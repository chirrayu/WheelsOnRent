import os
from datetime import datetime, timezone
import threading
from flask import request, jsonify
from database import get_db
from pymongo import ReturnDocument
from bson import ObjectId
from storage import upload_to_s3
from qr import generate_booking_qr
from email_service import ride_confirm_qr
from socket_service import emit_new_booking
from cache_service import get_cache, set_cache, clear_cache_pattern
from security_logger import log_security_event
import traceback

# S3-Only storage is enforced.

def get_user_bookings(user_id):
    """
    Retrieves bookings for a user with pagination.
    Query params: page (default 1), limit (default 20)
    """
    try:
        db = get_db()
        
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))
        skip = (page - 1) * limit
        
        total_count = db.bookings.count_documents({'user_id': user_id})
        bookings_cursor = db.bookings.find({'user_id': user_id}).sort('created_at', -1).skip(skip).limit(limit)
        bookings = []
        
        for booking in bookings_cursor:
            booking['_id'] = str(booking['_id'])
            # Get vehicle details
            if 'vehicle_id' in booking:
                vehicle = db.vehicles.find_one(
                    {'_id': ObjectId(booking['vehicle_id'])},
                    {'model': 1, 'vehicle_type': 1, 'license_plate': 1}
                ) if ObjectId.is_valid(booking['vehicle_id']) else None
                if vehicle:
                    booking['vehicle_model'] = vehicle.get('model', 'Unknown')
                    booking['vehicle_type'] = vehicle.get('vehicle_type', 'Unknown')
                    booking['license_plate'] = vehicle.get('license_plate', 'Unknown')
            
            # Secure S3 URLs if present
            from storage import create_presigned_url
            if booking.get('dl_image') and "amazonaws.com" in str(booking['dl_image']):
                booking['dl_image'] = create_presigned_url(booking['dl_image'])
                
            bookings.append(booking)
        
        return jsonify({
            'bookings': bookings,
            'count': len(bookings),
            'total': total_count,
            'page': page,
            'limit': limit,
            'total_pages': (total_count + limit - 1) // limit
        }), 200

    except Exception as e:
        print(f"Get user bookings error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Getting bookings failed. Please try again.'}), 500

def create_booking(user_id):
    """
    Creates a new booking for a user
    """
    try:
        db = get_db()
        
        # Support both JSON and FormData
        if request.content_type and 'multipart/form-data' in request.content_type:
            vehicle_id = request.form.get('vehicle_id')
            start_date = request.form.get('start_date')
            end_date = request.form.get('end_date')
            booking_type = request.form.get('booking_type', 'daily')
        else:
            data = request.get_json()
            # Explicitly cast to string to prevent NoSQL injection via JSON objects
            vehicle_id = str(data.get('vehicle_id', ''))
            start_date = str(data.get('start_date', ''))
            end_date = str(data.get('end_date', ''))
            booking_type = str(data.get('booking_type', 'daily'))
        
        if not vehicle_id or not start_date:
            print(f"DEBUG: Missing fields. vehicle_id: {vehicle_id}, start_date: {start_date}")
            return jsonify({'error': 'Vehicle ID and start date are required'}), 400
        
        print(f"DEBUG: Creating booking for vehicle_id: {vehicle_id}, user_id: {user_id}")
        
        # Check if user already has an active, confirmed or upcoming booking
        existing_booking = db.bookings.find_one({
            'user_id': user_id,
            'status': {'$in': ['confirmed', 'active', 'Upcoming', 'pending_manual_verification']}
        })
        
        if existing_booking:
            return jsonify({
                'error': 'You already have an active or upcoming booking. Please complete or cancel it before booking a new vehicle.'
            }), 400
        
        # Get user details (Only need email for QR delivery)
        user = db.users.find_one({'_id': ObjectId(user_id)}, {'email': 1})
        if not user:
            return jsonify({'error': 'User profile not found'}), 404
        
        # DL verification removed - DL is submitted during booking
            
        if not user.get('email'):
            print(f"User email not found for ID: {user_id}")
        if not start_date:
            return jsonify({'error': 'Start date is required'}), 400
            
        # Validate dates are in the future and end_date > start_date
        try:
            from datetime import timedelta
            # Handle ISO string with or without Z
            parse_start = start_date.replace('Z', '+00:00') if 'Z' in start_date else start_date
            start_dt = datetime.fromisoformat(parse_start)
            
            # Make timezone aware if not already
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)
                
            # Allow 5 minute buffer for frontend taking time to make the request
            if start_dt < (datetime.now(timezone.utc) - timedelta(minutes=5)):
                return jsonify({'error': 'Start date cannot be in the past'}), 400
                
            if end_date:
                parse_end = end_date.replace('Z', '+00:00') if 'Z' in end_date else end_date
                end_dt = datetime.fromisoformat(parse_end)
                if end_dt.tzinfo is None:
                    end_dt = end_dt.replace(tzinfo=timezone.utc)
                if end_dt <= start_dt:
                    return jsonify({'error': 'End date must be after start date'}), 400
                
                # Edge Case: Duration Checks (Minimum 15 minutes)
                if (end_dt - start_dt).total_seconds() < 900:
                    return jsonify({'error': 'Minimum booking duration is 15 minutes.'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid date format. Expected ISO 8601 string.'}), 400

        # OVERLAP SHIELD: Pre-check for overlapping bookings
        # This prevents booking a vehicle that is "available" now but has a conflict in the requested slot.
        overlap_query = {
            'vehicle_id': vehicle_id,
            'status': {'$in': ['confirmed', 'active', 'Upcoming', 'pending_manual_verification']},
            '$or': [
                {
                    'start_date': {'$lte': end_date if end_date else start_date},
                    'end_date': {'$gte': start_date}
                }
            ]
        }
        if db.bookings.find_one(overlap_query, {'_id': 1}):
             return jsonify({'error': 'Vehicle is already booked for the selected time slot.'}), 400
        
        # Verify vehicle exists and is active
        vehicle = db.vehicles.find_one(
            {'_id': ObjectId(vehicle_id), 'is_available': True}
        )
        
        if not vehicle:
            # Determine why it failed
            exists = db.vehicles.find_one({'_id': ObjectId(vehicle_id)})
            if not exists:
                return jsonify({'error': 'Vehicle not found'}), 404
            return jsonify({'error': 'Vehicle is no longer available. Someone else may have just booked it.'}), 400

        
        # Calculate cost
        rate = vehicle.get('daily_rate', 0) if booking_type == 'daily' else vehicle.get('hourly_rate', 0)
        print(f"DEBUG: Calculated rate: {rate} for type: {booking_type}")
        
        # Save DL file if provided
        dl_image_path = None
        dl_verification_status = 'not_provided'
        dl_extraction_data = {}

        if 'dl_file' in request.files:
            dl_file = request.files['dl_file']
            if dl_file.filename:
                # ... sync OCR ...
                try:
                    # 1. Read Bytes for scanning BEFORE upload
                    file_bytes = dl_file.read()
                    dl_file.seek(0)

                    # 2. Synchronous OCR for date validation (Safety first)
                    print("DEBUG: Performing synchronous DL validation...")
                    from dl_service import verify_dl_image
                    from dl_validator import validate_dl_dates
                    
                    val_status, val_msg, extraction = verify_dl_image(image_bytes=file_bytes)
                    
                    if val_status == 'verified' and extraction.get('identified', {}).get('expiry'):
                        expiry_date = extraction['identified']['expiry']
                        dob_date = extraction['identified'].get('dob')
                        
                        # Validate dates (Age and Expiry)
                        is_valid_dates, date_err = validate_dl_dates(dob_date if dob_date else "2000-01-01", expiry_date)
                        if not is_valid_dates:
                            log_security_event('BOOKING_BLOCKED_DL', {'user_id': user_id, 'reason': date_err}, severity='WARNING')
                            return jsonify({'error': f'Booking blocked: {date_err}'}), 400
                    
                    # 3. S3 Upload (If scan passed or requires manual review)
                    dl_image_path = upload_to_s3(dl_file)
                    if not dl_image_path:
                        return jsonify({'error': 'Failed to upload DL image.'}), 400
                    
                    dl_verification_status = val_status
                    dl_extraction_data = extraction
                    print(f"DEBUG: DL Verification Result: {val_status}. Path: {dl_image_path}")
                except Exception as upload_err:
                    print(f"ERROR: DL validation/upload Exception: {str(upload_err)}")
                    return jsonify({'error': f'Failed to process Driving License: {str(upload_err)}'}), 500

        # Determine initial booking status
        # If OCR flagged it, we might want manual review before 'confirmed'
        # BUT if it's completely invalid (e.g. not even a DL), we block it immediately.
        if dl_verification_status == 'flagged' and "Invalid document" in str(val_msg):
            return jsonify({'error': val_msg}), 400

        booking_status = 'confirmed' if dl_verification_status != 'flagged' else 'pending_manual_verification'

        # Create booking document
        new_booking = {
            'user_id': user_id,
            'vehicle_id': vehicle_id,
            'vendor_id': vehicle.get('vendor_id', ''),
            'start_date': start_date,
            'end_date': end_date,
            'booking_type': booking_type,
            'rate': rate,
            'status': booking_status,
            'dl_image': dl_image_path,
            'dl_verification_status': dl_verification_status,
            'dl_ocr_data': dl_extraction_data,
            'noc_agreed': True,
            'created_at': datetime.now(timezone.utc)
        }
        
        result = db.bookings.insert_one(new_booking)
        booking_id = str(result.inserted_id)

        # ATOMIC SECONDARY CHECK: Verify no other booking was created in parallel
        # This prevents the TOCTOU (Time-of-check to Time-of-use) race condition.
        final_overlap_check = db.bookings.find_one({
            'vehicle_id': vehicle_id,
            'status': {'$in': ['confirmed', 'active', 'Upcoming', 'pending_manual_verification']},
            '_id': {'$ne': result.inserted_id}, # Don't conflict with itself
            '$or': [
                {
                    'start_date': {'$lte': end_date if end_date else start_date},
                    'end_date': {'$gte': start_date}
                }
            ]
        }, {'_id': 1})

        if final_overlap_check:
            # Atomic Rollback: Delete the second booking that slipped through
            db.bookings.delete_one({'_id': result.inserted_id})
            log_security_event('RACE_CONDITION_DETECTED', {'user_id': user_id, 'vehicle_id': vehicle_id}, severity='CRITICAL')
            return jsonify({'error': 'A race condition occurred. Vehicle was booked by someone else at the same time. Please try again.'}), 400
        
        print(f"DEBUG: Booking inserted. ID: {booking_id}, Status: {booking_status}")
        

        
        # Generate QR code for this booking
        qr_base64 = generate_booking_qr(booking_id, new_booking)
        if qr_base64:
            db.bookings.update_one(
                {'_id': result.inserted_id},
                {'$set': {'qr_code': qr_base64}}
            )
            
            # Send confirmation email with QR code
            if user:
                user_email = user.get('email')
                print(f"DEBUG: Attempting to send email to user: {user_email}, User ID: {user_id}")
                
                if user_email:
                    try:
                        email_sent = ride_confirm_qr(user_email, qr_base64, booking_id, start_date)
                        print(f"DEBUG: Email send result: {email_sent}")
                    except Exception as e:
                        print(f"DEBUG: Email sending crashed: {str(e)}")
                else:
                    print("DEBUG: User has no email address in database.")
            else:
                print("DEBUG: User not found in database for email sending.")
        
        # Real-time notification to vendor
        try:
            emit_new_booking(new_booking.get('vendor_id'), {
                'booking_id': booking_id,
                'user_id': user_id,
                'vehicle_id': vehicle_id,
                'start_date': start_date,
                'end_date': end_date,
                'status': new_booking.get('status'),
                'vehicle_model': vehicle.get('model', 'Unknown')
            })
        except Exception as e:
            print(f"DEBUG: WebSocket notification failed: {str(e)}")
        
        # Clear availability cache because a booking was created
        clear_cache_pattern("vehicles:available:*")

        return jsonify({
            'message': 'Booking created successfully',
            'booking_id': booking_id,
            'qr_code': qr_base64
        }), 201

    except Exception as e:
        print(f"Create booking error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Booking creation failed. Please try again later.'
        }), 500

def cancel_booking(user_id):
    """
    Cancels an existing booking
    """
    try:
        db = get_db()
        data = request.get_json()
        
        booking_id = data.get('booking_id')
        if not booking_id:
            return jsonify({'error': 'Booking ID is required'}), 400
        
        # Find the booking (Only need status and vehicle_id)
        booking = db.bookings.find_one({
            '_id': ObjectId(booking_id),
            'user_id': user_id
        }, {'status': 1, 'vehicle_id': 1})
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        current_status = booking.get('status')
        if current_status == 'cancelled':
            return jsonify({'error': 'Booking is already cancelled'}), 400
            
        if current_status not in ['confirmed', 'Upcoming']:
            return jsonify({
                'error': f'Cannot cancel a ride that is already {current_status}. Please contact the vendor.'
            }), 400
        
        # Update booking status
        db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': {'status': 'cancelled', 'cancelled_at': datetime.now(timezone.utc)}}
        )

        
        # Clear availability cache
        clear_cache_pattern("vehicles:available:*")

        return jsonify({'message': 'Booking cancelled successfully'}), 200

    except Exception as e:
        print(f"Cancel booking error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Cancelling booking failed. Please try again.'}), 500

def get_available_vehicles():
    """
    Gets available vehicles with pagination.
    Query params: location, start_date, end_date, page (default 1), limit (default 20)
    """
    try:
        db = get_db()
        
        # Get query parameters
        location_id = request.args.get('location_id')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))
        skip = (page - 1) * limit
        
        query = {'is_available': True}
        
        if location_id:
            query['location_id'] = location_id
        
        # 1. Try Cache First
        cache_key = f"vehicles:available:{location_id}:{start_date_str}:{end_date_str}:{page}:{limit}"
        cached_res = get_cache(cache_key)
        if cached_res:
            return jsonify(cached_res), 200

        total_count = db.vehicles.count_documents(query)
        vehicles_cursor = db.vehicles.find(query).skip(skip).limit(limit)
        available_vehicles = []
        
        for vehicle in vehicles_cursor:
            vehicle_id = str(vehicle['_id'])
            
            # If dates are provided, check for overlapping bookings
            if start_date_str and end_date_str:
                overlapping_booking = db.bookings.find_one({
                    'vehicle_id': vehicle_id,
                    'status': {'$in': ['confirmed', 'active', 'Upcoming', 'pending_manual_verification']},
                    '$or': [
                        {
                            'start_date': {'$lte': end_date_str},
                            'end_date': {'$gte': start_date_str}
                        }
                    ]
                }, {'_id': 1})
                
                if overlapping_booking:
                    continue
            
            vehicle['_id'] = vehicle_id
            available_vehicles.append(vehicle)
        
        response_data = {
            'vehicles': available_vehicles,
            'count': len(available_vehicles),
            'total': total_count,
            'page': page,
            'limit': limit,
            'total_pages': (total_count + limit - 1) // limit
        }

        # 2. Set Cache (5 minute expiry for availability)
        set_cache(cache_key, response_data, expiry=300)

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Get available vehicles error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Getting available vehicles failed. Please try again.'}), 500
