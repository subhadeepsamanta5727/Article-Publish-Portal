/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Validates JWT access token in request headers
 * Extracts and verifies user identity from token payload
 * Populates req.user with decoded token data for downstream handlers
 * 
 * Usage: Applied to all protected routes to ensure user is authenticated
 * 
 * Execution Flow:
 * 1. Check for Authorization header
 * 2. Parse "Bearer {token}" format
 * 3. Verify JWT signature and expiration
 * 4. Attach decoded user data to req.user
 * 5. Pass control to next handler
 * 6. On error: Return 401 with error message
 * 
 * Token Payload (from req.user after verification):
 * - userId: User's MongoDB ID
 * - email: User's email
 * - role: User's role ("admin" or "user")
 * - iat: Issued at timestamp
 * - exp: Expiration timestamp (default: 15 minutes)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const {
  verifyAccessToken,
} = require("../utils/token");

const ApiError = require("../utils/ApiError");

const authMiddleware = (req, res, next) => {
  // ===== STEP 1: Check for Authorization Header =====
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(
      new ApiError(
        401,
        "Authorization header is required"
      )
    );
  }

  // ===== STEP 2: Parse "Bearer {token}" Format =====
  // Expected format: "Bearer eyJhbGciOiJIUzI1NiI..."
  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return next(
      new ApiError(
        401,
        "Invalid authorization format"
      )
    );
  }

  // ===== STEP 3: Verify JWT Signature and Expiration =====
  try {
    const decoded = verifyAccessToken(token);

    // ===== STEP 4: Attach User Data to Request =====
    // Decoded payload contains: userId, email, role, iat, exp
    req.user = decoded;
    
    // Store userId as convenient shorthand for controllers
    req.userId = decoded.userId;

    // ===== STEP 5: Continue to Next Handler =====
    next();
  } catch (error) {
    // ===== STEP 6: Handle Token Errors =====
    // Errors: Invalid signature, expired token, malformed token
    return next(
      new ApiError(
        401,
        "Invalid or expired access token"
      )
    );
  }
};

module.exports = authMiddleware;