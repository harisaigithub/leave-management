const express = require("express");
const { login, logout, me } = require("../controllers/authController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: employee@demo.com }
 *               password: { type: string, example: Employee@123 }
 *     responses:
 *       200: { description: Login successful, returns JWT + user profile }
 *       400: { description: Validation error }
 *       401: { description: Invalid credentials }
 */
router.post("/login", login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current session
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user profile }
 *       401: { description: Unauthorized }
 */
router.get("/me", requireAuth, me);

module.exports = router;
