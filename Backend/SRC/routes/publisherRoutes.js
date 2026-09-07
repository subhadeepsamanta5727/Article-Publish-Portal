const express = require("express");
const { getActivePublishers } = require("../controllers/publisherController");

const router = express.Router();
router.get("/", getActivePublishers);

module.exports = router;
