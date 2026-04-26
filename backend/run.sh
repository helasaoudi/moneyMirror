#!/bin/bash

# MoneyMirror Backend Setup and Run Script

echo "🚀 MoneyMirror Backend Setup"
echo "=============================="

# Find available Python 3 version
echo "🔍 Detecting Python version..."
PYTHON_CMD=""

# Try different Python versions in order of preference
for py_version in python3.11 python3.10 python3.9 python3.8 python3; do
    if command -v $py_version &> /dev/null; then
        # Check if version is >= 3.8
        version=$($py_version --version 2>&1 | awk '{print $2}')
        major=$(echo $version | cut -d. -f1)
        minor=$(echo $version | cut -d. -f2)
        
        if [ "$major" -eq 3 ] && [ "$minor" -ge 8 ]; then
            PYTHON_CMD=$py_version
            echo "✅ Found $py_version (version $version)"
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "❌ Error: Python 3.8 or higher is required"
    echo "   Please install Python 3.8+ and try again"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
  Check if Tesseract is installed
if ! command -v tesseract &> /dev/null; then
    echo "⚠️  Warning: Tesseract OCR not found"
    echo "   Install it with: sudo apt-get install tesseract-ocr (Ubuntu/Debian)"
    echo "                    or: brew install tesseract (macOS)"
    echo ""
fi

#   echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade requirements
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Get port from command line argument or use default  
PORT=${1:-8089}

# Check if port is in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Warning: Port $PORT is already in use"
    echo "   Kill the process or choose a different port:"
    echo "   ./run.sh 8090"
    echo ""
    echo "   To kill the process using port $PORT:"
    echo "   lsof -ti:$PORT | xargs kill -9"
    echo ""
    exit 1
fi

echo "=============================="
echo "🎯 Starting FastAPI server on port $PORT..."
echo "=============================="
echo ""

# Start the application with specified port
python run.py $PORT
