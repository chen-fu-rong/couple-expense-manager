from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from database import Base # Make sure this matches your actual Base import

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    payer_id = Column(String, index=True) # The Telegram ID of whoever clicked the button
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    
    # NEW: Did this come from the 'family' fund, or 'personal' pocket?
    fund_source = Column(String, default="personal") 
    
    # NEW: Did they check the "Split 50/50" box?
    is_split = Column(Boolean, default=False) 
    
    # NEW: Is this an expense, or a deposit into the family fund?
    # Values: 'expense' or 'contribution'
    transaction_type = Column(String, default="expense")

    timestamp = Column(DateTime, default=datetime.utcnow)
