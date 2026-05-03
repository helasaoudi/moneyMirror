from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from app.api.controllers.receipt_controller import receipt_controller
from app.services.gemma_service import gemma_service
from app.utils.config import config
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["receipts"])

class InsightRequest(BaseModel):
    budget: float
    totalSpent: float
    budgetRemaining: float
    budgetUsedPercent: int
    daysLeftInMonth: int
    categories: Dict[str, float]
    receiptCount: int
    topCategory: str
    topCategoryAmount: float
    trackingReason: str
    goalName: Optional[str] = None
    goalAmount: Optional[float] = None

@router.post("/analyze")
async def analyze_receipt(image: UploadFile = File(...)):
    """
    Analyze receipt image
    
    Input: Image file (multipart/form-data)
    Output: JSON with purchase, amount, category
    """
    try:
        result = await receipt_controller.analyze_receipt(image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report")
async def get_monthly_report():
    """
    Get monthly spending report
    
    Output: JSON with total and category breakdown
    """
    try:
        report = receipt_controller.get_monthly_report()
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/insights")
async def generate_insight(data: InsightRequest):
    """
    Generate AI-powered financial insight based on spending data.
    
    Input: Spending summary + user profile context
    Output: Personalized financial advice from Gemma AI
    """
    try:
        logger.info("🧠 Insight request received")
        result = gemma_service.generate_insight(data.model_dump())
        return result
    except Exception as e:
        logger.error(f"❌ Insight generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config/insight-interval")
async def get_insight_interval():
    """Return the configured insight refresh interval in minutes."""
    return {"intervalMinutes": config.INSIGHT_INTERVAL_MINUTES}
