from flask import request, jsonify, make_response
import jwt
from datetime import datetime
from config import Config

def logout_user():
    """
    Handles user logout by clearing the access_token cookie.
    """
    try:
        response = make_response(jsonify({'message': 'Logged out successfully'}), 200)
        # Clear the access_token cookie
        response.set_cookie(
            'access_token', '',
            httponly=True,
            secure=Config.ENV == 'production',
            samesite='Lax',
            max_age=0,  # Expire immediately
            expires=0
        )
        return response
    
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed. Please try again.'}), 500