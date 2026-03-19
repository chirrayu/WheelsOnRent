from flask_socketio import SocketIO, emit, join_room
import jwt
from flask import request

socketio = SocketIO(cors_allowed_origins="*")

def init_socketio(app):
    socketio.init_app(app)
    
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')
        emit('status', {'message': 'Connected to WheelsOnRent Real-time API'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')

    @socketio.on('join_vendor_room')
    def on_join_vendor(data):
        vendor_id = data.get('vendor_id')
        if vendor_id:
            room = f"vendor_{vendor_id}"
            join_room(room)
            print(f"Vendor {vendor_id} joined room {room}")
            emit('room_joined', {'room': room})

    @socketio.on('join_user_room')
    def on_join_user(data):
        user_id = data.get('user_id')
        if user_id:
            room = f"user_{user_id}"
            join_room(room)
            print(f"User {user_id} joined room {room}")
            emit('room_joined', {'room': room})

def emit_new_booking(vendor_id, booking_data):
    """Notify vendor of a new booking"""
    room = f"vendor_{vendor_id}"
    socketio.emit('new_booking', booking_data, room=room)
    print(f"Emitted new_booking to {room}")

def emit_ride_status_update(user_id, status_data):
    """Notify user of ride status update"""
    room = f"user_{user_id}"
    socketio.emit('ride_status_update', status_data, room=room)
    print(f"Emitted ride_status_update to {room}")
