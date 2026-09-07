const express = require("express");

const {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");
const csrfMiddleware = require("../middlewares/csrfMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post(
  "/refresh-token",
  csrfMiddleware,
  refreshAccessToken
);

router.post("/logout", csrfMiddleware, logout);

router.get(
  "/me",
  authMiddleware,
  getMe
);

module.exports = router;