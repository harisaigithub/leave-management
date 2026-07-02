const jwt = require("jsonwebtoken");
require("dotenv").config();

// Falls back to a fixed dev/test secret if JWT_SECRET isn't set (e.g. CI
// environments without a .env file). Production deployments should always
// set a real JWT_SECRET via environment variables — see .env.example.
const SECRET = process.env.JWT_SECRET || "dev-only-insecure-fallback-secret-do-not-use-in-production";

function signToken(payload) {
  return jwt.sign(payload, SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
