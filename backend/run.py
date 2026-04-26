import uvicorn
import sys
from app.utils.config import config

if __name__ == "__main__":
    # Allow port override via command line: python run.py [port]
    port = int(sys.argv[1]) if len(sys.argv) > 1 else config.PORT
    
    print(f"🚀 Starting server on {config.HOST}:{port}")
    
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=port,
        reload=True
    )
