from database import get_db
from flask import request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from bson import ObjectId
import traceback

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
        if not name or not email or not username or not password:
            return jsonify({'error': 'Name, email, username, and password are required'}), 400

        # Check if vendor with this email already exists
        existing_vendor_email = db.vendors.find_one({'email': email})
        if existing_vendor_email:
            return jsonify({'error': 'Vendor with this email already exists'}), 409

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
            'created_at': datetime.utcnow(),
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
        return jsonify({'error': f'Adding vendor failed: {str(e)}'}), 500


def get_all_vendors():
    """
    Retrieves all vendors from the system.
    """
    try:
        db = get_db()
        
        # Fetch all vendors
        vendors_cursor = db.vendors.find({})
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
        return jsonify({'error': f'Getting vendors failed: {str(e)}'}), 500


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
        
        # Check if email already exists for another vendor
        if 'email' in update_fields:
            existing_vendor = db.vendors.find_one({
                'email': update_fields['email'],
                '_id': {'$ne': ObjectId(vendor_id)}
            })
            if existing_vendor:
                return jsonify({'error': 'Email already exists for another vendor'}), 409

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
        return jsonify({'error': f'Updating vendor failed: {str(e)}'}), 500


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
        return jsonify({'error': f'Deleting vendor failed: {str(e)}'}), 500


def vendor_login():
    """
    Handles vendor login by verifying credentials and generating JWT token.
    """
    try:
        db = get_db()
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400

        # Find vendor in database by username
        vendor = db.vendors.find_one({'username': username})
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
            {'$set': {'last_login': datetime.utcnow()}}
        )

        # Generate JWT token
        token = jwt.encode({
            'vendor_id': str(vendor['_id']),
            'username': vendor['username'],
            'role': vendor.get('role', 'vendor'),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, 'your-secret-key', algorithm='HS256')

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'vendor': {
                'id': str(vendor['_id']),
                'username': vendor['username'],
                'name': vendor['name'],
                'email': vendor['email'],
                'role': vendor.get('role', 'vendor'),
                'phone': vendor.get('phone', '')
            }
        }), 200

    except Exception as e:
        print(f"Vendor login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


def get_all_team_members():
    """
    Retrieves all team members from the system.
    """
    try:
        db = get_db()
        
        # Fetch all team members
        team_cursor = db.teams.find({})
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
        return jsonify({'error': f'Getting team members failed: {str(e)}'}), 500