from database import get_db
from flask import request, jsonify
import jwt 
import bcrypt
from datetime import datetime, timedelta
import random
from bson import ObjectId
import traceback
from email_service import otp_sending_function
from sms_service import send_otp_sms
from config import Config
        

def register_user():
    """
    Handles user registration by receiving user data, 
    hashing the password, and storing the user in the database.
    Registration is now immediate without OTP verification.
    """
    try:
        db = get_db()
        # Get user data from request
        data = request.get_json()
        name = data.get('name')
        password = data.get('password')
        phone = data.get('phone')

        # Validation checks
        if not name or not phone or not password:
            return jsonify({'error': 'Name, phone number, and password are required'}), 400

        # Check if user already exists
        existing_user = db.users.find_one({'phone': phone})
        if existing_user:
            return jsonify({'error': 'User with this phone number already exists'}), 409

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Create new user document (is_verified is True by default now)
        new_user = {
            'name': name,
            'password': hashed_password.decode('utf-8'),
            'phone': phone,
            'is_verified': True,
            'created_at': datetime.utcnow(),
            'role': 'user'  # Default role is 'user'
        }

        # Insert user into database
        result = db.users.insert_one(new_user)
        user_id = str(result.inserted_id)

        # Generate final JWT token immediately
        token = jwt.encode({
            'user_id': user_id,
            'phone': phone,
            'role': 'user',
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm='HS256')

        return jsonify({
            'message': 'User registered successfully!',
            'user_id': user_id,
            'token': token
        }), 201

    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


def verify_otp():
    """
    Deprecated: No longer required. Returns success immediately.
    """
    return jsonify({
        'message': 'OTP verification is no longer required. Registration complete!',
        'success': True
    }), 200