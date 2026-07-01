# TalentIQ - Product Requirements

## Original Problem
Build an AI career platform (TalentIQ) for job seekers & college students. Features requested: resume upload with ATS score, real-time resume rewriter (paste JD → get rewritten resume + PDF download), skill-based role fit + skills to learn, job suggestions, AI mock interview with scorecard PDF, interview history, roadmap, career advisor, resume compare, profile.

## User Choices
- AI: **Claude Sonnet 4.5** (claude-sonnet-4-5-20250929) via Emergent Universal LLM Key
- Auth: **JWT-based email/password**
- Resume formats: **PDF + DOCX**
- Design: Let design agent decide (neo-brutalist pastel)

## Architecture
- Backend: FastAPI + MongoDB + emergentintegrations (Claude Sonnet 4.5)
- Frontend: React 19 + Tailwind + shadcn/ui + lucide-react
- Auth: JWT (bcrypt password hash, 30-day tokens)
- PDF: reportlab (rewrite output), pypdf/python-docx (resume extraction)

## Phase 1 - Implemented (2026-02)
✅ JWT auth (signup, login, /auth/me, JWT-protected routes)
✅ Landing page — PREMIUM dark theme (ink black + amber gold #D4AF37, Cabinet Grotesk + Manrope + JetBrains Mono)
✅ Dashboard (9-feature bento grid; 5 live, 4 marked "Soon")
✅ Resume Analyzer: PDF/DOCX upload → Claude → ATS score dial, pros/cons, suggestions, score breakdown
✅ Real-Time Resume Rewriter: paste JD + resume → rewritten resume + match score before/after + keywords + PDF download
✅ Skills & Role Fit: skills tags → Claude → recommended roles + learning roadmap (vertical timeline)
✅ Job Matcher: AI-generated job matches with match scores
✅ Profile page (edit name, target role, view skills)

## Phase 2 - Implemented (2026-02)
✅ **AI Mock Interview** — /interview: role + difficulty → 5 AI-generated questions → text answers → scorecard (overall + 4 metrics: Communication, Technical, Confidence, Clarity) + strengths/improvements/next-steps
✅ **PDF Scorecard download** — /api/interview/scorecard/pdf
✅ **History timeline** — /history: 3 tabs for past resume analyses, rewrites, and interviews (persisted in MongoDB)
✅ **Cinematic intro splash** — framer-motion morphing 3D cube + text reveal (2.4s, session-cached)
✅ **3D floating hero shape** — rotating hexagonal glass prism behind ATS card
✅ **New palette** — Electric cyan (#22D3EE) + coral (#FB7185) on deep navy (#06060B)

## Phase 3 - Implemented (2026-02)
✅ **Voice-based Mock Interview** — MediaRecorder → Whisper (via Emergent key) transcription; Mic button on each question that appends transcribed text to the answer textarea
✅ **Career Roadmap deep-dive** (/roadmap) — 4-phase 12-month plan with milestones, skills, resources, success metrics, long-term vision, monthly habits, certifications, salary impact
✅ **Resume Compare** (/compare) — upload 2 PDFs → side-by-side scores + winner + strengths/weaknesses + best-of-both recommendation
✅ **Real Jobs via Remotive** — GET /api/jobs/real (free public API, no key). Jobs page now has 2 tabs: Real Jobs (Remotive) + AI Curated

## Phase 4 - Implemented (2026-02)
✅ **Save/Bookmark Jobs + Apply Tracker** — Bookmark icon on every job card → saves to DB. New /tracker page shows Kanban-style filter tabs (All / Bookmarked / Applied / Interviewing / Offered / Rejected) with inline status buttons per card. Full CRUD backend: /api/jobs/save, /api/jobs/saved, PUT /api/jobs/saved/{id}, DELETE /api/jobs/saved/{id}.
✅ **Real-time speaking assessment** — /api/interview/submit now returns `speaking_assessment` with avg_wpm (pace), filler_ratio, pace_score, clarity_score, per-question breakdown, and verdict. Frontend records per-question voice duration via MediaRecorder → sends `durations_sec[]` → shows speaking card on the scorecard with pace/fillers stats.
✅ Nav + Dashboard include the new Tracker route.

## Phase 5 - Implemented (2026-02)
✅ **Video Mock Interview (replaces voice-only)** — MediaPipe FaceLandmarker + PoseLandmarker run client-side (WASM/GPU), tracking eye-contact % (face blendshapes) and posture (shoulder tilt + lean + upright score) at ~5 fps. Live meters overlay the webcam preview during recording. Whisper still transcribes audio.
✅ **Body-language on Scorecard** — /api/interview/submit accepts `body_language[]` per question and returns `body_language` block on scorecard: avg_eye_contact_pct, avg_posture_score, presence_score, verdict.
✅ **LinkedIn Import (URL + Paste text)** — `POST /api/profile/linkedin-parse` takes LinkedIn URL + pasted profile text → Claude extracts { name, headline, target_role, skills, experience_summary }. `POST /api/profile/linkedin-apply` merges chosen fields (skills deduped case-insensitive). Profile page shows extract-review-approve UI with per-skill toggles + per-field checkboxes.
✅ User model now stores `linkedin_url`; returned by /auth/me, /auth/login, /auth/signup, /profile.

## Test Results
✅ LinkedIn parse + apply verified via curl (skills extracted + merged).
✅ Interview submit with `body_language` payload verified via curl (body_language block returned in scorecard).

## Phase 2 - Deferred
- P0: AI Mock Interview (voice/text) + Scorecard PDF (Communication, Technical, Confidence, Improvement)
- P0: Interview History
- P1: Career Roadmap deep-dive
- P1: Resume Compare (A/B two resumes)
- P1: Career Advisor chat
- P2: Google/Emergent social login
- P2: Real job board API integration (LinkedIn/Indeed)
- P2: Save/bookmark jobs

## Test Credentials
See `/app/memory/test_credentials.md`
