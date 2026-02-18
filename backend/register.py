from database import get_db
from flask import request, jsonify
import jwt 
import bcrypt
from datetime import datetime, timedelta
import random
from bson import ObjectId
import traceback
from email_service import otp_sending_function
from config import Config
        

def register_user():
    """
    Handles user registration by receiving user data, 
    hashing the password, sending OTP to email, and storing the user in the database.
    """
    try:
        db = get_db()
        # Get user data from request
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone = data.get('phone')

        # Validation checks
        if not name or not email or not password:
            return jsonify({'error': 'Name, email, and password are required'}), 400

        # Check if user already exists
        existing_user = db.users.find_one({'email': email})
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409

        # Generate a 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Send OTP via email service
        email_success = otp_sending_function(email, otp)
        if not email_success:
             return jsonify({'error': 'Failed to send OTP to your email'}), 500

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Create new user document with OTP and expiry
        new_user = {
            'name': name,
            'email': email,
            'password': hashed_password.decode('utf-8'),
            'phone': phone,
            'otp': otp,
            'otp_expiry': datetime.utcnow() + timedelta(minutes=5),
            'is_verified': False,
            'created_at': datetime.utcnow(),
            'role': 'user'  # Default role is 'user'
        }

        # Insert user into database
        result = db.users.insert_one(new_user)
        user_id = str(result.inserted_id)

        # Generate JWT token (temporary token for verification)
        token = jwt.encode({
            'user_id': user_id,
            'email': email,
            'exp': datetime.utcnow() + timedelta(minutes=10)  # Token valid for 10 mins during registration
        }, Config.SECRET_KEY, algorithm='HS256')

        return jsonify({
            'message': 'User registered successfully. Please verify your email using the OTP sent.',
            'user_id': user_id,
            'token': token,
            'otp_sent': True
        }), 201

    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


def verify_otp():
    """
    Verifies the OTP entered by the user and completes registration.
    """
    try:
        db = get_db()
        data = request.get_json()
        user_id = data.get('user_id')
        otp = data.get('otp')

        if not user_id or not otp:
            return jsonify({'error': 'User ID and OTP are required'}), 400

        # Find user by ID
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if OTP matches and hasn't expired
        if user['otp'] != otp:
            return jsonify({'error': 'Invalid OTP'}), 400
        
        if datetime.utcnow() > user['otp_expiry']:
            return jsonify({'error': 'OTP has expired'}), 400

        # Update user to mark as verified
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$set': {'is_verified': True},
                '$unset': {'otp': '', 'otp_expiry': ''}
            }
        )

        # Generate final JWT token for verified user
        token = jwt.encode({
            'user_id': user_id,
            'email': user['email'],
            'role': user.get('role', 'user'),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm='HS256')

        return jsonify({
            'message': 'Email verified successfully. Registration complete!',
            'token': token
        }), 200

    except Exception as e:
        print(f"Verification error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Verification failed: {str(e)}'}), 500