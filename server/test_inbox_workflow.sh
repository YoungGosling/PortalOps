#!/bin/bash

# Test script for Inbox Workflow Implementation
# This script tests the complete onboarding and offboarding flow

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
WEBHOOK_KEY="${HR_WEBHOOK_KEY:-test-webhook-key-change-in-production}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Inbox Workflow Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Test 1: Onboarding Webhook
echo -e "${YELLOW}Test 1: Trigger Onboarding Webhook${NC}"
echo "Sending onboarding request for test.user@example.com..."

RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/webhooks/hr/onboarding" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: ${WEBHOOK_KEY}" \
  -d '{
    "employee": {
      "name": "Test User",
      "email": "test.user@example.com",
      "department": "Engineering"
    }
  }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "Onboarding workflow triggered successfully"; then
  echo -e "${GREEN}✓ Onboarding webhook accepted${NC}"
else
  echo -e "${RED}✗ Onboarding webhook failed${NC}"
  exit 1
fi
echo ""

# Test 2: Check task was created
echo -e "${YELLOW}Test 2: Verify Task Created${NC}"
echo "Checking if task was created..."
echo "NOTE: You need to login as Admin and check /inbox to verify the task appears"
echo -e "${GREEN}✓ Task should appear in Inbox with status 'pending'${NC}"
echo ""

# Test 3: Duplicate Prevention
echo -e "${YELLOW}Test 3: Duplicate Prevention${NC}"
echo "Trying to send the same onboarding webhook again..."

RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/webhooks/hr/onboarding" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: ${WEBHOOK_KEY}" \
  -d '{
    "employee": {
      "name": "Test User",
      "email": "test.user@example.com",
      "department": "Engineering"
    }
  }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "already exists"; then
  echo -e "${GREEN}✓ Duplicate prevention working${NC}"
else
  echo -e "${YELLOW}⚠ Duplicate prevention may not be working as expected${NC}"
fi
echo ""

# Test 4: Onboarding a second user
echo -e "${YELLOW}Test 4: Onboard Second User${NC}"
echo "Sending onboarding request for another.user@example.com..."

RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/webhooks/hr/onboarding" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: ${WEBHOOK_KEY}" \
  -d '{
    "employee": {
      "name": "Another User",
      "email": "another.user@example.com",
      "department": "Marketing"
    }
  }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "successfully"; then
  echo -e "${GREEN}✓ Second onboarding webhook accepted${NC}"
else
  echo -e "${RED}✗ Second onboarding webhook failed${NC}"
  exit 1
fi
echo ""

# Test 5: Offboarding Webhook (for non-existent user)
echo -e "${YELLOW}Test 5: Offboarding Non-Existent User${NC}"
echo "Trying to offboard a user that doesn't exist..."

RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/webhooks/hr/offboarding" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: ${WEBHOOK_KEY}" \
  -d '{
    "employee": {
      "name": "Ghost User",
      "email": "ghost.user@example.com",
      "department": "None"
    }
  }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "not found"; then
  echo -e "${GREEN}✓ Correctly rejected offboarding for non-existent user${NC}"
else
  echo -e "${RED}✗ Should have rejected offboarding${NC}"
fi
echo ""

# Manual Test Instructions
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Manual Test Steps Required${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "The automated tests are complete. Now perform these manual steps:"
echo ""
echo "1. Login as Admin at ${API_BASE_URL}"
echo "2. Navigate to Inbox"
echo "3. Verify TWO pending onboarding tasks appear:"
echo "   - Test User (test.user@example.com)"
echo "   - Another User (another.user@example.com)"
echo ""
echo "4. Click 'Start Task' on Test User"
echo "5. Assign at least one service"
echo "6. Click 'Complete Onboarding'"
echo "7. Verify success message appears"
echo ""
echo "8. Navigate to Employee Directory"
echo "9. Verify Test User now appears in the directory"
echo ""
echo "10. Navigate back to Inbox"
echo "11. Verify Test User's task is now marked 'completed'"
echo ""
echo "12. Create an offboarding webhook for Test User:"
echo ""
echo "curl -X POST ${API_BASE_URL}/api/webhooks/hr/offboarding \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"X-Webhook-Key: ${WEBHOOK_KEY}\" \\"
echo "  -d '{
    \"employee\": {
      \"name\": \"Test User\",
      \"email\": \"test.user@example.com\",
      \"department\": \"Engineering\"
    }
  }'"
echo ""
echo "13. Check Inbox - should see offboarding task"
echo "14. Employee Directory should STILL show Test User"
echo ""
echo "15. Complete the offboarding task in Inbox"
echo "16. Check Employee Directory - Test User should be GONE"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Script Complete${NC}"
echo -e "${GREEN}========================================${NC}"

