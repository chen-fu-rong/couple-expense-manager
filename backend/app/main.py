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

@app.get("/api/ledger/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    # 1. Calculate Family Fund (Contributions minus Family Expenses)
    family_contributions = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.transaction_type == "contribution",
        models.Transaction.fund_source == "family"
    ).scalar() or 0.0

    family_expenses = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.transaction_type == "expense",
        models.Transaction.fund_source == "family"
    ).scalar() or 0.0

    family_fund_balance = family_contributions - family_expenses

    # 2. Calculate 50/50 Split Debts (Personal pockets only)
    split_txs = db.query(models.Transaction).filter(
        models.Transaction.is_split == True,
        models.Transaction.fund_source == "personal",
        models.Transaction.transaction_type == "expense"
    ).all()

    user_totals = {}
    for tx in split_txs:
        user_totals[tx.payer_id] = user_totals.get(tx.payer_id, 0) + tx.amount

    return {
        "family_fund": family_fund_balance,
        "split_totals": user_totals
    }