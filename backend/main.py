from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from database import engine, Base
import models
import auth
import resumes
import job_match
import guidance
import interviews

# Create database tables automatically on startup
Base.metadata.create_all(bind=engine)

# Auto-migrate SQLite schema if new columns like 'role' are added
try:
    inspector = inspect(engine)
    if 'users' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('users')]
        if 'role' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';"))
            print("[INFO] Migrated SQLite 'users' table: Added 'role' column.")
except Exception as e:
    print(f"[INFO] Migration notice: {e}")

app = FastAPI(
    title="AI Resume Analyzer & Career Guidance API",
    description="Production-ready FastAPI Backend for Auth, Resume Upload, ATS Scoring, Job Matching, Career Guidance, and AI Interviews",
    version="2.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(job_match.router)
app.include_router(guidance.router)
app.include_router(interviews.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "AI Resume Analyzer & Career Guidance API Running 🚀",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

