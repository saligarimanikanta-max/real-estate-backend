const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");
const { registerValidator, loginValidator } = require("../validators/authValidators");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");

// Module 1 - User Registration & Authentication
router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/me", protect, getMe);

module.exports = router;
