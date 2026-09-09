const express = require("express");
const router = express.Router();

const {
  createEnquiry,
  getMyEnquiries,
  getAgentEnquiries,
  updateEnquiryStatus,
} = require("../controllers/enquiryController");

const {
  createEnquiryValidator,
  updateEnquiryStatusValidator,
} = require("../validators/enquiryValidators");

const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");

// Module 6 - Enquiry Submission Module
router.post("/", protect, authorize("buyer"), createEnquiryValidator, validate, createEnquiry);
router.get("/my", protect, authorize("buyer"), getMyEnquiries);

// Module 7 - Lead Management for Agents
router.get("/agent", protect, authorize("agent"), getAgentEnquiries);
router.put(
  "/:id/status",
  protect,
  authorize("agent", "admin"),
  updateEnquiryStatusValidator,
  validate,
  updateEnquiryStatus
);

module.exports = router;
