"""
Iteration 6 targeted regression:
- POST /api/interview/submit with body_language[] containing some null entries
  mixed with populated entries -> should still return proper scorecard.
  body_language block should only be present when at least one entry has
  non-zero eye_contact_pct or posture_score.
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
API = f"{BASE_URL.rstrip('/')}/api"

TS = int(time.time())
USER = {"name": "QA Iter6", "email": f"qa+iter6_{TS}@talentiq.dev",
        "password": "Password123!", "role": "student"}


@pytest.fixture(scope="module")
def h():
    r = requests.post(f"{API}/auth/signup", json=USER, timeout=30)
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}",
            "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def iv(h):
    r = requests.post(f"{API}/interview/start",
                      json={"role": "Software Engineer", "difficulty": "easy"},
                      headers=h, timeout=90)
    assert r.status_code == 200
    return r.json()


def test_submit_with_mixed_null_and_populated_body_language(h, iv):
    """Some nulls + some populated -> scorecard OK, body_language present."""
    qs = iv["questions"]
    answers = ["I have led teams building scalable backend systems using Python and AWS."] * len(qs)
    # Mix: null, populated, null, populated, populated
    body_language = [
        None,
        {"eye_contact_pct": 85, "posture_score": 80},
        None,
        {"eye_contact_pct": 78, "posture_score": 76},
        {"eye_contact_pct": 82, "posture_score": 79},
    ][:len(qs)]

    r = requests.post(f"{API}/interview/submit", json={
        "interview_id": iv["interview_id"],
        "answers": answers,
        "body_language": body_language,
    }, headers=h, timeout=180)
    assert r.status_code == 200, r.text
    sc = r.json()["scorecard"]

    # Body language block present with non-zero values (some entries populated)
    assert "body_language" in sc, "body_language block should be present when >=1 populated entry"
    bl = sc["body_language"]
    assert bl["captured_answers"] >= 1
    assert bl["avg_eye_contact_pct"] > 0
    assert bl["avg_posture_score"] > 0


def test_submit_with_all_null_body_language(h):
    """All nulls -> scorecard OK, body_language block absent."""
    r = requests.post(f"{API}/interview/start",
                      json={"role": "Data Scientist", "difficulty": "easy"},
                      headers=h, timeout=90)
    assert r.status_code == 200
    iv2 = r.json()
    qs = iv2["questions"]
    answers = ["I work on ML pipelines using PyTorch and cloud infra."] * len(qs)
    body_language = [None] * len(qs)

    r2 = requests.post(f"{API}/interview/submit", json={
        "interview_id": iv2["interview_id"],
        "answers": answers,
        "body_language": body_language,
    }, headers=h, timeout=180)
    assert r2.status_code == 200, r2.text
    sc = r2.json()["scorecard"]
    assert "body_language" not in sc, "body_language should be absent when all entries are null"


def test_submit_with_all_zero_body_language(h):
    """All zeros -> body_language absent (filter is >0 not is-not-None)."""
    r = requests.post(f"{API}/interview/start",
                      json={"role": "PM", "difficulty": "easy"},
                      headers=h, timeout=90)
    assert r.status_code == 200
    iv3 = r.json()
    qs = iv3["questions"]
    answers = ["I ship product roadmaps and align stakeholders across teams."] * len(qs)
    body_language = [{"eye_contact_pct": 0, "posture_score": 0}] * len(qs)

    r2 = requests.post(f"{API}/interview/submit", json={
        "interview_id": iv3["interview_id"],
        "answers": answers,
        "body_language": body_language,
    }, headers=h, timeout=180)
    assert r2.status_code == 200, r2.text
    sc = r2.json()["scorecard"]
    assert "body_language" not in sc, "body_language absent when all entries have 0/0"
