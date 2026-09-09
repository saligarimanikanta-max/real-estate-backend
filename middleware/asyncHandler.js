/**
 * Wraps an async route/controller function so any rejected promise or
 * thrown error is forwarded to next(err) instead of crashing the process
 * with an unhandled promise rejection. Every controller in this project
 * is wrapped with this instead of repeating try/catch everywhere.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
