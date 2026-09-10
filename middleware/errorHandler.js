const AppError = require("../utils/AppError");

/**
 * Catches any request that didn't match a route and turns it into a
 * clean 404 instead of Express's default HTML error page.
 */
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, "ROUTE_NOT_FOUND"));
};

/**
 * Centralized error-handling middleware (must be registered last, after
 * all routes). Every error in the app - thrown, rejected, or passed to
 * next(err) - ends up here and is turned into the same consistent JSON
 * shape: { success: false, message, errorCode }. This is what keeps a
 * bad ID, a missing field, or an unexpected bug from ever crashing the
 * server or leaking a stack trace to the client.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errorCode = err.errorCode || "INTERNAL_ERROR";

  // Invalid MongoDB ObjectId in a route param (e.g. GET /properties/123)
  if (err.name === "CastError") {
    statusCode = 404;
    message = `Invalid ${err.path}: ${err.value}`;
    errorCode = "INVALID_ID";
  }

  // Mongoose schema validation failure (belt-and-braces on top of
  // express-validator, in case a document is built/saved directly)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join("; ");
    errorCode = "VALIDATION_ERROR";
  }

  // Duplicate key (e.g. duplicate email, or a duplicate favourite)
  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});

    message =
      fields.length > 0
        ? `Duplicate value for field(s): ${fields.join(", ")}`
        : "A record with the same unique value already exists";

    errorCode = "DUPLICATE_KEY";
  }

  // Malformed / expired JWT that slipped past middleware/auth.js
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Not authorized, token invalid or expired";
    errorCode = "INVALID_TOKEN";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};

module.exports = { notFound, errorHandler };
