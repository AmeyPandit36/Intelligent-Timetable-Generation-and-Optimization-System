# Orbit — Intelligent College Timetable Generation & Optimization

Orbit is a full-stack scheduling workspace for higher-education institutions. It models a college's academic hierarchy, faculty teaching rights and workload, campus resources, availability, teaching requirements, and institutional preferences; then produces conflict-free timetables with Google OR-Tools CP-SAT.

> **Architecture boundary:** the conversational assistant can translate and explain policy intent, but it does not allocate timetable slots. All assignments are produced and validated by deterministic solver code.

## What is included

- A responsive React administration workspace with 11 functional views:
  - command center and setup-readiness reporting;
  - academic hierarchy manager;
  - faculty workload, eligibility, and availability studio;
  - campus infrastructure and capability manager;
  - teaching-requirement registry;
  - policy and objective-weight studio;
  - CP-SAT generation console;
  - timetable grid with drag-and-drop move validation;
  - bottleneck diagnostics;
  - bulk import/export workflow;
  - tool-bounded conversational policy assistant.
- An Express/TypeScript API with Zod-validated routes, generation preflight checks, policy actions, move validation, solver dispatch, and representative institutional seed data.
- A Python FastAPI optimization microservice with:
  - weekly requirement expansion;
  - contiguous multi-period candidate generation;
  - capacity, room type, capability, and active-resource filtering;
  - room, faculty, division/batch, and combined-cohort non-overlap;
  - faculty hard blackouts;
  - **faculty subject eligibility and weekly workload caps**;
  - CP-SAT optimization and a pure-Python exact backtracking fallback;
  - independent post-generation validation and bottleneck diagnostics.
- A normalized PostgreSQL/Prisma schema, initial SQL migration, and sample seed script.
- Docker definitions for PostgreSQL, FastAPI, Express, and the web client.
- TypeScript API/web tests and Python solver tests.

## System architecture

```text
Browser
  │ relative /api requests
  ▼
React + Vite ───────────────┐
  │                         │
  ▼                         │
Express API Gateway         │
  ├── Zod validation        │
  ├── workload/eligibility preflight
  ├── policy tools          │
  ├── schedule versioning   │
  └── solver client         │
          │ complete immutable JSON snapshot
          ▼                 │
FastAPI optimization service│
  ├── session builder       │
  ├── candidate filters     │
  ├── OR-Tools CP-SAT       │
  ├── exact fallback        │
  └── independent validator │
          │                 │
          └──── PostgreSQL / Prisma
```

## Repository layout

```text
apps/
  api/                  Express + TypeScript API
  web/                  React + Vite administration UI
prisma/
  schema.prisma         Complete relational domain model
  migrations/           PostgreSQL migration history
  seed.ts               Pilot seed dataset
solver/
  main.py               FastAPI service boundary
  cpsat_solver.py       CP-SAT and exact fallback formulations
  eligibility.py        Faculty teaching-right constraints
  workload.py           Weekly workload caps
  candidates.py         Time-block and resource candidates
  session_builder.py    Requirement expansion
  validation.py         Independent schedule validator
  diagnostics.py        Actionable bottleneck analysis
tests/                  Python solver tests
infra/                   Production Nginx configuration
```

## Local development

### Prerequisites

- Node.js 20 or newer
- Python 3.11 or newer
- PostgreSQL 15 or newer (only needed for persistence/migration work)

### 1. Install JavaScript dependencies

```bash
npm install
```

### 2. Install the Python solver

```bash
python3 -m venv .venv
.venv/bin/pip install -r solver/requirements.txt
```

### 3. Configure the environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` to a reachable PostgreSQL database.

### 4. Apply and seed the database

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

For active schema development, use `npm run prisma:migrate` instead of `prisma:deploy`.

### 5. Start the services

In one terminal:

```bash
.venv/bin/uvicorn solver.main:app --host 0.0.0.0 --port 8000 --reload
```

In another terminal:

```bash
npm run dev
```

- Web: `http://localhost:5173`
- Express API: `http://localhost:4000`
- FastAPI/OpenAPI: `http://localhost:8000/docs`

The Vite development server proxies browser `/api` calls to Express. Browser code never depends on a localhost service URL directly.

## Docker startup

```bash
docker compose up --build
```

Open `http://localhost:8080`. The compose stack includes PostgreSQL, the solver, API, and Nginx-served web app.

## Phase 7: workload and eligibility

Phase 7 is implemented across both persistence and solving layers:

- `Faculty.maxWeeklyWorkload` stores the maximum assignable weekly hours.
- `FacultyEligibility` uniquely maps a faculty member to an approved subject, with proficiency, primary-instructor, and validity metadata.
- `validate_faculty_eligibility()` rejects unknown or unapproved faculty/subject mappings before search.
- `validate_workload_caps()` reports aggregate requirement hours above a faculty cap before candidate generation.
- `add_eligibility_constraints()` and `add_workload_cap_constraints()` also encode the rules directly into CP-SAT. Workload coefficients use integer minutes for CP-SAT compatibility.
- The independent validator checks the same rules after solving.

API rejections use actionable codes:

- `FACULTY_INELIGIBLE`
- `WORKLOAD_CAP_EXCEEDED`
- `SCHEDULE_INFEASIBLE`

## Verification

```bash
npm run typecheck        # API and web TypeScript
npm test                 # API and web tests
.venv/bin/python -m pytest tests -q
npm run build            # production builds
```

The Python suite includes acceptance coverage for:

- workload calculation from duration and frequency;
- rejection above a weekly workload cap;
- acceptance exactly at the cap;
- rejection of faculty without subject eligibility;
- continuous multi-period candidates and blackout filtering;
- capacity, resource type, capability, and active-resource filtering.

## Main API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/dashboard` | Readiness and latest-run overview |
| `GET` | `/api/faculty` | Faculty, eligibility, workload, availability |
| `GET` | `/api/resources` | Campus scheduling resources |
| `GET/POST` | `/api/policies` | Policy registry and creation |
| `PATCH` | `/api/policies/:id/toggle` | Enable or pause a policy |
| `POST` | `/api/schedule/generate` | Validated generation workflow |
| `POST` | `/api/schedule/solve` | Forward a full snapshot to FastAPI |
| `POST` | `/api/schedule/validate-move` | Revalidate a manual grid edit |
| `POST` | `/api/agent/interpret` | Translate text into a reviewable policy proposal |
| `POST` | `/schedule` (FastAPI) | Deterministic CP-SAT schedule endpoint |

## Production notes

The included workspace uses representative data so the complete UX can be evaluated without onboarding a live institution. Before a real college pilot:

1. connect the Express repositories to the generated Prisma client;
2. configure institutional identity and RBAC middleware;
3. persist asynchronous generation jobs and timetable versions;
4. use object storage for uploaded workbooks and generated exports;
5. configure an approved LLM provider behind the existing confirmation-based tool boundary;
6. run a full dataset through independent validation and performance benchmarks.

The solver receives self-contained generation snapshots by design, preventing live database drift during a run.
