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

## Test Results
✅ iteration_1: 100% Phase 1 pass (auth + resume + rewriter + skills + jobs + profile)
✅ iteration_2: 100% Phase 2 pass (interview flow + scorecard PDF + history + regressions)

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
