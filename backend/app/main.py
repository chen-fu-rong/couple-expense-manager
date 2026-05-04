from sqlalchemy import func
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your Vercel app to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from app.api.deps import get_db
from app import models

@app.get("/api/ledger/dashboard")
async def get_dashboard_data(db: AsyncSession = Depends(get_db)):
    # 1. Calculate Family Fund (Async)
    contrib_query = select(func.sum(models.Transaction.amount)).where(
        models.Transaction.transaction_type == "contribution",
        models.Transaction.fund_source == "family"
    )
    contrib_result = await db.execute(contrib_query)
    family_contributions = contrib_result.scalar() or 0.0

    exp_query = select(func.sum(models.Transaction.amount)).where(
        models.Transaction.transaction_type == "expense",
        models.Transaction.fund_source == "family"
    )
    exp_result = await db.execute(exp_query)
    family_expenses = exp_result.scalar() or 0.0

    family_fund_balance = family_contributions - family_expenses

    # 2. Calculate Splits (Async)
    split_query = select(models.Transaction).where(
        models.Transaction.is_split == True,
        models.Transaction.fund_source == "personal",
        models.Transaction.transaction_type == "expense"
    )
    split_result = await db.execute(split_query)
    split_txs = split_result.scalars().all()

    user_totals = {}
    for tx in split_txs:
        user_totals[tx.payer_id] = user_totals.get(tx.payer_id, 0) + tx.amount

    return {
        "family_fund": family_fund_balance,
        "split_totals": user_totals
    }