#!/usr/bin/env python3
"""
Simple API test script to verify endpoints are working
"""
import requests
import json

API_BASE_URL = 'http://localhost:8001/api'

def test_endpoint(method, endpoint, data=None, headers=None):
    """Test an API endpoint"""
    url = f"{API_BASE_URL}{endpoint}"
    print(f"\n🧪 Testing {method} {url}")
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            print(f" Unsupported method: {method}")
            return None
            
        print(f" Status: {response.status_code}")
        print(f" Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f" Response: {json.dumps(response_data, indent=2)}")
        except:
            print(f" Response (text): {response.text}")
            
        return response
        
    except requests.exceptions.ConnectionError:
        print(" Connection Error: Is Django server running on port 8000?")
        return None
    except requests.exceptions.Timeout:
        print(" Timeout Error: Request took too long")
        return None
    except Exception as e:
        print(f" Error: {e}")
        return None

def main():
    print(" Starting API Tests")
    print("=" * 50)
    
    # Test 1: Check if server is running
    print("\n1️⃣ Testing server connection...")
    test_endpoint('GET', '/')
    
    # Test 2: Test login endpoint
    print("\n2️⃣ Testing login endpoint...")
    login_data = {
        "username": "sejalmisal",
        "password": "Dos@2026",
        "dashboard_type": "accountant"
    }
    response = test_endpoint('POST', '/auth/login/', data=login_data)
    
    if response and response.status_code == 200:
        try:
            login_response = response.json()
            if 'access' in login_response:
                token = login_response['access']
                print(f" Login successful! Token: {token[:20]}...")
                
                # Test 3: Test dashboard stats with token
                print("\n3️⃣ Testing dashboard stats with token...")
                headers = {'Authorization': f'Bearer {token}'}
                test_endpoint('GET', '/dashboard/stats/', headers=headers)
                
                # Test 4: Test users endpoint with token
                print("\n4️⃣ Testing users endpoint with token...")
                test_endpoint('GET', '/users/', headers=headers)
                
                # Test 5: Test offices endpoint with token
                print("\n5️⃣ Testing offices endpoint with token...")
                test_endpoint('GET', '/offices/', headers=headers)
                
            else:
                print(" No access token in login response")
        except Exception as e:
            print(f" Error parsing login response: {e}")
    else:
        print(" Login failed - cannot test authenticated endpoints")
    
    print("\n" + "=" * 50)
    print("🏁 API Tests Complete")

if __name__ == "__main__":
    main()
