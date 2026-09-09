const { body, query } = require("express-validator");

const createPropertyValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("type").isIn(["sale", "rent"]).withMessage("Type must be 'sale' or 'rent'"),
  body("propertyType")
    .isIn(["apartment", "villa", "independent-house", "plot", "commercial"])
    .withMessage("Invalid property type"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("locality").optional().trim(),
  body("bedrooms").optional().isInt({ min: 0 }).withMessage("Bedrooms must be a non-negative integer"),
  body("bathrooms").optional().isInt({ min: 0 }).withMessage("Bathrooms must be a non-negative integer"),
  body("areaSqft").optional().isFloat({ min: 0 }).withMessage("Area must be a positive number"),
  body("images").optional().isArray().withMessage("Images must be an array of URLs"),
];

const updatePropertyValidator = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("type").optional().isIn(["sale", "rent"]).withMessage("Type must be 'sale' or 'rent'"),
  body("propertyType")
    .optional()
    .isIn(["apartment", "villa", "independent-house", "plot", "commercial"])
    .withMessage("Invalid property type"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("city").optional().trim().notEmpty().withMessage("City cannot be empty"),
  body("bedrooms").optional().isInt({ min: 0 }),
  body("bathrooms").optional().isInt({ min: 0 }),
  body("areaSqft").optional().isFloat({ min: 0 }),
  body("images").optional().isArray(),
];

const searchPropertyValidator = [
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("minPrice must be a positive number"),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("maxPrice must be a positive number"),
  query("bedrooms").optional().isInt({ min: 0 }).withMessage("bedrooms must be a non-negative integer"),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const verifyPropertyValidator = [
  body("action").isIn(["approve", "reject"]).withMessage("action must be 'approve' or 'reject'"),
  body("remarks").optional().trim(),
];

const updateStatusValidator = [
  body("status")
    .isIn(["Available", "Under Negotiation", "Sold", "Rented"])
    .withMessage("Invalid status value"),
];

module.exports = {
  createPropertyValidator,
  updatePropertyValidator,
  searchPropertyValidator,
  verifyPropertyValidator,
  updateStatusValidator,
};
