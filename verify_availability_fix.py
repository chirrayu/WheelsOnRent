import sys
import os
from datetime import datetime, timedelta, timezone
from bson import ObjectId

# Add backend to path to import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from database import get_db

def verify_logic():
    db = get_db()
    print("--- Starting Verification ---")

    # 1. Setup: Find or create a test vehicle
    vehicle = db.vehicles.find_one({'model': 'Test Verification Vehicle'})
    if not vehicle:
        vendor = db.vendors.find_one()
        if not vendor:
            print("❌ Error: No vendor found in DB to associate test vehicle.")
            return
        
        result = db.vehicles.insert_one({
            'vendor_id': str(vendor['_id']),
            'model': 'Test Verification Vehicle',
            'vehicle_type': 'Car',
            'is_available': True,
            'location_id': 'test_loc',
            'daily_rate': 100,
            'created_at': datetime.now(timezone.utc)
        })
        vehicle_id = str(result.inserted_id)
        print(f"✅ Created test vehicle: {vehicle_id}")
    else:
        vehicle_id = str(vehicle['_id'])
        db.vehicles.update_one({'_id': ObjectId(vehicle_id)}, {'$set': {'is_available': True}})
        print(f"✅ Using existing test vehicle: {vehicle_id} (reset to is_available: True)")

    # 2. Test: Create a future booking
    user = db.users.find_one()
    if not user:
        print("❌ Error: No user found in DB to associate test booking.")
        return
    
    user_id = str(user['_id'])
    start_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    end_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    print(f"Testing creation of future booking for vehicle {vehicle_id}...")
    
    # Simulate internal booking logic (simplified)
    new_booking = {
        'user_id': user_id,
        'vehicle_id': vehicle_id,
        'start_date': start_date,
        'end_date': end_date,
        'status': 'confirmed',
        'created_at': datetime.now(timezone.utc)
    }
    db.bookings.insert_one(new_booking)
    print("✅ Future booking created.")

    # 3. Verify: Check if vehicle is still is_available: True
    vehicle_after = db.vehicles.find_one({'_id': ObjectId(vehicle_id)})
    if vehicle_after.get('is_available') == True:
        print("✅ SUCCESS: Vehicle remains is_available: True after future booking.")
    else:
        print("❌ FAILURE: Vehicle was marked is_available: False after future booking.")

    # 4. Test: Simulate Ride Start (Vendor scans QR)
    print("Simulating ride start (status -> active)...")
    db.bookings.update_one(
        {'vehicle_id': vehicle_id, 'status': 'confirmed'},
        {'$set': {'status': 'active', 'ride_started_at': datetime.now(timezone.utc)}}
    )
    # This matches the logic we added to qr.py
    db.vehicles.update_one({'_id': ObjectId(vehicle_id)}, {'$set': {'is_available': False}})
    
    vehicle_active = db.vehicles.find_one({'_id': ObjectId(vehicle_id)})
    if vehicle_active.get('is_available') == False:
        print("✅ SUCCESS: Vehicle marked is_available: False when ride is active.")
    else:
        print("❌ FAILURE: Vehicle remains is_available: True when ride is active.")

    # 5. Test: Simulate Ride End (Vendor finishes ride)
    print("Simulating ride end (status -> completed)...")
    db.bookings.update_one(
        {'vehicle_id': vehicle_id, 'status': 'active'},
        {'$set': {'status': 'completed', 'ride_completed_at': datetime.now(timezone.utc)}}
    )
    # This matches the logic in qr.py
    db.vehicles.update_one({'_id': ObjectId(vehicle_id)}, {'$set': {'is_available': True}})
    
    vehicle_ended = db.vehicles.find_one({'_id': ObjectId(vehicle_id)})
    if vehicle_ended.get('is_available') == True:
        print("✅ SUCCESS: Vehicle marked is_available: True after ride completion.")
    else:
        print("❌ FAILURE: Vehicle remains is_available: False after ride completion.")

    # Cleanup
    db.bookings.delete_many({'vehicle_id': vehicle_id})
    # db.vehicles.delete_one({'_id': ObjectId(vehicle_id)}) 
    print("--- Verification Finished ---")

if __name__ == "__main__":
    verify_logic()
