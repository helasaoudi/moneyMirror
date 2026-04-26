from fastapi import UploadFile
from app.services.tesseract_service import tesseract_service
from app.services.gemma_service import gemma_service
from app.core.data_store import data_store
import logging

# Configure logging
logger = logging.getLogger(__name__)

class ReceiptController:
    async def analyze_receipt(self, image: UploadFile) -> dict:
        """
        Analyze receipt image and return structured data
        
        Flow:
        1. Read image bytes
        2. Extract text using Tesseract OCR (free, offline)
        3. Analyze text using Gemma AI model (requires model download)
        4. Store result in memory
        5. Return JSON response
        
        Raises exception if Gemma model cannot be loaded or analysis fails.
        """
        try:
            logger.info("=" * 60)
            logger.info("🚀 Starting receipt analysis")
            logger.info("=" * 60)
            
            # Read image
            logger.info("📥 Reading image file...")
            image_bytes = await image.read()
            logger.info(f"✅ Image read: {len(image_bytes)} bytes")
            
            # Step 1: Tesseract OCR
            logger.info("🔍 Step 1: Extracting text with Tesseract OCR...")
            receipt_text = tesseract_service.extract_text_from_image(image_bytes)
            logger.info(f"✅ OCR complete. Text length: {len(receipt_text)} characters")
            
            if not receipt_text:
                logger.error("❌ No text extracted from image")
                raise Exception("No text extracted from image")
            
            # Step 2: Gemma AI analysis
            logger.info("🤖 Step 2: Analyzing text with Gemma AI...")
            analysis = gemma_service.analyze_receipt(receipt_text)
            logger.info(f"✅ AI Analysis complete: {analysis}")
            
            # Step 3: Store in memory
            logger.info("💾 Step 3: Storing in data store...")
            data_store.add_receipt(
                purchase=analysis["purchase"],
                amount=analysis["amount"],
                category=analysis["category"]
            )
            logger.info("✅ Receipt stored successfully")
            
            # Step 4: Return result
            logger.info("=" * 60)
            logger.info(f"✅ FINAL RESULT: {analysis}")
            logger.info("=" * 60)
            return analysis
            
        except Exception as e:
            import traceback
            logger.error("=" * 60)
            logger.error("❌ ERROR in analyze_receipt")
            logger.error("=" * 60)
            traceback.print_exc()
            logger.error(f"ERROR: {str(e)}")
            raise Exception(f"Receipt analysis failed: {str(e)}")
    
    def get_monthly_report(self) -> dict:
        """
        Get monthly spending report
        """
        return data_store.get_monthly_report()

receipt_controller = ReceiptController()
