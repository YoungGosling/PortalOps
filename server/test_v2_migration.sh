#!/bin/bash

# PortalOps v2.0 Migration Test Script
# This script helps verify that the v2.0 migration was successful

set -e

echo "================================================"
echo "PortalOps v2.0 Migration Verification"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if database is accessible
echo "1. Checking database connection..."
if psql -U postgres -d portalops -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection OK${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please check your database configuration"
    exit 1
fi

# Check products.service_id is nullable
echo ""
echo "2. Checking products.service_id is nullable..."
RESULT=$(psql -U postgres -d portalops -t -c "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'service_id';")
if [[ "$RESULT" == *"YES"* ]]; then
    echo -e "${GREEN}✓ products.service_id is nullable${NC}"
else
    echo -e "${RED}✗ products.service_id is NOT nullable${NC}"
    echo "Run: ALTER TABLE products ALTER COLUMN service_id DROP NOT NULL;"
fi

# Check foreign key constraint
echo ""
echo "3. Checking products foreign key constraint..."
RESULT=$(psql -U postgres -d portalops -t -c "SELECT delete_rule FROM information_schema.referential_constraints WHERE constraint_name LIKE '%products_service_id%';")
if [[ "$RESULT" == *"SET NULL"* ]]; then
    echo -e "${GREEN}✓ Foreign key ON DELETE SET NULL is configured${NC}"
else
    echo -e "${YELLOW}⚠ Foreign key constraint may need updating${NC}"
    echo "Expected: ON DELETE SET NULL"
fi

# Check payment_info.bill_attachment_path exists
echo ""
echo "4. Checking payment_info.bill_attachment_path column..."
RESULT=$(psql -U postgres -d portalops -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'payment_info' AND column_name = 'bill_attachment_path';")
if [[ "$RESULT" == *"bill_attachment_path"* ]]; then
    echo -e "${GREEN}✓ bill_attachment_path column exists${NC}"
else
    echo -e "${RED}✗ bill_attachment_path column missing${NC}"
    echo "Run: ALTER TABLE payment_info ADD COLUMN bill_attachment_path VARCHAR(500);"
fi

# Check roles
echo ""
echo "5. Checking roles..."
ROLES=$(psql -U postgres -d portalops -t -c "SELECT name FROM roles ORDER BY name;")
echo "Current roles:"
echo "$ROLES"

# Check uploads directory
echo ""
echo "6. Checking uploads directory..."
if [ -d "uploads/bill_attachments" ]; then
    echo -e "${GREEN}✓ uploads/bill_attachments directory exists${NC}"
    
    # Check permissions
    if [ -w "uploads/bill_attachments" ]; then
        echo -e "${GREEN}✓ Directory is writable${NC}"
    else
        echo -e "${RED}✗ Directory is NOT writable${NC}"
        echo "Run: chmod 755 uploads/bill_attachments"
    fi
else
    echo -e "${RED}✗ uploads/bill_attachments directory missing${NC}"
    echo "Run: mkdir -p uploads/bill_attachments && chmod 755 uploads/bill_attachments"
fi

# Check Python dependencies
echo ""
echo "7. Checking Python dependencies..."
if python -c "import aiofiles" 2>/dev/null; then
    echo -e "${GREEN}✓ aiofiles package installed${NC}"
else
    echo -e "${RED}✗ aiofiles package missing${NC}"
    echo "Run: pip install aiofiles"
fi

# Check if server can start (dry run)
echo ""
echo "8. Checking Python syntax..."
if python -m py_compile app/main.py 2>/dev/null; then
    echo -e "${GREEN}✓ Python syntax OK${NC}"
else
    echo -e "${RED}✗ Python syntax errors detected${NC}"
    echo "Please check your code for syntax errors"
fi

# Summary
echo ""
echo "================================================"
echo "Verification Summary"
echo "================================================"
echo ""
echo "Please review the results above. All items should show ✓"
echo ""
echo "If any issues were found:"
echo "1. Run the database migration script: database/manual_migration_prd_v2.sql"
echo "2. Install missing dependencies: pip install -r requirements.txt"
echo "3. Create missing directories as indicated"
echo ""
echo "To start the server: ./start.sh"
echo "To view API docs: http://localhost:8000/docs"
echo ""

