const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { createContactSubmission } = require("../controllers/contactController");

const uploadDirectory = path.join(__dirname, "../../uploads/contact");
fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = /pdf|msword|officedocument|png|jpe?g/;
    if (allowedTypes.test(file.mimetype)) return callback(null, true);
    return callback(new Error("Only PDF, DOC, DOCX, PNG, and JPG files are allowed."));
  },
});

const router = express.Router();
router.post("/", upload.single("attachment"), createContactSubmission);

module.exports = router;
