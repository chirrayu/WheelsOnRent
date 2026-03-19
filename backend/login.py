from database import get_db
from flask import request, jsonify, make_response
import jwt
import bcrypt
import random
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import traceback
from email_service import password_reset, otp_sending_function
from config import Config
from security_logger import log_security_event

def login_user():
    """
    Handles user login by verifying credentials and generating JWT token.
    """
    try:
        db = get_db()
        data = request.get_json()
        identifier = data.get('phone') # Can be phone or email
        password = data.get('password')

        if not identifier or not password:
            return jsonify({'error': 'Credentials and password are required'}), 400

        # First, try to find user in users collection (Strictly by phone)
        user = db.users.find_one({'phone': str(identifier)})
        if user:
            # ACCOUNT-LEVEL THROTTLING
            if user.get('login_attempts', 0) >= 5:
                # Check if last attempt was within 15 minutes
                last_attempt = user.get('last_attempt_time')
                if last_attempt and (datetime.now(timezone.utc) - last_attempt.replace(tzinfo=timezone.utc)).total_seconds() < 900:
                    log_security_event('ACCOUNT_LOCKED', {'identifier': identifier, 'type': 'user'}, severity='WARNING')
                    return jsonify({'error': 'Too many failed login attempts. Account locked for 15 minutes.'}), 429
                else:
                    # Reset after 15 mins
                    db.users.update_one({'_id': user['_id']}, {'$set': {'login_attempts': 0}})

            if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                db.users.update_one(
                    {'_id': user['_id']}, 
                    {'$inc': {'login_attempts': 1}, '$set': {'last_attempt_time': datetime.now(timezone.utc)}}
                )
                log_security_event('LOGIN_FAIL', {'identifier': identifier, 'type': 'user'}, severity='INFO')
                return jsonify({'error': 'Invalid credentials'}), 401

            # Successful login: Reset attempts and update token version if missing
            db.users.update_one(
                {'_id': user['_id']}, 
                {'$set': {'login_attempts': 0, 'last_login': datetime.now(timezone.utc)}}
            )
            
            # Use existing token_version or initialize it
            token_version = user.get('token_version', 0)

            # Check if user is verified
            if not user.get('is_verified', False):
                return jsonify({'error': 'Account not verified. Please complete OTP verification.'}), 403

            # Generate JWT token with token_version
            token = jwt.encode({
                'user_id': str(user['_id']),
                'phone': user['phone'],
                'role': user.get('role', 'user'),
                'token_version': token_version,
                'exp': datetime.now(timezone.utc) + timedelta(hours=24)
            }, Config.SECRET_KEY, algorithm='HS256')

            log_security_event('LOGIN_SUCCESS', {'user_id': str(user['_id']), 'role': 'user'}, severity='INFO')

            response = make_response(jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': str(user['_id']),
                    'phone': user['phone'],
                    'name': user['name'],
                    'role': user.get('role', 'user')
                }
            }), 200)
            response.set_cookie(
                'access_token', token,
                httponly=True,
                secure=Config.ENV == 'production',
                samesite='Lax',
                max_age=86400  # 24 hours
            )
            return response

        # Next, try to find team member in teams collection (Strictly by email)
        team_member = db.teams.find_one({'email': str(identifier)})
        if team_member:
            # ACCOUNT-LEVEL THROTTLING
            if team_member.get('login_attempts', 0) >= 5:
                last_attempt = team_member.get('last_attempt_time')
                if last_attempt and (datetime.now(timezone.utc) - last_attempt.replace(tzinfo=timezone.utc)).total_seconds() < 900:
                    log_security_event('ACCOUNT_LOCKED', {'identifier': identifier, 'type': 'team'}, severity='WARNING')
                    return jsonify({'error': 'Too many failed login attempts. Account locked for 15 minutes.'}), 429

            if not bcrypt.checkpw(password.encode('utf-8'), team_member['password'].encode('utf-8')):
                db.teams.update_one(
                    {'_id': team_member['_id']}, 
                    {'$inc': {'login_attempts': 1}, '$set': {'last_attempt_time': datetime.now(timezone.utc)}}
                )
                log_security_event('LOGIN_FAIL', {'identifier': identifier, 'type': 'team'}, severity='INFO')
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Successful login
            token_version = team_member.get('token_version', 0)
            db.teams.update_one(
                {'_id': team_member['_id']}, 
                {'$set': {'login_attempts': 0, 'last_login': datetime.now(timezone.utc)}}
            )

            # Generate JWT token with token_version
            token = jwt.encode({
                'team_id': str(team_member['_id']),
                'phone': team_member['phone'],
                'role': team_member.get('role', 'team'),
                'token_version': token_version,
                'exp': datetime.now(timezone.utc) + timedelta(hours=24)
            }, Config.SECRET_KEY, algorithm='HS256')

            log_security_event('LOGIN_SUCCESS', {'team_id': str(team_member['_id']), 'role': 'team'}, severity='INFO')

            response = make_response(jsonify({
                'message': 'Team login successful',
                'token': token,
                'user': {
                    'id': str(team_member['_id']),
                    'phone': team_member['phone'],
                    'name': team_member['name'],
                    'role': team_member.get('role', 'team'),
                    'email': team_member.get('email', '')
                }
            }), 200)
            response.set_cookie(
                'access_token', token,
                httponly=True,
                secure=Config.ENV == 'production',
                samesite='Lax',
                max_age=86400
            )
            return response

        # Finally, try vendors collection (Strictly by email)
        vendor = db.vendors.find_one({'email': str(identifier)})
        if vendor:
            # ACCOUNT-LEVEL THROTTLING
            if vendor.get('login_attempts', 0) >= 5:
                last_attempt = vendor.get('last_attempt_time')
                if last_attempt and (datetime.now(timezone.utc) - last_attempt.replace(tzinfo=timezone.utc)).total_seconds() < 900:
                    log_security_event('ACCOUNT_LOCKED', {'identifier': identifier, 'type': 'vendor'}, severity='WARNING')
                    return jsonify({'error': 'Too many failed login attempts. Account locked for 15 minutes.'}), 429

            if not bcrypt.checkpw(password.encode('utf-8'), vendor['password'].encode('utf-8')):
                db.vendors.update_one(
                    {'_id': vendor['_id']}, 
                    {'$inc': {'login_attempts': 1}, '$set': {'last_attempt_time': datetime.now(timezone.utc)}}
                )
                log_security_event('LOGIN_FAIL', {'identifier': identifier, 'type': 'vendor'}, severity='INFO')
                return jsonify({'error': 'Invalid credentials'}), 401

            # Successful login
            token_version = vendor.get('token_version', 0)
            db.vendors.update_one(
                {'_id': vendor['_id']}, 
                {'$set': {'login_attempts': 0, 'last_login': datetime.now(timezone.utc)}}
            )
            log_security_event('LOGIN_SUCCESS', {'vendor_id': str(vendor['_id']), 'role': 'vendor'}, severity='INFO')

            # Generate JWT token with token_version
            token = jwt.encode({
                'vendor_id': str(vendor['_id']),
                'phone': vendor['phone'],
                'role': vendor.get('role', 'vendor'),
                'token_version': token_version,
                'exp': datetime.now(timezone.utc) + timedelta(hours=24)
            }, Config.SECRET_KEY, algorithm='HS256')

            response = make_response(jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': str(vendor['_id']),
                    'phone': vendor['phone'],
                    'name': vendor['name'],
                    'role': vendor.get('role', 'vendor'),
                    'email': vendor.get('email', ''),
                    'location_id': vendor.get('location_id', '')
                }
            }), 200)
            response.set_cookie(
                'access_token', token,
                httponly=True,
                secure=Config.ENV == 'production',
                samesite='Lax',
                max_age=86400
            )
            return response

        # If not found in any collection
        return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Login failed. Please try again.'}), 500


def get_profile(current_user_id):
    """
    Retrieves user, team member, or vendor profile information.
    """
    try:
        db = get_db()
        
        # Optimization: Projection to exclude sensitive/unused fields
        projection = {'password': 0, 'login_attempts': 0, 'last_attempt_time': 0, 'token_version': 0}
        
        # Try to find in users collection first
        user = db.users.find_one({'_id': ObjectId(current_user_id)}, projection)
        if user:
            return jsonify({
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'phone': user.get('phone', ''),
                    'dl_number': user.get('dl_number', ''),
                    'role': user.get('role', 'user'),
                    'created_at': user['created_at']
                }
            }), 200

        # Try to find in teams collection
        team_member = db.teams.find_one({'_id': ObjectId(current_user_id)}, projection)
        if team_member:
            return jsonify({
                'user': {
                    'id': str(team_member['_id']),
                    'name': team_member['name'],
                    'email': team_member['email'],
                    'phone': team_member.get('phone', ''),
                    'role': team_member.get('role', 'team'),
                    'created_at': team_member['created_at'],
                    'last_login': team_member.get('last_login', None)
                }
            }), 200

        # Try to find in vendors collection
        vendor = db.vendors.find_one({'_id': ObjectId(current_user_id)}, projection)
        if vendor:
            return jsonify({
                'user': {
                    'id': str(vendor['_id']),
                    'name': vendor['name'],
                    'email': vendor['email'],
                    'phone': vendor.get('phone', ''),
                    'role': vendor.get('role', 'vendor'),
                    'location_id': vendor.get('location_id', ''),
                    'created_at': vendor['created_at'],
                    'last_login': vendor.get('last_login', None)
                }
            }), 200

        return jsonify({'error': 'User not found'}), 404

    except Exception as e:
        print(f"Profile retrieval error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Profile retrieval failed. Please try again.'}), 500


def forgot_password():
    """
    Handles password reset request.
    """
    try:
        db = get_db()
        data = request.get_json()
        phone = data.get('phone')

        if not phone:
            return jsonify({'error': 'Phone number is required'}), 400

        # First, try to find in users collection
        user = db.users.find_one({'phone': str(phone)})
        if user:
            # Generate a reset token
            reset_token = jwt.encode({
                'user_id': str(user['_id']),
                'phone': user['phone'],
                'exp': datetime.now(timezone.utc) + timedelta(hours=1)  # 1 hour expiry
            }, Config.SECRET_KEY, algorithm='HS256')

            # Create a localized reset code (simplifying for SMS)
            reset_code = str(random.randint(100000, 999999))
            
            # Store reset code in DB temporarily
            db.users.update_one({'_id': user['_id']}, {'$set': {'reset_code': reset_code, 'reset_code_expiry': datetime.now(timezone.utc) + timedelta(minutes=15)}})

            # Send the password reset Email instead of SMS
            email_success = otp_sending_function(user['email'], f"Your password reset code is: {reset_code}")
            if not email_success:
                return jsonify({'error': 'Failed to send password reset email'}), 500

            return jsonify({
                'message': 'Password reset code has been sent to your phone'
            }), 200

        # Try to find in teams collection
        team_member = db.teams.find_one({'phone': str(phone)})
        if team_member:
            # Generate a reset token
            reset_token = jwt.encode({
                'team_id': str(team_member['_id']),
                'phone': team_member['phone'],
                'exp': datetime.now(timezone.utc) + timedelta(hours=1)  # 1 hour expiry
            }, Config.SECRET_KEY, algorithm='HS256')

            # Create a localized reset code
            reset_code = str(random.randint(100000, 999999))
            
            # Store reset code in DB temporarily
            db.teams.update_one({'_id': team_member['_id']}, {'$set': {'reset_code': reset_code, 'reset_code_expiry': datetime.now(timezone.utc) + timedelta(minutes=15)}})

            # Send the password reset Email instead of SMS
            email_success = otp_sending_function(team_member['email'], f"Your team account password reset code is: {reset_code}")
            if not email_success:
                return jsonify({'error': 'Failed to send password reset email'}), 500

            return jsonify({
                'message': 'Password reset code has been sent to your phone'
            }), 200

        # Try to find in vendors collection
        vendor = db.vendors.find_one({'phone': str(phone)})
        if vendor:
            # Generate a reset token
            reset_token = jwt.encode({
                'vendor_id': str(vendor['_id']),
                'phone': vendor['phone'],
                'exp': datetime.now(timezone.utc) + timedelta(hours=1)  # 1 hour expiry
            }, Config.SECRET_KEY, algorithm='HS256')

            # Create a localized reset code
            reset_code = str(random.randint(100000, 999999))
            
            # Store reset code in DB temporarily
            db.vendors.update_one({'_id': vendor['_id']}, {'$set': {'reset_code': reset_code, 'reset_code_expiry': datetime.now(timezone.utc) + timedelta(minutes=15)}})

            # Send the password reset Email instead of SMS
            email_success = otp_sending_function(vendor['email'], f"Your vendor account password reset code is: {reset_code}")
            if not email_success:
                return jsonify({'error': 'Failed to send password reset email'}), 500

            return jsonify({
                'message': 'Password reset code has been sent to your phone'
            }), 200

        # Return success even if user doesn't exist to prevent phone enumeration
        return jsonify({'message': 'If an account exists, a password reset code has been sent'}), 200

    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Password reset request failed. Please try again.'}), 500


def reset_password():
    """
    Handles password reset using phone and reset code.
    """
    try:
        db = get_db()
        data = request.get_json()
        phone = data.get('phone')
        reset_code = data.get('reset_code')
        new_password = data.get('new_password')

        if not phone or not reset_code or not new_password:
            return jsonify({'error': 'Phone, reset code, and new password are required'}), 400
        
        # Determine collection by checking where the code exists
        user_data = None
        collection = None
        
        for coll in [db.users, db.teams, db.vendors]:
            # Optimization: Only fetch _id and name
            user_data = coll.find_one({
                'phone': str(phone),
                'reset_code': str(reset_code),
                'reset_code_expiry': {'$gt': datetime.now(timezone.utc)}
            }, {'_id': 1})
            if user_data:
                collection = coll
                break
        
        if not user_data or not collection:
            log_security_event('PASSWORD_RESET_FAIL', {'identifier': phone, 'reason': 'invalid_code'}, severity='WARNING')
            return jsonify({'error': 'Invalid or expired reset code'}), 401

        # Validate new password
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400

        # Hash the new password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

        # Update password and increment token_version
        result = collection.update_one(
            {'_id': user_data['_id']},
            {
                '$set': {'password': hashed_password.decode('utf-8'), 'login_attempts': 0},
                '$inc': {'token_version': 1},
                '$unset': {'reset_code': '', 'reset_code_expiry': ''}
            }
        )
        log_security_event('PASSWORD_RESET_SUCCESS', {'user_id': str(user_data['_id']), 'phone': phone}, severity='INFO')

        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'message': 'Password has been reset successfully'}), 200

    except Exception as e:
        print(f"Reset password error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Password reset failed. Please try again.'}), 500