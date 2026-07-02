const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { applyLeave, listMyLeaves, getLeaveById, updateLeave, cancelLeave } = require("../controllers/leavesController");

const router = express.Router();
router.use(requireAuth);

/**
 * @openapi
 * /api/leaves:
 *   post:
 *     tags: [Leaves]
 *     summary: Apply for a new leave
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leave_type, start_date, end_date, reason]
 *             properties:
 *               leave_type: { type: string, enum: [SICK, CASUAL, EARNED, UNPAID] }
 *               start_date: { type: string, example: "2026-07-10" }
 *               end_date: { type: string, example: "2026-07-12" }
 *               reason: { type: string, example: "Family function" }
 *     responses:
 *       201: { description: Leave created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *   get:
 *     tags: [Leaves]
 *     summary: List the current employee's own leave requests
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED, CANCELLED] }
 *       - in: query
 *         name: leave_type
 *         schema: { type: string, enum: [SICK, CASUAL, EARNED, UNPAID] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated list of leave requests }
 */
router.post("/", applyLeave);
router.get("/", listMyLeaves);

/**
 * @openapi
 * /api/leaves/{id}:
 *   get:
 *     tags: [Leaves]
 *     summary: Get a single leave request by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Leave details }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *   put:
 *     tags: [Leaves]
 *     summary: Edit a PENDING leave request (owner only)
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
 *               leave_type: { type: string }
 *               start_date: { type: string }
 *               end_date: { type: string }
 *               reason: { type: string }
 *     responses:
 *       200: { description: Leave updated }
 *       409: { description: Only PENDING requests can be edited }
 *   delete:
 *     tags: [Leaves]
 *     summary: Cancel a PENDING leave request (owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Leave cancelled }
 *       409: { description: Only PENDING requests can be cancelled }
 */
router.get("/:id", getLeaveById);
router.put("/:id", updateLeave);
router.delete("/:id", cancelLeave);

module.exports = router;
