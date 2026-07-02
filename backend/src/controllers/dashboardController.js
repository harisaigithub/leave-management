const db = require("../db");

/**
 * GET /api/dashboard/employee
 * Returns counts + recent activity for the logged-in employee.
 */
function employeeDashboard(req, res, next) {
  try {
    const employeeId = req.user.employee_id;

    const counts = db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status='APPROVED' THEN 1 ELSE 0 END) AS approved,
           SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN status='REJECTED' THEN 1 ELSE 0 END) AS rejected,
           SUM(CASE WHEN status='CANCELLED' THEN 1 ELSE 0 END) AS cancelled
         FROM leaves WHERE employee_id = ?`
      )
      .get(employeeId);

    const recentActivity = db
      .prepare("SELECT leave_id, leave_type, status, start_date, end_date, updated_at FROM leaves WHERE employee_id = ? ORDER BY updated_at DESC LIMIT 5")
      .all(employeeId);

    res.status(200).json({
      totals: {
        total: counts.total || 0,
        approved: counts.approved || 0,
        pending: counts.pending || 0,
        rejected: counts.rejected || 0,
        cancelled: counts.cancelled || 0,
      },
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { employeeDashboard };
