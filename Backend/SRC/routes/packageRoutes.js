const express = require("express");
const { getActivePackages } = require("../controllers/packageController");

const router = express.Router();
router.get("/", getActivePackages);

module.exports = router;
