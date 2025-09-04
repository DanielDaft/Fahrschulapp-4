from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class PracticeHour(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    duration: float  # 0.5 or 1.0 hours
    date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PracticeHourCreate(BaseModel):
    duration: float  # 0.5 or 1.0

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Practice Hours Endpoints
@api_router.get("/practice-hours", response_model=List[PracticeHour])
async def get_practice_hours():
    practice_hours = await db.practice_hours.find().to_list(1000)
    return [PracticeHour(**hour) for hour in practice_hours]

@api_router.post("/practice-hours", response_model=PracticeHour)
async def add_practice_hour(input: PracticeHourCreate):
    if input.duration not in [0.5, 1.0]:
        raise HTTPException(status_code=400, detail="Duration must be 0.5 or 1.0 hours")
    
    hour_dict = input.dict()
    hour_obj = PracticeHour(**hour_dict)
    await db.practice_hours.insert_one(hour_obj.dict())
    return hour_obj

@api_router.delete("/practice-hours/{hour_id}")
async def remove_practice_hour(hour_id: str):
    result = await db.practice_hours.delete_one({"id": hour_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Practice hour not found")
    return {"message": "Practice hour removed successfully"}

# Original endpoints
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()