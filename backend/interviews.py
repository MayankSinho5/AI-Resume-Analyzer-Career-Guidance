from fastapi import APIRouter
from pydantic import BaseModel
from ai_service import generate_mock_interview_questions, evaluate_interview_response

router = APIRouter(prefix="/api/interviews", tags=["AI Interviews"])

class InterviewRequest(BaseModel):
    role: str = "Full Stack Engineer"

class EvaluateRequest(BaseModel):
    question: str
    user_answer: str

@router.post("/generate")
def generate_questions(req: InterviewRequest):
    questions = generate_mock_interview_questions(req.role)
    return {
        "role": req.role,
        "questions": questions
    }

@router.post("/evaluate")
def evaluate_answer(req: EvaluateRequest):
    return evaluate_interview_response(req.question, req.user_answer)
