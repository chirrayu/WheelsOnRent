from flask_socketio import SocketIO, emit, join_room, leave_room
from config import Config
import jwt
from flask import request

# Production-ready SocketIO instance
socketio = SocketIO(
    cors_allowed_origins=[Config.FRONTEND_URL],
    async_mode="eventlet",
    message_queue="redis://localhost:6379/0",  # Required for scaling
    ping_timeout=60,
    ping_interval=25
)


def init_socketio(app):
    socketio.init_app(app)

    # ==========================
    # CONNECT / DISCONNECT
    # ==========================
    @socketio.on('connect')
    def handle_connect():
        token = request.args.get('token')

        if not token:
            print("❌ Connection rejected: No token")
            return False

        try:
            if token.startswith('Bearer '):
                token = token[7:]

            data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])

            # Attach decoded user data to request context
            request.user = data

            print(f"✅ Client connected: {data}")
            emit('status', {
                'message': 'Authenticated connection established'
            })

        except jwt.ExpiredSignatureError:
            print("❌ Connection rejected: Token expired")
            return False
        except jwt.InvalidTokenError:
            print("❌ Connection rejected: Invalid token")
            return False
        except Exception as e:
            print(f"❌ Connection rejected: {str(e)}")
            return False

    @socketio.on('disconnect')
    def handle_disconnect():
        print('🔌 Client disconnected')

    # ==========================
    # ROOM JOINING (SECURED)
    # ==========================

    @socketio.on('join_vendor_room')
    def on_join_vendor():
        token_data = getattr(request, 'user', None)

        if not token_data or token_data.get('role') != 'vendor':
            emit('error', {'message': 'Unauthorized: Vendor access required'})
            return

        vendor_id = token_data.get('vendor_id')
        if not vendor_id:
            emit('error', {'message': 'Invalid vendor token'})
            return

        room = f"vendor_{vendor_id}"
        join_room(room)

        print(f"🏢 Vendor {vendor_id} joined {room}")
        emit('room_joined', {'room': room})

    @socketio.on('join_user_room')
    def on_join_user():
        token_data = getattr(request, 'user', None)

        if not token_data or token_data.get('role') != 'user':
            emit('error', {'message': 'Unauthorized: User access required'})
            return

        user_id = token_data.get('user_id')
        if not user_id:
            emit('error', {'message': 'Invalid user token'})
            return

        room = f"user_{user_id}"
        join_room(room)

        print(f"👤 User {user_id} joined {room}")
        emit('room_joined', {'room': room})

    # ==========================
    # OPTIONAL: LEAVE ROOM
    # ==========================
    @socketio.on('leave_room')
    def on_leave(data):
        room = data.get('room')
        if room:
            leave_room(room)
            print(f"🚪 Left room: {room}")
            emit('room_left', {'room': room})


# ==========================
# EMIT FUNCTIONS (GLOBAL)
# ==========================

def emit_new_booking(vendor_id, booking_data):
    """Notify vendor of a new booking"""
    room = f"vendor_{vendor_id}"
    socketio.emit('new_booking', booking_data, room=room)
    print(f"📢 Emitted new_booking to {room}")


def emit_ride_status_update(user_id, status_data):
    """Notify user of ride status update"""
    room = f"user_{user_id}"
    socketio.emit('ride_status_update', status_data, room=room)
    print(f"📢 Emitted ride_status_update to {room}")