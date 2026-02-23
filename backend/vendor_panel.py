from database import get_db
from flask import request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from bson import ObjectId
import traceback

def get_vendor_profile(vendor_id):
    """
    Retrieves vendor profile information.
    """
    try:
        db = get_db()
        
        # Find vendor in database
        vendor = db.vendors.find_one({'_id': ObjectId(vendor_id)})
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
        return jsonify({'error': f'Vendor profile retrieval failed: {str(e)}'}), 500

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
                'phone': update_fields['phone'],
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

        return jsonify({'message': 'Vendor profile updated successfully'}), 200

    except Exception as e:
        print(f"Update vendor profile error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Updating vendor profile failed: {str(e)}'}), 500

def get_vendor_vehicles(vendor_id):
    """
    Retrieves vehicles associated with the vendor.
    """
    try:
        db = get_db()
        
        # Find vehicles assigned to this vendor
        vehicles_cursor = db.vehicles.find({'vendor_id': vendor_id})
        vehicles = []
        
        for vehicle in vehicles_cursor:
            vehicle['_id'] = str(vehicle['_id'])
            vehicle['vendor_id'] = str(vehicle['vendor_id'])
            vehicles.append(vehicle)
        
        return jsonify({
            'vehicles': vehicles,
            'count': len(vehicles)
        }), 200

    except Exception as e:
        print(f"Get vendor vehicles error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Getting vendor vehicles failed: {str(e)}'}), 500

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
        condtion = data.get('condtion', '')

        # Validation
        if not vehicle_type or not model or not make or not license_plate or not daily_rate:
            return jsonify({'error': 'Vehicle type, model, make, license plate, and daily rate are required'}), 400

        # Check if vehicle with this license plate already exists
        existing_vehicle = db.vehicles.find_one({'license_plate': license_plate})
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
            'condtion': condtion,
            'location': location,
            'fuel_type': fuel_type,
            'is_available': True,
            'created_at': datetime.utcnow()
        }

        # Insert vehicle into database
        result = db.vehicles.insert_one(new_vehicle)
        vehicle_id = str(result.inserted_id)

        # Add to vehicle_available collection
        available_vehicle = new_vehicle.copy()
        if '_id' in available_vehicle:
            del available_vehicle['_id']
        
        available_vehicle['vendor_name'] = vendor_name
        available_vehicle['vehicle_id'] = vehicle_id
        
        db.vehicle_available.insert_one(available_vehicle)

        return jsonify({
            'message': 'Vehicle added successfully',
            'vehicle_id': vehicle_id
        }), 201

    except Exception as e:
        print(f"Add vehicle error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Adding vehicle failed: {str(e)}'}), 500

def get_vendor_bookings(vendor_id):
    """
    Retrieves bookings associated with the vendor's vehicles.
    """
    try:
        db = get_db()
        
        # Find vehicles owned by this vendor
        vendor_vehicles = list(db.vehicles.find({'vendor_id': vendor_id}))
        vendor_vehicle_ids = [str(vehicle['_id']) for vehicle in vendor_vehicles]
        
        # Create a mapping of vehicle_id to model name for easy lookup
        vehicle_map = {str(v['_id']): v.get('model', 'Unknown') for v in vendor_vehicles}
        
        # Find bookings for these vehicles
        bookings_cursor = db.bookings.find({'vehicle_id': {'$in': vendor_vehicle_ids}}).sort('created_at', -1)
        bookings = []
        
        for booking in bookings_cursor:
            booking['_id'] = str(booking['_id'])
            booking['vehicle_id'] = str(booking['vehicle_id'])
            booking['user_id'] = str(booking['user_id'])
            
            # Add vehicle model from our map
            booking['vehicle_model'] = vehicle_map.get(booking['vehicle_id'], 'Unknown')
            
            # Fetch user name
            user = db.users.find_one({'_id': ObjectId(booking['user_id'])})
            booking['user_name'] = user.get('name', 'Unknown') if user else 'Unknown'
            
            bookings.append(booking)
        
        return jsonify({
            'bookings': bookings,
            'count': len(bookings)
        }), 200

    except Exception as e:
        print(f"Get vendor bookings error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Getting vendor bookings failed: {str(e)}'}), 500

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
                     'condtion', 'location', 'fuel_type', 'is_available']:
            if key in data:
                update_fields[key] = data[key]

        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400

        db.vehicles.update_one(
            {'_id': ObjectId(vehicle_id)},
            {'$set': update_fields}
        )

        # Also update vehicle_available collection
        db.vehicle_available.update_one(
            {'vehicle_id': vehicle_id},
            {'$set': update_fields}
        )

        return jsonify({'message': 'Vehicle updated successfully'}), 200

    except Exception as e:
        print(f"Update vehicle error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Updating vehicle failed: {str(e)}'}), 500
