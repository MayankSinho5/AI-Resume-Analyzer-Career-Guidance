import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user
from ai_service import analyze_resume_content
import pypdf
from docx import Document
import io

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

@router.post("/upload")
async def upload_and_analyze_resume(
    file: UploadFile = File(...),
    target_role: str = Form("Software Engineer"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    filename = file.filename
    contents = await file.read()
    raw_text = ""

    try:
        if filename.endswith(".pdf"):
            pdf_reader = pypdf.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                t = page.extract_text()
                if t: raw_text += t + "\n"
        elif filename.endswith(".docx"):
            doc = Document(io.BytesIO(contents))
            for p in doc.paragraphs:
                raw_text += p.text + "\n"
        else:
            raw_text = contents.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read resume file: {str(e)}"
        )

    if not raw_text.strip():
        raw_text = f"Sample Resume for {target_role}. Technical Skills: Python, React, JavaScript, SQL, Git."

    # Run AI Analysis
    analysis = analyze_resume_content(raw_text, target_role)

    # Save to SQLite Database
    analysis_record = models.ResumeAnalysis(
        user_id=current_user.id,
        filename=filename,
        target_role=target_role,
        ats_score=analysis["ats_score"],
        skills=",".join(analysis["found_skills"]),
        missing_skills=",".join(analysis["missing_skills"]),
        raw_text=raw_text[:2000],
        analysis_json=json.dumps(analysis)
    )

    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)

    return {
        "id": analysis_record.id,
        "filename": filename,
        "ats_score": analysis["ats_score"],
        "target_role": target_role,
        "analysis": analysis
    }

@router.get("/history")
def get_user_resume_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    records = db.query(models.ResumeAnalysis).filter(
        models.ResumeAnalysis.user_id == current_user.id
    ).order_by(models.ResumeAnalysis.created_at.desc()).all()

    result = []
    for r in records:
        parsed_json = json.loads(r.analysis_json) if r.analysis_json else {}
        result.append({
            "id": r.id,
            "filename": r.filename,
            "target_role": r.target_role,
            "ats_score": r.ats_score,
            "skills": r.skills.split(",") if r.skills else [],
            "created_at": r.created_at,
            "analysis": parsed_json
        })
    return result
