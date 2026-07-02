# Leave Hub — Employee Leave Management System

A full-stack MVP for digitizing employee leave requests: employees apply, track, edit, and cancel leave; managers review, approve, or reject with comments. Built as a technical assessment with production-grade practices — clean architecture, validation, RBAC, tests, and CI.

## Tech stack

| Layer     | Choice                                              |
|-----------|------------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS + React Router        |
| Backend   | Node.js + Express                                    |
| Database  | SQLite (via Node's built-in `node:sqlite`)            |
| Auth      | JWT (stateless), bcrypt password hashing              |
| Validation| Zod (backend), controlled-form validation (frontend)  |
| Docs      | Swagger/OpenAPI (`/api/docs`) + Postman collection    |
| Testing   | Jest + Supertest (21 tests, backend)                  |
| Ops       | Docker + Docker Compose, GitHub Actions CI            |

SQLite was chosen over Postgres/MySQL to keep the assessment runnable with zero external services — no DB server to install, no connection strings to configure. The schema (see below) is fully normalized and would port to Postgres with minimal changes if this went to production.

## Project structure

```
leave-management/
├── backend/
│   ├── src/
│   │   ├── controllers/     # request handlers, one file per resource
│   │   ├── routes/          # route tables + Swagger JSDoc annotations
│   │   ├── middlewares/     # auth (JWT), error handling
│   │   ├── db/               # schema, seed script, DB connection
│   │   ├── utils/            # JWT helpers, Zod validators
│   │   └── app.js / server.js
│   ├── tests/                # Jest + Supertest suites
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/employee/   # Dashboard, ApplyLeave, LeaveHistory, LeaveDetails, Profile
│   │   ├── pages/manager/    # Dashboard, PendingApprovals, Employees, Profile
│   │   ├── components/       # AppLayout, Navbar, StatCard, StatusBadge, Modal, Spinner
│   │   ├── context/          # AuthContext (login/logout, token persistence)
│   │   └── api/client.js     # axios instance, auto-attaches JWT, force-logout on 401
│   └── Dockerfile
├── docker-compose.yml
├── postman_collection.json
└── .github/workflows/ci.yml
```

## Database schema

Two tables, normalized, with a foreign key and indexes on the columns actually queried (`employee_id`, `status`, `leave_type`, `email`):

```
employees(employee_id PK, name, email UNIQUE, password, department, role, created_at, updated_at)
leaves(leave_id PK, employee_id FK→employees, leave_type, start_date, end_date, reason,
       status, manager_comments, created_at, updated_at)
```

`status` is one of `PENDING | APPROVED | REJECTED | CANCELLED`. Cancelling a leave is a **soft status change**, not a delete — this preserves an audit trail, which matters the moment anyone asks "how many leave days has this person taken this year."

## Getting started (local, no Docker)

Requires **Node.js 22.5+** (uses the built-in `node:sqlite` module).

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run seed      # creates demo users, idempotent — safe to re-run
npm run dev        # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173, proxies /api to :5000
```

**Demo credentials** (also printed by `npm run seed`):
| Role     | Email               | Password       |
|----------|---------------------|----------------|
| Manager  | manager@demo.com    | Manager@123    |
| Employee | employee@demo.com   | Employee@123   |

## Getting started (Docker)

```bash
docker compose up --build
```
Frontend: `http://localhost:8080` · Backend: `http://localhost:5000` · Swagger: `http://localhost:5000/api/docs`

The backend container seeds demo data on boot (seed is idempotent, so restarts don't duplicate rows). SQLite data persists in the `backend-data` named volume.

## API documentation

- **Interactive Swagger UI:** `GET /api/docs` while the backend is running — generated from JSDoc annotations directly on the route files, so it can't drift out of sync with the code.
- **Postman collection:** `postman_collection.json` at the repo root. Import it, run "Login (Employee)" or "Login (Manager)" first — a test script auto-saves the JWT into a collection variable so every other request is pre-authenticated.

### Endpoint summary

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/employees` | Manager |
| GET | `/api/employees/:id` | Self or Manager |
| POST | `/api/leaves` | Employee |
| GET | `/api/leaves` | Employee (own) |
| GET | `/api/leaves/:id` | Owner or Manager |
| PUT | `/api/leaves/:id` | Owner, PENDING only |
| DELETE | `/api/leaves/:id` | Owner, PENDING only (soft-cancel) |
| GET | `/api/dashboard/employee` | Employee |
| GET | `/api/manager/pending-leaves` | Manager |
| PUT | `/api/manager/leaves/:id/approve` | Manager, PENDING only |
| PUT | `/api/manager/leaves/:id/reject` | Manager, PENDING only, comment required |
| GET | `/api/manager/employees/:id/leaves` | Manager |
| GET | `/api/manager/dashboard` | Manager |

## Authentication & authorization

- Stateless JWT (`Authorization: Bearer <token>`), 1-hour expiry by default (`JWT_EXPIRES_IN` in `.env`).
- `requireAuth` middleware verifies the token and attaches `req.user = { employee_id, email, role }`.
- `requireRole('MANAGER')` middleware gates manager-only routes — employees get a `403 Forbidden`, not a silent empty result.
- Ownership checks happen in controllers (e.g. an employee can `PUT /leaves/:id` only if `leave.employee_id === req.user.employee_id`) — role alone isn't sufficient authorization for per-record actions.
- Frontend: `ProtectedRoute` redirects unauthenticated users to `/login`, and redirects mismatched roles to their own dashboard rather than showing a blank/broken page.

## Validation & error handling

- **Backend:** Zod schemas validate every write endpoint (leave type enum, valid dates, start ≤ end, reason length). Validation failures return `400` with per-field messages; a shared error handler maps Zod errors, ownership violations (`403`), missing records (`404`), and state conflicts like editing an already-approved leave (`409`) to consistent JSON shapes.
- **Frontend:** every form validates client-side before submitting (email format, required fields, date ordering, minimum reason length) and surfaces both field-level errors and a server-error banner if the API rejects the request.

## Testing

```bash
cd backend
npm test
```

21 tests across 3 suites (`tests/auth.test.js`, `tests/leaves.test.js`, `tests/manager.test.js`), run against an isolated SQLite file (`DB_PATH` overridden to `./src/db/test.sqlite` via the `test` script) so it never touches your dev data. Coverage includes: login success/failure, missing-token rejection, leave creation validation, ownership enforcement (403s), status-transition rules (409s on editing/approving non-PENDING leaves), the reject-requires-comment rule, and RBAC on manager routes.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: installs backend deps and runs the Jest suite, and separately installs frontend deps and runs `vite build` to catch build breaks. Two independent jobs so a frontend build failure doesn't hide a backend test failure or vice versa.

## Design notes (for the write-up / interview)

- **Soft-cancel over hard-delete** for leave records — audit trail matters more than tidiness here.
- **Reject requires a comment, approve doesn't** — rejecting without explanation is bad UX and bad management practice; the API enforces it, not just the UI.
- **Ownership checks live in controllers, not just route guards** — role-based middleware answers "can this role hit this endpoint," but "can this specific user touch this specific record" needs the record loaded first.
- **Design system, not default Tailwind gray** — deep teal accent, status colors (amber/red/teal/grey) chosen for at-a-glance scanability on a dashboard, Manrope/Inter type pairing for a professional-but-not-generic feel.
- **SQLite for the assessment, schema ready for Postgres** — no infra to stand up to review this, but the normalized schema and parameterized queries carry over directly.

## Git workflow

This repo was built incrementally with one commit per milestone:

```bash
git init
git add .
git commit -m "Initial project setup: backend scaffold, DB schema, JWT authentication"
git commit -m "Develop leave management APIs: apply, edit, cancel, history, dashboard"
git commit -m "Implement approval workflow: manager pending list, approve/reject, employee history, dashboard"
git commit -m "Build responsive dashboard shell: frontend scaffold, auth context, protected routing, login page"
git commit -m "Build employee and manager pages: dashboards, apply/edit/cancel, approvals, employee search"
git commit -m "Add tests, Docker, CI, Postman collection, and documentation"
```

## What's next (out of scope for the MVP)

- Refresh tokens / rotating JWTs (current setup is short-lived access tokens only)
- Leave balance tracking (days remaining per type per employee)
- Email notifications on approve/reject
- Postgres migration for multi-instance deployment
