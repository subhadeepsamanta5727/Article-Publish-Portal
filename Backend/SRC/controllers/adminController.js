const Article = require("../Models/Article");
const Payment = require("../Models/Payment");
const User = require("../Models/User");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const getDashboardStats = asyncHandler(async (req, res) => {
  const [allArticles, publishedArticles, submittedArticles, allUsers, pendingPayments, writingArticles] = await Promise.all([
    Article.countDocuments(),
    Article.countDocuments({ status: "accepted" }),
    Article.countDocuments({ status: { $in: ["submitted", "under_review"] } }),
    User.countDocuments(),
    Article.countDocuments({ paymentStatus: "pending" }),
    Article.countDocuments({ status: "writing" }),
  ]);
  res.status(200).json(new ApiResponse(200, { allArticles, publishedArticles, submittedArticles, allUsers, pendingPayments, writingArticles }, "Admin dashboard statistics fetched successfully"));
});


// ======================================
// GET SUBMITTED ARTICLES
// ======================================

const getSubmittedArticles = asyncHandler(async (req, res) => {
  const {
    articleId,
    authorName,
    status,
    fromDate,
    toDate,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {
    status: {
      $in: [
        "draft",
        "payment_pending",
        "writing",
        "submitted",
        "under_review",
        "accepted",
        "rejected",
      ],
    },
  };
  if (status && ["draft", "payment_pending", "writing", "submitted", "under_review", "accepted", "rejected"].includes(status)) filter.status = status;
  if (authorName) filter["author.name"] = { $regex: authorName, $options: "i" };

  // Article ID search
  if (articleId) {
    filter.articleId = {
      $regex: articleId,
      $options: "i",
    };
  }

  // Date filter
  if (fromDate || toDate) {
    filter.submittedAt = {};

    if (fromDate) {
      filter.submittedAt.$gte = new Date(
        `${fromDate}T00:00:00.000Z`
      );
    }

    if (toDate) {
      const endDate = new Date(
        `${toDate}T23:59:59.999Z`
      );

      filter.submittedAt.$lte = endDate;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .populate(
        "userId",
        "name email phone"
      )
      .populate(
        "paymentId",
        "amount currency status razorpayOrderId razorpayPaymentId paidAt"
      )
      .sort({
        submittedAt: -1,
      })
      .skip(skip)
      .limit(Number(limit)),

    Article.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        articles,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(
            total / Number(limit)
          ),
        },
      },
      "Submitted articles fetched successfully"
    )
  );
});


// ======================================
// GET ARTICLE DETAILS
// ======================================

const getArticleDetails = asyncHandler(async (req, res) => {
  const { articleId } = req.params;

  const article = await Article.findOne({
    articleId,
  })
    .populate(
      "userId",
      "name email phone role"
    )
    .populate(
      "paymentId",
      "amount currency status razorpayOrderId razorpayPaymentId paidAt createdAt"
    );

  if (!article) {
    throw new ApiError(
      404,
      "Article not found"
    );
  }

  res.status(200).json(
    new ApiResponse(
      200,
      article,
      "Article details fetched successfully"
    )
  );
});


// ======================================
// UPDATE ARTICLE STATUS
// ======================================

const updateArticleStatus = asyncHandler(
  async (req, res) => {
    const { articleId } = req.params;

    const { status } = req.body;

    const allowedStatuses = [
      "under_review",
      "accepted",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        400,
        "Invalid article status"
      );
    }

    const article = await Article.findOne({
      articleId,
    });

    if (!article) {
      throw new ApiError(
        404,
        "Article not found"
      );
    }

    if (
      article.status !== "writing" &&
      article.status !== "submitted" &&
      article.status !== "under_review"
    ) {
      throw new ApiError(
        400,
        "Article cannot be reviewed in its current state"
      );
    }

    article.status = status;

    await article.save();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          articleId: article.articleId,
          status: article.status,
        },
        "Article status updated successfully"
      )
    );
  }
);


// ======================================
// GET PAYMENT DETAILS
// ======================================

const getPaymentDetails = asyncHandler(
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

    if (!payment) {
      throw new ApiError(
        404,
        "Payment not found"
      );
    }

    res.status(200).json(
      new ApiResponse(
        200,
        payment,
        "Payment details fetched successfully"
      )
    );
  }
);


module.exports = {
  getDashboardStats,
  getSubmittedArticles,
  getArticleDetails,
  updateArticleStatus,
  getPaymentDetails,
};
