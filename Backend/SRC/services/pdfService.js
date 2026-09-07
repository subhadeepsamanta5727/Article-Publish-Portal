const PDFDocument = require("pdfkit");

/**
 * PDF SERVICE - Article PDF Generation
 * 
 * This service handles the creation of PDF documents for articles and payments.
 * Uses PDFKit library to generate professional PDF documents with proper formatting.
 * 
 * Main Export: generateArticlePDF() - Async function to generate PDF and send to response
 */

// ===== PAGE STYLING CONSTANTS =====
const PAGE = { left: 54, right: 54, top: 58, bottom: 64 }; // Margins in points
const colors = { 
  red: "#C62828",           // Brand red for headers
  darkRed: "#8E1B1B",       // Darker red for emphasis
  ink: "#172033",           // Dark text color
  muted: "#64748B",         // Gray for secondary text
  line: "#E2E8F0",          // Light gray for dividers
  softRed: "#FFF1F1",       // Light red background
  white: "#FFFFFF" 
};

// ===== UTILITY FUNCTIONS =====
/**
 * Format date to readable string in Indian locale
 * @param {Date} value - Date to format
 * @returns {string} Formatted date string or "N/A" if no date provided
 */
const formatDate = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A";

/**
 * Fallback value handler
 * @param {*} item - Value to check
 * @returns {string} The item or "Not provided" if falsy
 */
const value = (item) => item || "Not provided";

/**
 * Draw the header section of the PDF with branding
 * Includes company name, subtitle, and decorative line
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {string} subtitle - Page subtitle to display
 */
function drawHeader(doc, subtitle) {
  const width = doc.page.width - PAGE.left - PAGE.right;
  doc.rect(0, 0, doc.page.width, 16).fill(colors.red);  // Red bar at top
  doc.fillColor(colors.red).font("Helvetica-Bold").fontSize(22).text("SEO", PAGE.left, 34);
  doc.fillColor(colors.muted).font("Helvetica").fontSize(9).text("ARTICLE PUBLISHING PORTAL", PAGE.left, 60, { characterSpacing: 1 });
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(17).text(subtitle, PAGE.left, 91);
  doc.strokeColor(colors.line).lineWidth(1).moveTo(PAGE.left, 119).lineTo(PAGE.left + width, 119).stroke();
  doc.y = 139;
}

/**
 * Ensure there's enough vertical space for content
 * Automatically adds a new page if needed, with header
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {number} height - Height needed (default 58 points)
 */
function ensureSpace(doc, height = 58) {
  if (doc.y + height > doc.page.height - PAGE.bottom) { 
    doc.addPage(); 
    drawHeader(doc, "Article document"); 
  }
}

/**
 * Add a section title with styling and underline
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {string} title - Section title text
 */
function sectionTitle(doc, title) {
  ensureSpace(doc, 40);
  doc.moveDown(0.7).fillColor(colors.red).font("Helvetica-Bold").fontSize(11).text(title.toUpperCase());
  doc.moveDown(0.25).strokeColor(colors.line).moveTo(PAGE.left, doc.y).lineTo(doc.page.width - PAGE.right, doc.y).stroke();
  doc.moveDown(0.55);
}

/**
 * Add a label-value pair (e.g., "Name: John Doe")
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {string} label - Field label
 * @param {*} content - Field value (will use value() fallback if empty)
 */
function detail(doc, label, content) {
  ensureSpace(doc, 22);
  doc.fillColor(colors.muted).font("Helvetica-Bold").fontSize(9).text(`${label}: `, { continued: true });
  doc.fillColor(colors.ink).font("Helvetica").fontSize(9).text(value(content));
  doc.moveDown(0.2);
}

/**
 * Fetch and load an image from URL into a buffer
 * Used for embedding images in PDF
 * @param {string} imageUrl - URL of the image to fetch
 * @returns {Promise<Buffer|null>} Buffer containing image data, or null if fetch fails
 */
async function loadImageBuffer(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;  // Silently fail - PDF will show URL text instead
  }
}

/**
 * Add an image block to the PDF
 * Attempts to embed the actual image; falls back to displaying URL if image can't be fetched
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {string} imageUrl - URL of the image
 * @param {number} index - Image number for labeling
 */
async function addImageBlock(doc, imageUrl, index) {
  ensureSpace(doc, 90);

  const buffer = await loadImageBuffer(imageUrl);
  if (buffer) {
    const maxWidth = doc.page.width - PAGE.left - PAGE.right;
    const imageHeight = 180;
    doc.fillColor(colors.muted).font("Helvetica-Bold").fontSize(9).text(`Image ${index + 1}`, { continued: false });
    doc.moveDown(0.35);
    doc.image(buffer, { fit: [maxWidth, imageHeight], align: "center", valign: "center" });
    doc.moveDown(0.35);
  } else {
    // Fallback: show URL if image cannot be fetched
    doc.fillColor(colors.muted).font("Helvetica-Bold").fontSize(9).text(`Image ${index + 1}`, { continued: false });
    doc.moveDown(0.2);
    doc.fillColor(colors.ink).font("Helvetica").fontSize(9).text(imageUrl, { lineBreak: true });
    doc.moveDown(0.35);
  }
}

/**
 * Add footer to all pages with page numbers and company info
 * @param {PDFDocument} doc - PDFKit document instance
 */
function addFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let page = range.start; page < range.start + range.count; page += 1) {
    doc.switchToPage(page);
    const footerY = doc.page.height - 42;
    doc.strokeColor(colors.line).lineWidth(0.7).moveTo(PAGE.left, footerY - 10).lineTo(doc.page.width - PAGE.right, footerY - 10).stroke();
    doc.fillColor(colors.muted).font("Helvetica").fontSize(8).text("SEO - Article Publishing Portal", PAGE.left, footerY, { lineBreak: false });
    doc.text(`Page ${page + 1} of ${range.count}`, PAGE.left, footerY, { align: "right", width: doc.page.width - PAGE.left - PAGE.right, lineBreak: false });
  }
}

/**
 * MAIN PDF GENERATOR FUNCTION
 * 
 * Generates a formatted PDF document for articles and/or payments
 * Supports conditional inclusion of content, images, and payment details
 * 
 * @param {Object} params - Configuration object
 * @param {Object} params.article - Article document from database
 * @param {Array} params.articleIds - Array of article references (for payment PDFs)
 * @param {Object} params.payment - Payment document from database (optional)
 * @param {boolean} params.includePayment - Include payment details section (default: false)
 * @param {boolean} params.includeContent - Include article content body (default: true)
 * @param {boolean} params.includeImages - Embed article images (default: false)
 * @param {boolean} params.includeRefLink - Include reference link section (default: false)
 * @param {Object} params.res - Express response object (for streaming PDF to client)
 * 
 * @returns {Promise<void>} PDF is streamed to response
 * 
 * USAGE EXAMPLES:
 * 1. User download article PDF: includeContent=true, includeImages=true, includeRefLink=true, includePayment=false
 * 2. User download payment PDF: includePayment=true, includeContent=false
 * 3. Admin download article PDF: includeContent=true, includeImages=true, includeRefLink=true, includePayment=false
 * 4. Admin download payment PDF: includePayment=true, includeContent=false
 */
const generateArticlePDF = async ({ article, articleIds = [], payment = null, includePayment = false, includeContent = true, includeImages = false, includeRefLink = false, res }) => {
  // Initialize PDF document with metadata
  const doc = new PDFDocument({ 
    margin: PAGE.left, 
    size: "A4", 
    bufferPages: true,  // Buffer pages to allow footer addition
    info: { 
      Title: article.articleTitle || article.articleId, 
      Author: "SEO" 
    } 
  });
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${article.articleId}.pdf"`);
  doc.pipe(res);  // Stream PDF to response

  // ===== PAGE 1: ARTICLE HEADER =====
  drawHeader(doc, "Article submission");
  
  // Article ID badge
  doc.roundedRect(PAGE.left, doc.y, doc.page.width - PAGE.left - PAGE.right, 46, 8).fill(colors.softRed);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(10).text(article.articleId, PAGE.left + 14, doc.y + 11);
  doc.fillColor(colors.muted).font("Helvetica").fontSize(9).text(`Status: ${(article.status || "draft").replaceAll("_", " ")}`, PAGE.left + 14, doc.y + 27);
  doc.y += 57;

  // ===== PAYMENT-ONLY PDF (for payment record downloads) =====
  if (includePayment && !includeContent) {
    sectionTitle(doc, "Payment details");
    detail(doc, "Article IDs", articleIds.map((id) => id.articleId || id).join(", "));
    detail(doc, "Article quantity", payment?.articleIds?.length || payment?.packageSummary?.reduce((total, item) => total + Number(item.quantity || 0), 0));
    if (payment?.packageSummary?.length) detail(doc, "Packages", payment.packageSummary.map((item) => `${item.packageName} · ${item.packageId?.category || "Category unavailable"} × ${item.quantity}`).join(", "));
    if (payment?.publisherSummary?.length) detail(doc, "Publishers", payment.publisherSummary.map((item) => `${item.publisherName} · ${item.publisherId?.category || "Category unavailable"} × ${item.quantity}`).join(", "));
    detail(doc, "Amount", `INR ${(payment.amount / 100).toFixed(2)}`); 
    detail(doc, "Currency", payment.currency); 
    detail(doc, "Status", payment.status);
    detail(doc, "Order ID", payment.razorpayOrderId); 
    detail(doc, "Payment ID", payment.razorpayPaymentId); 
    detail(doc, "Paid at", formatDate(payment.paidAt));
    addFooters(doc);
    doc.end();
    return;  // Exit early for payment-only PDFs
  }

  // ===== FULL ARTICLE PDF =====
  
  // Author details section
  sectionTitle(doc, "Author details");
  detail(doc, "Name", article.author?.name);
  detail(doc, "Email", article.author?.email);
  detail(doc, "Phone", article.author?.phone);

  // Main article section
  sectionTitle(doc, "Article");
  ensureSpace(doc, 44);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(16).text(article.articleTitle || "Untitled article");
  
  // Optional: Article abstract
  if (article.abstract) {
    doc.moveDown(0.8);
    doc.fillColor(colors.red).font("Helvetica-Bold").fontSize(10).text("ABSTRACT");
    doc.moveDown(0.25);
    doc.fillColor(colors.ink).font("Helvetica").fontSize(10).text(article.abstract, { lineGap: 3 });
  }
  
  // Optional: Keywords
  if (article.keywords?.length) {
    doc.moveDown(0.8);
    doc.fillColor(colors.red).font("Helvetica-Bold").fontSize(10).text("KEYWORDS");
    doc.moveDown(0.25);
    doc.fillColor(colors.ink).font("Helvetica").fontSize(10).text(article.keywords.join("  |  "));
  }
  
  // Optional: Full article content
  if (includeContent && article.content) {
    sectionTitle(doc, "Article content");
    doc.fillColor(colors.ink).font("Helvetica").fontSize(10.5).text(article.content, { lineGap: 5, align: "justify" });
  }

  // Optional: Embedded images
  if (includeImages && article.images?.length) {
    sectionTitle(doc, "Images");
    for (const [index, imageUrl] of article.images.entries()) {
      await addImageBlock(doc, imageUrl, index);
    }
  }

  // Optional: Reference link
  if (includeRefLink && article.refLink) {
    sectionTitle(doc, "Reference link");
    ensureSpace(doc, 30);
    doc.fillColor(colors.ink).font("Helvetica").fontSize(9).text(article.refLink, { lineBreak: true, link: article.refLink });
    doc.moveDown(0.5);
  }

  if (article.articlePdfUrl) {
    sectionTitle(doc, "Attached article PDF");
    ensureSpace(doc, 30);
    doc.fillColor(colors.ink).font("Helvetica").fontSize(9).text("Open the user-uploaded article PDF", { link: article.articlePdfUrl, underline: true });
    doc.moveDown(0.5);
  }

  // Optional: Payment details (added on separate page if payment record exists)
  if (includePayment && payment) {
    doc.addPage(); 
    drawHeader(doc, "Payment record");
    sectionTitle(doc, "Payment details");
    detail(doc, "Article IDs", articleIds.map((id) => id.articleId || id).join(", "));
    detail(doc, "Article quantity", payment.articleIds?.length || payment.packageSummary?.reduce((total, item) => total + Number(item.quantity || 0), 0));
    if (payment.packageSummary?.length) detail(doc, "Packages", payment.packageSummary.map((item) => `${item.packageName} (${item.packageId?.category || "N/A"}) x${item.quantity}`).join(", "));
    if (payment.publisherSummary?.length) detail(doc, "Publishers", payment.publisherSummary.map((item) => `${item.publisherName} (${item.publisherId?.category || "N/A"}) x${item.quantity}`).join(", "));
    detail(doc, "Amount", `INR ${(payment.amount / 100).toFixed(2)}`); 
    detail(doc, "Currency", payment.currency); 
    detail(doc, "Status", payment.status);
    detail(doc, "Order ID", payment.razorpayOrderId); 
    detail(doc, "Payment ID", payment.razorpayPaymentId); 
    detail(doc, "Paid at", formatDate(payment.paidAt));
  }

  // Add footer to all pages and finalize PDF
  addFooters(doc);
  doc.end();  // Finish PDF stream
};

module.exports = { generateArticlePDF };
