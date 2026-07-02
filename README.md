# Leave Hub — Employee Leave Management System

**A full-stack MVP that replaces manual, spreadsheet-driven leave tracking with a role-aware web application for employees and managers.**

## Table of Contents

- [Introduction](#introduction)
- [Objectives](#objectives)
- [Summary](#summary)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Implementation Details](#implementation-details)
- [Results](#results)
- [Installation](#installation)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [Acknowledgment of AI-Assisted Development](#acknowledgment-of-ai-assisted-development)
- [License](#license)
- [Contact](#contact)

## Introduction

Organizations that manage employee leave through email threads and spreadsheets run into predictable problems: approvals get lost, duplicate requests go unnoticed, and neither employees nor managers have a single source of truth for who is out and when. Leave Hub addresses this by centralizing the entire leave lifecycle — submission, review, approval or rejection with comments, and historical reporting — behind a role-based web interface backed by a REST API.

The system is built as a technical assessment MVP, but follows the same architectural discipline expected of a production service: normalized schema, stateless authentication, server-side authorization enforced per-record (not just per-role), and a documented, tested API.

## Objectives

- Provide secure, role-based authentication (Employee / Manager) using JWTs.
- Allow employees to submit, edit, cancel, and track leave requests through defined status transitions.
- Allow managers to review, approve, or reject requests with mandatory justification on rejection.
- Enforce authorization at the record level, not just the route level (an employee cannot edit another employee's request even with a valid token).
- Deliver a normalized relational schema that scales cleanly from SQLite (used here) to a server-based RDBMS.
- Document every endpoint with both interactive (Swagger) and importable (Postman) references.
- Cover core business rules with automated tests and enforce them in continuous integration.

## Summary

Leave Hub is a two-role system. Employees authenticate, land on a dashboard summarizing their leave totals, and can apply for leave through a validated form. Every request starts as `PENDING` and can be edited or cancelled only while it remains in that state — once a manager acts on it, the record becomes an immutable part of the audit trail via a soft status change rather than deletion. Managers see an organization-wide dashboard, a queue of pending requests they can approve or reject (rejection requires a comment), and can search employees to inspect anyone's leave history. The backend is a modular Express API with Zod-based validation and centralized error handling; the frontend is a React single-page application with protected, role-aware routing and a component library shared across both employee and manager views.

## Features

### Authentication & Authorization
- Email/password login issuing a JWT (1-hour expiry, configurable)
- Role-based access control (`EMPLOYEE`, `MANAGER`) enforced via middleware
- Per-record ownership checks (a user can only modify their own leave requests)
- Protected frontend routes that redirect unauthenticated users to login and mismatched roles to their own dashboard
- Stateless logout (client-side token disposal) and automatic forced logout on token expiry (HTTP 401)

### Employee Capabilities
- Dashboard with total, approved, pending, and rejected request counts, plus recent activity
- Apply for leave with client- and server-side validation (date ordering, minimum reason length, leave-type enum)
- Edit or cancel a request while it is still `PENDING`
- Search and filter leave history by status, type, and free-text reason search
- View full detail of any individual request, including manager comments

### Manager Capabilities
- Organization-wide dashboard: total employees, pending approvals, approved/rejected counts, recent activity
- Queue of pending requests with search (by employee name/email) and leave-type filtering
- Approve requests with an optional comment, or reject with a **required** comment
- Search the employee directory and drill into any individual's complete leave history

### Engineering Quality
- Centralized error handling mapping validation, ownership, not-found, and state-conflict errors to consistent HTTP status codes (400/401/403/404/409)
- Rate limiting on the API surface
- Automated test suite (Jest + Supertest) covering authentication, ownership, and status-transition rules
- CI pipeline running the backend test suite and the frontend production build on every push
- Containerized deployment via Docker Compose

## Technologies Used

**Programming Languages**
- JavaScript (ES2022+, Node.js runtime and browser)

**Backend**
- Node.js, Express.js
- Zod (schema validation)
- jsonwebtoken, bcryptjs (authentication)
- helmet, cors, express-rate-limit, morgan (security & logging middleware)

**Frontend**
- React 18, React Router
- Vite (build tooling)
- Tailwind CSS (design system)
- Axios (HTTP client with interceptors)

**Database**
- SQLite via Node's native `node:sqlite` module (zero external dependencies; schema is portable to PostgreSQL/MySQL)

**API Documentation**
- Swagger / OpenAPI 3.0 (served live at `/api/docs`)
- Postman Collection (`postman_collection.json`)

**Testing**
- Jest, Supertest

**Deployment & DevOps**
- Docker, Docker Compose
- Nginx (frontend static serving + API reverse proxy in production)
- GitHub Actions (CI)

**Security**
- Bcrypt password hashing
- JWT-based stateless authentication
- HTTP security headers via Helmet
- Rate limiting on API routes
- Input validation on every write endpoint

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
# System Architecture

The application uses a standard three-tier architecture, separating the presentation, business logic, and data layers.

```text
┌──────────────────────────┐
│      Frontend Layer      │
│──────────────────────────│
│ React SPA                │
│ • Vite                   │
│ • Tailwind CSS           │
└─────────────┬────────────┘
              │
              │ HTTPS (JSON)
              │ JWT Authentication
              ▼
┌──────────────────────────┐
│      Backend Layer       │
│──────────────────────────│
│ Express REST API         │
│ • Node.js                │
│ • Authentication         │
│ • Business Logic         │
└─────────────┬────────────┘
              │
              │ SQL Queries
              ▼
┌──────────────────────────┐
│      Database Layer      │
│──────────────────────────│
│ SQLite                   │
│ • 2 Relational Tables    │
│ • Persistent Storage     │
└──────────────────────────┘
```

## Frontend

The frontend is implemented as a **React Single-Page Application (SPA)** using **Vite** and **Tailwind CSS**.

- `AuthContext` manages the authentication session and persists the JWT.
- `ProtectedRoute` restricts access to authenticated users and enforces role-based authorization.
- A shared Axios instance automatically attaches the JWT to every request and logs users out when a **401 Unauthorized** response is received.

## Backend

The backend follows a layered architecture built with **Express** and **Node.js**.

- **Routes** define the REST API endpoints and contain Swagger documentation.
- **Controllers** implement the application's business logic.
- **Middlewares** provide cross-cutting functionality such as authentication, error handling, and rate limiting.
- A lightweight **database module** encapsulates all SQL operations using prepared statements.

## Database

The application uses **SQLite** as its relational database.

- The schema consists of **two normalized tables**.
- **Foreign key constraints** maintain referential integrity.
- **Indexes** are created on all columns frequently used in `WHERE` clauses or `JOIN` operations to improve query performance.
- **Frontend** is a single-page application. `AuthContext` owns session state and persists the JWT; `ProtectedRoute` gates access by authentication and role; an Axios instance auto-attaches the token and force-logs-out on 401 responses.
- **Backend** follows a layered structure: routes define the HTTP surface and Swagger annotations, controllers hold business logic, middlewares handle cross-cutting concerns (auth, error formatting, rate limiting), and a thin database module exposes prepared statements.
- **Database** is intentionally minimal — two normalized tables with foreign-key and index coverage on every column used in a `WHERE` or `JOIN` clause.

## Database Schema

```
employees
|-- employee_id   PK, AUTOINCREMENT
|-- name          TEXT NOT NULL
|-- email         TEXT NOT NULL UNIQUE
|-- password      TEXT NOT NULL   (bcrypt hash)
|-- department    TEXT NOT NULL
|-- role          TEXT NOT NULL   CHECK IN ('EMPLOYEE','MANAGER')
|-- created_at    TEXT NOT NULL
`-- updated_at    TEXT NOT NULL

leaves
|-- leave_id           PK, AUTOINCREMENT
|-- employee_id        FK -> employees.employee_id (ON DELETE CASCADE)
|-- leave_type         TEXT NOT NULL  CHECK IN ('SICK','CASUAL','EARNED','UNPAID')
|-- start_date         TEXT NOT NULL
|-- end_date           TEXT NOT NULL
|-- reason             TEXT NOT NULL
|-- status             TEXT NOT NULL  CHECK IN ('PENDING','APPROVED','REJECTED','CANCELLED')
|-- manager_comments   TEXT
|-- created_at         TEXT NOT NULL
`-- updated_at         TEXT NOT NULL
```

Indexes exist on `leaves.employee_id`, `leaves.status`, `leaves.leave_type`, and `employees.email` — the four columns every filtered query in the API actually touches. Cancellation is implemented as a status transition (`CANCELLED`), not a row deletion, preserving a complete audit trail for future reporting features.

## Implementation Details

- **Validation** is schema-driven on the backend using Zod: every write endpoint (`POST /leaves`, `PUT /leaves/:id`, `PUT /manager/leaves/:id/reject`, etc.) parses and rejects malformed input before it reaches business logic, with per-field error messages surfaced to the client.
- **Authorization** happens in two layers: `requireRole` middleware blocks role-inappropriate requests before they reach a controller (HTTP 403), while controllers additionally check record ownership (e.g., `leave.employee_id === req.user.employee_id`) since role alone doesn't determine access to a specific row.
- **State machine enforcement**: leave requests can only be edited, cancelled, approved, or rejected while `status === 'PENDING'`; any other attempt returns HTTP 409 with a descriptive message.
- **Rejection requires justification**: the reject endpoint returns HTTP 400 if `manager_comments` is empty — a business rule enforced at the API layer, not just the UI, so it can't be bypassed by a direct API call.
- **Frontend state** is managed with React Context (`AuthContext`) for session data and local component state for page-level data fetching — no external state library was needed at this scope.

## Results

The automated suite (`npm test` in `backend/`) covers 21 test cases across authentication, leave lifecycle, and manager workflows:

| Area | Cases | Coverage |
|---|---|---|
| Authentication | 5 | Valid login, invalid email, invalid password, malformed input, missing-token rejection |
| Employee leave lifecycle | 9 | Apply (valid + invalid date/reason), list with ownership isolation, filtering, edit, cancel, edit-after-cancel conflict |
| Manager workflow | 7 | RBAC enforcement, pending list, reject without comment (400), reject with comment, approve, double-approve conflict (409), dashboard totals |

All 21 tests pass consistently, and both the backend test suite and the frontend production build (`vite build`) are enforced on every push via GitHub Actions.

## Installation

Requires **Node.js 22.5 or later** (uses the built-in `node:sqlite` module — no separate database server to install).

```bash
# 1. Clone the repository
git clone <your-repository-url>
cd leave-management

# 2. Backend setup
cd backend
cp .env.example .env
npm install
npm run seed      # creates demo accounts - safe to re-run, skips if data exists
npm run dev        # starts on http://localhost:5000

# 3. Frontend setup (in a new terminal)
cd frontend
npm install
npm run dev          # starts on http://localhost:5173, proxies /api to :5000
```

**Environment variables** (`backend/.env`, see `.env.example`):

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `5000` |
| `DB_PATH` | SQLite file location | `./src/db/leave_management.sqlite` |
| `JWT_SECRET` | Secret used to sign tokens | *(set a long random string)* |
| `JWT_EXPIRES_IN` | Token lifetime | `1h` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | API rate limiting | `900000` / `100` |

**Docker (alternative to the manual steps above):**

```bash
docker compose up --build
```
Frontend at `http://localhost:8080`, backend at `http://localhost:5000`, Swagger UI at `http://localhost:5000/api/docs`.

## Usage

1. Navigate to `http://localhost:5173` and sign in with a demo account:

   | Role | Email | Password |
   |---|---|---|
   | Manager | `manager@demo.com` | `Manager@123` |
   | Employee | `employee@demo.com` | `Employee@123` |

2. **As an employee:** view your dashboard, apply for leave, and track its status from the Leave History page — edit or cancel while it's pending.
3. **As a manager:** review the pending-approvals queue, approve or reject each request (rejection requires a comment), and search the employee directory to inspect anyone's leave history.
4. **API exploration:** import `postman_collection.json` into Postman (the login requests auto-populate a token variable for the rest of the collection), or browse the live Swagger UI at `/api/docs`.

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

## Future Enhancements

- Refresh-token rotation for longer-lived sessions without re-authentication
- Leave balance tracking (accrual and remaining days per leave type per employee)
- Email notifications on request submission, approval, or rejection
- Migration path to PostgreSQL for multi-instance/horizontally-scaled deployment
- Audit log of all state transitions, independent of the `leaves` table itself
- Dark mode and expanded accessibility auditing beyond current keyboard/focus-visible support

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes with clear, incremental commits (see the project's commit history for the expected granularity)
3. Run `npm test` in `backend/` and `npm run build` in `frontend/` before opening a pull request
4. Open a PR describing the change and referencing any related issue

## Acknowledgment of AI-Assisted Development

Portions of this codebase — including boilerplate scaffolding, repetitive CRUD patterns, and documentation drafts — were generated with the assistance of Claude (Anthropic) as a productivity and code-reuse aid, then reviewed, tested, and adapted by the author. All architectural decisions, business logic, and final code were reviewed and are fully understood by the author. This note is included in the interest of transparency and fair use.

## License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2026 Hari Sai Parasa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Contact

For questions about this project, reach out via the details below.


## ***To acquire this project, please contact***

**GitHub:** https://github.com/harisaigithub
**Email:** [harisaiparasa@gmail.com](mailto:harisaiparasa@gmail.com)

For collaborations, customizations, or deployment support, feel free to reach out.
