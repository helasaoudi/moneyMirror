from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers.receipt_router import router as receipt_router
from app.utils.config import config

# Create FastAPI app
app = FastAPI(
    title="MoneyMirror API",
    description="Simple receipt analysis API using Gemini OCR and Gemma reasoning",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(receipt_router)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "MoneyMirror API is running",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/api/analyze",
            "report": "/api/report"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
