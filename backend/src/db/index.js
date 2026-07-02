const path = require("path");
const { DatabaseSync } = require("node:sqlite");
require("dotenv").config();

const dbPath = path.resolve(__dirname, "../../", process.env.DB_PATH || "./src/db/leave_management.sqlite");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

// ---------------------------------------------------------------------------
// SCHEMA
// employees: EmployeeID, Name, Email, Password(hashed), Department, Role,
//            CreatedAt, UpdatedAt
// leaves:    LeaveID, EmployeeID (FK), LeaveType, StartDate, EndDate, Reason,
//            Status, ManagerComments, CreatedAt, UpdatedAt
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS employees (
  employee_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password        TEXT NOT NULL,
  department      TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('EMPLOYEE', 'MANAGER')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leaves (
  leave_id          INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id       INTEGER NOT NULL,
  leave_type        TEXT NOT NULL CHECK (leave_type IN ('SICK','CASUAL','EARNED','UNPAID')),
  start_date        TEXT NOT NULL,
  end_date          TEXT NOT NULL,
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  manager_comments  TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
CREATE INDEX IF NOT EXISTS idx_leaves_type ON leaves(leave_type);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
`);

// node:sqlite's DatabaseSync exposes .prepare(sql) -> statement with
// .get(...params) / .all(...params) / .run(...params), matching the
// familiar better-sqlite3-style API used throughout this codebase.
module.exports = db;
