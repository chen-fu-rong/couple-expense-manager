from pydantic import BaseModel
from typing import Optional
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

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    name: str
    telegram_id: str

class UserResponse(BaseModel):
    id: UUID
    name: str
    telegram_id: str
    
    model_config = ConfigDict(from_attributes=True)

# --- TRANSACTION SCHEMAS ---
class SplitCreate(BaseModel):
    debtor_id: UUID
    amount_owed: float

class TransactionCreate(BaseModel):
    payer_id: UUID
    amount: float
    description: str
    category: str
    splits: List[SplitCreate]

class TransactionResponse(BaseModel):
    id: UUID
    payer_id: UUID
    amount: float
    description: str
    category: str
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)
