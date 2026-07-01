"""
TalentIQ backend regression tests - Iteration 5 (refactor-only iteration)

Verifies the extracted helpers produce identical shapes/values as before:
  - build_speaking_assessment  -> /api/interview/submit
  - build_body_language_summary -> /api/interview/submit
  - _build_bl_timeline / _compute_trend / _aggregate_per_question -> /api/interview/body-language/trends

Also covers auth + profile linkedin_url regression (quick sanity).
"""
import os
import time
import requests
import pytest
from pathlib import Path

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    for line in Path('/app/frontend/.env').read_text().splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip()
            break
BASE_URL = BASE_URL.rstrip('/')
API = f"{BASE_URL}/api"

TS = int(time.time())
USER = {"name": "QA Iter5", "email": f"qa+iter5_{TS}@talentiq.dev", "password": "Password123!", "role": "student"}


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def auth():
    r = requests.post(f"{API}/auth/signup", json=USER, timeout=30)
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="module")
def h(auth):
    return {"Authorization": f"Bearer {auth['token']}", "Content-Type": "application/json"}


# ---------- REGRESSION: Auth response shape ----------
def test_signup_returns_token_and_linkedin_url_key(auth):
    assert "token" in auth and isinstance(auth["token"], str) and auth["token"]
    assert "user" in auth
    assert "linkedin_url" in auth["user"]


def test_login_and_me_work(auth):
    r = requests.post(f"{API}/auth/login", json={"email": USER["email"], "password": USER["password"]}, timeout=30)
    assert r.status_code == 200
    tok = r.json()["token"]
    r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
    assert r2.status_code == 200
    assert "linkedin_url" in r2.json()["user"]


def test_profile_put_linkedin_url(h):
    url = "https://www.linkedin.com/in/qa-iter5"
    r = requests.put(f"{API}/profile", json={"linkedin_url": url}, headers=h, timeout=30)
    assert r.status_code == 200
    assert r.json()["user"]["linkedin_url"] == url


# ---------- REGRESSION: /interview/body-language/trends empty state ----------
def test_body_language_trends_empty_state(h):
    r = requests.get(f"{API}/interview/body-language/trends", headers=h, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body == {"timeline": [], "summary": None}


# ---------- REGRESSION: /interview/start returns 5 questions ----------
@pytest.fixture(scope="module")
def interview_1(h):
    r = requests.post(f"{API}/interview/start", json={"role": "Software Engineer", "difficulty": "easy"}, headers=h, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "interview_id" in data
    assert isinstance(data.get("questions"), list) and len(data["questions"]) == 5, f"expected 5 questions, got {len(data.get('questions', []))}"
    return data


def test_interview_start_returns_5_questions(interview_1):
    assert len(interview_1["questions"]) == 5


# ---------- REGRESSION: Submit WITHOUT durations/body_language (backward compat) ----------
def test_submit_without_durations_or_body(h, interview_1):
    qs = interview_1["questions"]
    answers = ["I have strong experience in Python and system design, having worked on multiple production services."] * len(qs)
    r = requests.post(f"{API}/interview/submit", json={
        "interview_id": interview_1["interview_id"],
        "answers": answers,
    }, headers=h, timeout=180)
    assert r.status_code == 200, r.text
    sc = r.json()["scorecard"]

    # speaking_assessment ALWAYS present
    assert "speaking_assessment" in sc, "speaking_assessment must be present even without durations"
    sa = sc["speaking_assessment"]
    for k in ("avg_wpm", "pace_score", "clarity_score", "verdict", "per_question", "total_words", "total_fillers", "filler_ratio_pct"):
        assert k in sa, f"missing speaking_assessment key: {k}"
    assert isinstance(sa["avg_wpm"], int)
    assert 0 <= sa["pace_score"] <= 100
    assert 0 <= sa["clarity_score"] <= 100
    assert isinstance(sa["verdict"], str) and sa["verdict"]
    assert isinstance(sa["per_question"], list) and len(sa["per_question"]) == len(qs)

    # body_language must be ABSENT
    assert "body_language" not in sc, "body_language should be absent when not provided"


# ---------- REGRESSION: Submit WITH durations AND body_language ----------
@pytest.fixture(scope="module")
def interview_2(h):
    r = requests.post(f"{API}/interview/start", json={"role": "Backend Engineer", "difficulty": "easy"}, headers=h, timeout=90)
    assert r.status_code == 200
    return r.json()


def test_submit_with_durations_and_body_language(h, interview_2):
    qs = interview_2["questions"]
    answers = ["I have led teams building scalable backend systems using Python and AWS for the past five years."] * len(qs)
    durations = [30.0] * len(qs)
    body_language = [
        {"eye_contact_pct": 85, "posture_score": 80},
        {"eye_contact_pct": 78, "posture_score": 76},
        {"eye_contact_pct": 88, "posture_score": 82},
        {"eye_contact_pct": 90, "posture_score": 85},
        {"eye_contact_pct": 82, "posture_score": 79},
    ][:len(qs)]

    r = requests.post(f"{API}/interview/submit", json={
        "interview_id": interview_2["interview_id"],
        "answers": answers,
        "durations_sec": durations,
        "body_language": body_language,
    }, headers=h, timeout=180)
    assert r.status_code == 200, r.text
    sc = r.json()["scorecard"]

    # speaking_assessment
    sa = sc["speaking_assessment"]
    assert sa["avg_wpm"] > 0, f"avg_wpm should be positive when durations provided: {sa}"
    assert sa["per_question"][0]["wpm"] > 0

    # body_language must be present with non-zero values
    assert "body_language" in sc
    bl = sc["body_language"]
    for k in ("avg_eye_contact_pct", "avg_posture_score", "presence_score", "captured_answers", "per_question", "verdict"):
        assert k in bl, f"missing body_language key: {k}"
    assert bl["captured_answers"] == len(body_language)
    assert bl["avg_eye_contact_pct"] > 0
    assert bl["avg_posture_score"] > 0
    assert bl["presence_score"] > 0
    assert isinstance(bl["verdict"], str) and bl["verdict"]


# ---------- Add a second body-language interview for trends test ----------
def test_second_interview_with_body_language(h):
    r = requests.post(f"{API}/interview/start", json={"role": "Backend Engineer", "difficulty": "easy"}, headers=h, timeout=90)
    assert r.status_code == 200
    iv = r.json()
    qs = iv["questions"]
    answers = ["I mentor engineers and design distributed systems handling millions of requests per day."] * len(qs)
    body_language = [{"eye_contact_pct": 92, "posture_score": 90}] * len(qs)
    r2 = requests.post(f"{API}/interview/submit", json={
        "interview_id": iv["interview_id"],
        "answers": answers,
        "body_language": body_language,
    }, headers=h, timeout=180)
    assert r2.status_code == 200


# ---------- REGRESSION: Trends endpoint populated ----------
def test_body_language_trends_populated(h):
    r = requests.get(f"{API}/interview/body-language/trends", headers=h, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert isinstance(body.get("timeline"), list)
    assert len(body["timeline"]) >= 2, f"expected >=2 body-language interviews, got {len(body['timeline'])}"

    # Timeline entry shape
    t0 = body["timeline"][0]
    for k in ("id", "role", "created_at", "avg_eye_contact_pct", "avg_posture_score", "presence_score", "per_question"):
        assert k in t0, f"timeline entry missing {k}"

    # Summary shape
    s = body.get("summary")
    assert s is not None
    for k in ("total_interviews", "overall_avg_eye_contact_pct", "overall_avg_posture_score",
              "trend_direction", "trend_delta", "best_interview", "worst_interview", "per_question_avg"):
        assert k in s, f"summary missing key: {k}"
    assert s["total_interviews"] == len(body["timeline"])
    assert s["trend_direction"] in ("improving", "steady", "declining")
    assert isinstance(s["trend_delta"], int)
    # Best/worst structure
    for key in ("id", "role", "presence_score", "created_at"):
        assert key in s["best_interview"], f"best_interview missing {key}"
        assert key in s["worst_interview"], f"worst_interview missing {key}"
    # per_question_avg entries
    assert isinstance(s["per_question_avg"], list)
    if s["per_question_avg"]:
        pq = s["per_question_avg"][0]
        for k in ("question_index", "avg_eye_contact_pct", "avg_posture_score", "samples"):
            assert k in pq


# ---------- REGRESSION: LinkedIn parse/apply quick sanity ----------
LINKEDIN_TEXT = (
    "About: Senior Software Engineer with 6 years of experience building scalable web platforms. "
    "Passionate about clean architecture and mentoring.\n"
    "Experience:\n- Acme Corp (2022-Present): Senior Software Engineer. Python, FastAPI, AWS.\n"
    "- Beta Inc (2019-2022): Software Engineer. Django, PostgreSQL, Redis.\n"
    "Skills: Python, React, AWS, TypeScript, PostgreSQL, Docker, Kubernetes, FastAPI, Redis, Django."
)


def test_linkedin_parse_apply_still_works(h):
    r = requests.post(f"{API}/profile/linkedin-parse",
                      json={"linkedin_url": "https://www.linkedin.com/in/qa-iter5",
                            "raw_text": LINKEDIN_TEXT},
                      headers=h, timeout=90)
    assert r.status_code == 200, r.text
    parsed = r.json()
    assert isinstance(parsed.get("skills"), list) and len(parsed["skills"]) >= 5

    # Apply merges case-insensitively
    requests.put(f"{API}/profile", json={"skills": ["python", "existing skill"]}, headers=h, timeout=30)
    r2 = requests.post(f"{API}/profile/linkedin-apply",
                       json={"linkedin_url": "https://www.linkedin.com/in/qa-iter5",
                             "skills": parsed["skills"]},
                       headers=h, timeout=30)
    assert r2.status_code == 200
    merged = r2.json()["user"]["skills"]
    lowered = [s.lower() for s in merged]
    assert len(lowered) == len(set(lowered))  # dedup
    assert "existing skill" in lowered  # existing preserved
