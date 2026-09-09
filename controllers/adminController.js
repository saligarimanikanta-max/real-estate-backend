const User = require("../models/User");
const Property = require("../models/Property");
const Enquiry = require("../models/Enquiry");
const Rating = require("../models/Rating");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Module 11 - Admin Moderation Dashboard.
 * GET /api/admin/agents/pending
 * Agents awaiting verification before they're allowed to list anything.
 */
const getPendingAgents = asyncHandler(async (req, res) => {
  const agents = await User.find({ role: "agent", isVerified: false }).sort({ createdAt: 1 });
  return sendSuccess(res, 200, "Pending agents fetched successfully", { agents });
});

/**
 * PUT /api/admin/agents/:id/verify
 * Approves an agent account so they can start creating listings.
 */
const verifyAgent = asyncHandler(async (req, res) => {
  const agent = await User.findOne({ _id: req.params.id, role: "agent" });
  if (!agent) {
    throw new AppError("Agent not found", 404, "NOT_FOUND");
  }

  if (agent.isVerified) {
    throw new AppError("This agent is already verified", 409, "ALREADY_VERIFIED");
  }

  agent.isVerified = true;
  await agent.save();

  return sendSuccess(res, 200, "Agent verified successfully", { agent });
});

/**
 * Module 11 - Admin Moderation Dashboard.
 * GET /api/admin/properties/pending
 * Listings still pending review, plus anything flagged for a second look.
 */
const getPendingProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({
    $or: [{ verificationStatus: "Pending" }, { isFlagged: true }],
  })
    .populate("agentId", "name email isVerified")
    .sort({ createdAt: 1 });

  return sendSuccess(res, 200, "Pending/flagged properties fetched successfully", { properties });
});

/**
 * PUT /api/admin/properties/:id/flag   body: { flagged: true|false }
 * Lets an admin flag a live listing for re-review (e.g. a complaint)
 * without having to revoke its verification outright.
 */
const setPropertyFlag = asyncHandler(async (req, res) => {
  const { flagged } = req.body;
  const property = await Property.findById(req.params.id);
  if (!property) {
    throw new AppError("Property not found", 404, "NOT_FOUND");
  }

  property.isFlagged = Boolean(flagged);
  await property.save();

  return sendSuccess(res, 200, `Property ${property.isFlagged ? "flagged" : "unflagged"} successfully`, {
    property,
  });
});

/**
 * Module 12 - Reports & Analytics.
 * GET /api/admin/reports/top-properties
 * The most-enquired-about properties, ranked by enquiry count.
 */
const getTopProperties = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;

  const topProperties = await Enquiry.aggregate([
    { $group: { _id: "$propertyId", enquiryCount: { $sum: 1 } } },
    { $sort: { enquiryCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "properties",
        localField: "_id",
        foreignField: "_id",
        as: "property",
      },
    },
    { $unwind: "$property" },
    {
      $project: {
        _id: 0,
        propertyId: "$property._id",
        title: "$property.title",
        city: "$property.city",
        price: "$property.price",
        status: "$property.status",
        enquiryCount: 1,
      },
    },
  ]);

  return sendSuccess(res, 200, "Top enquired properties fetched successfully", { topProperties });
});

/**
 * Module 12 - Reports & Analytics.
 * GET /api/admin/reports/agent-performance
 * Per-agent rollup: total listings, how many have sold/rented, and
 * average buyer rating - joins across properties and ratings via
 * aggregation rather than N+1 queries in application code.
 */
const getAgentPerformance = asyncHandler(async (req, res) => {
  const performance = await Property.aggregate([
    {
      $group: {
        _id: "$agentId",
        totalListings: { $sum: 1 },
        soldOrRented: {
          $sum: { $cond: [{ $in: ["$status", ["Sold", "Rented"]] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "agent",
      },
    },
    { $unwind: "$agent" },
    {
      $lookup: {
        from: "ratings",
        localField: "_id",
        foreignField: "agentId",
        as: "ratings",
      },
    },
    {
      $project: {
        _id: 0,
        agentId: "$agent._id",
        name: "$agent.name",
        email: "$agent.email",
        isVerified: "$agent.isVerified",
        totalListings: 1,
        soldOrRented: 1,
        averageRating: { $round: [{ $ifNull: [{ $avg: "$ratings.rating" }, 0] }, 2] },
        ratingCount: { $size: "$ratings" },
      },
    },
    { $sort: { totalListings: -1 } },
  ]);

  return sendSuccess(res, 200, "Agent performance report fetched successfully", { performance });
});

module.exports = {
  getPendingAgents,
  verifyAgent,
  getPendingProperties,
  setPropertyFlag,
  getTopProperties,
  getAgentPerformance,
};
