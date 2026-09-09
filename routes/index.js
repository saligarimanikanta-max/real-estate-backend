const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/properties", require("./propertyRoutes"));
router.use("/enquiries", require("./enquiryRoutes"));
router.use("/favourites", require("./favouriteRoutes"));
router.use("/agents", require("./agentRoutes"));
router.use("/admin", require("./adminRoutes"));

module.exports = router;
