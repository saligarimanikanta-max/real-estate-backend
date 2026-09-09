const Enquiry = require("../models/Enquiry");
const Property = require("../models/Property");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");

// Module 7 - Lead Management for Agents: enquiries move forward through
// a fixed pipeline. "Closed" can be reached from anywhere (an agent can
// always close out a lead), but you can't jump backwards past Contacted.
const ALLOWED_ENQUIRY_TRANSITIONS = {
  New: ["Contacted", "Closed"],
  Contacted: ["In Progress", "Closed"],
  "In Progress": ["Closed"],
  Closed: [],
};

/**
 * Module 6 - Enquiry Submission Module.
 * POST /api/enquiries   body: { propertyId, message }
 * Business rule: a buyer can only enquire about a listing that is
 * actually public and still available (not Sold/Rented, not pending
 * verification) - enquiring on a dead or unapproved listing is rejected.
 */
const createEnquiry = asyncHandler(async (req, res) => {
  const { propertyId, message } = req.body;

  const property = await Property.findById(propertyId);
  if (!property) {
    throw new AppError("Property not found", 404, "NOT_FOUND");
  }

  if (!property.isVerified || property.verificationStatus !== "Approved") {
    throw new AppError("This property is not yet publicly listed", 409, "PROPERTY_NOT_APPROVED");
  }

  if (["Sold", "Rented"].includes(property.status)) {
    throw new AppError(`This property is already ${property.status.toLowerCase()}`, 409, "PROPERTY_UNAVAILABLE");
  }

  const enquiry = await Enquiry.create({
    propertyId,
    buyerId: req.user._id,
    message,
  });

  return sendSuccess(res, 201, "Enquiry submitted successfully", { enquiry });
});

/**
 * GET /api/enquiries/my
 * A buyer's own enquiry history.
 */
const getMyEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find({ buyerId: req.user._id })
    .populate("propertyId", "title city price status")
    .sort({ createdAt: -1 });

  return sendSuccess(res, 200, "Your enquiries fetched successfully", { enquiries });
});

/**
 * Module 7 - Lead Management for Agents.
 * GET /api/enquiries/agent
 * All enquiries received across every property this agent owns.
 */
const getAgentEnquiries = asyncHandler(async (req, res) => {
  const myProperties = await Property.find({ agentId: req.user._id }).select("_id");
  const propertyIds = myProperties.map((p) => p._id);

  const enquiries = await Enquiry.find({ propertyId: { $in: propertyIds } })
    .populate("propertyId", "title city price status")
    .populate("buyerId", "name email phone")
    .sort({ createdAt: -1 });

  return sendSuccess(res, 200, "Leads fetched successfully", { enquiries });
});

/**
 * Module 7 - Lead Management for Agents.
 * PUT /api/enquiries/:id/status   body: { status }
 * Only the agent who owns the underlying property (or an admin) may
 * update an enquiry's status, and only along an allowed transition.
 */
const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status: nextStatus } = req.body;

  const enquiry = await Enquiry.findById(req.params.id).populate("propertyId", "agentId");
  if (!enquiry) {
    throw new AppError("Enquiry not found", 404, "NOT_FOUND");
  }

  const ownsProperty = enquiry.propertyId && enquiry.propertyId.agentId.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !ownsProperty) {
    throw new AppError("You do not have permission to update this enquiry", 403, "FORBIDDEN");
  }

  const currentStatus = enquiry.status;
  if (currentStatus === nextStatus) {
    throw new AppError(`Enquiry is already '${nextStatus}'`, 409, "NO_OP_TRANSITION");
  }

  const allowedNext = ALLOWED_ENQUIRY_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(nextStatus)) {
    throw new AppError(
      `Invalid status transition from '${currentStatus}' to '${nextStatus}'`,
      409,
      "INVALID_TRANSITION"
    );
  }

  enquiry.status = nextStatus;
  await enquiry.save();

  return sendSuccess(res, 200, "Status updated successfully", { enquiry });
});

module.exports = { createEnquiry, getMyEnquiries, getAgentEnquiries, updateEnquiryStatus };
