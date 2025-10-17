#!/bin/bash

# PortalOps Database Initialization Script
# This script sets up the PostgreSQL database for PortalOps

set -e

# Configuration
DB_NAME="portalops"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL connection..."
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        print_error "PostgreSQL is not running or not accessible"
        print_error "Please ensure PostgreSQL is running and accessible at $DB_HOST:$DB_PORT"
        exit 1
    fi
    print_status "PostgreSQL is running"
}

# Function to create database
create_database() {
    print_status "Creating database '$DB_NAME'..."
    
    # Check if database exists
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_warning "Database '$DB_NAME' already exists"
        read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Dropping existing database..."
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
        else
            print_status "Using existing database"
            return 0
        fi
    fi
    
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    print_status "Database '$DB_NAME' created successfully"
}

# Function to run schema
setup_schema() {
    print_status "Setting up database schema..."
    
    if [ ! -f "schema.sql" ]; then
        print_error "schema.sql not found in current directory"
        exit 1
    fi
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f schema.sql
    print_status "Schema setup completed"
}

# Function to load sample data
load_sample_data() {
    print_status "Loading sample data..."
    
    if [ ! -f "sample_data.sql" ]; then
        print_warning "sample_data.sql not found, skipping sample data"
        return 0
    fi
    
    read -p "Do you want to load sample data? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f sample_data.sql
        print_status "Sample data loaded successfully"
    else
        print_status "Skipping sample data"
    fi
}

# Function to verify setup
verify_setup() {
    print_status "Verifying database setup..."
    
    # Count tables
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
    print_status "Created $TABLE_COUNT tables"
    
    # Count roles
    ROLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM roles;")
    print_status "Inserted $ROLE_COUNT roles"
    
    # List tables
    print_status "Database tables:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"
}

# Main execution
main() {
    echo "=================================================="
    echo "       PortalOps Database Initialization"
    echo "=================================================="
    echo
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    print_status "Database: $DB_NAME"
    print_status "Host: $DB_HOST:$DB_PORT"
    print_status "User: $DB_USER"
    echo
    
    check_postgres
    create_database
    setup_schema
    load_sample_data
    verify_setup
    
    echo
    print_status "Database initialization completed successfully!"
    print_status "You can now connect to the database using:"
    echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Initialize the PortalOps PostgreSQL database"
    echo
    echo "Environment Variables:"
    echo "  DB_USER    Database user (default: postgres)"
    echo "  DB_HOST    Database host (default: localhost)"
    echo "  DB_PORT    Database port (default: 5432)"
    echo
    echo "Options:"
    echo "  -h, --help    Show this help message"
    echo
    echo "Examples:"
    echo "  $0                           # Use default settings"
    echo "  DB_USER=myuser $0            # Use custom user"
    echo "  DB_HOST=remote.db.com $0     # Use remote database"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac



