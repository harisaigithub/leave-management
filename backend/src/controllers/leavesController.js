const db = require("../db");
const { applyLeaveSchema, updateLeaveSchema } = require("../utils/validators");

/**
 * POST /api/leaves
 * Employee applies for a new leave request. Always created as PENDING.
 */
function applyLeave(req, res, next) {
  try {
    const data = applyLeaveSchema.parse(req.body);
    const employeeId = req.user.employee_id;

    const stmt = db.prepare(`
      INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
      VALUES (@employee_id, @leave_type, @start_date, @end_date, @reason, 'PENDING')
    `);
    const result = stmt.run({ employee_id: employeeId, ...data });

    const created = db.prepare("SELECT * FROM leaves WHERE leave_id = ?").get(result.lastInsertRowid);
    res.status(201).json({ message: "Leave request submitted", leave: created });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaves
 * Lists the authenticated employee's own leave requests.
 * Supports: ?status=PENDING&leave_type=SICK&search=text&page=1&limit=10
 */
function listMyLeaves(req, res, next) {
  try {
    const employeeId = req.user.employee_id;
    const { status, leave_type, search } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const conditions = ["employee_id = @employee_id"];
    const params = { employee_id: employeeId };

    if (status) {
      conditions.push("status = @status");
      params.status = status;
    }
    if (leave_type) {
      conditions.push("leave_type = @leave_type");
      params.leave_type = leave_type;
    }
    if (search) {
      conditions.push("reason LIKE @search");
      params.search = `%${search}%`;
    }

    const whereClause = conditions.join(" AND ");

    const total = db.prepare(`SELECT COUNT(*) AS count FROM leaves WHERE ${whereClause}`).get(params).count;
    const rows = db
      .prepare(`SELECT * FROM leaves WHERE ${whereClause} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit, offset });

    res.status(200).json({
      leaves: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaves/:id
 * Employees may only view their own leave; managers may view any.
 */
function getLeaveById(req, res, next) {
  try {
    const leave = db.prepare("SELECT * FROM leaves WHERE leave_id = ?").get(req.params.id);
    if (!leave) return res.status(404).json({ error: "NotFound", message: "Leave request not found" });

    if (req.user.role !== "MANAGER" && leave.employee_id !== req.user.employee_id) {
      return res.status(403).json({ error: "Forbidden", message: "You cannot view another employee's leave request" });
    }
    res.status(200).json({ leave });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/leaves/:id
 * Employee edits their OWN leave request, only while it is still PENDING.
 */
function updateLeave(req, res, next) {
  try {
    const data = updateLeaveSchema.parse(req.body);
    const leave = db.prepare("SELECT * FROM leaves WHERE leave_id = ?").get(req.params.id);

    if (!leave) return res.status(404).json({ error: "NotFound", message: "Leave request not found" });
    if (leave.employee_id !== req.user.employee_id) {
      return res.status(403).json({ error: "Forbidden", message: "You cannot edit another employee's leave request" });
    }
    if (leave.status !== "PENDING") {
      return res.status(409).json({ error: "Conflict", message: `Only PENDING requests can be edited (current status: ${leave.status})` });
    }

    const merged = {
      leave_type: data.leave_type ?? leave.leave_type,
      start_date: data.start_date ?? leave.start_date,
      end_date: data.end_date ?? leave.end_date,
      reason: data.reason ?? leave.reason,
    };
    if (new Date(merged.start_date) > new Date(merged.end_date)) {
      return res.status(400).json({ error: "ValidationError", message: "start_date must be on or before end_date" });
    }

    db.prepare(`
      UPDATE leaves SET leave_type=@leave_type, start_date=@start_date, end_date=@end_date,
        reason=@reason, updated_at=datetime('now') WHERE leave_id=@leave_id
    `).run({ ...merged, leave_id: req.params.id });

    const updated = db.prepare("SELECT * FROM leaves WHERE leave_id = ?").get(req.params.id);
    res.status(200).json({ message: "Leave request updated", leave: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/leaves/:id
 * "Cancel" a PENDING leave request. Implemented as a soft status change
 * (CANCELLED) rather than a hard delete, to preserve an audit trail -
 * this matters for a system that will need leave-balance and reporting
 * features later.
 */
function cancelLeave(req, res, next) {
  try {
    const leave = db.prepare("SELECT * FROM leaves WHERE leave_id = ?").get(req.params.id);
    if (!leave) return res.status(404).json({ error: "NotFound", message: "Leave request not found" });
    if (leave.employee_id !== req.user.employee_id) {
      return res.status(403).json({ error: "Forbidden", message: "You cannot cancel another employee's leave request" });
    }
    if (leave.status !== "PENDING") {
      return res.status(409).json({ error: "Conflict", message: `Only PENDING requests can be cancelled (current status: ${leave.status})` });
    }

    db.prepare("UPDATE leaves SET status='CANCELLED', updated_at=datetime('now') WHERE leave_id=?").run(req.params.id);
    const updated = db.prepare("SELECT * FROM leaves WHERE leave_id = ?").get(req.params.id);
    res.status(200).json({ message: "Leave request cancelled", leave: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { applyLeave, listMyLeaves, getLeaveById, updateLeave, cancelLeave };
