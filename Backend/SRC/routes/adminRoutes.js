const express = require("express");

const {
  getSubmittedArticles,
  getArticleDetails,
  updateArticleStatus,
  deliverArticle,
  getPaymentDetails,
  getDashboardStats,
} = require("../controllers/adminController");
const {
  getAllPackages,
  createPackage,
  updatePackage,
  setPackageAvailability,
  deletePackage,
} = require("../controllers/packageController");
const {
  getAllPublishers,
  createPublisher,
  updatePublisher,
  setPublisherAvailability,
  deletePublisher,
} = require("../controllers/publisherController");
const {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonialController");
const {
  getAllMediaPartners,
  createMediaPartner,
  updateMediaPartner,
  deleteMediaPartner,
} = require("../controllers/mediaPartnerController");
const { logoUpload } = require("../controllers/mediaPartnerController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const {
  downloadAdminArticlePDF,
} = require("../controllers/pdfController");

const router = express.Router();


// ======================================
// ADMIN PROTECTED ROUTES
// ======================================

router.use(
  authMiddleware,
  authorizeRoles("admin")
);

// Package catalogue management. Package price is calculated on the server
// from costPrice, margin, and marginCategory.
router.get("/packages", getAllPackages);
router.get("/stats", getDashboardStats);
router.post("/packages", createPackage);
router.put("/packages/:packageId", updatePackage);
router.patch("/packages/:packageId/availability", setPackageAvailability);
router.delete("/packages/:packageId", deletePackage);
router.get("/publishers", getAllPublishers);
router.post("/publishers", createPublisher);
router.put("/publishers/:publisherId", updatePublisher);
router.patch("/publishers/:publisherId/availability", setPublisherAvailability);
router.delete("/publishers/:publisherId", deletePublisher);
router.get("/testimonials", getAllTestimonials);
router.post("/testimonials", createTestimonial);
router.put("/testimonials/:testimonialId", updateTestimonial);
router.delete("/testimonials/:testimonialId", deleteTestimonial);
router.get("/media-partners", getAllMediaPartners);
router.post("/media-partners", logoUpload.single("logo"), createMediaPartner);
router.put("/media-partners/:partnerId", logoUpload.single("logo"), updateMediaPartner);
router.delete("/media-partners/:partnerId", deleteMediaPartner);


// Submitted articles
router.get(
  "/articles",
  getSubmittedArticles
);


// Article details
router.get(
  "/articles/:articleId",
  getArticleDetails
);


// Update article status
router.patch(
  "/articles/:articleId/status",
  updateArticleStatus
);
router.post(
  "/articles/:articleId/deliver",
  deliverArticle
);


// Payment details
router.get(
  "/articles/:articleId/payment",
  getPaymentDetails
);
router.get(
  "/articles/:articleId/pdf",
  downloadAdminArticlePDF
);

module.exports = router;
