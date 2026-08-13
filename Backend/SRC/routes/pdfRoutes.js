/**
 * PDF DOWNLOAD ROUTES
 * 
 * Handles PDF generation and download for articles and payments
 * All routes require authentication via JWT token
 * 
 * Route Types:
 * 1. User Article PDF: Download user's own article with content, images, refLink
 * 2. User Payment PDF: Download user's payment record
 * 3. Admin Payment PDF: Download any payment record (admin-only, includes full details)
 * 
 * Response Format:
 * - Content-Type: application/pdf
 * - Content-Disposition: attachment (triggers download)
 * - Binary stream of PDF data
 */
const express = require("express");

const {
  downloadMyArticlePDF,
  downloadMyPaymentPDF,
  downloadAdminPaymentPDF,
} = require("../controllers/pdfController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

/**
 * DOWNLOAD USER ARTICLE PDF
 * 
 * Generate and download article PDF for user
 * Includes article content, images, and reference link
 * Does NOT include payment details
 * 
 * PDF Contents:
 * - Article header with ID and status badge
 * - Author details (name, email, phone)
 * - Article section with title, abstract, keywords
 * - Article content (full body text)
 * - Images (embedded as actual image data in PDF)
 * - Reference link (clickable URL)
 * - Footers with page numbers
 * 
 * @route GET /pdfs/article/:articleId
 * @authentication Required (JWT token)
 * @param {string} articleId - Article ID to download
 * @returns {Blob} PDF file stream
 * 
 * Access Control: User can only download their own articles
 * (verified in controller via userId matching)
 * 
 * Controller: downloadMyArticlePDF
 * @see pdfController.js
 */
// User Article PDF
router.get(
  "/article/:articleId",
  authMiddleware,
  downloadMyArticlePDF
);

/**
 * DOWNLOAD USER PAYMENT PDF
 * 
 * Generate and download payment record PDF for user
 * Contains payment transaction details only
 * Does NOT include article content
 * 
 * PDF Contents:
 * - Payment header
 * - Article IDs purchased
 * - Package details and quantities
 * - Total amount (in INR)
 * - Payment status (paid, failed, refunded)
 * - Razorpay order and payment IDs
 * - Transaction timestamp
 * 
 * @route GET /pdfs/payment/:articleId
 * @authentication Required (JWT token)
 * @param {string} articleId - Article ID (used to find associated payment)
 * @returns {Blob} PDF file stream
 * 
 * Access Control: User can only download payments for their own articles
 * (verified in controller)
 * 
 * Controller: downloadMyPaymentPDF
 * @see pdfController.js
 */
// User Payment PDF
router.get(
  "/payment/:articleId",
  authMiddleware,
  downloadMyPaymentPDF
);

/**
 * DOWNLOAD ADMIN PAYMENT PDF
 * 
 * Admin-only endpoint to download any payment record
 * Download includes full admin details
 * 
 * PDF Contents (same as user payment PDF):
 * - Payment details, amounts, status
 * - Article IDs and package information
 * - Razorpay transaction IDs
 * 
 * @route GET /pdfs/admin/payment-record/:paymentId
 * @authentication Required (JWT token)
 * @authorization Required (admin role)
 * @param {string} paymentId - Payment record ID (MongoDB ObjectId)
 * @returns {Blob} PDF file stream
 * 
 * Middleware Chain:
 * 1. authMiddleware - Verify JWT token
 * 2. authorizeRoles("admin") - Verify admin role
 * 
 * Access Control: Admin-only (role-based)
 * Admin can download any payment record in system
 * 
 * Controller: downloadAdminPaymentPDF
 * @see pdfController.js
 */
router.get(
  "/admin/payment-record/:paymentId",
  authMiddleware,
  authorizeRoles("admin"),
  downloadAdminPaymentPDF
);

/**
 * BACKWARD-COMPATIBLE ALIAS
 * 
 * Older frontend clients may call /pdfs/payment-record/ endpoint
 * This route provides backward compatibility by routing to same controller
 * New clients should use /pdfs/admin/payment-record/ instead
 * 
 * @route GET /pdfs/payment-record/:paymentId
 * @authentication Required (JWT token)
 * @authorization Required (admin role)
 * @deprecated Use /pdfs/admin/payment-record/:paymentId instead
 * 
 * Same behavior as /admin/payment-record/ route
 */
// Backward-compatible alias for older client calls
router.get(
  "/payment-record/:paymentId",
  authMiddleware,
  authorizeRoles("admin"),
  downloadAdminPaymentPDF
);

module.exports = router;
