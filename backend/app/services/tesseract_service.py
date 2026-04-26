import pytesseract
from PIL import Image
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TesseractService:
    def __init__(self):
        # Set Tesseract path (Homebrew installation)
        pytesseract.pytesseract.tesseract_cmd = '/opt/homebrew/bin/tesseract'
        logger.info("✅ TesseractService initialized")
    
    def extract_text_from_image(self, image_bytes: bytes) -> str:
        """
        Extract text from receipt image using Tesseract OCR
        
        Args:
            image_bytes: Raw image data
            
        Returns:
            Extracted text from the image
        """
        try:
            logger.info("📸 Starting OCR extraction...")
            logger.info(f"📊 Image size: {len(image_bytes)} bytes")
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            logger.info(f"🖼️  Image format: {image.format}, Size: {image.size}, Mode: {image.mode}")
            
            # Perform OCR
            text = pytesseract.image_to_string(image)
            
            logger.info(f"✅ OCR successful! Extracted {len(text)} characters")
            logger.info(f"📝 Extracted text preview (first 200 chars):\n{text[:200]}")
            logger.info(f"📄 Full extracted text:\n{text}")
            
            if not text.strip():
                logger.warning("⚠️  No text extracted from image!")
                raise Exception("No text could be extracted from the image")
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"❌ Tesseract OCR failed: {str(e)}")
            raise Exception(f"Tesseract OCR failed: {str(e)}")

# Create singleton instance
tesseract_service = TesseractService()
