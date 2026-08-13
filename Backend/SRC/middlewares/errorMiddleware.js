/**
 * ERROR HANDLING MIDDLEWARE
 * 
 * Global error handler for Express application
 * Catches all errors from controllers and other middleware
 * Converts errors to standardized JSON response format
 * 
 * Must be registered LAST in middleware chain:
 * app.use(authMiddleware);
 * app.use(roleMiddleware);
 * app.use(controllerRoutes);
 * app.use(errorMiddleware);  // Must be last!
 * 
 * Error Handling Strategy:
 * 1. ApiError instances: Return statusCode and message from error object
 * 2. Other errors: Return 500 with "Internal Server Error"
 * 3. Log all errors to console for debugging
 * 
 * Response Format (Standardized):
 * {
 *   "success": false,
 *   "message": "Error description",
 *   "errors": []  // Detailed error array if provided
 * }
 * 
 * Common HTTP Status Codes:
 * - 400 Bad Request: Invalid input/validation error
 * - 401 Unauthorized: Authentication failed
 * - 403 Forbidden: Authorization failed (role check)
 * - 404 Not Found: Resource not found
 * - 409 Conflict: Duplicate entry/resource already exists
 * - 500 Internal Server Error: Unexpected server error
 * 
 * @param {Error} err - Error object (from thrown error or AsyncHandler)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (not used in error middleware)
 */
const errorMiddleware = (err, req, res, next) => {
  // ===== LOG ERROR =====
  // Log full error to console for debugging and monitoring
  console.error(err);

  // ===== DETERMINE STATUS CODE =====
  // Use error's statusCode if ApiError, default to 500
  const statusCode = err.statusCode || 500;

  // ===== SEND ERROR RESPONSE =====
  // Standardized JSON response format for all errors
  res.status(statusCode).json({
    success: false,                           // Indicates API call failed
    message: err.message || "Internal Server Error",  // Error description
    errors: err.errors || [],                 // Detailed error information (if applicable)
  });
};

module.exports = errorMiddleware;