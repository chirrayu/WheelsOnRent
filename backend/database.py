from pymongo import MongoClient
from bson import ObjectId
from config import Config

# Create Mongo client using centralized config
client = MongoClient(Config.MONGO_URI)

# Select database
db = client.get_database("WheelsOnRent")

def init_db():
    """Initializes indexes for performance and uniqueness."""
    # 1. Users Collection
    db.users.create_index("email", unique=True)
    db.users.create_index("phone", unique=True)
    
    # 2. Vendors Collection
    db.vendors.create_index("email", unique=True)
    db.vendors.create_index("location_id")
    db.vendors.create_index("is_active")
    
    # 3. Vehicles Collection
    db.vehicles.create_index("location_id")
    db.vehicles.create_index("vehicle_type")
    db.vehicles.create_index("is_available")
    db.vehicles.create_index([("location_id", 1), ("is_available", 1), ("vehicle_type", 1)])
    
    # 4. Bookings Collection
    db.bookings.create_index("user_id")
    db.bookings.create_index("status")
    db.bookings.create_index("vehicle_id")
    db.bookings.create_index([("user_id", 1), ("status", 1)])
    
    print("✅ Database indexes initialized successfully.")

def get_db():
    return db
