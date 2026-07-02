const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { employeeDashboard } = require("../controllers/dashboardController");

const router = express.Router();
router.use(requireAuth);

/**
 * @openapi
 * /api/dashboard/employee:
 *   get:
 *     tags: [Dashboard]
 *     summary: Employee dashboard stats (totals + recent activity)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard summary }
 */
router.get("/employee", employeeDashboard);

module.exports = router;
