/**
 * Global error handler middleware
 * Catches any error passed via next(err) in Express and returns a structured JSON response.
 * Mirrors the error.middleware pattern from the project's reference setup.
 */

module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(
    `[ERROR] ${req.method} ${req.originalUrl} - ${status}: ${message}`,
  );
  if (status >= 500) {
    console.error(err.stack);
  }

  res.status(status).json({
    ok: false,
    message,
    statusCode: status,
    path: req.originalUrl,
  });
};
