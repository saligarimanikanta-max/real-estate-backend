const { body } = require("express-validator");

const createEnquiryValidator = [
  body("propertyId").isMongoId().withMessage("A valid propertyId is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
];

const updateEnquiryStatusValidator = [
  body("status")
    .isIn(["New", "Contacted", "In Progress", "Closed"])
    .withMessage("Invalid enquiry status"),
];

module.exports = { createEnquiryValidator, updateEnquiryStatusValidator };
