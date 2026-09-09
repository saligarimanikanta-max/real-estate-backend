/**
 * Custom error class for expected/operational errors (bad input, missing
 * resource, business-rule conflicts, auth failures). Anything thrown as an
 * AppError is treated as "safe to show the client" by the centralized
 * error handler, unlike raw programming errors.
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = "ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
