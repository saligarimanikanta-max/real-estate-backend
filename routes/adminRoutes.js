const express = require("express");
const router = express.Router();

const {
  getPendingAgents,
  verifyAgent,
  getPendingProperties,
  setPropertyFlag,
  getTopProperties,
  getAgentPerformance,
} = require("../controllers/adminController");

const { protect, authorize } = require("../middleware/auth");

// Every route in this file is admin-only.
router.use(protect, authorize("admin"));

// Module 11 - Admin Moderation Dashboard
router.get("/agents/pending", getPendingAgents);
router.put("/agents/:id/verify", verifyAgent);
router.get("/properties/pending", getPendingProperties);
router.put("/properties/:id/flag", setPropertyFlag);

// Module 12 - Reports & Analytics
router.get("/reports/top-properties", getTopProperties);
router.get("/reports/agent-performance", getAgentPerformance);

module.exports = router;
