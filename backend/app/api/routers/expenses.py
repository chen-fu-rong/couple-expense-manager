from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.api.deps import get_db
from app.schemas import expense as schemas
from app import models

router = APIRouter()

@router.post("/", response_model=schemas.TransactionResponse)
async def create_new_expense(expense_in: schemas.TransactionCreate, db: AsyncSession = Depends(get_db)):
    # Create the transaction directly using the new flat schema
    new_tx = models.Transaction(
        payer_id=expense_in.payer_id,
        amount=expense_in.amount,
        description=expense_in.description,
        fund_source=expense_in.fund_source,
        is_split=expense_in.is_split,
        transaction_type=expense_in.transaction_type
    )
    
    db.add(new_tx)
    await db.commit()
    await db.refresh(new_tx)
    
    return new_tx

@router.get("/recent")
async def get_recent_transactions(limit: int = 10, db: AsyncSession = Depends(get_db)):
    # Async query to get the latest transactions
    query = select(models.Transaction).order_by(models.Transaction.timestamp.desc()).limit(limit)
    result = await db.execute(query)
    transactions = result.scalars().all()
    
    return transactions