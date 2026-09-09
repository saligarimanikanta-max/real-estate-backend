const mongoose = require("mongoose");

/**
 * enquiries collection.
 * References propertyId and buyerId rather than embedding, since
 * enquiries are numerous, queried from both sides (a buyer's own
 * enquiries, and an agent's leads across all their properties), and
 * updated independently of the property/user documents they point to.
 */
const enquirySchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: [true, "Enquiry message is required"],
      trim: true,
    },
    // Lead-management lifecycle (Module 7). See enquiryController for the
    // allowed-transition rules that keep this from becoming a free-for-all.
    status: {
      type: String,
      enum: ["New", "Contacted", "In Progress", "Closed"],
      default: "New",
    },
  },
  { timestamps: true }
);

// Speeds up the very common "fetch by relation" query: all enquiries
// for a given property (used to build an agent's lead list).
enquirySchema.index({ propertyId: 1 });
enquirySchema.index({ buyerId: 1 });

module.exports = mongoose.model("Enquiry", enquirySchema);
