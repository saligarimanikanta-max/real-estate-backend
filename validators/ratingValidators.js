const { body } = require("express-validator");

const rateAgentValidator = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be an integer between 1 and 5"),
  body("comment").optional().trim(),
];

module.exports = { rateAgentValidator };
