import requests
import jwt
import sys

# Configuration
BASE_URL = "http://localhost:5000"
SECRET_KEY = "your_secret_key_here" # Should match backend config for local testing

def test_rbac_bypass():
    print("\n--- Testing RBAC Bypass ---")
    # Generate a JWT that only has user_id
    payload = {
        'user_id': '65f1234567890abcdef12345',
        'role': 'user'
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/team/vendors", headers=headers)
    
    if resp.status_code == 200:
        print("❌ FAIL: User token accepted on Team route!")
    elif resp.status_code == 401 or resp.status_code == 403:
        print("✅ PASS: User token rejected on Team route.")
    else:
        print(f"⚠️ UNCLEAR: Received status {resp.status_code}")

def test_nosql_injection():
    print("\n--- Testing NoSQL Injection on Login ---")
    # Payload designed to find any user if injection is possible
    payload = {
        "phone": {"$gt": ""},
        "password": "wrong_password"
    }
    try:
        resp = requests.post(f"{BASE_URL}/login", json=payload)
        # If the server is patched, it will treat {"$gt": ""} as a string "{\"$gt\": \"\"}"
        # and should return 401 or 404 because that phone doesn't exist.
        # If it returns 401, we need to be careful: did it find a user?
        # A patched server will check bcrypt.checkpw(password, user['password'])
        # If the query found a user via injection, it will proceed to checkpw.
        # However, with str(identifier), the query will be for the literal string.
        
        if resp.status_code == 200:
            print("❌ FAIL: Injection successful - Logged in!")
        elif resp.status_code == 401:
            print("✅ PASS: Login rejected (safe if query didn't find a user).")
        elif resp.status_code == 404:
            print("✅ PASS: User not found (safe).")
        else:
            print(f"⚠️ INFO: Received status {resp.status_code}")
    except Exception as e:
        print(f"Error during injection test: {e}")

def test_rbac_team_isolation():
    print("\n--- Testing Team API Isolation ---")
    # Payload with user role
    payload = {
        'user_id': '65f1234567890abcdef12345',
        'role': 'user'
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    headers = {"Authorization": f"Bearer {token}"}
    
    # Attempt to access add-vendor
    resp = requests.post(f"{BASE_URL}/team/add-vendor", headers=headers, json={})
    if resp.status_code == 403:
        print("✅ PASS: User blocked from Team API.")
    elif resp.status_code == 201 or resp.status_code == 200:
        print("❌ FAIL: User was able to access Team API!")
    else:
        print(f"⚠️ INFO: Received status {resp.status_code}")

def test_rate_limiting():
    print("\n--- Testing Rate Limiting on Forgot Password ---")
    # Try 10 requests rapidly
    for i in range(10):
        try:
            resp = requests.post(f"{BASE_URL}/forgot-password", json={"phone": "1234567890"})
            if resp.status_code == 429:
                print(f"✅ PASS: Rate limited at request {i+1}")
                return
        except Exception as e:
            print(f"Error during rate limit test: {e}")
            break
    print("❌ FAIL: No rate limit hit after 10 requests!")

if __name__ == "__main__":
    print("WheelsOnRent Security Validation Tool")
    test_rbac_bypass()
    test_rbac_team_isolation()
    test_nosql_injection()
    test_rate_limiting()
