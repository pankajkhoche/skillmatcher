"""
TalentIQ backend tests - Iteration 4
Covers: LinkedIn Import (parse/apply), Profile PUT linkedin_url, Interview body_language
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # fallback to reading from frontend/.env
    from pathlib import Path
    for line in Path('/app/frontend/.env').read_text().splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
            break

API = f"{BASE_URL}/api"
TS = int(time.time())
USER = {"name": "QA Body", "email": f"qa+iter4_{TS}@talentiq.dev", "password": "Password123!", "role": "student"}


@pytest.fixture(scope="module")
def auth():
    r = requests.post(f"{API}/auth/signup", json=USER, timeout=30)
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["token"], "user": data["user"]}


@pytest.fixture(scope="module")
def h(auth):
    return {"Authorization": f"Bearer {auth['token']}", "Content-Type": "application/json"}


# ---------- Auth response shape (linkedin_url present) ----------
def test_signup_returns_linkedin_url_key(auth):
    assert "linkedin_url" in auth["user"], "signup response user must include linkedin_url"


def test_login_returns_linkedin_url_key():
    r = requests.post(f"{API}/auth/login", json={"email": USER["email"], "password": USER["password"]}, timeout=30)
    assert r.status_code == 200
    assert "linkedin_url" in r.json()["user"]


def test_me_returns_linkedin_url_key(h):
    r = requests.get(f"{API}/auth/me", headers=h, timeout=30)
    assert r.status_code == 200
    assert "linkedin_url" in r.json()["user"]


# ---------- PUT /profile with linkedin_url ----------
def test_profile_put_saves_linkedin_url(h):
    url = "https://www.linkedin.com/in/qa-body-test"
    r = requests.put(f"{API}/profile", json={"linkedin_url": url}, headers=h, timeout=30)
    assert r.status_code == 200, r.text
    assert r.json()["user"]["linkedin_url"] == url
    # Verify persisted via /me
    r2 = requests.get(f"{API}/auth/me", headers=h, timeout=30)
    assert r2.json()["user"]["linkedin_url"] == url


# ---------- LinkedIn Parse ----------
def test_linkedin_parse_requires_auth():
    r = requests.post(f"{API}/profile/linkedin-parse", json={"raw_text": "x" * 100}, timeout=30)
    assert r.status_code in (401, 403)


def test_linkedin_parse_400_when_short_text_and_no_url(h):
    r = requests.post(f"{API}/profile/linkedin-parse", json={"raw_text": "too short", "linkedin_url": ""}, headers=h, timeout=30)
    assert r.status_code == 400


LINKEDIN_TEXT = (
    "About: Senior Software Engineer with 6 years building scalable web platforms. "
    "Passionate about clean architecture, mentoring, and shipping fast.\n"
    "Experience:\n- Acme Corp (2022-Present): Senior Software Engineer. Led migration to microservices using Python, FastAPI and AWS. "
    "Built React front-ends with TypeScript. Managed PostgreSQL databases and Docker/Kubernetes deployments.\n"
    "- Beta Inc (2019-2022): Software Engineer. Developed Django REST APIs, deployed on AWS EC2, used Redis for caching. "
    "Wrote unit tests with pytest and CI pipelines in GitHub Actions.\n"
    "Skills: Python, React, AWS, TypeScript, PostgreSQL, Docker, Kubernetes, FastAPI, Redis, Django, Git."
)


@pytest.fixture(scope="module")
def parse_result(h):
    r = requests.post(f"{API}/profile/linkedin-parse",
                      json={"linkedin_url": "https://www.linkedin.com/in/qa-body-test", "raw_text": LINKEDIN_TEXT},
                      headers=h, timeout=90)
    assert r.status_code == 200, f"parse failed: {r.status_code} {r.text}"
    return r.json()


def test_linkedin_parse_returns_required_keys(parse_result):
    for k in ("name", "headline", "target_role", "skills", "experience_summary"):
        assert k in parse_result, f"missing key: {k}"


def test_linkedin_parse_skills_5_to_25(parse_result):
    skills = parse_result["skills"]
    assert isinstance(skills, list)
    assert 5 <= len(skills) <= 25, f"skills length out of range: {len(skills)}"


def test_linkedin_parse_skills_case_insensitive_deduped(parse_result):
    skills = parse_result["skills"]
    lowered = [s.lower() for s in skills]
    assert len(lowered) == len(set(lowered)), f"dupes present: {skills}"


# ---------- LinkedIn Apply ----------
def test_linkedin_apply_requires_auth():
    r = requests.post(f"{API}/profile/linkedin-apply", json={"skills": ["Python"]}, timeout=30)
    assert r.status_code in (401, 403)


def test_linkedin_apply_merges_and_dedups(h, parse_result):
    # First set existing skills with mixed case
    requests.put(f"{API}/profile", json={"skills": ["python", "Existing Skill"]}, headers=h, timeout=30)

    parsed_skills = parse_result["skills"]
    payload = {
        "linkedin_url": "https://www.linkedin.com/in/qa-body-test",
        "name": parse_result.get("name") or "QA Body",
        "target_role": parse_result.get("target_role") or "Software Engineer",
        "skills": parsed_skills,
    }
    r = requests.post(f"{API}/profile/linkedin-apply", json=payload, headers=h, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "user" in body and "added_skills" in body
    merged = body["user"]["skills"]
    lowered = [s.lower() for s in merged]
    # No dupes
    assert len(lowered) == len(set(lowered)), f"merged has dupes: {merged}"
    # Existing preserved
    assert "existing skill" in lowered
    assert "python" in lowered
    # parsed skills all present (case-insensitive)
    for s in parsed_skills:
        assert s.lower() in lowered, f"missing merged skill: {s}"
    # added_skills reflects only truly-new ones (python was already present)
    assert body["added_skills"] >= 0


def test_linkedin_apply_second_call_no_new_added(h, parse_result):
    # Applying same skills again should add 0
    payload = {
        "linkedin_url": "https://www.linkedin.com/in/qa-body-test",
        "skills": parse_result["skills"],
    }
    r = requests.post(f"{API}/profile/linkedin-apply", json=payload, headers=h, timeout=30)
    assert r.status_code == 200
    assert r.json()["added_skills"] == 0


# ---------- Interview submit with body_language ----------
@pytest.fixture(scope="module")
def interview(h):
    r = requests.post(f"{API}/interview/start", json={"role": "Software Engineer", "difficulty": "easy"}, headers=h, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "interview_id" in data and len(data.get("questions", [])) > 0
    return data


def test_interview_submit_with_body_language(h, interview):
    qs = interview["questions"]
    answers = ["I am a software engineer with experience in Python and AWS."] * len(qs)
    body_language = [
        {"eye_contact_pct": 82, "posture_score": 78},
        {"eye_contact_pct": 65, "posture_score": 70},
        None,
        {"eye_contact_pct": 90, "posture_score": 85},
        {"eye_contact_pct": 55, "posture_score": 60},
    ][:len(qs)]
    r = requests.post(f"{API}/interview/submit", json={
        "interview_id": interview["interview_id"],
        "answers": answers,
        "body_language": body_language,
    }, headers=h, timeout=180)
    assert r.status_code == 200, r.text
    sc = r.json()["scorecard"]
    assert "body_language" in sc, "body_language block missing"
    bl = sc["body_language"]
    for key in ("avg_eye_contact_pct", "avg_posture_score", "presence_score", "captured_answers", "per_question", "verdict"):
        assert key in bl, f"missing body_language key: {key}"
    assert bl["captured_answers"] == 4  # non-null entries
    assert 0 <= bl["avg_eye_contact_pct"] <= 100
    assert 0 <= bl["avg_posture_score"] <= 100


def test_interview_submit_without_body_language_backward_compat(h):
    r = requests.post(f"{API}/interview/start", json={"role": "Data Analyst", "difficulty": "easy"}, headers=h, timeout=90)
    assert r.status_code == 200
    iv = r.json()
    answers = ["I have 3 years of SQL and Python experience analyzing customer data."] * len(iv["questions"])
    r2 = requests.post(f"{API}/interview/submit", json={
        "interview_id": iv["interview_id"],
        "answers": answers,
    }, headers=h, timeout=180)
    assert r2.status_code == 200, r2.text
    sc = r2.json()["scorecard"]
    # No body_language when not provided
    assert "body_language" not in sc, "body_language should be absent when not provided"
    # But speaking_assessment still present
    assert "speaking_assessment" in sc
