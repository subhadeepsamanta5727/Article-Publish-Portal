import api from "../lib/api";

/**
 * ADMIN SERVICE
 * 
 * API service for admin-only operations
 * All endpoints require admin role authentication via JWT token
 * 
 * Admin Capabilities:
 * - View and manage all articles in the system
 * - Update article review status (draft → submitted → pending → delivered/Failed)
 * - Download articles with full content + images + payment details
 * - View all user payments
 * - Manage article packages (create, update, delete, availability)
 */

/**
 * Fetch all articles for admin review
 * Returns articles submitted by all users, not just current user
 * 
 * @param {Object} params - Query/filter parameters
 * @param {number} params.skip - Pagination offset
 * @param {number} params.limit - Records per page
 * @param {string} params.articleId - Filter by article ID
 * @param {string} params.authorName - Filter by author name
 * @param {string} params.status - Filter by status (draft, submitted, etc.)
 * @param {string} params.from - Start date for date range filter
 * @param {string} params.to - End date for date range filter
 * @returns {Promise} Array of articles with user info, payment status, and timestamps
 * 
 * GET /admin/articles
 * Admin-only endpoint
 */
export const getAdminArticles = (params) =>
  api.get("/admin/articles", { params });

/**
 * Fetch admin dashboard statistics
 * Returns overview metrics for admin dashboard
 * 
 * @returns {Promise} Statistics object with:
 *   - totalArticles: Total number of articles
 *   - totalPayments: Total payment records
 *   - totalRevenue: Total amount collected
 *   - pendingReview: Articles awaiting admin decision
 * 
 * GET /admin/stats
 * Admin-only endpoint
 */
export const getAdminStats = () => api.get("/admin/stats");

/**
 * Update article review status
 * Transitions article through workflow stages during review
 * 
 * @param {string} id - Article ID
 * @param {string} status - New status value
 *   - "draft": Unsaved initial state
 *   - "payment_pending": Awaiting payment
 *   - "writing": User writing article (after payment)
 *   - "submitted": Submitted for admin review
 *   - "pending": Awaiting delivery
 *   - "delivered": Delivery completed
 *   - "Failed": Article failed
 * @returns {Promise} Updated article object with new status
 * 
 * PATCH /admin/articles/:id/status
 * Admin-only endpoint
 */
export const setArticleStatus = (id, status, details = {}) =>
  api.patch(`/admin/articles/${id}/status`, { status, ...details });

export const deliverArticle = (id, { deliveryNote, deliveryLinks, file }) => {
  const formData = new FormData();
  formData.append("deliveryNote", deliveryNote || "");
  formData.append("deliveryLinks", JSON.stringify(deliveryLinks || []));
  if (file) formData.append("file", file);
  return api.post(`/admin/articles/${id}/deliver`, formData);
};

/**
 * Fetch single article details for admin
 * Includes article content, author info, and payment records
 * 
 * @param {string} id - Article ID
 * @returns {Promise} Article object with populated relationships:
 *   - Author details with user ID
 *   - Payment record if payment completed
 *   - Package information
 *   - All article content (title, abstract, keywords, content, images, refLink)
 * 
 * GET /admin/articles/:id
 * Admin-only endpoint
 */
export const getAdminArticle = (id) => api.get(`/admin/articles/${id}`);

/**
 * Download article content PDF from admin review view
 * Returns the article content, images, and reference link without payment details
 * 
 * @param {string} id - Article ID
 * @returns {Promise<Blob>} PDF file blob for download
 *   Includes: article content, images, and refLink
 * 
 * GET /admin/articles/:id/pdf
 * Response type: "blob" (binary PDF data)
 * Admin-only endpoint
 */
export const downloadAdminArticle = (id) =>
  api.get(`/admin/articles/${id}/pdf`, { responseType: "blob" });

/**
 * Fetch all available packages
 * Returns packages for viewing and management
 * 
 * @returns {Promise} Array of package objects with:
 *   - packageId, packageName, category
 *   - description, price (in paisa)
 *   - isActive: Boolean for availability
 *   - createdAt, updatedAt timestamps
 * 
 * GET /admin/packages
 * Admin-only endpoint
 */
export const getAdminPackages = () => api.get("/admin/packages");

/**
 * Create a new package
 * Adds a new article package for users to purchase
 * 
 * @param {Object} payload - Package data
 * @param {string} payload.packageName - Display name (e.g., "Basic Article")
 * @param {string} payload.category - Category (e.g., "Standard", "Premium")
 * @param {string} payload.description - Package description
 * @param {number} payload.price - Price in INR (will be stored in paisa)
 * @param {boolean} payload.isActive - Whether package is available for purchase
 * @returns {Promise} Created package object with new packageId
 * 
 * POST /admin/packages
 * Admin-only endpoint
 */
export const createAdminPackage = (payload) =>
  api.post("/admin/packages", payload);

/**
 * Toggle package availability
 * Enables or disables a package for user purchases without deleting data
 * 
 * @param {string} packageId - Package ID to update
 * @param {boolean} isActive - New availability state
 * @returns {Promise} Updated package object
 * 
 * PATCH /admin/packages/:packageId/availability
 * Admin-only endpoint
 */
export const setPackageAvailability = (packageId, isActive) =>
  api.patch(`/admin/packages/${packageId}/availability`, { isActive });

/**
 * Update package details
 * Modifies price, description, category, and other package properties
 * 
 * @param {string} packageId - Package ID to update
 * @param {Object} payload - Fields to update
 * @param {string} payload.packageName - New package name
 * @param {string} payload.category - New category
 * @param {string} payload.description - New description
 * @param {number} payload.price - New price in INR
 * @returns {Promise} Updated package object
 * 
 * PUT /admin/packages/:packageId
 * Admin-only endpoint
 */
export const updateAdminPackage = (packageId, payload) =>
  api.put(`/admin/packages/${packageId}`, payload);

/**
 * Delete a package
 * Removes package from system (cascades to affect future purchases only)
 * Existing articles with this package retain their pricing
 * 
 * @param {string} packageId - Package ID to delete
 * @returns {Promise} Deletion confirmation
 * 
 * DELETE /admin/packages/:packageId
 * Admin-only endpoint
 */
export const deleteAdminPackage = (packageId) =>
  api.delete(`/admin/packages/${packageId}`);

export const getAdminPublishers = () => api.get("/admin/publishers");

export const createAdminPublisher = (payload) =>
  api.post("/admin/publishers", payload);

export const updateAdminPublisher = (publisherId, payload) =>
  api.put(`/admin/publishers/${publisherId}`, payload);

export const setPublisherAvailability = (publisherId, isActive) =>
  api.patch(`/admin/publishers/${publisherId}/availability`, { isActive });

export const deleteAdminPublisher = (publisherId) =>
  api.delete(`/admin/publishers/${publisherId}`);

export const getAdminTestimonials = () => api.get("/admin/testimonials");

export const createAdminTestimonial = (payload) =>
  api.post("/admin/testimonials", payload);

export const updateAdminTestimonial = (testimonialId, payload) =>
  api.put(`/admin/testimonials/${testimonialId}`, payload);

export const deleteAdminTestimonial = (testimonialId) =>
  api.delete(`/admin/testimonials/${testimonialId}`);

export const getAdminMediaPartners = () => api.get("/admin/media-partners");
export const createAdminMediaPartner = (payload) => api.post("/admin/media-partners", payload, { headers: { "Content-Type": "multipart/form-data" } });
export const updateAdminMediaPartner = (partnerId, payload) => api.put(`/admin/media-partners/${partnerId}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteAdminMediaPartner = (partnerId) => api.delete(`/admin/media-partners/${partnerId}`);
