from database import get_db
from flask import request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from bson import ObjectId
import traceback
from email_service import password_reset

def login_user():
    """
    Handles user login by verifying credentials and generating JWT token.
    """
    try:
        db = get_db()
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        # First, try to find user in users collection
        user = db.users.find_one({'email': email})
        if user:
            # Verify password
            if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                return jsonify({'error': 'Invalid credentials'}), 401

            # Check if user is verified
            if not user.get('is_verified', False):
                return jsonify({'error': 'Please verify your email first'}), 401

            # Generate JWT token
            token = jwt.encode({
                'user_id': str(user['_id']),
                'email': user['email'],
                'role': user.get('role', 'user'),
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, 'your-secret-key', algorithm='HS256')

            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': str(user['_id']),
                    'email': user['email'],
                    'name': user['name'],
                    'role': user.get('role', 'user'),
                    'phone': user.get('phone', '')
                }
            }), 200

        # Next, try to find team member in teams collection
        team_member = db.teams.find_one({'email': email})
        if team_member:
            # Verify password
            if not bcrypt.checkpw(password.encode('utf-8'), team_member['password'].encode('utf-8')):
                return jsonify({'error': 'Invalid credentials'}), 401

            # Check if team member is active
            if not team_member.get('is_active', True):
                return jsonify({'error': 'Team member account is deactivated'}), 401

            # Update last login time
            db.teams.update_one(
                {'_id': team_member['_id']},
                {'$set': {'last_login': datetime.utcnow()}}
            )

            # Generate JWT token
            token = jwt.encode({
                'team_id': str(team_member['_id']),
                'email': team_member['email'],
                'role': team_member.get('role', 'team'),
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, 'your-secret-key', algorithm='HS256')

            return jsonify({
                'message': 'Team login successful',
                'token': token,
                'user': {
                    'id': str(team_member['_id']),
                    'email': team_member['email'],
                    'name': team_member['name'],
                    'role': team_member.get('role', 'team'),
                    'phone': team_member.get('phone', '')
                }
            }), 200

        # Finally, try vendors collection
        vendor = db.vendors.find_one({'email': email})
        if vendor:
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
                'email': vendor['email'],
                'role': vendor.get('role', 'vendor'),
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, 'your-secret-key', algorithm='HS256')

            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': str(vendor['_id']),
                    'email': vendor['email'],
                    'name': vendor['name'],
                    'role': vendor.get('role', 'vendor'),
                    'phone': vendor.get('phone', '')
                }
            }), 200

        # If not found in any collection
        return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


def get_profile(current_user_id):
    """
    Retrieves user, team member, or vendor profile information.
    """
    try:
        db = get_db()
        
        # Try to find in users collection first
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user:
            return jsonify({
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email'],
                    'phone': user.get('phone', ''),
                    'dl_number': user.get('dl_number', ''),
                    'role': user.get('role', 'user'),
                    'created_at': user['created_at']
                }
            }), 200

        # Try to find in teams collection
        team_member = db.teams.find_one({'_id': ObjectId(current_user_id)})
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
        vendor = db.vendors.find_one({'_id': ObjectId(current_user_id)})
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
        return jsonify({'error': f'Profile retrieval failed: {str(e)}'}), 500


def forgot_password():
    """
    Handles password reset request.
    """
    try:
        db = get_db()
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        # First, try to find in users collection
        user = db.users.find_one({'email': email})
        if user:
            # Generate a reset token
            reset_token = jwt.encode({
                'user_id': str(user['_id']),
                'email': user['email'],
                'exp': datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
            }, 'your-secret-key', algorithm='HS256')

            # Create the reset link
            reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

            # Send the password reset email
            email_success = password_reset(email, reset_link)
            if not email_success:
                return jsonify({'error': 'Failed to send password reset email'}), 500

            return jsonify({
                'message': 'Password reset link has been sent to your email'
            }), 200

        # Try to find in teams collection
        team_member = db.teams.find_one({'email': email})
        if team_member:
            # Generate a reset token
            reset_token = jwt.encode({
                'team_id': str(team_member['_id']),
                'email': team_member['email'],
                'exp': datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
            }, 'your-secret-key', algorithm='HS256')

            # Create the reset link
            reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

            # Send the password reset email
            email_success = password_reset(email, reset_link)
            if not email_success:
                return jsonify({'error': 'Failed to send password reset email'}), 500

            return jsonify({
                'message': 'Password reset link has been sent to your email'
            }), 200

        # Try to find in vendors collection
        vendor = db.vendors.find_one({'email': email})
        if vendor:
            # Generate a reset token
            reset_token = jwt.encode({
                'vendor_id': str(vendor['_id']),
                'email': vendor['email'],
                'exp': datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
            }, 'your-secret-key', algorithm='HS256')

            # Create the reset link
            reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

            # Send the password reset email
            email_success = password_reset(email, reset_link)
            if not email_success:
                return jsonify({'error': 'Failed to send password reset email'}), 500

            return jsonify({
                'message': 'Password reset link has been sent to your email'
            }), 200

        # Return success even if user doesn't exist to prevent email enumeration
        return jsonify({'message': 'If an account exists, a password reset link has been sent'}), 200

    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Password reset request failed: {str(e)}'}), 500


def reset_password():
    """
    Handles password reset using reset token.
    """
    try:
        db = get_db()
        data = request.get_json()
        reset_token = data.get('reset_token')
        new_password = data.get('new_password')

        if not reset_token or not new_password:
            return jsonify({'error': 'Reset token and new password are required'}), 400

        try:
            # Decode the reset token
            decoded_token = jwt.decode(reset_token, 'your-secret-key', algorithms=['HS256'])
            
            # Determine which collection to use based on token type
            if 'user_id' in decoded_token:
                user_id = decoded_token['user_id']
                collection = db.users
            elif 'team_id' in decoded_token:
                user_id = decoded_token['team_id']
                collection = db.teams
            elif 'vendor_id' in decoded_token:
                user_id = decoded_token['vendor_id']
                collection = db.vendors
            else:
                return jsonify({'error': 'Invalid reset token'}), 400

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Reset token has expired'}), 400
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid reset token'}), 400

        # Validate new password
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400

        # Hash the new password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

        # Update user's/team's/vendor's password
        result = collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'password': hashed_password.decode('utf-8')}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'message': 'Password has been reset successfully'}), 200

    except Exception as e:
        print(f"Reset password error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Password reset failed: {str(e)}'}), 500