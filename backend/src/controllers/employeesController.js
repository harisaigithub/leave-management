const db = require("../db");

/**
 * GET /api/employees
 * Manager-only: list all employees. Supports ?search=name-or-email&department=X
 */
function listEmployees(req, res, next) {
  try {
    const { search, department } = req.query;
    const conditions = [];
    const params = {};

    if (search) {
      conditions.push("(name LIKE @search OR email LIKE @search)");
      params.search = `%${search}%`;
    }
    if (department) {
      conditions.push("department = @department");
      params.department = department;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = db
      .prepare(`SELECT employee_id, name, email, department, role, created_at FROM employees ${where} ORDER BY name ASC`)
      .all(params);

    res.status(200).json({ employees: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/employees/:id
 * Employees can view their own profile; managers can view anyone's.
 */
function getEmployeeById(req, res, next) {
  try {
    const targetId = Number(req.params.id);
    if (req.user.role !== "MANAGER" && req.user.employee_id !== targetId) {
      return res.status(403).json({ error: "Forbidden", message: "You cannot view another employee's profile" });
    }

    const employee = db
      .prepare("SELECT employee_id, name, email, department, role, created_at, updated_at FROM employees WHERE employee_id = ?")
      .get(targetId);

    if (!employee) return res.status(404).json({ error: "NotFound", message: "Employee not found" });
    res.status(200).json({ employee });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEmployees, getEmployeeById };
