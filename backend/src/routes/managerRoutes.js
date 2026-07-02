const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const {
  listPendingLeaves,
  approveLeave,
  rejectLeave,
  getEmployeeLeaveHistory,
  managerDashboard,
} = require("../controllers/managerController");

const router = express.Router();
router.use(requireAuth, requireRole("MANAGER"));

/**
 * @openapi
 * /api/manager/pending-leaves:
 *   get:
 *     tags: [Manager]
 *     summary: List all PENDING leave requests across employees
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by employee name or email
 *       - in: query
 *         name: leave_type
 *         schema: { type: string, enum: [SICK, CASUAL, EARNED, UNPAID] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated pending leave requests }
 *       403: { description: Forbidden - manager role required }
 */
router.get("/pending-leaves", listPendingLeaves);

/**
 * @openapi
 * /api/manager/leaves/{id}/approve:
 *   put:
 *     tags: [Manager]
 *     summary: Approve a PENDING leave request
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               manager_comments: { type: string }
 *     responses:
 *       200: { description: Leave approved }
 *       409: { description: Only PENDING requests can be reviewed }
 */
router.put("/leaves/:id/approve", approveLeave);

/**
 * @openapi
 * /api/manager/leaves/{id}/reject:
 *   put:
 *     tags: [Manager]
 *     summary: Reject a PENDING leave request (comments required)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manager_comments]
 *             properties:
 *               manager_comments: { type: string, example: "Insufficient leave balance" }
 *     responses:
 *       200: { description: Leave rejected }
 *       400: { description: manager_comments is required }
 *       409: { description: Only PENDING requests can be reviewed }
 */
router.put("/leaves/:id/reject", rejectLeave);

/**
 * @openapi
 * /api/manager/employees/{id}/leaves:
 *   get:
 *     tags: [Manager]
 *     summary: View a specific employee's full leave history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: leave_type
 *         schema: { type: string }
 *     responses:
 *       200: { description: Employee leave history }
 *       404: { description: Employee not found }
 */
router.get("/employees/:id/leaves", getEmployeeLeaveHistory);

/**
 * @openapi
 * /api/manager/dashboard:
 *   get:
 *     tags: [Manager]
 *     summary: Manager dashboard stats (org-wide totals + recent activity)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard summary }
 */
router.get("/dashboard", managerDashboard);

module.exports = router;
