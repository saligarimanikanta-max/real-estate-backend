const mongoose = require("mongoose");

/**
 * properties collection.
 *
 * agentId is a *reference* (not embedded) because a property is large,
 * updated independently of its agent, and each agent owns many
 * properties - the classic case for referencing rather than embedding.
 *
 * Two workflows are tracked as separate fields on purpose:
 *  - verificationStatus / isVerified: the one-time admin gate before a
 *    listing is public at all (Module 3).
 *  - status: the property's ongoing lifecycle once it IS public
 *    (Available -> Under Negotiation -> Sold/Rented) (Module 8).
 * Keeping them separate avoids conflating "is this listing allowed to
 * exist publicly" with "where is this listing in its sales lifecycle".
 */
const propertySchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Listing type: is the property for sale or for rent.
    type: {
      type: String,
      enum: ["sale", "rent"],
      required: [true, "Listing type (sale/rent) is required"],
    },
    propertyType: {
      type: String,
      enum: ["apartment", "villa", "independent-house", "plot", "commercial"],
      required: [true, "Property type is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    locality: {
      type: String,
      trim: true,
      default: "",
    },
    bedrooms: {
      type: Number,
      min: 0,
      default: 0,
    },
    bathrooms: {
      type: Number,
      min: 0,
      default: 0,
    },
    areaSqft: {
      type: Number,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Available", "Under Negotiation", "Sold", "Rented"],
      default: "Available",
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationRemarks: {
      type: String,
      default: "",
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Speeds up the very common "fetch by relation" query: an agent's own listings.
propertySchema.index({ agentId: 1 });
// Speeds up search/filter (Module 4) and location grouping (Module 10).
propertySchema.index({ city: 1, price: 1, propertyType: 1 });

module.exports = mongoose.model("Property", propertySchema);
