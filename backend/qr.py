import io
import json
import base64
import qrcode
import uuid
from datetime import datetime, timezone, timedelta
from database import get_db
from flask import request, jsonify
from bson import ObjectId
from socket_service import emit_ride_status_update
import traceback
from storage import create_presigned_url
from security_logger import log_security_event

def generate_booking_qr(booking_id, booking_data):
    """
    Generates a QR code for a booking and returns base64 string.
    The QR encodes a JSON payload with booking details.
    """
    try:
        qr_payload = {
            'booking_id': booking_id,
            'vehicle_id': booking_data.get('vehicle_id', ''),
            'user_id': booking_data.get('user_id', ''),
            'vendor_id': booking_data.get('vendor_id', ''),
            'start_date': booking_data.get('start_date', ''),
            'end_date': booking_data.get('end_date', ''),
            'status': booking_data.get('status', 'confirmed'),
            'type': 'wheelsonrent_booking',
            'nonce': str(uuid.uuid4()),
            'exp': (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        }

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(json.dumps(qr_payload))
        qr.make(fit=True)

        img = qr.make_image(fill_color="#1e293b", back_color="white")

        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return qr_base64

    except Exception as e:
        print(f"QR generation error: {str(e)}")
        traceback.print_exc()
        return None

def get_booking_qr(user_id):
    """
    Returns the QR code image (base64) for a specific booking.
    """
    try:
        db = get_db()
        booking_id = request.args.get('booking_id')

        if not booking_id:
            return jsonify({'error': 'Booking ID is required'}), 400

        booking = db.bookings.find_one({
            '_id': ObjectId(booking_id),
            'user_id': user_id
        })

        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        qr_base64 = booking.get('qr_code')

        # If QR doesn't exist yet, generate it
        if not qr_base64:
            booking_data = {
                'vehicle_id': booking.get('vehicle_id', ''),
                'user_id': booking.get('user_id', ''),
                'vendor_id': booking.get('vendor_id', ''),
                'start_date': booking.get('start_date', ''),
                'end_date': booking.get('end_date', ''),
                'status': booking.get('status', ''),
            }
            qr_base64 = generate_booking_qr(str(booking['_id']), booking_data)

            if qr_base64:
                db.bookings.update_one(
                    {'_id': booking['_id']},
                    {'$set': {'qr_code': qr_base64}}
                )

        if not qr_base64:
            return jsonify({'error': 'Failed to generate QR code'}), 500

        return jsonify({
            'qr_code': qr_base64,
            'booking_id': str(booking['_id']),
            'status': booking.get('status', '')
        }), 200

    except Exception as e:
        print(f"Get booking QR error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get QR code. Please try again.'}), 500

def verify_qr(vendor_id):
    """
    Vendor scans a QR code. This endpoint:
    - Validates the QR payload
    - Checks the booking belongs to this vendor's vehicle
    - Returns booking details for verification
    """
    try:
        db = get_db()
        data = request.get_json()

        qr_data = data.get('qr_data')
        if not qr_data:
            log_security_event('QR_SCAN_FAIL', {'vendor_id': vendor_id, 'reason': 'missing_data'}, severity='WARNING')
            return jsonify({'error': 'QR data is required'}), 400

        # Parse QR payload
        try:
            payload = json.loads(qr_data)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid QR code format'}), 400

        if payload.get('type') != 'wheelsonrent_booking':
            log_security_event('QR_SCAN_FAIL', {'vendor_id': vendor_id, 'reason': 'invalid_type'}, severity='WARNING')
            return jsonify({'error': 'This is not a valid WheelsOnRent QR code'}), 400

        booking_id = payload.get('booking_id')
        if not booking_id:
            return jsonify({'error': 'Invalid QR code: missing booking ID'}), 400

        # REPLAY PROTECTION: Check Expiry
        qr_exp = payload.get('exp')
        if qr_exp:
            try:
                exp_dt = datetime.fromisoformat(qr_exp)
                if datetime.now(timezone.utc) > exp_dt:
                    log_security_event('QR_REPLAY_ATTEMPT', {'vendor_id': vendor_id, 'booking_id': booking_id, 'reason': 'qr_expired'}, severity='WARNING')
                    return jsonify({'error': 'QR code has expired. Please ask the user to refresh their screen.'}), 401
            except Exception:
                return jsonify({'error': 'Invalid QR expiry format'}), 400

        # Find the booking
        booking = db.bookings.find_one({'_id': ObjectId(booking_id)})
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        # STATE MACHINE: Check if booking is already completed/cancelled
        current_status = booking.get('status')
        if current_status == 'completed':
             return jsonify({'valid': False, 'error': 'BOOKING_ALREADY_COMPLETED'}), 200
        if current_status == 'cancelled':
             return jsonify({'valid': False, 'error': 'BOOKING_ALREADY_CANCELLED'}), 200
        
        # TIME WINDOW: Check if user is scanning too early
        start_date_str = booking.get('start_date')
        if start_date_str:
            try:
                # Handle ISO string
                parse_start = start_date_str.replace('Z', '+00:00') if 'Z' in start_date_str else start_date_str
                start_dt = datetime.fromisoformat(parse_start)
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
                
                # Allow pick-up 15 minutes early
                if datetime.now(timezone.utc) < (start_dt - timedelta(minutes=15)):
                    return jsonify({'valid': False, 'error': f'Pick-up not allowed before {start_dt.strftime("%H:%M")}'}), 200
            except Exception:
                pass

        # Verify this booking belongs to this vendor's vehicle
        vehicle = db.vehicles.find_one({
            '_id': ObjectId(booking['vehicle_id']),
            'vendor_id': vendor_id
        })
        if not vehicle:
            log_security_event('QR_SCAN_FAIL', {'vendor_id': vendor_id, 'booking_id': booking_id, 'reason': 'unauthorized_vehicle'}, severity='WARNING')
            return jsonify({'error': 'This booking does not belong to your vehicle'}), 403

        log_security_event('QR_SCAN_SUCCESS', {'vendor_id': vendor_id, 'booking_id': booking_id, 'user_id': str(booking['user_id'])}, severity='INFO')

        # Get user details
        user = db.users.find_one({'_id': ObjectId(booking['user_id'])})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        user_name = user.get('name', 'Unknown')
        user_phone = user.get('phone', 'N/A')
        
        # Determine DL image: check booking first, then profile fallback
        dl_image = booking.get('dl_image')
        if not dl_image or str(dl_image).strip() == "":
            # Try finding in profile uploads as fallback
            uid_str = str(user['_id'])
            # Search by string user_id OR ObjectId user_id to be extra safe
            dl_profile = db.dl_uploads.find_one({
                '$or': [{'user_id': uid_str}, {'user_id': user['_id']}]
            })
            
            if dl_profile:
                dl_image = dl_profile.get('image_url') or dl_profile.get('image_filename')
                print(f"DEBUG: Found profile fallback DL for user {uid_str}: {dl_image}")

        if dl_image and isinstance(dl_image, str) and "amazonaws.com" in dl_image:
            dl_image = create_presigned_url(dl_image)
        # 2. Check if time is within booking window (buffer of 30 mins)
        try:
            current_time = datetime.now(timezone.utc)
            # Assuming start_date is in ISO format or DD-MM-YYYY HH:MM
            # For simplicity, we just check if it's today if date format matches
            start_date_str = booking.get('start_date', '')
            # If dates are stored as simple strings without time, we might just check the date
            # Assuming '2026-02-16' or similar
            if len(start_date_str) >= 10:
                booking_date = start_date_str[:10]
                if booking_date != current_time.strftime('%Y-%m-%d') and booking_date != current_time.strftime('%d-%m-%Y'):
                    print(f"DEBUG: Booking date {booking_date} != current {current_time.strftime('%Y-%m-%d')}")
                    # return jsonify({'valid': False, 'error': f'Booking is for {booking_date}, not today'}), 200
        except:
            pass # Skip time check if format is unknown

        # 3. Check status
        allowed_statuses = ['confirmed', 'active', 'Upcoming', 'pending_manual_verification']
        current_status = booking.get('status')
        if current_status not in allowed_statuses:
            return jsonify({
                'valid': False,
                'error': f'Booking is already {current_status}',
                'user_name': user_name
            }), 200

        return jsonify({
            'valid': True,
            'booking': {
                'booking_id': str(booking['_id']),
                'status': booking.get('status', ''),
                'start_date': booking.get('start_date', ''),
                'end_date': booking.get('end_date', ''),
                'booking_type': booking.get('booking_type', 'daily'),
                'rate': booking.get('rate', 0),
                'vehicle_model': vehicle.get('model', ''),
                'vehicle_type': vehicle.get('vehicle_type', ''),
                'license_plate': vehicle.get('license_plate', ''),
                'user_name': user_name,
                'user_phone': user_phone,
                'dl_image': dl_image,
                'noc_agreed': booking.get('noc_agreed', False)
            }
        }), 200

    except Exception as e:
        print(f"Verify QR error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'QR verification failed. Please try again.'}), 500

def update_ride_status(vendor_id):
    """
    Vendor updates ride status after scanning QR:
    - 'active'    → ride started (vehicle picked up)
    - 'completed' → ride ended (vehicle returned)
    """
    try:
        db = get_db()
        data = request.get_json()

        booking_id = data.get('booking_id')
        new_status = data.get('status')  # 'active' or 'completed'

        if not booking_id or not new_status:
            return jsonify({'error': 'Booking ID and status are required'}), 400

        if new_status not in ['active', 'completed', 'cancelled']:
            return jsonify({'error': 'Status must be "active", "completed", or "cancelled"'}), 400

        booking = db.bookings.find_one({'_id': ObjectId(booking_id)})
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        # Verify vendor owns the vehicle
        vehicle = db.vehicles.find_one({
            '_id': ObjectId(booking['vehicle_id']),
            'vendor_id': vendor_id
        })
        if not vehicle:
            return jsonify({'error': 'Unauthorized: not your vehicle'}), 403

        # Strict State Machine Validation
        current_status = booking.get('status', 'pending')
        valid_transitions = {
            'confirmed': ['active', 'cancelled'],
            'Upcoming': ['active', 'cancelled'],
            'pending_manual_verification': ['active', 'cancelled'],
            'active': ['completed', 'cancelled'],
            'completed': [], # Terminal state
            'cancelled': []  # Terminal state
        }
        
        if new_status not in valid_transitions.get(current_status, []):
            return jsonify({'error': f'Invalid status transition from "{current_status}" to "{new_status}".'}) , 400

        update_fields = {'status': new_status}
        if new_status == 'active':
            update_fields['ride_started_at'] = datetime.now(timezone.utc)
            # Make vehicle unavailable while ride is active
            db.vehicles.update_one(
                {'_id': ObjectId(booking['vehicle_id'])},
                {'$set': {'is_available': False}}
            )
        elif new_status == 'completed':
            ride_completed_at = datetime.now(timezone.utc)
            update_fields['ride_completed_at'] = ride_completed_at
            
            # Calculate final amount
            ride_started_at = booking.get('ride_started_at')
            if ride_started_at:
                if isinstance(ride_started_at, str):
                    ride_started_at = datetime.fromisoformat(ride_started_at.replace('Z', '+00:00'))
                if ride_started_at.tzinfo is None:
                    ride_started_at = ride_started_at.replace(tzinfo=timezone.utc)
                duration = ride_completed_at - ride_started_at
                seconds = duration.total_seconds()
                hours = seconds / 3600
                rate = booking.get('rate', 0)
                booking_type = booking.get('booking_type', 'daily')
                
                if booking_type == 'hourly':
                    # Minimum 1 hour
                    billable_hours = max(1, int(hours) + (1 if seconds % 3600 > 0 else 0))
                    final_amount = billable_hours * rate
                    duration_text = f"{billable_hours} hour(s)"
                else:
                    # Daily rate: Minimum 1 day
                    days = hours / 24
                    billable_days = max(1, int(days) + (1 if hours % 24 > 0 else 0))
                    final_amount = billable_days * rate
                    duration_text = f"{billable_days} day(s)"
                
                update_fields['final_amount'] = final_amount
                update_fields['total_duration'] = duration_text
            else:
                final_amount = booking.get('rate', 0) # Fallback
                duration_text = "N/A"
                
            # Make vehicle available again
            db.vehicles.update_one(
                {'_id': ObjectId(booking['vehicle_id'])},
                {'$set': {'is_available': True}}
            )
        elif new_status == 'cancelled':
            update_fields['cancelled_at'] = datetime.now(timezone.utc)
            update_fields['cancelled_by'] = 'vendor'
            # Make vehicle available again
            db.vehicles.update_one(
                {'_id': ObjectId(booking['vehicle_id'])},
                {'$set': {'is_available': True}}
            )

        db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': update_fields}
        )

        # Real-time notification to user
        try:
            user_id = str(booking.get('user_id'))
            emit_ride_status_update(user_id, {
                'booking_id': str(booking_id),
                'status': new_status,
                'final_amount': update_fields.get('final_amount'),
                'total_duration': update_fields.get('total_duration'),
                'message': f"Your ride is now {new_status}!"
            })
        except Exception as e:
            print(f"DEBUG: WebSocket notification failed: {str(e)}")

        status_messages = {
            'active': 'Ride started!',
            'completed': 'Ride completed!',
            'cancelled': 'Booking rejected by vendor.'
        }
        
        response_data = {
            'message': status_messages.get(new_status, 'Updated'),
            'status': new_status
        }
        
        if new_status == 'completed':
            response_data['final_amount'] = update_fields.get('final_amount', 0)
            response_data['total_duration'] = update_fields.get('total_duration', 'N/A')
            
        return jsonify(response_data), 200

    except Exception as e:
        print(f"Update ride status error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'Status update failed. Please try again.'}), 500
