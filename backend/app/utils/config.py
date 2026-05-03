import os
from dotenv import load_dotenv

load_dotenv()

# Calculate model path before class definition
# Gemma 2-2B-IT (local model)
_LOCAL_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/gemma-2-2b-it"))
_DEFAULT_MODEL_PATH = _LOCAL_MODEL_PATH if os.path.exists(_LOCAL_MODEL_PATH) else "google/gemma-2-2b-it"

class Config:
    # API Keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # Model Configuration
    # Use local model path if it exists, otherwise fall back to HuggingFace
    GEMMA_MODEL_PATH = os.getenv("GEMMA_MODEL_PATH", _DEFAULT_MODEL_PATH)
    
    # Server Configuration
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8089"))
    
    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # AI Insight Configuration
    # How often to refresh AI insights (in minutes)
    # Default: 5 minutes for testing. Set to 10080 (7 days) for production
    INSIGHT_INTERVAL_MINUTES = int(os.getenv("INSIGHT_INTERVAL_MINUTES", "5"))

config = Config()
