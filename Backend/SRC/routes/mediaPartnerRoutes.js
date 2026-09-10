const express = require("express");
const { getActiveMediaPartners } = require("../controllers/mediaPartnerController");

const router = express.Router();
router.get("/", getActiveMediaPartners);

module.exports = router;
