from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Dict

from app.api.deps import get_db
from app.schemas import expense as schemas
from app.crud import expense as crud
from app import models

router = APIRouter()

@router.post("/", response_model=schemas.TransactionResponse)
async def create_new_expense(
    expense_in: schemas.TransactionCreate, 
    db: AsyncSession = Depends(get_db)
):
    # Removed the try/except block to expose the raw error
    transaction = await crud.create_transaction(db, obj_in=expense_in)
    return transaction

@router.get("/balance")
async def get_settlement_balance(db: AsyncSession = Depends(get_db)):
    query = select(
        models.Split.debtor_id, 
        func.sum(models.Split.amount_owed).label("total_owed")
    ).group_by(models.Split.debtor_id)
    
    result = await db.execute(query)
    debts = result.all()
    
    balance_sheet = {str(debtor_id): total for debtor_id, total in debts}
    return {"status": "success", "balances": balance_sheet}
