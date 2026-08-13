/**
 * PAYMENT ROUTES
 * 
 * Handles all payment and checkout operations via Razorpay
 * All routes require authentication via JWT token
 * 
 * Endpoints:
 * - POST /create-order - Create Razorpay order (authenticated users)
 * - POST /verify - Verify payment after Razorpay completion (authenticated users)
 * - GET /history - Get current user's payment history (authenticated users)
 * - GET /admin/all-payments - Get all payments in system (admin-only)
 */
const express = require("express");

const {
  createPaymentOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments,
} = require("../controllers/paymentController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

/**
 * CREATE PAYMENT ORDER
 * 
 * Creates a Razorpay order for articles ready for checkout
 * Backend calculates total amount based on selected articles and packages
 * 
 * @route POST /payments/create-order
 * @authentication Required (JWT token)
 * @body { articleIds: ["ART-2024-001", "ART-2024-002", ...] }
 * @returns {Object} Razorpay order object with keyId, orderId, amount
 * 
 * Controller: createPaymentOrder
 * @see paymentController.js
 */
router.post(
  "/create-order",
  authMiddleware,
  createPaymentOrder
);

/**
 * VERIFY PAYMENT
 * 
 * Validates payment signature and marks payment as successful
 * Backend verifies HMAC-SHA256 signature using Razorpay webhook secret
 * Updates article status and creates Payment document if verification passes
 * 
 * @route POST /payments/verify
 * @authentication Required (JWT token)
 * @body {
 *   razorpayOrderId: string,
 *   razorpayPaymentId: string,
 *   razorpaySignature: string
 * }
 * @returns {Object} { success: boolean, message: string, paymentId: string }
 * 
 * Signature Verification:
 * - Creates HMAC-SHA256 hash of (orderId|paymentId) with webhook secret
 * - Compares against razorpaySignature
 * - Ensures payment authenticity
 * 
 * Controller: verifyPayment
 * @see paymentController.js
 */
router.post(
  "/verify",
  authMiddleware,
  verifyPayment
);

/**
 * GET USER PAYMENT HISTORY
 * 
 * Fetches payment records for currently authenticated user
 * Returns only successful/paid transactions
 * Includes article IDs, package details, and payment timestamps
 * 
 * @route GET /payments/history
 * @authentication Required (JWT token)
 * @query {number} skip - Pagination offset
 * @query {number} limit - Results per page
 * @returns {Array} Payment records for user
 * 
 * Scope: Current user only (filtered in controller via req.userId)
 * Filter: Only status = "paid" payments
 * 
 * Controller: getMyPayments
 * @see paymentController.js
 */
router.get(
  "/history",
  authMiddleware,
  getMyPayments
);

/**
 * GET ALL PAYMENTS (ADMIN ONLY)
 * 
 * Fetches ALL payment records in the system
 * Admin use for viewing all user payments and payment reports
 * Includes populated user info, articles, and packages
 * 
 * @route GET /payments/admin/all-payments
 * @authentication Required (JWT token)
 * @authorization Required (admin role)
 * @query {number} skip - Pagination offset
 * @query {number} limit - Results per page
 * @returns {Array} All payment records with user/article details
 * 
 * Scope: System-wide (all users' payments)
 * Filter: Only status = "paid" payments
 * Middleware Chain:
 * 1. authMiddleware - Verify JWT token
 * 2. authorizeRoles("admin") - Check admin role
 * 
 * Controller: getAllPayments
 * @see paymentController.js
 */
router.get(
  "/admin/all-payments",
  authMiddleware,
  authorizeRoles("admin"),
  getAllPayments
);

module.exports = router;