from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from ai_service import generate_career_roadmap

router = APIRouter(prefix="/api/guidance", tags=["Career Guidance"])

class RoadmapRequest(BaseModel):
    target_role: str = "Full Stack Engineer"
    current_skills: Optional[List[str]] = []

@router.post("/roadmap")
def get_roadmap(req: RoadmapRequest):
    return generate_career_roadmap(req.target_role)
