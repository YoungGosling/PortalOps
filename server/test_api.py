#!/usr/bin/env python3
"""
Simple API test script for PortalOps backend.
Run this after starting the server to verify basic functionality.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"


def test_health_check():
    """Test health check endpoint."""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False


def test_root_endpoint():
    """Test root endpoint."""
    print("Testing root endpoint...")
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            data = response.json()
            print(
                f"✅ Root endpoint passed: {data.get('message', 'No message')}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False


def test_openapi_docs():
    """Test OpenAPI documentation endpoint."""
    print("Testing OpenAPI docs...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ OpenAPI docs accessible")
            return True
        else:
            print(f"❌ OpenAPI docs failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ OpenAPI docs error: {e}")
        return False


def test_auth_endpoints():
    """Test authentication endpoints (without valid credentials)."""
    print("Testing auth endpoints...")

    # Test login endpoint (should fail with invalid credentials)
    try:
        response = requests.post(f"{API_BASE}/auth/login", json={
            "email": "test@example.com",
            "password": "invalid"
        })
        if response.status_code == 401:
            print("✅ Login endpoint properly rejects invalid credentials")
        else:
            print(
                f"⚠️ Login endpoint returned unexpected status: {response.status_code}")
    except Exception as e:
        print(f"❌ Login endpoint error: {e}")
        return False

    # Test /me endpoint (should fail without token)
    try:
        response = requests.get(f"{API_BASE}/auth/me")
        if response.status_code == 401:
            print("✅ /me endpoint properly requires authentication")
            return True
        else:
            print(
                f"⚠️ /me endpoint returned unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ /me endpoint error: {e}")
        return False


def test_protected_endpoints():
    """Test that protected endpoints require authentication."""
    print("Testing protected endpoints...")

    endpoints = [
        f"{API_BASE}/users",
        f"{API_BASE}/services",
        f"{API_BASE}/payment-register",
        f"{API_BASE}/audit-logs"
    ]

    all_passed = True
    for endpoint in endpoints:
        try:
            response = requests.get(endpoint)
            if response.status_code == 401:
                print(f"✅ {endpoint} properly requires authentication")
            else:
                print(
                    f"⚠️ {endpoint} returned unexpected status: {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ {endpoint} error: {e}")
            all_passed = False

    return all_passed


def main():
    """Run all tests."""
    print("🚀 Starting PortalOps API Tests")
    print("=" * 50)

    tests = [
        test_health_check,
        test_root_endpoint,
        test_openapi_docs,
        test_auth_endpoints,
        test_protected_endpoints
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()

    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
        sys.exit(0)
    else:
        print("⚠️ Some tests failed. Check the output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()



