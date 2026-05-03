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

# Parse arguments
PORT=8089
FORCE_KILL=false

for arg in "$@"; do
    case $arg in
        --kill)
            FORCE_KILL=true
            shift
            ;;
        *)
            PORT=$arg
            shift
            ;;
    esac
done

# Kill any existing process on the port if --kill flag is used
if [ "$FORCE_KILL" = true ]; then
    echo "🔪 Killing any process on port $PORT..."
    if command -v lsof &> /dev/null; then
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    else
        # Fallback for systems without lsof
        fuser -k $PORT/tcp 2>/dev/null || true
    fi
    echo "✅ Port cleared"
    sleep 1
fi

# Check if port is in use (if lsof is available)
if command -v lsof &> /dev/null; then
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  Warning: Port $PORT is already in use"
        echo ""
        echo "   Option 1 - Auto-kill and restart:"
        echo "   ./run.sh --kill $PORT"
        echo ""
        echo "   Option 2 - Use different port:"
        echo "   ./run.sh 8090"
        echo ""
        echo "   Option 3 - Manual kill:"
        echo "   lsof -ti:$PORT | xargs kill -9"
        echo ""
        exit 1
    fi
else
    # If lsof not available, try fuser
    if command -v fuser &> /dev/null; then
        if fuser $PORT/tcp >/dev/null 2>&1 ; then
            echo "⚠️  Warning: Port $PORT appears to be in use"
            echo "   Run with --kill flag to force: ./run.sh --kill $PORT"
            echo ""
            exit 1
        fi
    fi
fi

echo "=============================="
echo "🎯 Starting FastAPI server on port $PORT..."
echo "=============================="
echo ""

# Start the application with specified port
python run.py $PORT
