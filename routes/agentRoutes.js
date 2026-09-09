const express = require("express");
const router = express.Router();

const { getAgentProfile, rateAgent } = require("../controllers/agentController");
const { rateAgentValidator } = require("../validators/ratingValidators");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");

// Module 9 - Agent Profile & Ratings
router.get("/:id", getAgentProfile);
router.post("/:id/rate", protect, authorize("buyer"), rateAgentValidator, validate, rateAgent);

module.exports = router;
