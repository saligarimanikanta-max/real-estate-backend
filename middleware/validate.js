const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

/**
 * Runs after an express-validator rule chain. If any rule failed, it
 * short-circuits with a clean 400 instead of letting bad data reach the
 * controller/business logic. This is the "server-side validation" layer
 * required by the assignment - the API must be safe to call directly
 * (e.g. via Postman), not just from a trusted frontend.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => `${e.path}: ${e.msg}`)
      .join("; ");
    return next(new AppError(message, 400, "VALIDATION_ERROR"));
  }
  next();
};

module.exports = validate;
