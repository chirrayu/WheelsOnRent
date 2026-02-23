from database import get_db
from flask import request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from bson import ObjectId
import traceback
from config import Config

def team_login():
    """
    Handles team member login by verifying credentials and generating JWT token.
    """
    try:
        db = get_db()
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        # Find team member in database (stored in teams collection)
        team_member = db.teams.find_one({'email': email})
        if not team_member:
            return jsonify({'error': 'Invalid credentials or insufficient permissions'}), 401

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
            'phone': team_member['phone'],
            'role': team_member.get('role', 'team'),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm='HS256')

        return jsonify({
            'message': 'Team login successful',
            'token': token,
            'user': {
                'id': str(team_member['_id']),
                'phone': team_member['phone'],
                'name': team_member['name'],
                'role': team_member.get('role', 'team'),
                'email': team_member.get('email', '')
            }
        }), 200

    except Exception as e:
        print(f"Team login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Team login failed: {str(e)}'}), 500