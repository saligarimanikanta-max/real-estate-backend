const User = require("../models/User");
const Property = require("../models/Property");
const Enquiry = require("../models/Enquiry");
const Rating = require("../models/Rating");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Module 9 - Agent Profile & Ratings (public profile).
 * GET /api/agents/:id
 * Assembles a public-facing agent profile: basic info plus derived
 * stats (listing count, average rating, rating count) computed on the
 * fly rather than stored/duplicated on the User document, so they can
 * never go stale.
 */
const getAgentProfile = asyncHandler(async (req, res) => {
  const agent = await User.findOne({ _id: req.params.id, role: "agent" });
  if (!agent) {
    throw new AppError("Agent not found", 404, "NOT_FOUND");
  }

  const [listingsCount, ratingStats] = await Promise.all([
    Property.countDocuments({ agentId: agent._id, isVerified: true, verificationStatus: "Approved" }),
    Rating.aggregate([
      { $match: { agentId: agent._id } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
  ]);

  const { average = 0, count = 0 } = ratingStats[0] || {};

  return sendSuccess(res, 200, "Agent profile fetched successfully", {
    agent: {
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      isVerified: agent.isVerified,
    },
    listingsCount,
    averageRating: Math.round(average * 10) / 10,
    ratingCount: count,
  });
});

/**
 * Module 9 - Agent Profile & Ratings (submit/update a rating).
 * POST /api/agents/:id/rate   body: { rating, comment? }
 * Business rule: a buyer may only rate an agent they've actually
 * enquired with - this stops drive-by ratings with no real interaction
 * behind them. Upserts so re-rating updates the existing rating instead
 * of violating the one-rating-per-buyer-per-agent unique index.
 */
const rateAgent = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const agentId = req.params.id;

  const agent = await User.findOne({ _id: agentId, role: "agent" });
  if (!agent) {
    throw new AppError("Agent not found", 404, "NOT_FOUND");
  }

  const agentProperties = await Property.find({ agentId }).select("_id");
  const propertyIds = agentProperties.map((p) => p._id);

  const hasEnquired = await Enquiry.exists({
    buyerId: req.user._id,
    propertyId: { $in: propertyIds },
  });

  if (!hasEnquired) {
    throw new AppError(
      "You can only rate an agent after enquiring about one of their properties",
      403,
      "NO_INTERACTION_HISTORY"
    );
  }

  const ratingDoc = await Rating.findOneAndUpdate(
    { agentId, buyerId: req.user._id },
    { rating, comment },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return sendSuccess(res, 200, "Rating submitted successfully", { rating: ratingDoc });
});

module.exports = { getAgentProfile, rateAgent };
