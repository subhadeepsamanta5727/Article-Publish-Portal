const Article = require("../Models/Article");
const Payment = require("../Models/Payment");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const {
  generateArticlePDF,
} = require("../services/pdfService");


// ======================================
// USER ARTICLE PDF
// ======================================

const downloadMyArticlePDF = asyncHandler(
  async (req, res) => {
    const { articleId } = req.params;

    const article = await Article.findOne({
      articleId,
      userId: req.user.userId,
    });

    if (!article) {
      throw new ApiError(
        404,
        "Article not found"
      );
    }

    await generateArticlePDF({
      article,
      includePayment: false,
      includeContent: true,
      includeImages: true,
      includeRefLink: true,
      res,
    });
  }
);


// ======================================
// USER PAYMENT PDF
// ======================================

const downloadMyPaymentPDF = asyncHandler(
  async (req, res) => {
    const { articleId } = req.params;

    const article = await Article.findOne({
      articleId,
      userId: req.user.userId,
    });

    if (!article) {
      throw new ApiError(
        404,
        "Article not found"
      );
    }

    const payment = await Payment.findOne({
      articleIds: article._id,
      userId: req.user.userId,
    });

    if (!payment) {
      throw new ApiError(
        404,
        "Payment not found"
      );
    }

    await generateArticlePDF({
      article,
      payment,
      includePayment: true,
      includeContent: false,
      res,
    });
  }
);

// ======================================
// ADMIN PAYMENT PDF
// ======================================

const downloadAdminPaymentPDF = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findOne({ _id: paymentId })
    .populate("articleIds", "articleId articleTitle packageId")
    .populate("packageSummary.packageId", "packageName category");

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  const article = await Article.findOne({ _id: payment.articleIds[0]._id || payment.articleIds[0] });

  if (!article) {
    throw new ApiError(404, "Payment article not found");
  }

  await generateArticlePDF({
    article,
    articleIds: payment.articleIds,
    payment,
    includePayment: true,
    includeContent: false,
    res,
  });
});

// ======================================
// ADMIN COMPLETE ARTICLE PDF
// ======================================

const downloadAdminArticlePDF = asyncHandler(
  async (req, res) => {
    const { articleId } = req.params;

    const article = await Article.findOne({
      articleId,
    });

    if (!article) {
      throw new ApiError(
        404,
        "Article not found"
      );
    }

    const payment = await Payment.findOne({
      articleIds: article._id,
    });

    await generateArticlePDF({
      article,
      payment,
      includePayment: true,
      includeContent: true,
      includeImages: true,
      includeRefLink: true,
      res,
    });
  }
);


module.exports = {
 downloadMyArticlePDF,
 downloadMyPaymentPDF,
  downloadAdminPaymentPDF,
  downloadAdminArticlePDF,
};
