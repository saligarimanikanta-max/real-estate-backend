const mongoose = require("mongoose");

/**
 * users collection.
 * One schema serves all three actors (Buyer/Tenant, Agent, Admin) via the
 * `role` field rather than three separate collections, since the shared
 * fields (name/email/password/phone) far outweigh the differences.
 *
 * `isVerified` doubles as the agent-verification flag required by the
 * "Property Verification Workflow" business rule: an agent cannot list a
 * property until an admin sets isVerified = true on their account
 * (see propertyController.createProperty). Buyers/admins are verified by
 * default since that check doesn't apply to them.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // never returned by default on find()/findById()
    },
    role: {
      type: String,
      enum: ["buyer", "agent", "admin"],
      default: "buyer",
    },
    phone: {
      type: String,
      trim: true,
    },
    // Agents: false until an admin approves them (see adminController.verifyAgent).
    // Buyers/admins: true immediately, the flag simply doesn't apply to them.
    isVerified: {
      type: Boolean,
      default: function () {
        return this.role !== "agent";
      },
    },
  },
  { timestamps: true }
);

// NOTE: the `unique: true` on the email path above already creates a
// unique index ({ email: 1 }) - it enforces uniqueness and speeds up
// login lookups, so no separate index is declared here.

module.exports = mongoose.model("User", userSchema);
