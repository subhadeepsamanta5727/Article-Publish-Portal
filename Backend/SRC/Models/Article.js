const mongoose = require("mongoose");

/**
 * ARTICLE SCHEMA
 * 
 * Represents an article submission in the system.
 * One document represents one article submission. A checkout can contain many
 * of these documents, each with its own selected package.
 * 
 * Key Fields:
 * - articleId: Unique identifier generated in format ART-YYYY-XXXXX
 * - userId: Reference to the user who submitted the article
 * - packageId: Reference to the package selected at submission
 * - packagePrice: Preserved price at submission time (prevents price changes from affecting existing submissions)
 * - author: Article author details (name, email, phone)
 * - Article Content: title, keywords, abstract, content, images, refLink
 * - status: Workflow status (draft → payment_pending → writing → submitted → pending → delivered/Failed)
 * 
 * Timestamps: Auto-updated createdAt, updatedAt fields
 */
const articleSchema = new mongoose.Schema(
  {
    // ===== UNIQUE IDENTIFIERS =====
    articleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // ===== RELATIONSHIPS =====
    /**
     * User who submitted this article
     * Indexed for fast filtering by user
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * Package selected at submission time
     * Indexed for fast filtering by package
     */
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      index: true,
    },

    /**
     * Preserve the package price at creation so a later package-price
     * change cannot alter an already-created submission's checkout amount.
     */
    packagePrice: { type: Number, default: 0, min: 0 },
    packageCostPrice: { type: Number, default: 0, min: 0 },
    publisherId: { type: mongoose.Schema.Types.ObjectId, ref: "Publisher", default: null, index: true },
    publisherPrice: { type: Number, default: 0, min: 0 },
    publisherCostPrice: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR", uppercase: true },

    /**
     * Payment record reference - populated after successful payment
     * Indexed for fast lookup of payment status
     */
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
      index: true,
    },

    // ===== AUTHOR INFORMATION =====
    author: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, default: "", trim: true },
    },

    // ===== ARTICLE CONTENT =====
    /**
     * Article title/heading
     * Editable after payment completion
     */
    articleTitle: { type: String, trim: true, default: "" },

    /**
     * Array of search keywords (comma-separated at input, stored as array)
     * Used for SEO and categorization
     */
    keywords: { type: [String], default: [] },

    /**
     * Article summary/abstract
     * Optional field for article overview
     */
    abstract: { type: String, default: "" },

    /**
     * Array of image URLs
     * Multiple images can be associated with one article
     * Images are embedded in downloaded PDFs when includeImages flag is true
     */
    images: { type: [String], default: [] },

    /**
     * Reference/source link for the article
     * Single URL that provides context or source material
     * Displayed as clickable link in PDFs
     */
    refLink: { type: String, default: "" },
    articlePdfUrl: { type: String, default: "" },

    /**
     * Full article content/body text
     * Editable after payment, included in PDF when includeContent flag is true
     */
    content: { type: String, default: "" },

    // ===== STATUS FIELDS =====
    /**
     * Workflow status of the article
     * Enum values represent different stages in the article lifecycle:
     * - draft: Initial unpaid state
     * - payment_pending: Awaiting payment verification
     * - writing: User is writing/editing article
     * - submitted: Article submitted for review
    * - pending: Awaiting admin delivery
    * - delivered: Delivery completed
    * - Failed: Admin marked the submission as failed
     */
    status: {
      type: String,
      enum: [
        "draft",
        "payment_pending",
        "writing",
        "submitted",
        "pending",
        "delivered",
        "Failed",
      ],
      default: "draft",
      index: true,
    },

    /**
     * Date when article was submitted for review
     * Null until user submits the article
     */
    submittedAt: { type: Date, default: null },
    deliveryNote: { type: String, default: "", trim: true },
    deliveryLink: { type: String, default: "", trim: true },
    deliveryLinks: { type: [String], default: [] },
    deliveryFileUrl: { type: String, default: "", trim: true },
    deliveryFileName: { type: String, default: "", trim: true },
    deliveredAt: { type: Date, default: null },

    /**
     * Payment status separate from main status
     * Tracks: pending (no payment yet), paid (payment confirmed), failed, refunded
     */
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }, // Auto-add createdAt, updatedAt
);

// ===== INDEXES =====
// Composite index for common queries (user + creation date)
articleSchema.index({ userId: 1, createdAt: -1 });
// Composite index for filtering by package
articleSchema.index({ packageId: 1, createdAt: -1 });

module.exports = mongoose.model("Article", articleSchema);
