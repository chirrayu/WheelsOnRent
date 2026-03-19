from database import get_db
from flask import request, jsonify
import jwt 
import bcrypt
from datetime import datetime, timedelta, timezone
import random
from bson import ObjectId
from pymongo import ReturnDocument
import traceback
from email_service import otp_sending_function
from config import Config
from security_logger import log_security_event
        

def register_user():
    """
    Handles user registration:
    1. Validates input data
    2. Hashes the password
    3. Generates a 6-digit OTP and sends it via Email
    4. Stores the user as unverified until OTP is confirmed
    """
    try:
        db = get_db()
        # Get user data from request
        data = request.get_json()
        name = data.get('name')
        password = data.get('password')
        phone = data.get('phone')
        email = data.get('email')

        # Validation checks
        if not name or not phone or not password or not email:
            log_security_event('SIGNUP_ATTEMPT', {'identifier': phone or email, 'status': 'missing_fields'}, severity='INFO')
            return jsonify({'error': 'Name, email, phone number, and password are required'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400

        # Check if user already exists and is verified (phone or email)
        # Optimization: Only fetch _id and is_verified
        existing_user = db.users.find_one(
            {'$or': [{'phone': str(phone)}, {'email': str(email)}]},
            {'_id': 1, 'is_verified': 1}
        )
        if existing_user:
            if existing_user.get('is_verified', False):
                return jsonify({'error': 'User with this phone number or email already exists'}), 409
            else:
                # User exists but is unverified — delete old record so they can re-register
                db.users.delete_one({'_id': existing_user['_id']})

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Generate OTP
        otp = str(random.randint(100000, 999999))

        # Create new user document (unverified until OTP is confirmed)
        new_user = {
            'name': name,
            'email': email,
            'password': hashed_password.decode('utf-8'),
            'phone': phone,
            'is_verified': False,
            'otp': otp,
            'otp_expiry': datetime.now(timezone.utc) + timedelta(minutes=5),
            'created_at': datetime.now(timezone.utc),
            'role': 'user'
        }

        # Insert user into database
        result = db.users.insert_one(new_user)
        user_id = str(result.inserted_id)

        # Send OTP via Email using Resend
        email_sent = otp_sending_function(email, otp)
        if not email_sent:
            print(f"WARNING: OTP Email failed for {email}. OTP: {otp}")

        log_security_event('SIGNUP_SUCCESS', {'user_id': user_id, 'phone': phone}, severity='INFO')

        return jsonify({
            'message': 'OTP sent to your email address. Please verify to complete registration.',
            'user_id': user_id
        }), 201

    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Registration failed. Please try again later.'}), 500


def verify_otp():
    """
    Verifies the OTP sent during registration.
    On success, marks the user as verified and returns a JWT token.
    """
    try:
        db = get_db()
        data = request.get_json()
        phone = data.get('phone')
        otp = data.get('otp')

        if not phone or not otp:
            return jsonify({'error': 'Phone number and OTP are required'}), 400

        # Find unverified user with this phone AND correct OTP in ONE ATOMIC STEP
        # This prevents OTP reuse and race conditions
        user = db.users.find_one_and_update(
            {
                'phone': str(phone), 
                'otp': str(otp), 
                'is_verified': False,
                'otp_expiry': {'$gt': datetime.now(timezone.utc)}
            },
            {
                '$set': {'is_verified': True},
                '$unset': {'otp': '', 'otp_expiry': ''}
            },
            return_document=ReturnDocument.BEFORE
        )

        if not user:
            # Optimization: Only fetch _id
            exists = db.users.find_one({'phone': str(phone)}, {'_id': 1})
            if not exists:
                log_security_event('OTP_VERIFY_FAIL', {'identifier': phone, 'reason': 'user_not_found'}, severity='INFO')
                return jsonify({'error': 'No registration found for this phone number'}), 404
            
            log_security_event('OTP_VERIFY_FAIL', {'identifier': phone, 'reason': 'invalid_otp'}, severity='INFO')
            return jsonify({'error': 'Invalid or expired OTP'}), 401

        # Generate JWT token
        token = jwt.encode({
            'user_id': str(user['_id']),
            'phone': phone,
            'role': 'user',
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm='HS256')

        log_security_event('OTP_VERIFY_SUCCESS', {'user_id': str(user['_id']), 'phone': phone}, severity='INFO')

        return jsonify({
            'message': 'Registration complete! You are now verified.',
            'token': token,
            'user_id': str(user['_id'])
        }), 200

    except Exception as e:
        print(f"OTP verification error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'OTP verification failed. Please try again.'}), 500