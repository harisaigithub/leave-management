const bcrypt = require("bcryptjs");
const { z } = require("zod");
const db = require("../db");
const { signToken } = require("../utils/jwt");

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 * Validates credentials, returns a JWT + user profile (without password).
 */
function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = db.prepare("SELECT * FROM employees WHERE email = ?").get(email);
    if (!user) {
      return res.status(401).json({ error: "InvalidCredentials", message: "Invalid email or password" });
    }

    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "InvalidCredentials", message: "Invalid email or password" });
    }

    const token = signToken({
      employee_id: user.employee_id,
      email: user.email,
      role: user.role,
    });

    const { password: _pw, ...safeUser } = user;
    res.status(200).json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Stateless JWT: logout is handled client-side by discarding the token.
 * Endpoint exists for API completeness / future token-blacklist support.
 */
function logout(req, res) {
  res.status(200).json({ message: "Logged out successfully" });
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
function me(req, res) {
  const user = db.prepare("SELECT employee_id, name, email, department, role, created_at FROM employees WHERE employee_id = ?").get(req.user.employee_id);
  res.status(200).json({ user });
}

module.exports = { login, logout, me };
