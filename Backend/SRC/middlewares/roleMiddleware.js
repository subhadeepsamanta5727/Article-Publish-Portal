/**
 * ROLE-BASED AUTHORIZATION MIDDLEWARE
 * 
 * Validates user role matches required access level
 * Works in conjunction with authMiddleware (must run after authentication)
 * 
 * Usage Pattern:
 * router.get(
 *   "/admin/articles",
 *   authMiddleware,           // Step 1: Authenticate user (populates req.user)
 *   authorizeRoles("admin"),  // Step 2: Check if user has admin role
 *   controllerFunction        // Step 3: Handle request
 * );
 * 
 * Supported Roles:
 * - "admin": Full system access (article review, payment management, package management)
 * - "user": Limited access (create/edit articles, view own payments, submit articles)
 * 
 * Error Handling:
 * - 401 Unauthorized: If req.user not found (authentication failed)
 * - 403 Forbidden: If user's role not in allowedRoles
 * 
 * @param {...string} allowedRoles - Role names that have access
 * @returns {Function} Express middleware function
 * 
 * Examples:
 * authorizeRoles("admin") - Only admin users
 * authorizeRoles("admin", "moderator") - Either admin or moderator
 * authorizeRoles("user") - Only regular users
 */
const ApiError = require("../utils/ApiError");

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // ===== CHECK: User Authenticated =====
    // req.user populated by authMiddleware
    // If missing: authentication middleware was skipped or failed
    if (!req.user) {
      return next(
        new ApiError(
          401,
          "Authentication required"
        )
      );
    }

    // ===== CHECK: User Role Authorized =====
    // Compare user's role from JWT token against allowed roles
    // Case-sensitive: "admin" !== "Admin"
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "You are not authorized to access this resource"
        )
      );
    }

    // ===== PASS: User Authorized =====
    // User has authenticated and has required role
    next();
  };
};

module.exports = authorizeRoles;