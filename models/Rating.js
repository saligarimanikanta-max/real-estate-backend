const mongoose = require("mongoose");

/**
 * ratings collection (supports Module 9 - Agent Profile & Ratings).
 * Kept separate from User rather than an embedded array on the agent,
 * because ratings are written by a different actor (the buyer), queried
 * independently (average + count for a public profile), and one buyer
 * should only ever have one rating per agent - a compound unique index
 * enforces that, and rateAgent() upserts so a re-rate updates in place
 * instead of creating spam duplicates.
 */
const ratingSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

ratingSchema.index({ agentId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
