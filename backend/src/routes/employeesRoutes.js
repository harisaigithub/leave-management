const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { listEmployees, getEmployeeById } = require("../controllers/employeesController");

const router = express.Router();
router.use(requireAuth);

/**
 * @openapi
 * /api/employees:
 *   get:
 *     tags: [Employees]
 *     summary: List employees (manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of employees }
 *       403: { description: Forbidden - manager role required }
 */
router.get("/", requireRole("MANAGER"), listEmployees);

/**
 * @openapi
 * /api/employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Get an employee profile (self, or any employee if manager)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Employee profile }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.get("/:id", getEmployeeById);

module.exports = router;
