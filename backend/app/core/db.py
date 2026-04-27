from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Fetch the DB URL from the Docker environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:supersecretpassword@db:5432/expense_manager")

# Create the async engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Create a session factory
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Base class for our models
Base = declarative_base()
