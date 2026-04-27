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