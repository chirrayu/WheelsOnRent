from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from register import register_user, verify_otp
from login import login_user, get_profile, forgot_password, reset_password
from logout import logout_user
from team_panel import add_vendor, get_all_vendors, update_vendor, delete_vendor, vendor_login, get_all_team_members
from vendor_panel import get_vendor_profile, update_vendor_profile, get_vendor_vehicles, add_vehicle_to_vendor, get_vendor_bookings, update_vehicle_by_vendor
from dl_upload import upload_dl, get_dl_status
from ride_history import get_user_bookings, create_booking, cancel_booking, get_available_vehicles
from qr import get_booking_qr, verify_qr, update_ride_status
from socket_service import socketio, init_socketio
from database import init_db
from cache_service import get_cache, set_cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import jwt
from functools import wraps
from config import Config
import database
import os
from datetime import datetime, timezone

app = Flask(__name__)
init_socketio(app)
init_db()

# Trust proxy headers for safe IP extraction (1 proxy expected)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

from security_logger import log_security_event

# Rate Limiter setup
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

@app.errorhandler(429)
def ratelimit_handler(e):
    log_security_event('RATE_LIMIT_HIT', {
        'ip': get_remote_address(),
        'endpoint': request.path,
        'method': request.method
    }, severity='WARNING')
    return jsonify({"error": "ratelimit exceeded", "message": str(e.description)}), 429

# ==========================================
# CONFIGURATION & MIDDLEWARE
# ==========================================

# Secret key for JWT from centralized config
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB limit for security

# Enhanced CORS configuration
CORS(app, 
     resources={r"/*": {
         "origins": [Config.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 3600
     }})

# Apply Security Headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # HSTS and Content-Security-Policy
    if Config.ENV == "production":
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; object-src 'none';"
    else:
        # Relaxed for local development
        response.headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';"
        
    return response


# ==========================================
# TOKEN DECORATORS
# ==========================================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        
        # Check cookie first, then Authorization header
        token = request.cookies.get('access_token')
        if not token:
            token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
                
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            
            # 1. Enforce role and field
            if data.get('role') != 'user' or 'user_id' not in data:
                return jsonify({'error': 'Unauthorized access'}), 403
            
            current_user_id = data['user_id']
            token_version = data.get('token_version', 0)

            # 2. STRICT: Verify token version against DB (Use projection for performance)
            db = database.get_db()
            user = db.users.find_one(
                {'_id': database.ObjectId(current_user_id)},
                {'token_version': 1}
            )
            if not user or user.get('token_version', 0) != token_version:
                return jsonify({'error': 'Token has been revoked or session expired'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
        except Exception as e:
            return jsonify({'error': f'Auth Error: {str(e)}'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

def team_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check cookie first, then Authorization header
        token = request.cookies.get('access_token')
        if not token:
            token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
                
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            
            # STRICT RBAC: Must have team role and team_id
            if data.get('role') != 'team' or 'team_id' not in data:
                return jsonify({'error': 'Team access required'}), 403
                
            current_team_id = data['team_id']
            token_version = data.get('token_version', 0)

            # 2. STRICT: Verify token version against DB (Use projection)
            db = database.get_db()
            team_member = db.teams.find_one(
                {'_id': database.ObjectId(current_team_id)},
                {'token_version': 1}
            )
            if not team_member or team_member.get('token_version', 0) != token_version:
                return jsonify({'error': 'Token has been revoked or session expired'}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
        except Exception as e:
            return jsonify({'error': f'Auth Error: {str(e)}'}), 401
            
        return f(current_team_id, *args, **kwargs)
    return decorated

def vendor_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check cookie first, then Authorization header
        token = request.cookies.get('access_token')
        if not token:
            token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
                
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            vendor_id = data.get('vendor_id')
            token_version = data.get('token_version', 0)
            
            if not vendor_id:
                return jsonify({'error': 'Invalid vendor token'}), 401
                
            # STRICT: Verify token version against DB (Use projection)
            db = database.get_db()
            vendor = db.vendors.find_one(
                {'_id': database.ObjectId(vendor_id)},
                {'token_version': 1}
            )
            if not vendor or vendor.get('token_version', 0) != token_version:
                return jsonify({'error': 'Token has been revoked or session expired'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
        except Exception as e:
            return jsonify({'error': f'Auth Error: {str(e)}'}), 401
            
        return f(vendor_id, *args, **kwargs)
    return decorated

# ==========================================
# GENERAL ROUTES
# ==========================================

@app.route('/')
def home():
    return jsonify({'message': 'Welcome to WheelsOnRent API'})

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint for deployment monitoring"""
    try:
        from database import get_db
        db = get_db()
        db.command('ping')
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return jsonify({
        "status": "ok",
        "service": "WheelsOnRent API",
        "environment": Config.ENV,
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200

# ==========================================
# REGISTRATION & AUTH ROUTES (Rate-Limited)
# ==========================================

@app.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    return register_user()

@app.route('/verify-otp', methods=['POST'])
@limiter.limit("10 per minute")
def verify():
    return verify_otp()

@app.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    return login_user()

@app.route('/vendor/login', methods=['POST'])
@limiter.limit("10 per minute")
def vendor_login_route():
    return vendor_login()

@app.route('/logout', methods=['POST'])
def logout():
    return logout_user()

# ==========================================
# USER PROFILE ROUTES
# ==========================================

@app.route('/profile', methods=['GET'])
@token_required
def get_user_profile(current_user_id):
    from login import get_profile
    return get_profile(current_user_id)

# ==========================================
# PASSWORD RESET ROUTES (Rate-Limited)
# ==========================================

@app.route('/forgot-password', methods=['POST'])
@limiter.limit("5 per hour")
def forgot_pass():
    return forgot_password()

@app.route('/reset-password', methods=['POST'])
@limiter.limit("5 per hour")
def reset_pass():
    return reset_password()

# ==========================================
# DL UPLOAD ROUTES
# ==========================================

@app.route('/dl/upload', methods=['POST'])
@token_required
def upload_dl_route(current_user_id):
    return upload_dl(current_user_id)

@app.route('/dl/status', methods=['GET'])
@token_required
def get_dl_status_route(current_user_id):
    return get_dl_status(current_user_id)

# ==========================================
# BOOKING / RIDE HISTORY ROUTES
# ==========================================

@app.route('/bookings', methods=['GET'])
@token_required
def get_bookings_route(current_user_id):
    return get_user_bookings(current_user_id)

@app.route('/bookings', methods=['POST'])
@token_required
def create_booking_route(current_user_id):
    return create_booking(current_user_id)

@app.route('/bookings/cancel', methods=['POST'])
@token_required
def cancel_booking_route(current_user_id):
    return cancel_booking(current_user_id)

@app.route('/vehicles/available', methods=['GET'])
@token_required
def get_available_vehicles_route(current_user_id):
    return get_available_vehicles()

@app.route('/vehicles/vendor/<vendor_id>', methods=['GET'])
@token_required
def get_vendor_vehicles_public_route(current_user_id, vendor_id):
    """Get available vehicles for a specific vendor for user booking"""
    try:
        from database import get_db
        from bson import ObjectId
        db = get_db()
        
        # Find active vehicles for this vendor - CAST TO STRING
        query = {'vendor_id': str(vendor_id), 'is_available': True}
        vehicles_cursor = db.vehicles.find(query)
        
        vehicles = []
        for v in vehicles_cursor:
            v['_id'] = str(v['_id'])
            vehicles.append(v)
            
        return jsonify({'vehicles': vehicles, 'count': len(vehicles)}), 200
    except Exception as e:
        return jsonify({'error': 'An internal error occurred.'}), 500

# ==========================================
# TEAM PANEL ROUTES
# ==========================================

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

# ==========================================
# USER ACCESSIBLE VENDOR & LOCATION ROUTES
# ==========================================

@app.route('/vendors', methods=['GET'])
@token_required
def get_public_vendors(current_user_id):
    """Returns only active vendors that users can see"""
    try:
        from database import get_db
        db = get_db()
        
        # 1. Try Cache First
        cached_res = get_cache("public:vendors")
        if cached_res:
            return jsonify(cached_res), 200

        vendors_cursor = db.vendors.find({'is_active': True})
        vendors = []
        
        for vendor in vendors_cursor:
            vendor['_id'] = str(vendor['_id'])
            if 'password' in vendor:
                del vendor['password']
            vendors.append(vendor)
        
        response_data = {
            'vendors': vendors,
            'count': len(vendors)
        }

        # 2. Set Cache (1 hour expiry)
        set_cache("public:vendors", response_data, expiry=3600)

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Get public vendors error: {str(e)}")
        return jsonify({'error': 'Getting vendors failed. Please try again later.'}), 500

@app.route('/locations', methods=['GET'])
def get_locations():
    """Returns distinct locations available in the system"""
    try:
        from database import get_db
        db = get_db()
        
        # 1. Try Cache First
        cached_res = get_cache("public:locations")
        if cached_res:
            return jsonify(cached_res), 200

        locations = db.vendors.distinct('location_id')
        locations = [loc for loc in locations if loc]
        
        response_data = {
            'locations': locations,
            'count': len(locations)
        }

        # 2. Set Cache (12 hour expiry as locations change rarely)
        set_cache("public:locations", response_data, expiry=43200)

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Get locations error: {str(e)}")
        return jsonify({'error': 'Getting locations failed. Please try again later.'}), 500

# ==========================================
# VENDOR PANEL ROUTES
# ==========================================

@app.route('/vendor/profile', methods=['GET'])
@vendor_token_required
def get_vendor_profile_route(vendor_id):
    return get_vendor_profile(vendor_id)

@app.route('/vendor/profile', methods=['PUT'])
@vendor_token_required
def update_vendor_profile_route(vendor_id):
    return update_vendor_profile(vendor_id)

@app.route('/vendor/vehicles', methods=['GET'])
@vendor_token_required
def get_vendor_vehicles_route(vendor_id):
    return get_vendor_vehicles(vendor_id)

@app.route('/vendor/vehicles', methods=['POST'])
@vendor_token_required
def add_vehicle_to_vendor_route(vendor_id):
    return add_vehicle_to_vendor(vendor_id)

@app.route('/vendor/bookings', methods=['GET'])
@vendor_token_required
def get_vendor_bookings_route(vendor_id):
    return get_vendor_bookings(vendor_id)

@app.route('/vendor/vehicle/<vehicle_id>', methods=['PUT'])
@vendor_token_required
def update_vehicle_route(vendor_id, vehicle_id):
    return update_vehicle_by_vendor(vendor_id, vehicle_id)

# ==========================================
# QR CODE ROUTES
# ==========================================

@app.route('/bookings/qr', methods=['GET'])
@token_required
def get_booking_qr_route(current_user_id):
    return get_booking_qr(current_user_id)

@app.route('/vendor/qr/verify', methods=['POST'])
@vendor_token_required
def verify_qr_route(vendor_id):
    return verify_qr(vendor_id)

@app.route('/vendor/ride/status', methods=['POST'])
@vendor_token_required
def update_ride_status_route(vendor_id):
    return update_ride_status(vendor_id)

# ==========================================
# ERROR HANDLERS (Production-Friendly)
# ==========================================


@app.errorhandler(500)
def internal_error(e):
    app.logger.error(f'Internal error: {str(e)}')
    return jsonify({
        'error': 'Internal server error',
        'message': 'Something went wrong on our end. Please try again later.'
    }), 500

# ==========================================
# RUN APPLICATION
# ==========================================

if __name__ == '__main__':
    # Use debug mode only in development
    debug_mode = Config.ENV == "development"
    
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=5000, 
        debug=debug_mode,
        allow_unsafe_werkzeug=debug_mode  # Required for Flask-SocketIO in debug
    )