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
✅ Landing page (neo-brutalist hero, marquee, features bento, CTA)
✅ Dashboard (9-feature bento grid; 5 live, 4 soon)
✅ Resume Analyzer: PDF/DOCX upload → Claude → ATS score, pros/cons, suggestions, skills, score breakdown
✅ Real-Time Resume Rewriter: paste JD + resume → rewritten resume + match score before/after + keywords + PDF download
✅ Skills & Role Fit: add skills → Claude → recommended roles + fit scores + skills to learn + learning roadmap
✅ Job Matcher: uses skills + resume → AI-generated job matches with match scores
✅ Profile page (edit name, target role, view skills)

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
