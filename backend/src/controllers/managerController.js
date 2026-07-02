const db = require("../db");
const { reviewLeaveSchema } = require("../utils/validators");

/**
 * GET /api/manager/pending-leaves
 * All PENDING leave requests across all employees, with requester info.
 * Supports ?search=name-or-email&leave_type=SICK&page=1&limit=10
 */
function listPendingLeaves(req, res, next) {
  try {
    const { search, leave_type } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const conditions = ["l.status = 'PENDING'"];
    const params = {};

    if (search) {
      conditions.push("(e.name LIKE @search OR e.email LIKE @search)");
      params.search = `%${search}%`;
    }
    if (leave_type) {
      conditions.push("l.leave_type = @leave_type");
      params.leave_type = leave_type;
    }
    const where = conditions.join(" AND ");

    const total = db
      .prepare(`SELECT COUNT(*) AS count FROM leaves l JOIN employees e ON e.employee_id = l.employee_id WHERE ${where}`)
      .get(params).count;

    const rows = db
      .prepare(
        `SELECT l.*, e.name AS employee_name, e.email AS employee_email, e.department
         FROM leaves l JOIN employees e ON e.employee_id = l.employee_id
         WHERE ${where} ORDER BY l.created_at ASC LIMIT @limit OFFSET @offset`
      )
      .all({ ...params, limit, offset });

    res.status(200).json({ leaves: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

/**
 * Shared logic for approve/reject — validates the leave exists and is PENDING.
 */
function findPendingLeaveOr409(id) {
  const leave = db.prepare("SELECT * FROM leaves WHERE leave_id = ?").get(id);
  if (!leave) {
    const err = new Error("Leave request not found");
    err.status = 404;
    err.name = "NotFound";
    throw err;
  }
  if (leave.status !== "PENDING") {
    const err = new Error(`Only PENDING requests can be reviewed (current status: ${leave.status})`);
    err.status = 409;
    err.name = "Conflict";
    throw err;
  }
  return leave;
}

/**
 * PUT /api/manager/leaves/:id/approve
 */
function approveLeave(req, res, next) {
  try {
    const { manager_comments } = reviewLeaveSchema.parse(req.body || {});
    findPendingLeaveOr409(req.params.id);

    db.prepare("UPDATE leaves SET status='APPROVED', manager_comments=@comments, updated_at=datetime('now') WHERE leave_id=@id")
      .run({ id: req.params.id, comments: manager_comments || null });

    const updated = db.prepare("SELECT * FROM leaves WHERE leave_id = ?").get(req.params.id);
    res.status(200).json({ message: "Leave request approved", leave: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/manager/leaves/:id/reject
 * Manager comments are effectively required for a rejection so the
 * employee understands why (enforced at the API level, not just DB level).
 */
function rejectLeave(req, res, next) {
  try {
    const { manager_comments } = reviewLeaveSchema.parse(req.body || {});
    if (!manager_comments || !manager_comments.trim()) {
      return res.status(400).json({ error: "ValidationError", message: "manager_comments is required when rejecting a leave request" });
    }
    findPendingLeaveOr409(req.params.id);

    db.prepare("UPDATE leaves SET status='REJECTED', manager_comments=@comments, updated_at=datetime('now') WHERE leave_id=@id")
      .run({ id: req.params.id, comments: manager_comments });

    const updated = db.prepare("SELECT * FROM leaves WHERE leave_id = ?").get(req.params.id);
    res.status(200).json({ message: "Leave request rejected", leave: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/manager/employees/:id/leaves
 * Full leave history for a specific employee (manager view).
 */
function getEmployeeLeaveHistory(req, res, next) {
  try {
    const employee = db.prepare("SELECT employee_id, name, email, department FROM employees WHERE employee_id = ?").get(req.params.id);
    if (!employee) return res.status(404).json({ error: "NotFound", message: "Employee not found" });

    const { status, leave_type } = req.query;
    const conditions = ["employee_id = @employee_id"];
    const params = { employee_id: req.params.id };
    if (status) {
      conditions.push("status = @status");
      params.status = status;
    }
    if (leave_type) {
      conditions.push("leave_type = @leave_type");
      params.leave_type = leave_type;
    }

    const leaves = db
      .prepare(`SELECT * FROM leaves WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`)
      .all(params);

    res.status(200).json({ employee, leaves });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/manager/dashboard
 * Org-wide counts + recent activity for the manager dashboard.
 */
function managerDashboard(req, res, next) {
  try {
    const totalEmployees = db.prepare("SELECT COUNT(*) AS count FROM employees WHERE role = 'EMPLOYEE'").get().count;

    const counts = db
      .prepare(
        `SELECT
           SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN status='APPROVED' THEN 1 ELSE 0 END) AS approved,
           SUM(CASE WHEN status='REJECTED' THEN 1 ELSE 0 END) AS rejected
         FROM leaves`
      )
      .get();

    const recentActivity = db
      .prepare(
        `SELECT l.leave_id, l.leave_type, l.status, l.start_date, l.end_date, l.updated_at, e.name AS employee_name
         FROM leaves l JOIN employees e ON e.employee_id = l.employee_id
         ORDER BY l.updated_at DESC LIMIT 5`
      )
      .all();

    res.status(200).json({
      totals: {
        totalEmployees,
        pendingApprovals: counts.pending || 0,
        approved: counts.approved || 0,
        rejected: counts.rejected || 0,
      },
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPendingLeaves, approveLeave, rejectLeave, getEmployeeLeaveHistory, managerDashboard };
