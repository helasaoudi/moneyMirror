# MoneyMirror Backend

FastAPI backend for receipt analysis using Gemini OCR and Gemma 4 reasoning.

## Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure .env
# Add your GEMINI_API_KEY

# Run server
python run.py
```

Server runs on `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

```env
GEMINI_API_KEY=your_key_here
GEMMA_MODEL_PATH=google/gemma-2-2b-it
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=*
```

## Architecture

- **Routers** - Define API endpoints
- **Controllers** - Handle business logic
- **Services** - External integrations (Gemini, Gemma)
- **Core** - Data storage and utilities
- **Utils** - Configuration and helpers
