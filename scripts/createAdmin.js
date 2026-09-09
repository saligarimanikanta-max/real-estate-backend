/**
 * One-off CLI utility to bootstrap the first admin account.
 *
 * Admins are intentionally NOT self-registerable via POST /api/auth/register
 * (see authController.register) - anyone being able to sign up as an admin
 * would defeat the point of role-based access control. This script is the
 * team's own back door to create the initial admin, run directly against
 * the database, not exposed as an API route.
 *
 * Usage:
 *   node scripts/createAdmin.js "Admin Name" admin@example.com StrongPass123
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error("Usage: node scripts/createAdmin.js \"Admin Name\" admin@example.com StrongPass123");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email });
    if (existing) {
      console.error(`A user with email ${email} already exists (role: ${existing.role}).`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await User.create({ name, email, passwordHash, role: "admin", isVerified: true });

    console.log(`Admin account created: ${admin.email} (id: ${admin._id})`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to create admin:", err.message);
    process.exit(1);
  }
})();
