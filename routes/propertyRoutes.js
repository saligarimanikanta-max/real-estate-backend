const express = require("express");
const router = express.Router();

const {
  createProperty,
  updateProperty,
  deleteProperty,
  getProperty,
  searchProperties,
  getPropertiesByLocation,
  getPropertiesGroupedByCity,
  verifyProperty,
  updatePropertyStatus,
} = require("../controllers/propertyController");

const {
  createPropertyValidator,
  updatePropertyValidator,
  searchPropertyValidator,
  verifyPropertyValidator,
  updateStatusValidator,
} = require("../validators/propertyValidators");

const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");

// NOTE: specific static routes (search, location/:city, grouped-by-city)
// are declared BEFORE the generic /:id route, otherwise Express would
// try to treat "search" etc. as an :id value.

// Module 4 - Advanced Search & Filtering
router.get("/search", searchPropertyValidator, validate, searchProperties);

// Module 10 - Location-Based Listing Grouping
router.get("/grouped-by-city", getPropertiesGroupedByCity);
router.get("/location/:city", getPropertiesByLocation);

// Module 2 - Property Listing Management
router.post("/", protect, authorize("agent"), createPropertyValidator, validate, createProperty);
router.get("/:id", getProperty);
router.put("/:id", protect, authorize("agent", "admin"), updatePropertyValidator, validate, updateProperty);
router.delete("/:id", protect, authorize("agent", "admin"), deleteProperty);

// Module 3 - Property Verification Workflow
router.put("/:id/verify", protect, authorize("admin"), verifyPropertyValidator, validate, verifyProperty);

// Module 8 - Property Status Tracking
router.put(
  "/:id/status",
  protect,
  authorize("agent", "admin"),
  updateStatusValidator,
  validate,
  updatePropertyStatus
);

module.exports = router;
