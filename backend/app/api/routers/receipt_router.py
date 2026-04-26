from fastapi import APIRouter, UploadFile, File, HTTPException
from app.api.controllers.receipt_controller import receipt_controller

router = APIRouter(prefix="/api", tags=["receipts"])

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
