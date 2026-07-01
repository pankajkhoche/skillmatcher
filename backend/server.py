"""TalentIQ backend - FastAPI + MongoDB + Claude Sonnet 4.5"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import json
import uuid
import logging
import re
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr

import bcrypt
import jwt as pyjwt
from pypdf import PdfReader
from docx import Document as DocxDocument
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.speech_to_text import OpenAISpeechToText
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Config
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
CLAUDE_MODEL = ("anthropic", "claude-sonnet-4-5-20250929")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="TalentIQ API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("talentiq")


# ---------- Models ----------
class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "student"  # student / job_seeker

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    target_role: Optional[str] = None
    skills: List[str] = []

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    target_role: Optional[str] = None
    skills: Optional[List[str]] = None
    linkedin_url: Optional[str] = None


class LinkedInParseIn(BaseModel):
    linkedin_url: Optional[str] = ""
    raw_text: Optional[str] = ""


class LinkedInApplyIn(BaseModel):
    linkedin_url: Optional[str] = ""
    name: Optional[str] = None
    target_role: Optional[str] = None
    headline: Optional[str] = None
    skills: Optional[List[str]] = []

class SkillsIn(BaseModel):
    skills: List[str]
    target_role: Optional[str] = None

class RewriteIn(BaseModel):
    resume_text: str
    job_description: str


class InterviewStartIn(BaseModel):
    role: str
    difficulty: Optional[str] = "medium"


class InterviewSubmitIn(BaseModel):
    interview_id: str
    answers: List[str]
    durations_sec: Optional[List[float]] = None  # optional per-question speaking duration
    body_language: Optional[List[Optional[dict]]] = None  # per-question { eye_contact_pct, posture_score }


class SaveJobIn(BaseModel):
    title: str
    company: str
    location: Optional[str] = ""
    salary_range: Optional[str] = ""
    match_score: Optional[int] = 0
    url: Optional[str] = ""
    source: Optional[str] = "manual"


class UpdateJobStatusIn(BaseModel):
    status: str  # bookmarked | applied | interviewing | offered | rejected
    notes: Optional[str] = ""


# ---------- Helpers ----------
def hash_pw(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_pw(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def make_token(uid: str) -> str:
    payload = {"sub": uid, "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(cred: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = pyjwt.decode(cred.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload["sub"]
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": uid}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def extract_text_from_upload(filename: str, data: bytes) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((p.extract_text() or "") for p in reader.pages).strip()
    if name.endswith(".docx"):
        doc = DocxDocument(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs).strip()
    raise HTTPException(400, "Only PDF or DOCX supported")


def parse_json_from_text(text: str) -> dict:
    """Extract first JSON object from LLM output."""
    # Try direct
    try:
        return json.loads(text)
    except Exception:
        pass
    # Strip markdown fences
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    # Extract first { ... } block
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    raise HTTPException(500, "AI response could not be parsed")


async def call_claude_json(system: str, user_text: str) -> dict:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system,
    ).with_model(*CLAUDE_MODEL)
    resp = await chat.send_message(UserMessage(text=user_text))
    return parse_json_from_text(resp)


# ---------- Auth Routes ----------
@api_router.post("/auth/signup")
async def signup(inp: SignupIn):
    existing = await db.users.find_one({"email": inp.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "name": inp.name,
        "email": inp.email.lower(),
        "password": hash_pw(inp.password),
        "role": inp.role or "student",
        "target_role": None,
        "skills": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    return {"token": make_token(uid), "user": {k: doc.get(k) for k in ["id", "name", "email", "role", "target_role", "skills", "linkedin_url"]}}


@api_router.post("/auth/login")
async def login(inp: LoginIn):
    user = await db.users.find_one({"email": inp.email.lower()})
    if not user or not verify_pw(inp.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    return {"token": make_token(user["id"]), "user": {k: user.get(k) for k in ["id", "name", "email", "role", "target_role", "skills", "linkedin_url"]}}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"user": {k: user.get(k) for k in ["id", "name", "email", "role", "target_role", "skills", "linkedin_url"]}}


@api_router.put("/profile")
async def update_profile(inp: ProfileUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in inp.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return {"user": {k: fresh.get(k) for k in ["id", "name", "email", "role", "target_role", "skills", "linkedin_url"]}}


# ---------- LinkedIn Import ----------
LINKEDIN_PARSE_SYSTEM = """You are a LinkedIn profile parser. Given a LinkedIn URL and/or the raw text
a user pasted from their LinkedIn profile (About, Experience, Skills sections), extract structured data.
Return STRICT JSON only, no prose:
{
  "name": string | null,
  "headline": string | null,
  "target_role": string | null,   // best-guess most-recent role or a role that fits their trajectory
  "skills": [string, ...],         // deduped, canonical skill names (e.g. "Python", "React", "AWS")
  "experience_summary": string     // 2-3 sentence summary of their experience
}
Rules:
- If the text is empty or too short to infer, return nulls / empty arrays.
- Skills MUST be short canonical tokens (max 3 words each), between 5 and 25 items.
- Do NOT invent facts not in the input.
Return ONLY JSON."""


@api_router.post("/profile/linkedin-parse")
async def linkedin_parse(inp: LinkedInParseIn, user=Depends(get_current_user)):
    text = (inp.raw_text or "").strip()
    url = (inp.linkedin_url or "").strip()
    if not text and not url:
        raise HTTPException(400, "Provide a LinkedIn URL or paste your profile text")
    if len(text) < 40:
        raise HTTPException(400, "Paste more of your LinkedIn profile text (About/Experience/Skills)")
    prompt = f"LINKEDIN URL: {url or 'not provided'}\n\nPASTED PROFILE TEXT:\n{text[:8000]}"
    result = await call_claude_json(LINKEDIN_PARSE_SYSTEM, prompt)
    # Normalise skills
    skills = result.get("skills") or []
    clean_skills = []
    seen = set()
    for s in skills:
        s = (s or "").strip()
        if s and s.lower() not in seen and len(s) <= 40:
            clean_skills.append(s)
            seen.add(s.lower())
    result["skills"] = clean_skills[:25]
    return result


@api_router.post("/profile/linkedin-apply")
async def linkedin_apply(inp: LinkedInApplyIn, user=Depends(get_current_user)):
    updates = {}
    if inp.linkedin_url:
        updates["linkedin_url"] = inp.linkedin_url.strip()
    if inp.name:
        updates["name"] = inp.name.strip()
    if inp.target_role:
        updates["target_role"] = inp.target_role.strip()
    if inp.headline and not user.get("target_role"):
        # Fallback: only set headline as target_role if user has no target_role and none provided
        updates.setdefault("target_role", inp.headline.strip())

    # Merge skills (dedup case-insensitive, preserve existing casing)
    added_skills = 0
    if inp.skills:
        existing = user.get("skills") or []
        existing_lower = {s.lower() for s in existing}
        merged = list(existing)
        for s in inp.skills:
            s = (s or "").strip()
            if s and s.lower() not in existing_lower:
                merged.append(s)
                existing_lower.add(s.lower())
                added_skills += 1
        updates["skills"] = merged

    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return {
        "user": {k: fresh.get(k) for k in ["id", "name", "email", "role", "target_role", "skills", "linkedin_url"]},
        "added_skills": added_skills,
    }


# ---------- Resume: ATS Analysis ----------
ATS_SYSTEM = """You are an expert ATS (Applicant Tracking System) resume analyzer and career coach.
Analyze the given resume and produce a strict JSON response only, no prose.
Return JSON with EXACT keys:
{
  "ats_score": int (0-100),
  "score_breakdown": {"formatting": int, "keywords": int, "impact": int, "clarity": int, "completeness": int},
  "pros": [string, ...],
  "cons": [string, ...],
  "suggested_changes": [string, ...],
  "detected_skills": [string, ...],
  "experience_level": string (one of: "entry", "mid", "senior"),
  "one_line_summary": string
}
Return ONLY the JSON object."""


@api_router.post("/resume/analyze")
async def analyze_resume(file: UploadFile = File(...), user=Depends(get_current_user)):
    data = await file.read()
    text = extract_text_from_upload(file.filename, data)
    if not text or len(text) < 50:
        raise HTTPException(400, "Could not extract enough text from resume")

    result = await call_claude_json(ATS_SYSTEM, f"RESUME:\n{text}")

    # Save
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "filename": file.filename,
        "resume_text": text,
        "analysis": result,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.resumes.insert_one(record)
    # store latest skills on user if detected
    detected = result.get("detected_skills", [])
    if detected:
        await db.users.update_one({"id": user["id"]}, {"$set": {"skills": list(set(user.get("skills", []) + detected))[:40]}})

    return {"id": record["id"], "resume_text": text, "analysis": result}


@api_router.get("/resume/latest")
async def latest_resume(user=Depends(get_current_user)):
    r = await db.resumes.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    if not r:
        return {"resume": None}
    return {"resume": r}


# ---------- Resume Rewriter ----------
REWRITE_SYSTEM = """You are an expert resume writer. Rewrite the given resume to better match the target job description.
Return STRICT JSON only with EXACT keys:
{
  "rewritten_resume": string (full plaintext resume optimized for ATS with clear sections: Summary, Skills, Experience, Education, Projects),
  "improvements": [string, ...],
  "keywords_added": [string, ...],
  "match_score_before": int (0-100),
  "match_score_after": int (0-100)
}
Rewrite must preserve truthful facts (companies, dates, education) but improve wording, keywords, quantify impact, and align with the JD.
Return ONLY the JSON object."""


@api_router.post("/resume/rewrite")
async def rewrite_resume(inp: RewriteIn, user=Depends(get_current_user)):
    if len(inp.resume_text) < 30 or len(inp.job_description) < 20:
        raise HTTPException(400, "Resume and job description are required")
    user_msg = f"JOB DESCRIPTION:\n{inp.job_description}\n\nORIGINAL RESUME:\n{inp.resume_text}"
    result = await call_claude_json(REWRITE_SYSTEM, user_msg)
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "job_description": inp.job_description,
        "original": inp.resume_text,
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.rewrites.insert_one(record)
    return {"id": record["id"], **result}


@api_router.post("/resume/rewrite/pdf")
async def rewrite_pdf(payload: dict, user=Depends(get_current_user)):
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(400, "Text is required")
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=0.75*inch, rightMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    body_style = ParagraphStyle('body', parent=styles['Normal'], fontName='Helvetica', fontSize=10.5, leading=14, alignment=TA_LEFT)
    heading_style = ParagraphStyle('h', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, spaceAfter=6, spaceBefore=10)
    story = []
    for line in text.split("\n"):
        line = line.rstrip()
        if not line.strip():
            story.append(Spacer(1, 6))
            continue
        # Treat ALL CAPS or lines ending with ':' as headings
        stripped = line.strip()
        if (stripped.isupper() and len(stripped) < 60) or (stripped.endswith(":") and len(stripped) < 40):
            story.append(Paragraph(stripped.replace("&", "&amp;"), heading_style))
        else:
            story.append(Paragraph(stripped.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), body_style))
    doc.build(story)
    pdf = buf.getvalue()
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": 'attachment; filename="talentiq_resume.pdf"'})


# ---------- Skills / Role Fit / Jobs ----------
ROLE_FIT_SYSTEM = """You are a senior career advisor. Given a user's skills and optional target role, recommend the best roles and a learning path.
Return STRICT JSON only with EXACT keys:
{
  "recommended_roles": [
    {"role": string, "fit_score": int (0-100), "why": string, "skills_matched": [string, ...], "skills_to_learn": [string, ...]}
  ],
  "top_pick": string,
  "learning_roadmap": [ {"step": int, "title": string, "duration": string, "resources": [string, ...]} ]
}
Provide 4-6 recommended_roles and 5-7 learning_roadmap steps. Return ONLY the JSON object."""


@api_router.post("/skills/analyze")
async def analyze_skills(inp: SkillsIn, user=Depends(get_current_user)):
    if not inp.skills:
        raise HTTPException(400, "Skills are required")
    # persist
    await db.users.update_one({"id": user["id"]}, {"$set": {"skills": inp.skills, "target_role": inp.target_role}})
    user_msg = f"SKILLS: {', '.join(inp.skills)}\nTARGET ROLE (optional): {inp.target_role or 'not specified'}"
    result = await call_claude_json(ROLE_FIT_SYSTEM, user_msg)
    return result


JOBS_SYSTEM = """You are a job market expert. Based on the user's skills, experience level, and resume (if any), generate 6 realistic, diverse job opportunities that would be a good match.
Return STRICT JSON only:
{
  "jobs": [
    {
      "title": string,
      "company": string,
      "location": string,
      "type": "Full-time" | "Internship" | "Contract",
      "salary_range": string,
      "match_score": int (0-100),
      "match_reason": string,
      "key_requirements": [string, ...],
      "why_you_fit": string
    }
  ]
}
Companies must be varied and realistic (mix of well-known tech companies and startups). Return ONLY the JSON object."""


@api_router.post("/jobs/suggest")
async def suggest_jobs(user=Depends(get_current_user)):
    skills = user.get("skills", [])
    target = user.get("target_role", "")
    latest = await db.resumes.find_one({"user_id": user["id"]}, sort=[("created_at", -1)])
    resume_snippet = (latest.get("resume_text", "")[:1500] if latest else "")
    exp_level = ((latest or {}).get("analysis", {}) or {}).get("experience_level", "entry")
    if not skills and not resume_snippet:
        raise HTTPException(400, "Add skills or upload a resume first")

    prompt = f"SKILLS: {', '.join(skills) or 'none'}\nTARGET ROLE: {target or 'flexible'}\nEXPERIENCE LEVEL: {exp_level}\nRESUME SNIPPET:\n{resume_snippet}"
    result = await call_claude_json(JOBS_SYSTEM, prompt)
    return result


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"service": "TalentIQ", "status": "ok"}


# ---------- History (analyzer + rewriter) ----------
@api_router.get("/history/resumes")
async def history_resumes(user=Depends(get_current_user)):
    docs = await db.resumes.find({"user_id": user["id"]}, {"_id": 0, "resume_text": 0}).sort("created_at", -1).to_list(50)
    return {"items": docs}


@api_router.get("/history/rewrites")
async def history_rewrites(user=Depends(get_current_user)):
    docs = await db.rewrites.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"items": docs}


# ---------- Mock Interview ----------
INTERVIEW_QUESTIONS_SYSTEM = """You are an expert technical interviewer. Generate 5 interview questions tailored to the given role and difficulty.
Return STRICT JSON:
{
  "questions": [
    {"id": int, "type": "behavioral"|"technical"|"situational", "question": string}
  ]
}
Return ONLY the JSON."""

INTERVIEW_SCORE_SYSTEM = """You are a strict but fair interview coach. Evaluate the candidate's answers.
Return STRICT JSON:
{
  "overall_score": int (0-100),
  "communication_score": int (0-100),
  "technical_score": int (0-100),
  "confidence_score": int (0-100),
  "clarity_score": int (0-100),
  "strengths": [string, ...],
  "improvement_areas": [string, ...],
  "per_question_feedback": [
    {"question": string, "answer": string, "score": int, "feedback": string}
  ],
  "verdict": string (one line summary),
  "next_steps": [string, ...]
}
Return ONLY the JSON."""


@api_router.post("/interview/start")
async def interview_start(inp: InterviewStartIn, user=Depends(get_current_user)):
    if not inp.role or len(inp.role) < 2:
        raise HTTPException(400, "Role required")
    result = await call_claude_json(INTERVIEW_QUESTIONS_SYSTEM, f"ROLE: {inp.role}\nDIFFICULTY: {inp.difficulty}\nCANDIDATE SKILLS: {', '.join(user.get('skills', [])[:12])}")
    iv_id = str(uuid.uuid4())
    doc = {
        "id": iv_id,
        "user_id": user["id"],
        "role": inp.role,
        "difficulty": inp.difficulty,
        "questions": result.get("questions", []),
        "status": "in_progress",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.interviews.insert_one(doc)
    return {"interview_id": iv_id, "questions": doc["questions"]}


@api_router.post("/interview/submit")
async def interview_submit(inp: InterviewSubmitIn, user=Depends(get_current_user)):
    iv = await db.interviews.find_one({"id": inp.interview_id, "user_id": user["id"]})
    if not iv:
        raise HTTPException(404, "Interview not found")
    qs = iv.get("questions", [])
    payload = "ROLE: " + iv["role"] + "\n\n" + "\n\n".join(
        f"Q{i+1} ({q.get('type')}): {q.get('question')}\nAnswer: {inp.answers[i] if i < len(inp.answers) else '(no answer)'}"
        for i, q in enumerate(qs)
    )
    result = await call_claude_json(INTERVIEW_SCORE_SYSTEM, payload)

    # Speaking assessment (heuristic + AI blend)
    FILLERS = {"um", "uh", "like", "you know", "basically", "actually", "literally", "kind of", "sort of", "so", "right"}
    speaking = []
    total_words = 0; total_fillers = 0; total_dur = 0.0
    for i, ans in enumerate(inp.answers or []):
        words = [w for w in re.findall(r"[A-Za-z']+", ans.lower())]
        wc = len(words)
        fillers = sum(1 for w in words if w in FILLERS)
        dur = (inp.durations_sec[i] if inp.durations_sec and i < len(inp.durations_sec) else 0) or 0
        # assume 150 wpm if no duration provided
        wpm = round((wc / dur) * 60) if dur > 3 else (min(180, max(60, wc * 2)) if wc else 0)
        speaking.append({"question_index": i, "word_count": wc, "filler_count": fillers, "filler_ratio": round((fillers/wc)*100,1) if wc else 0, "wpm": wpm})
        total_words += wc; total_fillers += fillers; total_dur += dur
    ideal_wpm = 150
    avg_wpm = round(sum(s["wpm"] for s in speaking) / len(speaking)) if speaking else 0
    pace_score = max(0, min(100, 100 - abs(avg_wpm - ideal_wpm))) if avg_wpm else 0
    filler_ratio = (total_fillers / total_words * 100) if total_words else 0
    filler_score = max(0, min(100, round(100 - filler_ratio * 8)))
    speaking_summary = {
        "avg_wpm": avg_wpm,
        "total_words": total_words,
        "total_fillers": total_fillers,
        "filler_ratio_pct": round(filler_ratio, 1),
        "pace_score": pace_score,
        "clarity_score": filler_score,
        "per_question": speaking,
        "verdict": ("Excellent pace and delivery" if pace_score >= 80 and filler_score >= 80
                    else "Consider slowing down and reducing filler words" if avg_wpm > 180
                    else "Try speaking a bit faster and more concisely" if avg_wpm and avg_wpm < 100
                    else "Solid — trim a few filler words for extra polish"),
    }
    result["speaking_assessment"] = speaking_summary

    # Body-language aggregation (from client-side MediaPipe)
    bl_in = inp.body_language or []
    eye_vals, posture_vals = [], []
    for entry in bl_in:
        if not entry:
            continue
        e = entry.get("eye_contact_pct")
        p = entry.get("posture_score")
        if isinstance(e, (int, float)) and e > 0:
            eye_vals.append(float(e))
        if isinstance(p, (int, float)) and p > 0:
            posture_vals.append(float(p))
    if eye_vals or posture_vals:
        avg_eye = round(sum(eye_vals) / len(eye_vals)) if eye_vals else 0
        avg_posture = round(sum(posture_vals) / len(posture_vals)) if posture_vals else 0
        presence = round(avg_eye * 0.6 + avg_posture * 0.4)
        if avg_eye >= 75 and avg_posture >= 75:
            verdict = "Strong presence — steady eye contact and upright posture."
        elif avg_eye < 40:
            verdict = "Look at the camera more often; your gaze drifts off frequently."
        elif avg_posture < 40:
            verdict = "Sit upright and centered in frame to project more confidence."
        else:
            verdict = "Decent presence — a little more eye contact will make you unmistakable."
        result["body_language"] = {
            "avg_eye_contact_pct": avg_eye,
            "avg_posture_score": avg_posture,
            "presence_score": presence,
            "captured_answers": max(len(eye_vals), len(posture_vals)),
            "per_question": bl_in,
            "verdict": verdict,
        }

    await db.interviews.update_one({"id": inp.interview_id}, {"$set": {"answers": inp.answers, "scorecard": result, "status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}})
    return {"interview_id": inp.interview_id, "scorecard": result}


# ---------- Saved Jobs / Apply Tracker ----------
@api_router.post("/jobs/save")
async def save_job(inp: SaveJobIn, user=Depends(get_current_user)):
    # de-dup by title+company for this user
    existing = await db.saved_jobs.find_one({"user_id": user["id"], "title": inp.title, "company": inp.company})
    if existing:
        return {"id": existing["id"], "already_saved": True}
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **inp.model_dump(),
        "status": "bookmarked",
        "notes": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.saved_jobs.insert_one(doc)
    return {"id": doc["id"], "already_saved": False}


@api_router.get("/jobs/saved")
async def list_saved(user=Depends(get_current_user)):
    docs = await db.saved_jobs.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    return {"items": docs}


@api_router.put("/jobs/saved/{job_id}")
async def update_saved(job_id: str, inp: UpdateJobStatusIn, user=Depends(get_current_user)):
    allowed = {"bookmarked", "applied", "interviewing", "offered", "rejected"}
    if inp.status not in allowed:
        raise HTTPException(400, f"status must be one of {allowed}")
    r = await db.saved_jobs.update_one(
        {"id": job_id, "user_id": user["id"]},
        {"$set": {"status": inp.status, "notes": inp.notes, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api_router.delete("/jobs/saved/{job_id}")
async def delete_saved(job_id: str, user=Depends(get_current_user)):
    r = await db.saved_jobs.delete_one({"id": job_id, "user_id": user["id"]})
    if r.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api_router.get("/interview/history")
async def interview_history(user=Depends(get_current_user)):
    docs = await db.interviews.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"items": docs}


@api_router.post("/interview/scorecard/pdf")
async def interview_pdf(payload: dict, user=Depends(get_current_user)):
    iv_id = payload.get("interview_id")
    iv = await db.interviews.find_one({"id": iv_id, "user_id": user["id"]}, {"_id": 0})
    if not iv or not iv.get("scorecard"):
        raise HTTPException(404, "Scorecard not found")
    sc = iv["scorecard"]
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=0.75*inch, rightMargin=0.75*inch, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    title = ParagraphStyle('t', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=22, spaceAfter=8, textColor='#A855F7')
    h2 = ParagraphStyle('h2', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, spaceAfter=6, spaceBefore=12)
    body = ParagraphStyle('b', parent=styles['Normal'], fontName='Helvetica', fontSize=10.5, leading=14)
    story = []
    story.append(Paragraph("TalentIQ — Interview Scorecard", title))
    story.append(Paragraph(f"Role: <b>{iv['role']}</b> · Difficulty: {iv.get('difficulty','medium')}", body))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<b>Overall: {sc.get('overall_score','-')}/100</b>", h2))
    story.append(Paragraph(
        f"Communication: {sc.get('communication_score','-')} &nbsp;·&nbsp; Technical: {sc.get('technical_score','-')} &nbsp;·&nbsp; Confidence: {sc.get('confidence_score','-')} &nbsp;·&nbsp; Clarity: {sc.get('clarity_score','-')}",
        body,
    ))
    story.append(Paragraph(f"<i>{sc.get('verdict','')}</i>", body))
    story.append(Paragraph("Strengths", h2))
    for s in sc.get("strengths", []): story.append(Paragraph(f"• {s}", body))
    story.append(Paragraph("Improvement Areas", h2))
    for s in sc.get("improvement_areas", []): story.append(Paragraph(f"• {s}", body))
    story.append(Paragraph("Next Steps", h2))
    for s in sc.get("next_steps", []): story.append(Paragraph(f"• {s}", body))
    story.append(Paragraph("Per-Question Feedback", h2))
    for i, q in enumerate(sc.get("per_question_feedback", [])):
        story.append(Paragraph(f"<b>Q{i+1}. {q.get('question','')}</b> — score {q.get('score','-')}", body))
        story.append(Paragraph(f"<i>Feedback:</i> {q.get('feedback','')}", body))
        story.append(Spacer(1, 4))
    doc.build(story)
    return Response(content=buf.getvalue(), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="talentiq_interview_{iv_id[:8]}.pdf"'})




# ---------- Voice Interview: Transcribe ----------
@api_router.post("/interview/transcribe")
async def transcribe_audio(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = (file.filename or "").split(".")[-1].lower()
    if ext not in ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"]:
        # Default to webm since MediaRecorder produces webm/opus
        ext = "webm"
    data = await file.read()
    tmp_path = f"/tmp/tiq_{uuid.uuid4()}.{ext}"
    with open(tmp_path, "wb") as f:
        f.write(data)
    try:
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        result = await stt.transcribe(file=Path(tmp_path), model="whisper-1", response_format="json")
        # result may be a Pydantic object or dict
        if hasattr(result, "text"):
            text = result.text
        elif isinstance(result, dict):
            text = result.get("text", "")
        else:
            text = str(result)
        return {"text": text}
    finally:
        try: os.remove(tmp_path)
        except Exception: pass


# ---------- Career Roadmap Deep-Dive ----------
ROADMAP_SYSTEM = """You are a world-class career strategist. Produce a comprehensive, actionable 12-month career roadmap.
Return STRICT JSON:
{
  "current_position": string,
  "target_position": string,
  "gap_analysis": string,
  "phases": [
    {
      "phase": int (1-4),
      "title": string,
      "duration": string (e.g. "Months 1-3"),
      "focus": string,
      "milestones": [string, ...],
      "skills_to_learn": [string, ...],
      "resources": [{"name": string, "type": "course"|"book"|"project"|"community", "url_hint": string}],
      "success_metric": string
    }
  ],
  "long_term_vision": string,
  "monthly_habits": [string, ...],
  "certifications": [string, ...],
  "estimated_salary_impact": string
}
Provide 4 phases covering 12 months. Return ONLY JSON."""


class RoadmapIn(BaseModel):
    current_role: Optional[str] = ""
    target_role: str
    skills: List[str] = []


@api_router.post("/roadmap/generate")
async def gen_roadmap(inp: RoadmapIn, user=Depends(get_current_user)):
    if not inp.target_role:
        raise HTTPException(400, "target_role required")
    skills = inp.skills or user.get("skills", [])
    prompt = f"CURRENT ROLE: {inp.current_role or 'not specified'}\nTARGET ROLE: {inp.target_role}\nCURRENT SKILLS: {', '.join(skills[:20])}"
    result = await call_claude_json(ROADMAP_SYSTEM, prompt)
    await db.roadmaps.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"],
        "target_role": inp.target_role, "roadmap": result,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return result


# ---------- Resume Compare ----------
COMPARE_SYSTEM = """You are an expert resume reviewer. Compare two resumes and produce STRICT JSON:
{
  "resume_a_score": int (0-100),
  "resume_b_score": int (0-100),
  "winner": "A"|"B"|"tie",
  "verdict": string,
  "resume_a_strengths": [string, ...],
  "resume_b_strengths": [string, ...],
  "resume_a_weaknesses": [string, ...],
  "resume_b_weaknesses": [string, ...],
  "recommendation": string,
  "best_of_both": [string, ...]
}
Return ONLY JSON."""


@api_router.post("/resume/compare")
async def compare_resumes(resume_a: UploadFile = File(...), resume_b: UploadFile = File(...), user=Depends(get_current_user)):
    text_a = extract_text_from_upload(resume_a.filename, await resume_a.read())
    text_b = extract_text_from_upload(resume_b.filename, await resume_b.read())
    if len(text_a) < 50 or len(text_b) < 50:
        raise HTTPException(400, "Could not extract enough text from both resumes")
    prompt = f"RESUME A:\n{text_a}\n\n---\n\nRESUME B:\n{text_b}"
    result = await call_claude_json(COMPARE_SYSTEM, prompt)
    return {"comparison": result, "resume_a_name": resume_a.filename, "resume_b_name": resume_b.filename}


# ---------- Real Job Board (Remotive - free) ----------
@api_router.get("/jobs/real")
async def real_jobs(user=Depends(get_current_user), search: Optional[str] = None):
    query = search or user.get("target_role") or (user.get("skills", ["software"])[:1][0] if user.get("skills") else "software")
    url = "https://remotive.com/api/remote-jobs"
    params = {"search": query, "limit": 12}
    try:
        async with httpx.AsyncClient(timeout=20) as ac:
            r = await ac.get(url, params=params)
            data = r.json()
    except Exception as e:
        raise HTTPException(502, f"Job feed unavailable: {e}")
    jobs = []
    user_skills_lower = [s.lower() for s in user.get("skills", [])]
    for j in data.get("jobs", [])[:12]:
        text = ((j.get("title","") + " " + (j.get("description","") or ""))[:2000]).lower()
        matched = [s for s in user.get("skills", []) if s.lower() in text]
        score = min(100, 40 + len(matched) * 8) if matched else 40
        jobs.append({
            "title": j.get("title"),
            "company": j.get("company_name"),
            "location": j.get("candidate_required_location", "Remote"),
            "type": j.get("job_type", "Full-time").replace("_"," ").title(),
            "salary_range": j.get("salary") or "Not disclosed",
            "match_score": score,
            "matched_skills": matched,
            "url": j.get("url"),
            "posted_at": j.get("publication_date", ""),
        })
    jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return {"query": query, "jobs": jobs, "source": "Remotive"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
