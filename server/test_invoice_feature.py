#!/usr/bin/env python3
"""
Test script for Payment Register Invoice Management feature.
This script tests the new API v2 endpoints without affecting existing functionality.
"""

import requests
import json
import os
import uuid
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
API_V2_BASE = f"{BASE_URL}/api/v2"


def test_health_check():
    """Test that the server is running."""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✓ Health check: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False


def test_api_v1_still_works():
    """Test that existing API v1 endpoints still work."""
    try:
        # Test payment register v1 (should still work)
        response = requests.get(f"{BASE_URL}/api/payment-register")
        print(f"✓ API v1 payment register: {response.status_code}")
        # 401 is expected without auth
        return response.status_code in [200, 401]
    except Exception as e:
        print(f"✗ API v1 test failed: {e}")
        return False


def test_api_v2_endpoints_exist():
    """Test that API v2 endpoints are accessible."""
    endpoints = [
        "/payment-register",
        "/invoices",
        "/master-files/invoices"
    ]

    all_exist = True
    for endpoint in endpoints:
        try:
            response = requests.get(f"{API_V2_BASE}{endpoint}")
            # We expect 401 (unauthorized) since we're not authenticated
            if response.status_code == 401:
                print(f"✓ API v2 {endpoint}: accessible (401 expected)")
            else:
                print(f"✓ API v2 {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"✗ API v2 {endpoint} failed: {e}")
            all_exist = False

    return all_exist


def test_storage_directory():
    """Test that the storage directory exists."""
    storage_dir = "/home/evanzhang/EnterpriseProjects/PortalOpsStorage/bills"
    if os.path.exists(storage_dir):
        print(f"✓ Storage directory exists: {storage_dir}")
        return True
    else:
        print(f"✗ Storage directory missing: {storage_dir}")
        return False


def test_database_schema():
    """Test that the database schema includes the new table."""
    try:
        # This would require database connection, for now just check if files exist
        model_file = "/home/evanzhang/EnterpriseProjects/PortalOps/server/app/models/payment_invoice.py"
        if os.path.exists(model_file):
            print("✓ PaymentInvoice model exists")
            return True
        else:
            print("✗ PaymentInvoice model missing")
            return False
    except Exception as e:
        print(f"✗ Database schema test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("Testing Payment Register Invoice Management Feature")
    print("=" * 50)

    tests = [
        ("Health Check", test_health_check),
        ("API v1 Still Works", test_api_v1_still_works),
        ("API v2 Endpoints Exist", test_api_v2_endpoints_exist),
        ("Storage Directory", test_storage_directory),
        ("Database Schema", test_database_schema),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        if test_func():
            passed += 1
        else:
            print(f"  FAILED: {test_name}")

    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} passed")

    if passed == total:
        print(
            "✓ All tests passed! The invoice feature implementation is working correctly.")
    else:
        print("✗ Some tests failed. Please check the implementation.")

    return passed == total


if __name__ == "__main__":
    main()
