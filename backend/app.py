from flask import Flask, request, jsonify
from flask_cors import CORS
from register import register_user, verify_otp
from login import login_user, get_profile, forgot_password, reset_password
from logout import logout_user
from team_panel import add_vendor, get_all_vendors, update_vendor, delete_vendor, vendor_login, get_all_team_members
import jwt
from functools import wraps

app = Flask(__name__)
CORS(app)

# Secret key for JWT
app.config['SECRET_KEY'] = 'your-secret-key'  # Change this to a strong secret in production

# Token decorator for protected routes
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
                
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

def team_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
                
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            # Check if it's a team member token (could be team_id or user_id depending on your implementation)
            if 'team_id' in data:
                current_team_id = data['team_id']
            elif 'user_id' in data:
                current_team_id = data['user_id']
            else:
                return jsonify({'error': 'Invalid token format'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(current_team_id, *args, **kwargs)
    return decorated

def vendor_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
                
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            vendor_id = data['vendor_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(vendor_id, *args, **kwargs)
    return decorated

# Routes
@app.route('/')
def home():
    return jsonify({'message': 'Welcome to WheelsOnRent API'})

# Registration routes
@app.route('/register', methods=['POST'])
def register():
    return register_user()

@app.route('/verify-otp', methods=['POST'])
def verify():
    return verify_otp()

# Login routes
@app.route('/login', methods=['POST'])
def login():
    return login_user()

# Vendor login route
@app.route('/vendor/login', methods=['POST'])
def vendor_login_route():
    return vendor_login()

# Logout route
@app.route('/logout', methods=['POST'])
def logout():
    return logout_user()

# Profile routes
@app.route('/profile', methods=['GET'])
@token_required
def get_user_profile(current_user_id):
    from login import get_profile
    return get_profile(current_user_id)

# Password reset routes
@app.route('/forgot-password', methods=['POST'])
def forgot_pass():
    return forgot_password()

@app.route('/reset-password', methods=['POST'])
def reset_pass():
    return reset_password()

# Team panel routes - These require team member authentication
@app.route('/team/add-vendor', methods=['POST'])
@team_token_required
def add_vendor_route(current_team_id):
    return add_vendor()

@app.route('/team/vendors', methods=['GET'])
@team_token_required
def get_all_vendors_route(current_team_id):
    return get_all_vendors()

@app.route('/team/vendor/<vendor_id>', methods=['PUT'])
@team_token_required
def update_vendor_route(current_team_id, vendor_id):
    return update_vendor(vendor_id)

@app.route('/team/vendor/<vendor_id>', methods=['DELETE'])
@team_token_required
def delete_vendor_route(current_team_id, vendor_id):
    return delete_vendor(vendor_id)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)