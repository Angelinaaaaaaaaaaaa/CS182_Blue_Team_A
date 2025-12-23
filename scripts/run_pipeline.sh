#!/bin/bash

# CS182 Blue Team - Complete Pipeline Runner
# This script runs the entire data collection and processing pipeline

set -e  # Exit on error

echo "========================================"
echo "CS182 Blue Team - Pipeline Runner"
echo "========================================"
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r backend/requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found!"
    echo "Please copy .env.example to .env and add your API tokens"
    exit 1
fi

# Create data directory
mkdir -p frontend/public/data

# Create backend data directory
mkdir -p backend/data

# Run scraper
echo ""
echo "Step 1: Scraping Ed discussions..."
echo "========================================"
cd backend
python scraper.py
cd ..

# Copy data to frontend
echo ""
echo "Copying data to frontend..."
cp backend/data/special_participation_a.json frontend/public/data/
cp backend/data/special_participation_a.csv frontend/public/data/

# Run analytics
echo ""
echo "Step 2: Running basic analytics..."
echo "========================================"
cd backend
python analytics.py
cd ..

# Run advanced analytics
echo ""
echo "Step 3: Running advanced analytics (TF-IDF, clustering)..."
echo "========================================"
cd backend
python advanced_analytics.py
cd ..

# Copy analytics to frontend
echo ""
echo "Copying analytics to frontend..."
cp backend/data/analytics.json frontend/public/data/
cp backend/data/advanced_analytics.json frontend/public/data/

echo ""
echo "========================================"
echo "Pipeline completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. cd frontend"
echo "2. npm install"
echo "3. npm run dev"
echo ""
echo "Or for production build:"
echo "1. cd frontend"
echo "2. npm install"
echo "3. npm run build"
echo "========================================"