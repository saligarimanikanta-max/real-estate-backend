const jwt = require("jsonwebtoken");

/**
 * Issues a signed JWT carrying the user's id and role. The role is
 * embedded so authorization middleware can check it without an extra
 * DB round trip on every request.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

module.exports = generateToken;
