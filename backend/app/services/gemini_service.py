import requests
import base64
from app.utils.config import config

class GeminiService:
    def __init__(self):
        self.api_key = config.GEMINI_API_KEY
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.api_key}"
    
    def extract_text_from_image(self, image_bytes: bytes) -> str:
        """
        Extract text from receipt image using Gemini OCR
        """
        try:
            # Convert image to base64
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Prepare request
            payload = {
                "contents": [{
                    "parts": [
                        {
                            "text": "Extract all text from this receipt image. Return only the raw text content, no formatting or explanation."
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_base64
                            }
                        }
                    ]
                }]
            }
            
            # Make request to Gemini API
            response = requests.post(self.api_url, json=payload)
            response.raise_for_status()
            
            # Extract text from response
            result = response.json()
            text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            return text.strip()
            
        except Exception as e:
            error_msg = str(e)
            
            # Handle rate limiting with clear message
            if "429" in error_msg or "Too Many Requests" in error_msg:
                raise Exception("Gemini API rate limit exceeded. Please wait a few minutes and try again.")
            
            # Re-raise other errors
            raise Exception(f"Gemini OCR failed: {error_msg}")

gemini_service = GeminiService()
