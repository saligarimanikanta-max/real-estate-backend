const { body } = require("express-validator");

const addFavouriteValidator = [
  body("propertyId").isMongoId().withMessage("A valid propertyId is required"),
];

module.exports = { addFavouriteValidator };
