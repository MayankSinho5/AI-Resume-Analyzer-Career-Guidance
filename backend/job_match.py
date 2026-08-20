from fastapi import APIRouter
from pydantic import BaseModel
from ai_service import match_job_requirements

router = APIRouter(prefix="/api/jobs", tags=["Job Matching"])

class MatchRequest(BaseModel):
    resume_text: str
    job_description: str

@router.post("/match")
def match_job(req: MatchRequest):
    return match_job_requirements(req.resume_text, req.job_description)
