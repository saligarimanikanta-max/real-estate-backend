const Favourite = require("../models/Favourite");
const Property = require("../models/Property");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Module 5 - Favourites/Saved Properties.
 * POST /api/favourites   body: { propertyId }
 * Backed by a compound unique index on (userId, propertyId) in the model,
 * but we also check explicitly here rather than relying on that index
 * alone - if the index build ever loses a race with existing data (e.g.
 * duplicate documents already present when Mongoose syncs indexes),
 * MongoDB silently skips building it, and a DB-only guard would silently
 * stop protecting against duplicates. Checking here guarantees the rule
 * holds regardless of index state.
 */
const addFavourite = asyncHandler(async (req, res) => {
  const { propertyId } = req.body;

  const property = await Property.findById(propertyId);
  if (!property) {
    throw new AppError("Property not found", 404, "NOT_FOUND");
  }

  const existing = await Favourite.findOne({ userId: req.user._id, propertyId });
  if (existing) {
    throw new AppError("This property is already in your favourites", 409, "ALREADY_FAVOURITED");
  }

  const favourite = await Favourite.create({ userId: req.user._id, propertyId });
  return sendSuccess(res, 201, "Property added to favourites", { favourite });
});

/**
 * DELETE /api/favourites/:propertyId
 */
const removeFavourite = asyncHandler(async (req, res) => {
  const favourite = await Favourite.findOneAndDelete({
    userId: req.user._id,
    propertyId: req.params.propertyId,
  });

  if (!favourite) {
    throw new AppError("This property is not in your favourites", 404, "NOT_FOUND");
  }

  return sendSuccess(res, 200, "Property removed from favourites");
});

/**
 * GET /api/favourites
 */
const getMyFavourites = asyncHandler(async (req, res) => {
  const favourites = await Favourite.find({ userId: req.user._id })
    .populate("propertyId")
    .sort({ createdAt: -1 });

  return sendSuccess(res, 200, "Favourites fetched successfully", { favourites });
});

module.exports = { addFavourite, removeFavourite, getMyFavourites };
