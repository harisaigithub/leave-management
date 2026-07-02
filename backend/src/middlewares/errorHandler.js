function notFoundHandler(req, res, next) {
  res.status(404).json({ error: "NotFound", message: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} ::`, err.message);

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "ValidationError",
      message: "Request validation failed",
      details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.name || "InternalServerError",
    message: err.message || "Something went wrong",
  });
}

module.exports = { notFoundHandler, errorHandler };
