import api from "../lib/api";

/**
 * ARTICLE SERVICE
 * 
 * API service for article-related operations
 * All functions return Promise with API response data
 * 
 * Endpoints Reference:
 * - Backend base URL: http://localhost:5000/api
 * - All requests include JWT token from localStorage (set in api.js interceptor)
 */

/**
 * Create a new article
 * Initializes article with draft status and basic information
 * 
 * @param {Object} payload - Article creation data
 * @param {string} payload.articleTitle - Article title (optional initially)
 * @param {Array} payload.keywords - Search keywords array
 * @param {string} payload.abstract - Brief summary
 * @param {Array} payload.images - Image URLs array
 * @param {string} payload.refLink - Reference link
 * @param {string} payload.content - Full article content
 * @param {string} payload.packageId - Selected package ID
 * @returns {Promise} Response with created article data including articleId
 * 
 * POST /articles
 */
export const createArticle = (payload) => api.post("/articles", payload);

/**
 * Fetch all articles for current user
 * Returns articles with statuses: draft, writing, submitted, under_review, published, failed
 * 
 * @returns {Promise} Array of articles with populated paymentId and packageId
 * 
 * GET /articles/my
 */
export const getMyArticles = () => api.get("/articles/my");

/**
 * Fetch single article by ID
 * Populated with user and package details
 * 
 * @param {string} id - Article ID (e.g., "ART-2024-001")
 * @returns {Promise} Article object with all fields
 * 
 * GET /articles/:id
 */
export const getArticle = (id) => api.get(`/articles/${id}`);

/**
 * Update article content
 * Allowed for draft, payment_pending, and writing statuses
 * Updates: title, keywords, abstract, content, images, refLink
 * 
 * @param {string} id - Article ID
 * @param {Object} payload - Updated article fields
 * @returns {Promise} Updated article object
 * 
 * PUT /articles/:id
 */
export const updateArticle = (id, payload) =>
  api.put(`/articles/${id}`, payload);

/**
 * Submit article for review
 * Changes status from "writing" to "submitted"
 * Called after payment successful
 * 
 * @param {string} id - Article ID
 * @returns {Promise} Updated article with submitted status
 * 
 * POST /articles/:id/submit
 */
export const submitArticle = (id) => api.post(`/articles/${id}/submit`);

/**
 * Generate article content using AI (Gemini)
 * Creates full article body based on title, keywords, and abstract
 * 
 * @param {string} id - Article ID
 * @param {Object} payload - Generation parameters
 * @param {string} payload.articleTitle - Article title to use for generation
 * @param {string} payload.keywords - Keywords to incorporate
 * @param {string} payload.abstract - Abstract to expand on
 * @returns {Promise} Response with generated content
 * 
 * POST /articles/:id/generate-content
 */
export const generateArticleContent = (id, payload) =>
  api.post(`/articles/${id}/generate-content`, payload);

/**
 * Get full URL for article PDF
 * Used to generate direct download links or preview URLs
 * Note: Can return 404 if PDF generation fails
 * 
 * @param {string} id - Article ID
 * @returns {string} Full URL to PDF endpoint
 */
export const articlePdfUrl = (id) =>
  `${api.defaults.baseURL}/pdfs/article/${id}`;

/**
 * Download article PDF file
 * Returns blob for download in browser
 * Includes: article content, images, reference link (NO payment details)
 * 
 * @param {string} id - Article ID
 * @returns {Promise<Blob>} PDF file blob (use in downloadFile helper)
 * 
 * GET /pdfs/article/:id
 * Response type: "blob" (binary PDF data)
 */
export const downloadArticlePdf = (id) =>
  api.get(`/pdfs/article/${id}`, { responseType: "blob" });

/**
 * Download payment record PDF file
 * Returns blob for download in browser
 * Includes: payment details, article IDs, package info, payment transaction details
 * 
 * @param {string} paymentId - Payment record ID
 * @returns {Promise<Blob>} PDF file blob
 * 
 * GET /pdfs/admin/payment-record/:paymentId
 * Response type: "blob" (binary PDF data)
 * Admin-only endpoint (requires admin role)
 */
export const downloadPaymentPdf = (paymentId) =>
  api.get(`/pdfs/admin/payment-record/${paymentId}`, { responseType: "blob" });
