#!/bin/bash

# PortalOps Backend Startup Script

echo "Starting PortalOps Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo "Please edit .env file with your configuration before running again."
    exit 1
fi

# Check if Docker is available
if command -v docker-compose &> /dev/null; then
    echo "Starting with Docker Compose..."
    docker-compose up -d
    
    echo "Waiting for services to be ready..."
    sleep 10
    
    echo "Services started successfully!"
    echo "API available at: http://localhost:8000"
    echo "API documentation at: http://localhost:8000/docs"
    echo "Database available at: localhost:5432"
    
elif command -v docker &> /dev/null; then
    echo "Docker Compose not found, but Docker is available."
    echo "Please install Docker Compose or run manually."
    exit 1
    
else
    echo "Docker not found. Starting manually..."
    
    # Check if Python virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "Installing dependencies..."
    pip install -r requirements.txt
    
    # Start the application
    echo "Starting FastAPI application..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi



