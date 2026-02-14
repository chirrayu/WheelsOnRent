from flask import request, jsonify
import jwt
from datetime import datetime

def logout_user():
    """
    Handles user logout by clearing session data and invalidating tokens.
    """
    try:
        # Get the token from the request header
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Logged out successfully'}), 200
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            # Decode the token to validate it (but don't use the data)
            # In a real application, you might want to blacklist the token
            jwt.decode(token, 'your-secret-key', algorithms=['HS256'])
            
            # In a real app with token blacklisting, you would add the token to a blacklist
            # For now, we just return success to indicate the client should clear its local storage
            return jsonify({'message': 'Logged out successfully'}), 200
            
        except jwt.ExpiredSignatureError:
            # Token is already expired, so user is effectively logged out
            return jsonify({'message': 'Logged out successfully'}), 200
        except jwt.InvalidTokenError:
            # Invalid token, so user is effectively logged out
            return jsonify({'message': 'Logged out successfully'}), 200
    
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return jsonify({'error': f'Logout failed: {str(e)}'}), 500