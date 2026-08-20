import os
import re
import json
from typing import Dict, List, Any
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def call_gemini(prompt: str) -> dict:
    """Helper to query Google Gemini LLM with JSON format enforcement."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        genai.configure(api_key=api_key)
        # Primary Gemini Model
        model_name = "gemini-flash-latest"
        model = genai.GenerativeModel(model_name)
        
        full_prompt = prompt + "\nReturn strictly valid JSON without markdown wrapping or code fences."
        response = model.generate_content(full_prompt)

        if response and response.text:
            text = response.text.strip()
            # Clean markdown JSON formatting if returned
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
    except Exception as e:
        print(f"[Gemini 2.5 Flash Exception]: {e}")
        try:
            # Fallback to gemini-flash-latest
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(prompt + "\nRespond in valid JSON.")
            text = response.text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            return json.loads(text.strip())
        except Exception as e2:
            print(f"[Gemini Flash Latest Fallback Error]: {e2}")
    return None



def analyze_resume_content(text: str, target_role: str = "Software Engineer") -> Dict[str, Any]:
    """Analyzes resume text using Gemini AI if key exists, else strict realistic heuristics."""
    
    # 1. Try Real Gemini AI Evaluation
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) Screener & Technical Recruiter.
    Analyze the following resume content strictly for the target role: "{target_role}".
    
    Resume Content:
    \"\"\"{text[:4000]}\"\"\"

    Return a JSON object with this exact structure:
    {{
      "ats_score": (integer 0-100 based on true candidate alignment, penalty for weak content),
      "target_role": "{target_role}",
      "found_skills": ["Skill1", "Skill2"],
      "missing_skills": ["MissingSkill1", "MissingSkill2"],
      "strengths": ["Key strength 1", "Key strength 2"],
      "recommendations": ["Improvement suggestion 1", "Improvement suggestion 2"],
      "formatting_status": "Passed ATS Standard"
    }}
    """
    
    gemini_result = call_gemini(prompt)
    if gemini_result and isinstance(gemini_result, dict) and "ats_score" in gemini_result:
        return gemini_result

    # 2. Strict Fallback Heuristic Analysis (When GEMINI_API_KEY is missing or invalid)
    text_lower = text.lower()
    word_count = len(text.split())

    # Detect skills
    tech_db = [
        "python", "javascript", "typescript", "react", "next.js", "node.js", "express",
        "fastapi", "django", "flask", "html", "css", "sql", "postgresql", "mysql",
        "mongodb", "docker", "kubernetes", "aws", "azure", "git", "rest api"
    ]
    found_skills = [s.title() for s in tech_db if s in text_lower]
    missing_skills = [s.title() for s in tech_db if s not in text_lower][:4]

    # Calculate Realistic Dynamic ATS Score
    base_score = 25.0 # Low base score for bad/short text
    if word_count > 50: base_score += 15
    if word_count > 150: base_score += 15
    if len(found_skills) >= 2: base_score += 15
    if len(found_skills) >= 5: base_score += 15
    if "experience" in text_lower or "project" in text_lower: base_score += 10
    if "education" in text_lower or "university" in text_lower: base_score += 5

    ats_score = int(min(base_score, 95.0))

    strengths = []
    if found_skills:
        strengths.append(f"Technical stack presence: {', '.join(found_skills[:3])}")
    if word_count > 100:
        strengths.append("Adequate word length & structure.")
    else:
        strengths.append("Basic resume length.")

    recommendations = [
        "Add measurable achievements (e.g. 'Improved efficiency by 40%').",
        f"Include more relevant skills for {target_role}.",
        "Configure GEMINI_API_KEY in backend/.env for deep LLM evaluation."
    ]

    return {
        "ats_score": ats_score,
        "target_role": target_role.title(),
        "found_skills": found_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "recommendations": recommendations,
        "formatting_status": "Strict Heuristic Evaluated (Add GEMINI_API_KEY for Deep AI)"
    }


def match_job_requirements(resume_text: str, job_description: str) -> Dict[str, Any]:
    prompt = f"""
    Compare this resume against the job description:
    
    Resume: \"\"\"{resume_text[:2000]}\"\"\"
    Job Description: \"\"\"{job_description[:2000]}\"\"\"

    Return JSON:
    {{
      "match_percentage": (integer 0-100),
      "matching_keywords": ["Keyword1", "Keyword2"],
      "missing_keywords": ["Missing1", "Missing2"],
      "summary": "Short evaluation summary"
    }}
    """
    gemini_res = call_gemini(prompt)
    if gemini_res and "match_percentage" in gemini_res:
        return gemini_res

    # Fallback
    res_words = set(re.findall(r'\b[a-z]{3,}\b', resume_text.lower()))
    job_words = set(re.findall(r'\b[a-z]{3,}\b', job_description.lower()))
    
    common = job_words.intersection(res_words)
    missing = list(job_words - res_words)[:5]
    matching = list(common)[:5]
    
    pct = int((len(common) / max(len(job_words), 1)) * 100)
    pct = max(min(pct, 95), 15)

    return {
        "match_percentage": pct,
        "matching_keywords": matching,
        "missing_keywords": missing,
        "summary": f"Your resume matches {pct}% of key job posting requirements."
    }


def generate_career_roadmap(target_role: str) -> Dict[str, Any]:
    prompt = f"""
    Generate a 3-step career growth roadmap for a candidate aspiring to become a "{target_role}".
    Return JSON:
    {{
      "target_role": "{target_role}",
      "level": "Intermediate",
      "milestones": [
        {{ "step": 1, "title": "Step title", "duration": "2 Weeks", "skills": ["Skill1", "Skill2"] }},
        {{ "step": 2, "title": "Step title", "duration": "3 Weeks", "skills": ["Skill3", "Skill4"] }},
        {{ "step": 3, "title": "Step title", "duration": "4 Weeks", "skills": ["Skill5", "Skill6"] }}
      ],
      "recommended_courses": ["Course 1", "Course 2", "Course 3"]
    }}
    """
    gemini_res = call_gemini(prompt)
    if gemini_res and "milestones" in gemini_res:
        return gemini_res

    return {
        "target_role": target_role.title(),
        "level": "Intermediate",
        "milestones": [
            { "step": 1, "title": "Core Foundations & Language Mastery", "duration": "2-3 Weeks", "skills": ["Data Structures", "Git", "OOP"] },
            { "step": 2, "title": "Frameworks & Backend Architecture", "duration": "3 Weeks", "skills": ["FastAPI / Node.js", "SQL Databases", "REST APIs"] },
            { "step": 3, "title": "Cloud Operations & Production", "duration": "2-4 Weeks", "skills": ["Docker", "CI/CD Pipelines", "AWS / Vercel"] }
        ],
        "recommended_courses": [
            f"Production Guide to {target_role.title()}",
            "Full Stack Microservices Architecture",
            "Cloud Native DevOps & Containerization"
        ]
    }


def generate_mock_interview_questions(role: str) -> List[str]:
    prompt = f"""
    Generate 4 realistic technical interview questions for a "{role}".
    Return JSON array of strings: ["Question 1", "Question 2", "Question 3", "Question 4"]
    """
    gemini_res = call_gemini(prompt)
    if gemini_res and isinstance(gemini_res, list) and len(gemini_res) > 0:
        return gemini_res

    return [
        f"How do you design a scalable architecture for a {role} project?",
        "How do you implement JWT authentication & secure API endpoints?",
        "Describe a performance bottleneck you encountered and how you optimized it.",
        "What strategies do you use for database schema design & indexing?"
    ]


def evaluate_interview_response(question: str, answer: str) -> Dict[str, Any]:
    prompt = f"""
    You are a strict technical interviewer evaluating a candidate's answer.
    
    Question: \"\"\"{question}\"\"\"
    Candidate's Answer: \"\"\"{answer}\"\"\"

    Be strict! If the answer is short, vague, wrong, or low effort (e.g. "I don't know" or "it is good"), give a LOW score (10-40%).
    If the answer is technically detailed and thorough, give a high score (70-95%).

    Return JSON:
    {{
      "score": (integer 0-100),
      "feedback": "Detailed evaluation feedback string",
      "strengths": ["Strength 1"],
      "suggestions": ["Improvement suggestion 1"]
    }}
    """
    gemini_res = call_gemini(prompt)
    if gemini_res and "score" in gemini_res:
        return gemini_res

    # Strict Heuristic Fallback
    words = len(answer.strip().split())
    if words < 5:
        score = 15
        feedback = "Answer is too short and lacks technical explanation."
        strengths = ["Attempted response"]
        suggestions = ["Provide a detailed, step-by-step technical explanation with examples."]
    elif words < 20:
        score = 45
        feedback = "Basic answer provided, but lacks depth and architectural details."
        strengths = ["Relevant initial concepts"]
        suggestions = ["Expand on practical implementation steps and code structure."]
    else:
        score = min(50 + (words * 2), 90)
        feedback = "Detailed answer provided with clear explanation of technical concepts."
        strengths = ["Comprehensive word length", "Good coverage of core topics"]
        suggestions = ["Include specific performance metrics or edge-case handling."]

    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths,
        "suggestions": suggestions
    }
