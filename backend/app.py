from flask import Flask, request, jsonify
from flask_cors import CORS
from register import register_user, verify_otp
from login import login_user, get_profile, forgot_password, reset_password
from logout import logout_user
from team_panel import add_vendor, get_all_vendors, update_vendor, delete_vendor, vendor_login, get_all_team_members
from vendor_panel import get_vendor_profile, update_vendor_profile, get_vendor_vehicles, add_vehicle_to_vendor, get_vendor_bookings
from dl_upload import upload_dl, get_dl_status
from ride_history import get_user_bookings, create_booking, cancel_booking, get_available_vehicles
from qr import get_booking_qr, verify_qr, update_ride_status
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
            vendor_id = data.get('vendor_id')
            if not vendor_id:
                return jsonify({'error': 'Invalid vendor token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(vendor_id, *args, **kwargs)
    return decorated

# ==========================================
# GENERAL ROUTES
# ==========================================

@app.route('/')
def home():
    return jsonify({'message': 'Welcome to WheelsOnRent API'})

# ==========================================
# REGISTRATION & AUTH ROUTES
# ==========================================

@app.route('/register', methods=['POST'])
def register():
    return register_user()

@app.route('/verify-otp', methods=['POST'])
def verify():
    return verify_otp()

@app.route('/login', methods=['POST'])
def login():
    return login_user()

@app.route('/vendor/login', methods=['POST'])
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
# PASSWORD RESET ROUTES
# ==========================================

@app.route('/forgot-password', methods=['POST'])
def forgot_pass():
    return forgot_password()

@app.route('/reset-password', methods=['POST'])
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
        
        # Find active vehicles for this vendor - handle both string and ObjectId types
        print(f"DEBUG: Searching vehicles for vendor ID: {vendor_id}")
        
        search_query = {
            '$and': [
                {'is_available': True},
                {'$or': [
                    {'vendor_id': vendor_id},
                    {'vendor_id': str(vendor_id)}
                ]}
            ]
        }
        
        # Try to add ObjectId version of vendor_id to query if valid
        try:
            from bson import ObjectId
            if ObjectId.is_valid(vendor_id):
                search_query['$and'][1]['$or'].append({'vendor_id': ObjectId(vendor_id)})
        except:
            pass

        vehicles_cursor = list(db.vehicles.find(search_query))
        print(f"DEBUG: Found {len(vehicles_cursor)} vehicles for query: {search_query}")
        
        vehicles = []
        for v in vehicles_cursor:
            v['_id'] = str(v['_id'])
            if 'vendor_id' in v:
                v['vendor_id'] = str(v['vendor_id'])
            vehicles.append(v)
            
        return jsonify({'vehicles': vehicles, 'count': len(vehicles)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
# USER ACCESSIBLE VENDOR ROUTE
# ==========================================

@app.route('/vendors', methods=['GET'])
@token_required
def get_public_vendors(current_user_id):
    """Returns only active vendors that users can see"""
    try:
        from database import get_db
        db = get_db()
        
        # Find only active vendors
        vendors_cursor = db.vendors.find({'is_active': True})
        vendors = []
        
        for vendor in vendors_cursor:
            vendor['_id'] = str(vendor['_id'])
            # Remove password from response for security
            if 'password' in vendor:
                del vendor['password']
            vendors.append(vendor)
        
        return jsonify({
            'vendors': vendors,
            'count': len(vendors)
        }), 200

    except Exception as e:
        print(f"Get public vendors error: {str(e)}")
        return jsonify({'error': f'Getting vendors failed: {str(e)}'}), 500

@app.route('/locations', methods=['GET'])
def get_locations():
    """Returns distinct locations available in the system"""
    try:
        from database import get_db
        db = get_db()
        
        # Get distinct locations from vendors
        locations = db.vendors.distinct('location_id')
        # Filter out None or empty strings
        locations = [loc for loc in locations if loc]
        
        return jsonify({
            'locations': locations,
            'count': len(locations)
        }), 200

    except Exception as e:
        print(f"Get locations error: {str(e)}")
        return jsonify({'error': f'Getting locations failed: {str(e)}'}), 500

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

if __name__ == "__main__":
    app.run(debug=True)