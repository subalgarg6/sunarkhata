"""
SunarKhata backend service.

This is a lightweight FastAPI application that satisfies the Emergent
platform's supervisor requirements (backend on port 8001, /api prefix).

The primary application is a Vite frontend that talks directly to
Supabase/Firebase. This backend exposes only health & metadata
endpoints so the platform's health checks succeed and the Publish
button is enabled.
"""

import os
from datetime import datetime, timezone

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="SunarKhata API", version="1.0.0")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {
        "service": "SunarKhata API",
        "status": "ok",
        "time": datetime.now(timezone.utc).isoformat(),
    }


@api_router.get("/health")
async def health():
    try:
        await client.admin.command("ping")
        db_status = "ok"
    except Exception as exc:  # pragma: no cover
        db_status = f"error: {exc}"
    return {
        "status": "ok",
        "database": db_status,
        "time": datetime.now(timezone.utc).isoformat(),
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
