# Praxis360

**From Feedback to Improvement.**

Praxis360 is an AI-powered university platform that transforms assessment feedback, student voice, and teaching evaluation into measurable action and improvement.

This repository contains a working MVP built with Next.js 14, TypeScript, Prisma, and Tailwind CSS.

## What's inside

- **Landing page** and **role-based sign-in**
- **Student**: dashboard, assessments, feedback with AI explanation, learning recovery, raise-an-issue (with AI classification + routing), issue tracking + verification, teaching evaluations, You Said → We Did, notifications
- **Lecturer**: dashboard, courses, assessments, digital marking workspace with AI feedback quality (TUAA), students at risk, analytics, teaching evaluation results (post-close), notifications
- **Department Officer**: cases dashboard, case management with timeline, resolution, escalation, and student verification loop
- **Quality Assurance**: Academic & Student Experience Intelligence Dashboard, per-domain analytics (feedback, evaluations, voice, learning), institutional action tracker with publish → You Said → We Did
- **System Administrator**: users, faculties/departments, courses, academic calendar, evaluation questions, routing rules

## Tech stack

- Next.js 14 (App Router, Server Actions)
- TypeScript
- Prisma ORM (SQLite locally; schema compatible with PostgreSQL)
- Tailwind CSS
- bcryptjs + jose (JWT session cookie)

## Getting started

```bash
cd praxis360-app
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Demo accounts

All demo accounts share the password `password123`.

| Role                | Email                          |
| ------------------- | ------------------------------ |
| Student             | student@umi.ac.ug         |
| Lecturer            | lecturer@umi.ac.ug        |
| Department Officer  | ict@umi.ac.ug             |
| Quality Assurance   | qa@umi.ac.ug              |
| Administrator       | admin@umi.ac.ug           |

Additional service department officers seeded: `library@`, `finance@`, `registrar@`, `welfare@` (all `@umi.ac.ug`).

## AI configuration

Praxis360 uses a small AI service abstraction (`src/lib/ai.ts`) exposing:

- `AIService.analyzeFeedback(feedback)` — TUAA feedback quality
- `AIService.explainFeedback(feedback)` — Student "Understand My Feedback"
- `AIService.classifyIssue(title, description)` — Student voice classification & routing
- `AIService.extractEvaluationThemes(comments)` — Evaluation NLP themes
- `AIService.generateQAInsights(stats)` — QA institution-wide insights

Set `AI_PROVIDER` and `AI_API_KEY` in `.env` to plug in a real model provider. If they are unset (default), Praxis360 uses deterministic demo fallbacks so the platform never breaks during a demo.

## Demo walkthrough

1. Sign in as **Ada Nakato** (`student@umi.ac.ug`).
2. Open the released feedback for **Coursework 1: Requirements Document** (42%). See the AI **Understand My Feedback** explanation and the rubric breakdown.
3. Go to **Learning Recovery**. Complete the correction activity for **Requirements Analysis**. The gap moves to **RECOVERED** with a before/after (42% → recovered score).
4. Go to **Raise an Issue** and enter "The Wi-Fi in the library hasn't worked properly for the last three days." Click **AI: classify my issue** — it categorises as ICT / Connectivity / Library and routes to ICT.
5. Sign out and sign in as `ict@umi.ac.ug`. Open the ICT case, mark it In Progress, add a student update, then **Resolve**.
6. Sign back in as the student, find the issue under **My Issues**, and confirm the resolution.
7. Sign in as `qa@umi.ac.ug` to see the intelligence dashboard, then open **Institutional Actions**, create or edit an entry, and click **Publish**. It appears immediately on the student's **You Said → We Did** feed.

## Closed loops

- **Academic feedback**: Assess → Give Feedback → Understand → Act → Verify → Improve
- **Student voice**: Raise → Categorize → Route → Act → Communicate → Verify → Improve
- **Teaching evaluation**: Evaluate → Analyze → Identify → Act → Communicate → Improve

## Known MVP limitations

- SQLite is used for local demo; production would run on PostgreSQL (schema is compatible).
- Charts are rendered as progress bars and grouped counts; a richer chart library can be plugged in later.
- Report export to PDF/CSV is stubbed — interactive report pages are functional.
- AI provider is a deterministic fallback unless real credentials are configured.
- Real-time notifications use in-app polling on navigation (no WebSockets in the MVP).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build (also runs `prisma generate`)
- `npm run db:push` — apply Prisma schema to SQLite
- `npm run db:seed` — reseed demo data
- `npm run db:reset` — drop, push, and reseed
