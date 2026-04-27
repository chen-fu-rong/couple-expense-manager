import asyncio
import uuid
from app.core.db import AsyncSessionLocal
from app.models import User
from sqlalchemy import select

async def seed():
    async with AsyncSessionLocal() as db:
        # Check if users already exist
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        if not users:
            print("No users found. Injecting mock users...")
            user1 = User(id=uuid.UUID('00000000-0000-0000-0000-000000000001'), name='Me', telegram_id='111')
            user2 = User(id=uuid.UUID('00000000-0000-0000-0000-000000000002'), name='Aung Phyo Paing', telegram_id='222')
            db.add_all([user1, user2])
            await db.commit()
            print("✅ Mock users injected successfully!")
        else:
            print(f"✅ Users already exist: {[u.name for u in users]}")

asyncio.run(seed())
