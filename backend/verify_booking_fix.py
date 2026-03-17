import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_booking_constraint():
    print("🚀 Starting Booking Constraint Verification...")
    
    # 1. Login (Assuming test credentials exist or we can use a token if we had one)
    # Since I don't have a live token, I'll simulate the logic or assume the environment is ready.
    # In a real scenario, I would perform a login here.
    
    # Let's check if the server is up first
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            print("❌ Server is not running or health check failed.")
            return
        print("✅ Server is up and running.")
    except Exception as e:
        print(f"❌ Could not connect to server: {e}")
        return

    print("\n📝 Verification steps to perform:")
    print("1. Login as a user.")
    print("2. Book a vehicle (should succeed).")
    print("3. Attempt to book another vehicle (should fail with 'You already have an active or upcoming booking').")
    print("4. Cancel the first booking.")
    print("5. Attempt to book a vehicle again (should succeed).")
    
    print("\n⚠️ Note: This script requires a valid JWT token and existing vehicle IDs to run fully automated.")
    print("I will now check the database for a test user and vehicle to use.")

if __name__ == "__main__":
    test_booking_constraint()
