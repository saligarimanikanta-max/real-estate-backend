const express = require("express");
const router = express.Router();

const { addFavourite, removeFavourite, getMyFavourites } = require("../controllers/favouriteController");
const { addFavouriteValidator } = require("../validators/favouriteValidators");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");

// Module 5 - Favourites/Saved Properties
router.post("/", protect, authorize("buyer"), addFavouriteValidator, validate, addFavourite);
router.get("/", protect, authorize("buyer"), getMyFavourites);
router.delete("/:propertyId", protect, authorize("buyer"), removeFavourite);

module.exports = router;
