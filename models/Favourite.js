const mongoose = require("mongoose");

/**
 * favourites collection.
 * A small join document (userId + propertyId) rather than an array
 * embedded in User: favourites can grow unbounded per user and are
 * queried/removed independently, which fits a referenced, separately
 * indexed collection better than an ever-growing embedded array.
 *
 * The compound unique index is a real, DB-enforced business rule: a
 * buyer cannot favourite the same property twice (a duplicate attempt
 * fails with a Mongo 11000 error, which the centralized error handler
 * turns into a clean 409).
 */
const favouriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  { timestamps: true }
);

favouriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.model("Favourite", favouriteSchema);
