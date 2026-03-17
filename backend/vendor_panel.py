from database import get_db
from flask import request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import traceback
from storage import create_presigned_url
from cache_service import delete_cache, clear_cache_pattern

def get_vendor_profile(vendor_id):
    """
    Retrieves vendor profile information.
    """
    try:
        db = get_db()
        
        # Find vendor in database (Excluding password)
        vendor = db.vendors.find_one({'_id': ObjectId(vendor_id)}, {'password': 0})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        # Remove password from response for security
        if 'password' in vendor:
            del vendor['password']
        
        vendor['_id'] = str(vendor['_id'])
        
        return jsonify({
            'vendor': vendor
        }), 200
    except Exception as e:
        print(f"Vendor profile retrieval error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Vendor profile retrieval failed. Please try again.'}), 500

def update_vendor_profile(vendor_id):
    """
    Updates vendor profile information.
    """
    try:
        db = get_db()
        data = request.get_json()
        
        # Prepare update fields (excluding sensitive fields)
        update_fields = {}
        if 'name' in data:
            update_fields['name'] = data['name']
        if 'email' in data:
            update_fields['email'] = data['email']
        if 'phone' in data:
            update_fields['phone'] = data['phone']
        if 'location_id' in data:
            update_fields['location_id'] = data['location_id']
        if 'is_active' in data:
            update_fields['is_active'] = data['is_active']
        
        # Check if phone already exists for another vendor
        if 'phone' in update_fields:
            existing_vendor = db.vendors.find_one({
                'phone': str(update_fields['phone']),
                '_id': {'$ne': ObjectId(vendor_id)}
            })
            if existing_vendor:
                return jsonify({'error': 'Phone number already exists for another vendor'}), 409

        # Update vendor
        result = db.vendors.update_one(
            {'_id': ObjectId(vendor_id)},
            {'$set': update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Vendor not found'}), 404

        # Invalidate vendor and location caches
        delete_cache("public:vendors")
        delete_cache("public:locations")

        return jsonify({'message': 'Vendor profile updated successfully'}), 200

    except Exception as e:
        print(f"Update vendor profile error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Updating vendor profile failed. Please try again.'}), 500

def get_vendor_vehicles(vendor_id):
    """
    Retrieves vehicles associated with the vendor with pagination.
    """
    try:
        db = get_db()
        
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))
        skip = (page - 1) * limit
        
        query = {'vendor_id': vendor_id}
        total_count = db.vehicles.count_documents(query)
        vehicles_cursor = db.vehicles.find(query).skip(skip).limit(limit)
        vehicles = []
        
        for vehicle in vehicles_cursor:
            vehicle['_id'] = str(vehicle['_id'])
            vehicle['vendor_id'] = str(vehicle['vendor_id'])
            vehicles.append(vehicle)
        
        return jsonify({
            'vehicles': vehicles,
            'count': len(vehicles),
            'total': total_count,
            'page': page,
            'limit': limit,
            'total_pages': (total_count + limit - 1) // limit
        }), 200

    except Exception as e:
        print(f"Get vendor vehicles error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Getting vendor vehicles failed. Please try again.'}), 500

def add_vehicle_to_vendor(vendor_id):
    """
    Adds a new vehicle to the vendor's inventory.
    """
    try:
        db = get_db()
        data = request.get_json()
        
        # Get vehicle details
        vehicle_type = data.get('vehicle_type')
        model = data.get('model')
        make = data.get('make')
        year = data.get('year')
        license_plate = data.get('license_plate')
        daily_rate = data.get('daily_rate')
        hourly_rate = data.get('hourly_rate')
        description = data.get('description', '')
        location = data.get('location', '')
        features = data.get('features', [])
        images = data.get('images', [])
        condition = data.get('condition', '')

        # Validation
        if not vehicle_type or not model or not make or not license_plate or not daily_rate:
            return jsonify({'error': 'Vehicle type, model, make, license plate, and daily rate are required'}), 400

        # Check if vehicle with this license plate already exists
        existing_vehicle = db.vehicles.find_one({'license_plate': str(license_plate)})
        if existing_vehicle:
            return jsonify({'error': 'Vehicle with this license plate already exists'}), 409

        # Get vendor name
        vendor = db.vendors.find_one({'_id': ObjectId(vendor_id)})
        vendor_name = vendor.get('name', 'Unknown') if vendor else 'Unknown'

        fuel_type = data.get('fuel_type', 'Petrol')

        # Create new vehicle document
        new_vehicle = {
            'vendor_id': vendor_id,
            'vehicle_type': vehicle_type,
            'model': model,
            'make': make,
            'license_plate': license_plate,
            'daily_rate': daily_rate,
            'hourly_rate': hourly_rate,
            'condition': condition,
            'location': location,
            'fuel_type': fuel_type,
            'is_available': True,
            'created_at': datetime.now(timezone.utc)
        }

        # Insert vehicle into database
        result = db.vehicles.insert_one(new_vehicle)
        vehicle_id = str(result.inserted_id)



        # Invalidate availability cache
        clear_cache_pattern("vehicles:available:*")

        return jsonify({
            'message': 'Vehicle added successfully',
            'vehicle_id': vehicle_id
        }), 201

    except Exception as e:
        print(f"Add vehicle error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Adding vehicle failed. Please try again.'}), 500

def get_vendor_bookings(vendor_id):
    """
    Retrieves bookings associated with the vendor's vehicles with pagination.
    Uses aggregation to avoid N+1 queries for user names.
    """
    try:
        db = get_db()
        
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))
        skip = (page - 1) * limit
        
        # Find vehicles owned by this vendor
        vendor_vehicles = list(db.vehicles.find({'vendor_id': vendor_id}))
        vendor_vehicle_ids = [str(vehicle['_id']) for vehicle in vendor_vehicles]
        vehicle_map = {str(v['_id']): v.get('model', 'Unknown') for v in vendor_vehicles}
        
        query = {'vehicle_id': {'$in': vendor_vehicle_ids}}
        total_count = db.bookings.count_documents(query)
        bookings_cursor = db.bookings.find(query).sort('created_at', -1).skip(skip).limit(limit)
        bookings = []
        
        # Batch-fetch user names to avoid N+1
        booking_list = list(bookings_cursor)
        user_ids = list(set(b.get('user_id') for b in booking_list if b.get('user_id')))
        user_ids_obj = [ObjectId(uid) for uid in user_ids if ObjectId.is_valid(uid)]
        users = {str(u['_id']): u.get('name', 'Unknown') for u in db.users.find({'_id': {'$in': user_ids_obj}})}
        
        # Batch-fetch DL fallback uploads
        # Check for both string and ObjectId versions of user_id to be safe
        dl_uploads_cursor = db.dl_uploads.find({
            '$or': [{'user_id': {'$in': user_ids}}, {'user_id': {'$in': user_ids_obj}}]
        })
        dl_uploads = {}
        for d in dl_uploads_cursor:
            uid = str(d.get('user_id'))
            dl_uploads[uid] = (d.get('image_url') or d.get('image_filename'))
        
        for booking in booking_list:
            booking['_id'] = str(booking['_id'])
            booking['vehicle_id'] = str(booking['vehicle_id'])
            booking['user_id'] = str(booking['user_id'])
            booking['vehicle_model'] = vehicle_map.get(booking['vehicle_id'], 'Unknown')
            booking['user_name'] = users.get(booking['user_id'], 'Unknown')
            
            # Resolve DL logic
            dl_img = booking.get('dl_image')
            if not dl_img:
                dl_img = dl_uploads.get(booking['user_id'])
            
            if dl_img and "amazonaws.com" in dl_img:
                dl_img = create_presigned_url(dl_img)
                
            booking['dl_image'] = dl_img
            
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
        print(f"Get vendor bookings error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Getting vendor bookings failed. Please try again.'}), 500

def update_vehicle_by_vendor(vendor_id, vehicle_id):
    """
    Updates a vehicle's details. Only the owning vendor can update.
    """
    try:
        db = get_db()
        data = request.get_json()

        # Verify vendor owns this vehicle
        vehicle = db.vehicles.find_one({
            '_id': ObjectId(vehicle_id),
            'vendor_id': vendor_id
        })
        if not vehicle:
            return jsonify({'error': 'Vehicle not found or unauthorized'}), 404

        # Allowed update fields
        update_fields = {}
        for key in ['model', 'make', 'vehicle_type', 'license_plate', 'daily_rate', 'hourly_rate',
                     'condition', 'location', 'fuel_type', 'is_available']:
            if key in data:
                update_fields[key] = data[key]

        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400

        db.vehicles.update_one(
            {'_id': ObjectId(vehicle_id)},
            {'$set': update_fields}
        )



        # Invalidate availability cache
        clear_cache_pattern("vehicles:available:*")

        return jsonify({'message': 'Vehicle updated successfully'}), 200

    except Exception as e:
        print(f"Update vehicle error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Updating vehicle failed. Please try again.'}), 500
