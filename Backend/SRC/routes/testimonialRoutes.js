const express = require("express");
const { getActiveTestimonials } = require("../controllers/testimonialController");

const router = express.Router();
router.get("/", getActiveTestimonials);

module.exports = router;
