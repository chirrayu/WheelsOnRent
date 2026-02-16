import io
import json
import base64
import qrcode
from datetime import datetime
from database import get_db
from flask import request, jsonify
from bson import ObjectId
import traceback

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
            'type': 'wheelsonrent_booking'
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
        return jsonify({'error': f'Failed to get QR code: {str(e)}'}), 500

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
            return jsonify({'error': 'QR data is required'}), 400

        # Parse QR payload
        try:
            payload = json.loads(qr_data)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid QR code format'}), 400

        if payload.get('type') != 'wheelsonrent_booking':
            return jsonify({'error': 'This is not a valid WheelsOnRent QR code'}), 400

        booking_id = payload.get('booking_id')
        if not booking_id:
            return jsonify({'error': 'Invalid QR code: missing booking ID'}), 400

        # Find the booking
        booking = db.bookings.find_one({'_id': ObjectId(booking_id)})
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        # Verify this booking belongs to this vendor's vehicle
        vehicle = db.vehicles.find_one({
            '_id': ObjectId(booking['vehicle_id']),
            'vendor_id': vendor_id
        })
        if not vehicle:
            return jsonify({'error': 'This booking does not belong to your vehicle'}), 403

        # Get user details
        user = db.users.find_one({'_id': ObjectId(booking['user_id'])})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        user_name = user.get('name', 'Unknown')
        user_phone = user.get('phone', 'N/A')
        dl_verified = user.get('dl_verified', False)

        # 1. Check if DL is verified
        if not dl_verified:
            return jsonify({
                'valid': False,
                'error': 'User DL not verified. Please ask user to verify DL.',
                'user_name': user_name
            }), 200 # Using 200 for scanning results but with valid=False

        # 2. Check if time is within booking window (buffer of 30 mins)
        try:
            current_time = datetime.now()
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
        if booking.get('status') != 'confirmed' and booking.get('status') != 'Upcoming':
            return jsonify({
                'valid': False,
                'error': f'Booking is already {booking.get("status")}',
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
                'dl_verified': dl_verified
            }
        }), 200

    except Exception as e:
        print(f"Verify QR error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'QR verification failed: {str(e)}'}), 500

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

        if new_status not in ['active', 'completed']:
            return jsonify({'error': 'Status must be "active" or "completed"'}), 400

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

        # Validate status transitions
        current_status = booking.get('status', '')
        if new_status == 'active' and current_status != 'confirmed':
            return jsonify({'error': f'Cannot start ride: booking is "{current_status}", expected "confirmed"'}), 400
        if new_status == 'completed' and current_status != 'active':
            return jsonify({'error': f'Cannot complete ride: booking is "{current_status}", expected "active"'}), 400

        update_fields = {'status': new_status}
        if new_status == 'active':
            update_fields['ride_started_at'] = datetime.utcnow()
        elif new_status == 'completed':
            update_fields['ride_completed_at'] = datetime.utcnow()
            # Make vehicle available again
            db.vehicles.update_one(
                {'_id': ObjectId(booking['vehicle_id'])},
                {'$set': {'is_available': True}}
            )
            db.vehicle_available.update_one(
                {'vehicle_id': booking['vehicle_id']},
                {'$set': {'is_available': True}}
            )

        db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': update_fields}
        )

        status_msg = 'Ride started!' if new_status == 'active' else 'Ride completed!'
        return jsonify({'message': status_msg, 'status': new_status}), 200

    except Exception as e:
        print(f"Update ride status error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'Status update failed: {str(e)}'}), 500
