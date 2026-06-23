# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Servi Elec Manager** is a web app for managing electrical service projects, inventory, and field technicians. Built for **Avercio Zamora** (company: Servi Elec, Chile). It consists of three components:

- `Producto/frontend/` — React SPA
- `Producto/backend/ms-gestion/` — Main REST API (FastAPI + PostgreSQL)
- `Producto/backend/ms-chatbot/` — WhatsApp chatbot microservice (FastAPI, stateless)

## Team & Branches

| Branch | Owner | Role |
|---|---|---|
| `ramabenja` | Benjamín | PO / tech lead / backend — **deployed to AWS** |
| `ramaesteban` | Esteban | SM / docs |
| `ramahans` | Hans | Frontend / QA |

`ramabenja` is the active production branch. `main` is not deployed. PRs target each member's own branch; coordinate merges manually.

## Commands

### Frontend (`Producto/frontend/`)
```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build
npm run lint       # ESLint check
npm run preview    # Preview production build
```

### Backend — ms-gestion (`Producto/backend/ms-gestion/`)
```bash
# First time
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt

# Run
uvicorn app.main:app --reload   # API at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Backend — ms-chatbot (`Producto/backend/ms-chatbot/`)
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Docker (from each service directory)
```bash
docker build -t ms-gestion .
docker run -p 8000:8000 --env-file .env ms-gestion
```

## Architecture

### Request Flow
```
Browser → React (Vite SPA)
            ↓ REST (JWT in Authorization header)
         ms-gestion (FastAPI) — port 8000
            ↓ SQLAlchemy ORM
         PostgreSQL (prod) / SQLite (dev fallback)

WhatsApp (+1 555 646 7446) → ms-chatbot (FastAPI)
                                  ↓ httpx
                              ms-gestion REST API
```

### Backend Layer Pattern (ms-gestion)
Each domain follows: `routes/ → controllers/ → services/ → models/`

- **routes/** — FastAPI routers; declare endpoints, inject auth dependencies (`get_current_user`, `require_admin`, `require_superadmin`)
- **controllers/** — thin delegation layer between routes and services
- **services/** — all business logic (ORM queries, validation, state transitions)
- **models/** — SQLAlchemy ORM models + Pydantic schemas

### Frontend Structure
- `src/pages/` — one file per page/route
- `src/components/` — reusable UI components
- `src/services/api.js` — all API calls (Axios); base URL hardcoded to `http://98.95.225.248:8000`
- `src/routes/AppRoutes.jsx` — route definitions; `AppLayout` wraps protected routes and checks JWT

## Key Domain Concepts

**Roles**: `S` (SuperAdmin) and `A` (Administrador) — only two roles, stored as single char in DB

**User states**: `pendiente` → `aprobado`. New registrations start as `pendiente` and are blocked from logging in until a SuperAdmin approves them from the **Solicitudes** screen. This is intentional — no self-activation.

**Project states**: `pendiente` → `en_curso` → `finalizado` / `cancelado`

**Materials** have `stock_actual` and `stock_critico` (the critical/minimum threshold column — not `stock_minimo`), and belong to a `Categoria`

**Plantillas** (service templates) contain suggested materials with quantities; they can be applied to a project to pre-fill required materials

**Movimientos** record every stock change (type: `entrada` / `salida`) with timestamps

## Timezone Fix

Dates from the API are stored as plain `YYYY-MM-DD` strings (no time, no TZ). When displaying them in the frontend, always parse as `new Date(year, month-1, day)` (local constructor) — **never** `new Date(dateString)` directly, which interprets the string as UTC midnight and shows the previous day in Chile (UTC-4/UTC-3).

## Production Infrastructure (AWS)

| Resource | Value |
|---|---|
| EC2 IP | `98.95.225.248` |
| RDS endpoint | `servielec-db.ciusjsyr00zj.us-east-1.rds.amazonaws.com` |
| WhatsApp bot number | `+1 555 646 7446` |
| Meta webhook verify token | `servielec_verify_2026` |

**Cloudflare Quick Tunnel**: `cloudflared` runs as a `systemd` service on EC2 with autostart. To get the current public tunnel URL, run the alias `url-tunel` on the EC2 instance (it queries the local cloudflared API and prints the URL). The tunnel URL changes on each restart.

## Environment Variables

Both backends require a `.env` file (not committed). See `.env.example` in each service:

- **ms-gestion**: `DATABASE_URL`, `JWT_SECRET` (hardcoded fallback exists in `app/utils/auth.py` — don't rely on it)
- **ms-chatbot**: `MS_GESTION_URL`, `MS_GESTION_TOKEN`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `VERIFY_TOKEN`, `SESSION_TTL_MINUTES`

## Database

- Dev: SQLite (`servielec_test.db`) auto-created by SQLAlchemy on startup
- Prod: PostgreSQL on AWS RDS (see endpoint above)
- Schema SQL lives in `ms-gestion/db_scripts/` (01 = schema, 02–07 = seed/migrations)
- No migration tool (Alembic) — schema changes require manual SQL scripts added to `db_scripts/`

## Auth

JWT (HS256), 43200 min expiry for bot tokens. Token payload: `sub` (user_id), `rol`, `exp`. Frontend stores token in `localStorage`.

## CORS

ms-gestion allows specific origins (localhost:5173 and the production EC2 IP). When adding a new frontend origin, update `origins` list in `ms-gestion/app/main.py`.
