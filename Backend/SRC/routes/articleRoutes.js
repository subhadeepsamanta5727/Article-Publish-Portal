/**
 * ARTICLE ROUTES
 * 
 * User-facing article CRUD operations
 * All routes require authentication via JWT token
 * 
 * Workflow:
 * 1. POST / - User creates new article (draft status)
 * 2. PUT /:articleId - User updates article content
 * 3. POST /:articleId/generate-content - Generate AI content
 * 4. POST /:articleId/submit - Submit article for review (after payment)
 * 5. GET /my - Get all user's articles
 * 6. GET /:articleId - Get single article details
 * 
 * Note: Article submission is tied to payment workflow
 * - User must pay before submitting article for review
 * - Payment changes status to "writing"
 * - Submit endpoint changes status to "submitted"
 */
const express = require("express");

const {
  createArticle,
  getMyArticles,
  getArticleById,
  updateArticle,
  submitArticle,
  generateArticleContent,
  uploadArticleAsset,
} = require("../controllers/articleController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * CREATE ARTICLE
 * 
 * Initialize a new article document
 * Auto-generates unique articleId in format: ART-YYYY-XXXXX
 * Sets status to "draft" by default
 * Associates with current user (req.userId)
 * 
 * @route POST /articles
 * @authentication Required (JWT token)
 * @body {
 *   articleTitle?: string,
 *   keywords?: string[],
 *   abstract?: string,
 *   images?: string[],
 *   refLink?: string,
 *   content?: string,
 *   packageId?: string
 * }
 * @returns {Object} Created article object with articleId
 * 
 * Article State After Creation:
 * - status: "draft"
 * - userId: Current user's ID
 * - createdAt: Current timestamp
 * - empty/optional fields initialized
 * 
 * Controller: createArticle
 * @see articleController.js
 */
// Create article
router.post(
  "/",
  authMiddleware,
  createArticle
);

router.post(
  "/:articleId/upload",
  authMiddleware,
  uploadArticleAsset
);

/**
 * GET USER ARTICLES
 * 
 * Fetch all articles created by current user
 * Returns articles in all statuses: draft, writing, submitted, etc.
 * Populated with payment and package information
 * 
 * @route GET /articles/my
 * @authentication Required (JWT token)
 * @returns {Array} User's articles with all related data
 * 
 * Access Control: Current user only (filtered via req.userId)
 * 
 * Controller: getMyArticles
 * @see articleController.js
 */
// My articles
router.get(
  "/my",
  authMiddleware,
  getMyArticles
);

/**
 * SUBMIT ARTICLE
 * 
 * Submit article for admin review
 * Requires payment to be completed first
 * Backend validates article has valid content and payment record
 * 
 * @route POST /articles/:articleId/submit
 * @authentication Required (JWT token)
 * @param {string} articleId - Article ID to submit
 * @returns {Object} Updated article with status = "submitted"
 * 
 * Workflow:
 * 1. User pays for article (status: payment_pending → writing)
 * 2. User completes article content, images, refLink
 * 3. User clicks submit
 * 4. Status changes to "submitted"
 * 5. Article appears in admin review queue
 * 
 * Validation:
 * - User must own the article
 * - Article must have payment record
 * - Article must have content
 * 
 * Controller: submitArticle
 * @see articleController.js
 * 
 * ROUTE ORDER: Must come before /:articleId GET/PUT to match before generic param
 */
// Submit article (must come before /:articleId)
router.post(
  "/:articleId/submit",
  authMiddleware,
  submitArticle
);

/**
 * GENERATE ARTICLE CONTENT
 * 
 * AI-powered content generation using Google Gemini API
 * Generates full article body based on title, keywords, and abstract
 * Useful for users who prefer AI assistance with writing
 * 
 * @route POST /articles/:articleId/generate-content
 * @authentication Required (JWT token)
 * @param {string} articleId - Article ID to generate content for
 * @body {
 *   title: string,              // Article title for context
 *   keywords: string,           // Keywords (comma-separated or array)
 *   abstract?: string,          // Abstract/summary
 *   resourceLink?: string       // Optional reference link
 * }
 * @returns {Object} { success: boolean, content: string }
 * 
 * Process:
 * 1. Validate input parameters
 * 2. Call Google Gemini API with prompt
 * 3. Receive generated content (~max 45 seconds timeout)
 * 4. Return generated content to frontend
 * 5. Frontend updates form state with generated content
 * 
 * Timeout: 45 seconds (Gemini API default timeout)
 * 
 * Limitations:
 * - Requires Gemini API key in environment
 * - May take 10-45 seconds depending on content length
 * - Generated content quality depends on keywords provided
 * 
 * Controller: generateArticleContent
 * @see articleController.js
 * 
 * ROUTE ORDER: Must come before /:articleId GET/PUT to match before generic param
 */
// Generate article content using AI (must come before /:articleId)
router.post(
  "/:articleId/generate-content",
  authMiddleware,
  generateArticleContent
);

/**
 * GET ARTICLE DETAILS
 * 
 * Fetch single article by ID
 * Returns full article data with user and payment info
 * User can only view their own articles
 * 
 * @route GET /articles/:articleId
 * @authentication Required (JWT token)
 * @param {string} articleId - Article ID to fetch
 * @returns {Object} Article object with:
 *   - All article fields (title, keywords, content, images, refLink)
 *   - Author details
 *   - Status
 *   - Payment record (if exists)
 *   - Package details
 *   - timestamps (createdAt, updatedAt)
 * 
 * Access Control: User can only view their own articles
 * (verified in controller)
 * 
 * Controller: getArticleById
 * @see articleController.js
 */
// Get single article
router.get(
  "/:articleId",
  authMiddleware,
  getArticleById
);

/**
 * UPDATE ARTICLE
 * 
 * Update article content
 * User can edit articles in draft, payment_pending, or writing statuses
 * Updates preserved: title, keywords, abstract, content, images, refLink
 * 
 * @route PUT /articles/:articleId
 * @authentication Required (JWT token)
 * @param {string} articleId - Article ID to update
 * @body {
 *   articleTitle?: string,    // Article title
 *   keywords?: string[],      // Array of keywords
 *   abstract?: string,        // Article abstract/summary
 *   content?: string,         // Full article body
 *   images?: string[],        // Array of image URLs
 *   refLink?: string          // Reference/source link URL
 * }
 * @returns {Object} Updated article object
 * 
 * Field Mapping (IMPORTANT):
 * - images is an ARRAY (not singular imageUrl)
 * - refLink is a STRING (not resourceLink or resourceLink array)
 * 
 * Access Control:
 * - User can only update their own articles
 * - Cannot update: status, paymentId, packageId (via different endpoints)
 * - Cannot update: timestamps, articleId (immutable)
 * 
 * Validation:
 * - Keywords converted to array if comma-separated
 * - URLs validated for refLink
 * - Image URLs should be accessible
 * 
 * Controller: updateArticle
 * @see articleController.js
 */
// Save article
router.put(
  "/:articleId",
  authMiddleware,
  updateArticle
);

module.exports = router;
