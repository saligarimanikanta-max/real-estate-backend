const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../utils/AppError");
const generateToken = require("../utils/generateToken");
const { sendSuccess } = require("../utils/apiResponse");

const SALT_ROUNDS = 10;

/**
 * Strips passwordHash and __v before a user document goes out over the
 * wire. Called everywhere a user object is part of a response.
 */
const toSafeUser = (userDoc) => {
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete user.passwordHash;
  delete user.__v;
  return user;
};

/**
 * Module 1 - User Registration & Authentication (register half).
 * POST /api/auth/register
 * Buyers and agents can self-register; admin accounts are not created
 * through this public endpoint (a real deployment would seed/manage
 * admins separately - letting anyone sign up as admin would defeat RBAC).
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (role === "admin") {
    throw new AppError("Admin accounts cannot be self-registered", 403, "FORBIDDEN_ROLE");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409, "DUPLICATE_EMAIL");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || "buyer",
    phone,
  });

  const token = generateToken(user);

  return sendSuccess(res, 201, "User registered successfully", {
    user: toSafeUser(user),
    token,
  });
});

/**
 * Module 1 - User Registration & Authentication (login half).
 * POST /api/auth/login
 * Login succeeds even for an unverified agent - verification only gates
 * the ability to create property listings (see propertyController), not
 * the ability to log in and see the account's own state.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const token = generateToken(user);

  return sendSuccess(res, 200, "Login successful", {
    user: toSafeUser(user),
    token,
  });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's own profile.
 */
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Current user fetched", { user: toSafeUser(req.user) });
});

module.exports = { register, login, getMe, toSafeUser };
