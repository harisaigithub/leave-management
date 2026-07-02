const { verifyToken } = require("../utils/jwt");

/**
 * Verifies the Bearer JWT on protected routes and attaches
 * req.user = { employee_id, email, role }
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized", message: "Missing or malformed Authorization header" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }
}

/**
 * Restricts access to specific roles. Use after requireAuth.
 * e.g. requireRole('MANAGER')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden", message: "You do not have permission to perform this action" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
