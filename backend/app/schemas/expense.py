from pydantic import BaseModel
from datetime import datetime

class TransactionCreate(BaseModel):
    payer_id: str
    amount: float
    description: str
    fund_source: str = "personal"
    is_split: bool = False
    transaction_type: str = "expense"

class TransactionResponse(TransactionCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
