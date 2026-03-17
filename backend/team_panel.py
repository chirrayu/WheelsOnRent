from database import get_db
from flask import request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import traceback
from config import Config

def add_vendor():
    """
    Adds a new vendor to the system with username and password.
    """
    try:
        db = get_db()
        data = request.get_json()
        
        # Get vendor details
        name = data.get('name')
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        phone = data.get('phone')
        location_id = data.get('location_id')  # Optional: assign to specific location

        # Validation
        if not name or not phone or not username or not password:
            return jsonify({'error': 'Name, phone number, username, and password are required'}), 400

        # Check if vendor with this phone already exists
        existing_vendor_phone = db.vendors.find_one({'phone': phone})
        if existing_vendor_phone:
            return jsonify({'error': 'Vendor with this phone number already exists'}), 409

        # Check if vendor with this username already exists
        existing_vendor_username = db.vendors.find_one({'username': username})
        if existing_vendor_username:
            return jsonify({'error': 'Vendor with this username already exists'}), 409

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Create new vendor document
        new_vendor = {
            'name': name,
            'email': email,
            'username': username,
            'password': hashed_password.decode('utf-8'),
            'phone': phone,
            'location_id': location_id,
            'role': 'vendor',
            'is_active': True,
            'created_at': datetime.now(timezone.utc),
            'last_login': None
        }

        # Insert vendor into database
        result = db.vendors.insert_one(new_vendor)
        vendor_id = str(result.inserted_id)

        return jsonify({
            'message': 'Vendor added successfully',
            'vendor_id': vendor_id
        }), 201

    except Exception as e:
        print(f"Add vendor error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Adding vendor failed. Please try again.'}), 500


def get_all_vendors():
    """
    Retrieves all vendors from the system.
    """
    try:
        db = get_db()
        
        # Fetch all vendors (Excluding password from DB)
        vendors_cursor = db.vendors.find({}, {'password': 0})
        vendors = []
        
        for vendor in vendors_cursor:
            vendor['_id'] = str(vendor['_id'])
            # Remove password from response for security
            if 'password' in vendor:
                del vendor['password']
            vendors.append(vendor)
        
        return jsonify({
            'vendors': vendors,
            'count': len(vendors)
        }), 200

    except Exception as e:
        print(f"Get vendors error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Getting vendors failed. Please try again.'}), 500


def update_vendor(vendor_id):
    """
    Updates vendor information.
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

        return jsonify({'message': 'Vendor updated successfully'}), 200

    except Exception as e:
        print(f"Update vendor error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Updating vendor failed. Please try again.'}), 500


def delete_vendor(vendor_id):
    """
    Deletes a vendor from the system.
    """
    try:
        db = get_db()
        
        # Delete vendor
        result = db.vendors.delete_one({'_id': ObjectId(vendor_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Vendor not found'}), 404

        return jsonify({'message': 'Vendor deleted successfully'}), 200

    except Exception as e:
        print(f"Delete vendor error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Deleting vendor failed. Please try again.'}), 500


def vendor_login():
    """
    Handles vendor login by verifying credentials and generating JWT token.
    """
    try:
        db = get_db()
        data = request.get_json()
        phone = data.get('phone')
        password = data.get('password')

        if not phone or not password:
            return jsonify({'error': 'Phone number and password are required'}), 400

        # Find vendor in database by phone - CAST TO STRING
        vendor = db.vendors.find_one({'phone': str(phone)})
        if not vendor:
            return jsonify({'error': 'Invalid credentials'}), 401

        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), vendor['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Check if vendor is active
        if not vendor.get('is_active', True):
            return jsonify({'error': 'Vendor account is deactivated'}), 401

        # Update last login time
        db.vendors.update_one(
            {'_id': vendor['_id']},
            {'$set': {'last_login': datetime.now(timezone.utc)}}
        )

        # Generate JWT token
        token_version = vendor.get('token_version', 0)
        token = jwt.encode({
            'vendor_id': str(vendor['_id']),
            'phone': vendor['phone'],
            'role': vendor.get('role', 'vendor'),
            'token_version': token_version,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm='HS256')

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'vendor': {
                'id': str(vendor['_id']),
                'phone': vendor['phone'],
                'name': vendor['name'],
                'username': vendor.get('username', ''),
                'email': vendor.get('email', ''),
                'role': vendor.get('role', 'vendor')
            }
        }), 200

    except Exception as e:
        print(f"Vendor login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Login failed. Please try again.'}), 500


def get_all_team_members():
    """
    Retrieves all team members from the system.
    """
    try:
        db = get_db()
        
        # Fetch all team members (Excluding password from DB)
        team_cursor = db.teams.find({}, {'password': 0})
        team_members = []
        
        for member in team_cursor:
            member['_id'] = str(member['_id'])
            # Remove password from response for security
            if 'password' in member:
                del member['password']
            team_members.append(member)
        
        return jsonify({
            'team_members': team_members,
            'count': len(team_members)
        }), 200

    except Exception as e:
        print(f"Get team members error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Getting team members failed. Please try again.'}), 500