const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const AppError = require("../utils/AppError");
const User = require("../models/User");

/**
 * Module 13 - Role-Based Access Control (part 1: authentication).
 * Verifies the Bearer JWT on protected routes and attaches the
 * authenticated user (without the password hash) to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Not authorized, no token provided", 401, "NO_TOKEN");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError("Not authorized, token invalid or expired", 401, "INVALID_TOKEN");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError("Not authorized, user no longer exists", 401, "USER_NOT_FOUND");
  }

  req.user = user;
  next();
});

/**
 * Module 13 - Role-Based Access Control (part 2: authorization).
 * Use after `protect`. Restricts a route to one or more roles, e.g.
 * authorize('agent', 'admin'). Never trust a route to be safe just
 * because the user is logged in - every mutating route also checks role
 * and, inside the controller, resource ownership.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(
      new AppError(
        `Role '${req.user ? req.user.role : "unknown"}' is not permitted to perform this action`,
        403,
        "FORBIDDEN"
      )
    );
  }
  next();
};

module.exports = { protect, authorize };
