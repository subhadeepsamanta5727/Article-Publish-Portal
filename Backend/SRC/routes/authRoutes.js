const express = require("express");

const {
  register,
  login,
  refreshAccessToken,
  getMe,
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post(
  "/refresh-token",
  refreshAccessToken
);

router.get(
  "/me",
  authMiddleware,
  getMe
);

module.exports = router;