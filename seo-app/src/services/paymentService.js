import api from "../lib/api";

/**
 * PAYMENT SERVICE
 * 
 * API service for payment and checkout operations
 * Handles Razorpay payment integration
 * 
 * Payment Flow:
 * 1. createOrder() - Backend creates Razorpay order
 * 2. User pays through Razorpay modal (on frontend)
 * 3. verifyPayment() - Backend verifies payment signature and updates database
 * 4. User redirected to success page
 */

/**
 * Create a Razorpay payment order
 * Calculates total price from selected articles and their packages
 * 
 * @param {Array<string>} articleIds - Array of article IDs to pay for (all articles in one checkout)
 * @returns {Promise} Response with Razorpay order object
 * @returns {object} Response data includes:
 *   - razorpayOrderId: Razorpay order ID for payment modal
 *   - amount: Total amount in paisa (smallest currency unit)
 *   - currency: "INR"
 *   - articleIds: Confirmed article references
 * 
 * POST /payments/create-order
 * Body: { articleIds: ["ART-2024-001", "ART-2024-002", ...] }
 */
export const createOrder = (articleIds) =>
  api.post("/payments/create-order", { articleIds });

/**
 * Verify payment after Razorpay payment completion
 * Validates payment signature and marks payment as successful
 * 
 * @param {Object} payload - Razorpay payment verification data
 * @param {string} payload.razorpayOrderId - Razorpay order ID
 * @param {string} payload.razorpayPaymentId - Razorpay payment ID
 * @param {string} payload.razorpaySignature - Payment signature for verification
 * @returns {Promise} Response with:
 *   - success: Boolean indicating if verification passed
 *   - message: Status message
 *   - Payment record ID for future reference
 * 
 * POST /payments/verify
 * Validates HMAC-SHA256 signature using backend secret key
 */
export const verifyPayment = (payload) => api.post("/payments/verify", payload);

/**
 * Fetch payment history for current user
 * Returns only paid/successful payments for the authenticated user
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.skip - Number of records to skip (pagination)
 * @param {number} params.limit - Number of records to fetch per page
 * @param {string} params.search - Optional: search by payment ID or article ID
 * @returns {Promise} Array of payment records with:
 *   - paymentId, razorpayOrderId, razorpayPaymentId
 *   - amount (in paisa), currency
 *   - status: "paid", "failed", "refunded", etc.
 *   - articleIds array with article details
 *   - paidAt timestamp
 *   - User-level only (no sensitive admin info)
 * 
 * GET /payments/history
 * Filtered: Only payments where status = "paid"
 * User scope: Current authenticated user only
 */
export const getPayments = (params) => api.get("/payments/history", { params });

/**
 * Fetch all payments (ADMIN ONLY)
 * Returns all payments in the system with full details
 * Requires admin role authentication
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.skip - Pagination offset
 * @param {number} params.limit - Pagination limit
 * @param {string} params.search - Optional search filter
 * @returns {Promise} Array of payment records with populated:
 *   - userId with user details (name, email)
 *   - articleIds with article details (title, ID)
 *   - packageSummary with package names and categories
 *   - All Razorpay transaction details
 * 
 * GET /payments/admin/all-payments
 * Admin-only endpoint (requires admin role)
 * Filtered: Only payments where status = "paid"
 */
export const getAllPayments = (params) =>
  api.get("/payments/admin/all-payments", { params });
