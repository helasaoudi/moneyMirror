from datetime import datetime
from typing import List, Dict

class DataStore:
    """
    Simple in-memory storage for receipts
    """
    def __init__(self):
        self.receipts: List[Dict] = []
    
    def add_receipt(self, purchase: str, amount: float, category: str):
        """
        Add a new receipt to storage
        """
        receipt = {
            "purchase": purchase,
            "amount": amount,
            "category": category,
            "timestamp": datetime.now().isoformat()
        }
        self.receipts.append(receipt)
        return receipt
    
    def get_current_month_receipts(self) -> List[Dict]:
        """
        Get all receipts from current month
        """
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        return [
            receipt for receipt in self.receipts
            if datetime.fromisoformat(receipt["timestamp"]).month == current_month
            and datetime.fromisoformat(receipt["timestamp"]).year == current_year
        ]
    
    def get_monthly_report(self) -> Dict:
        """
        Generate monthly spending report
        """
        receipts = self.get_current_month_receipts()
        
        total = sum(r["amount"] for r in receipts)
        categories = {
            "food": 0.0,
            "transport": 0.0,
            "bills": 0.0,
            "other": 0.0
        }
        
        for receipt in receipts:
            category = receipt["category"]
            if category in categories:
                categories[category] += receipt["amount"]
        
        return {
            "total": total,
            "categories": categories
        }

# Global data store instance
data_store = DataStore()
