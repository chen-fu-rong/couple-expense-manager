from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app import models
from app.schemas import expense as schemas

async def create_transaction(db: AsyncSession, obj_in: schemas.TransactionCreate):
    # 1. Create the main transaction record
    db_transaction = models.Transaction(
        payer_id=obj_in.payer_id,
        amount=obj_in.amount,
        description=obj_in.description,
        category=obj_in.category
    )
    db.add(db_transaction)
    await db.flush() # Flush to get the transaction ID without committing yet

    # 2. Create the associated splits
    for split_in in obj_in.splits:
        db_split = models.Split(
            transaction_id=db_transaction.id,
            debtor_id=split_in.debtor_id,
            amount_owed=split_in.amount_owed
        )
        db.add(db_split)

    # 3. Commit everything together
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction
