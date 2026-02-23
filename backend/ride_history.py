import os
from datetime import datetime
from flask import request, jsonify
from database import get_db
from bson import ObjectId
from storage import upload_to_s3
from qr import generate_booking_qr
from email_service import ride_confirm_qr
import traceback

# S3-Only storage is enforced.

def get_user_bookings(user_id):
    """
    Retrieves all bookings for a user
    """
    try:
        db = get_db()
        
        bookings_cursor = db.bookings.find({'user_id': user_id}).sort('created_at', -1)
        bookings = []
        
        for booking in bookings_cursor:
            booking['_id'] = str(booking['_id'])
            # Get vehicle details
            if 'vehicle_id' in booking:
                vehicle = db.vehicles.find_one({'_id': ObjectId(booking['vehicle_id'])}) if ObjectId.is_valid(booking['vehicle_id']) else None
                if vehicle:
                    booking['vehicle_model'] = vehicle.get('model', 'Unknown')
                    booking['vehicle_type'] = vehicle.get('vehicle_type', 'Unknown')
                    booking['license_plate'] = vehicle.get('license_plate', 'Unknown')
            bookings.append(booking)
        
        return jsonify({
            'bookings': bookings,
            'count': len(bookings)
        }), 200

    except Exception as e:
        print(f"Get user bookings error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Getting bookings failed: {str(e)}'}), 500

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
            vehicle_id = data.get('vehicle_id')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            booking_type = data.get('booking_type', 'daily')
        
        if not vehicle_id or not start_date:
            print(f"DEBUG: Missing fields. vehicle_id: {vehicle_id}, start_date: {start_date}")
            return jsonify({'error': 'Vehicle ID and start date are required'}), 400
        
        print(f"DEBUG: Creating booking for vehicle_id: {vehicle_id}, user_id: {user_id}")
        
        # Check if user already has an active or confirmed booking
        existing_booking = db.bookings.find_one({
            'user_id': user_id,
            'status': {'$in': ['confirmed', 'active']}
        })
        
        if existing_booking:
            return jsonify({
                'error': 'You already have an active or confirmed booking. Please complete or cancel it before booking a new ride.'
            }), 400
        
        # Get user details
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User profile not found'}), 404
        
        # DL verification removed - DL is submitted during booking
            
        if not user.get('email'):
            print(f"User email not found for ID: {user_id}")
        
        # Check vehicle availability
        vehicle = db.vehicles.find_one({'_id': ObjectId(vehicle_id)})
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        if not vehicle.get('is_available', False):
            return jsonify({'error': 'Vehicle is not available'}), 400
        
        # Calculate cost
        rate = vehicle.get('daily_rate', 0) if booking_type == 'daily' else vehicle.get('hourly_rate', 0)
        print(f"DEBUG: Calculated rate: {rate} for type: {booking_type}")
        
        # Save DL file if provided
        dl_image_path = None
        if 'dl_file' in request.files:
            dl_file = request.files['dl_file']
            if dl_file.filename:
                print(f"DEBUG: Processing DL file: {dl_file.filename}")
                dl_image_path = upload_to_s3(dl_file)
                print(f"DEBUG: DL uploaded to {dl_image_path}")

        # Create booking document
        new_booking = {
            'user_id': user_id,
            'vehicle_id': vehicle_id,
            'vendor_id': vehicle.get('vendor_id', ''),
            'start_date': start_date,
            'end_date': end_date,
            'booking_type': booking_type,
            'rate': rate,
            'status': 'confirmed',
            'dl_image': dl_image_path,
            'noc_agreed': True,
            'created_at': datetime.utcnow()
        }
        
        result = db.bookings.insert_one(new_booking)
        booking_id = str(result.inserted_id)
        print(f"DEBUG: Booking inserted. ID: {booking_id}")
        
        # Mark vehicle as unavailable
        db.vehicles.update_one(
            {'_id': ObjectId(vehicle_id)},
            {'$set': {'is_available': False}}
        )
        
        # Also update vehicle_available collection
        db.vehicle_available.update_one(
            {'vehicle_id': vehicle_id},
            {'$set': {'is_available': False}}
        )
        
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
                        # Ensure QR code format for image src
                        qr_src = qr_base64 if qr_base64.startswith('data:image') else f"data:image/png;base64,{qr_base64}"
                        email_sent = ride_confirm_qr(user_email, qr_src, booking_id, start_date)
                        print(f"DEBUG: Email send result: {email_sent}")
                    except Exception as e:
                        print(f"DEBUG: Email sending crashed: {str(e)}")
                else:
                    print("DEBUG: User has no email address in database.")
            else:
                print("DEBUG: User not found in database for email sending.")
        
        return jsonify({
            'message': 'Booking created successfully',
            'booking_id': booking_id,
            'qr_code': qr_base64
        }), 201

    except Exception as e:
        error_tb = traceback.format_exc()
        print(f"Create booking error: {str(e)}")
        print(error_tb)
        return jsonify({
            'error': f'Booking creation failed: {str(e)}',
            'traceback': error_tb
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
        
        # Find the booking
        booking = db.bookings.find_one({
            '_id': ObjectId(booking_id),
            'user_id': user_id
        })
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        current_status = booking.get('status')
        if current_status == 'cancelled':
            return jsonify({'error': 'Booking is already cancelled'}), 400
            
        if current_status != 'confirmed':
            return jsonify({
                'error': f'Cannot cancel a ride that is already {current_status}. Please contact the vendor.'
            }), 400
        
        # Update booking status
        db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': {'status': 'cancelled', 'cancelled_at': datetime.utcnow()}}
        )
        
        # Make vehicle available again
        vehicle_id = booking.get('vehicle_id')
        if vehicle_id:
            db.vehicles.update_one(
                {'_id': ObjectId(vehicle_id)},
                {'$set': {'is_available': True}}
            )
            db.vehicle_available.update_one(
                {'vehicle_id': vehicle_id},
                {'$set': {'is_available': True}}
            )
        
        return jsonify({'message': 'Booking cancelled successfully'}), 200

    except Exception as e:
        print(f"Cancel booking error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Cancelling booking failed: {str(e)}'}), 500

def get_available_vehicles():
    """
    Gets all available vehicles for users to browse, filtering by location
    and checking for overlapping bookings if dates are provided.
    """
    try:
        db = get_db()
        
        # Get query parameters
        location = request.args.get('location')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        query = {'is_available': True}
        
        if location:
            query['location'] = location
        
        # Initial search for available vehicles in the requested location
        vehicles_cursor = db.vehicles.find(query)
        available_vehicles = []
        
        for vehicle in vehicles_cursor:
            vehicle_id = str(vehicle['_id'])
            
            # If dates are provided, check for overlapping bookings
            if start_date_str and end_date_str:
                # Basic overlap logic: 
                # (StartA <= EndB) and (EndA >= StartB)
                # But here we just check if any booking exists for this vehicle that's not cancelled
                
                # For simplicity in this implementation, we check if there's any active/confirmed booking
                # that overlaps with requested range. 
                # Note: This is simplified for MongoDB date storage.
                
                overlapping_booking = db.bookings.find_one({
                    'vehicle_id': vehicle_id,
                    'status': {'$in': ['confirmed', 'active']},
                    '$or': [
                        {
                            'start_date': {'$lte': end_date_str},
                            'end_date': {'$gte': start_date_str}
                        }
                    ]
                })
                
                if overlapping_booking:
                    continue # Vehicle is booked for this slot
            
            vehicle['_id'] = vehicle_id
            available_vehicles.append(vehicle)
        
        # If no vehicles found in 'vehicles' collection, try 'vehicle_available' as fallback (legacy)
        if not available_vehicles and not location and not (start_date_str and end_date_str):
            vehicles_cursor = db.vehicle_available.find({'is_available': True})
            for v in vehicles_cursor:
                v['_id'] = str(v['_id'])
                available_vehicles.append(v)
        
        return jsonify({
            'vehicles': available_vehicles,
            'count': len(available_vehicles)
        }), 200

    except Exception as e:
        print(f"Get available vehicles error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Getting available vehicles failed: {str(e)}'}), 500
