const Article = require("../Models/Article");
const Payment = require("../Models/Payment");
const User = require("../Models/User");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const deliveryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const hasCloudinaryCredentials = () => [
  process.env.CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET,
].every((credential) => credential && !credential.startsWith("your_"));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const [allArticles, publishedArticles, submittedArticles, allUsers, pendingPayments, writingArticles] = await Promise.all([
    Article.countDocuments(),
    Article.countDocuments({ status: { $in: ["pending", "delivered"] } }),
    Article.countDocuments({ status: "pending" }),
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
        "pending",
        "delivered",
        "Failed",
      ],
    },
  };
  if (status && ["draft", "payment_pending", "writing", "submitted", "pending", "delivered", "Failed"].includes(status)) filter.status = status;
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
      .populate("packageId", "packageName category mediaCoverage")
      .populate("publisherId", "publisherName category")
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
    )
    .populate("packageId", "packageName category mediaCoverage")
    .populate("publisherId", "publisherName category");

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

    const { status, deliveryNote = "", deliveryLink = "" } = req.body;

    const allowedStatuses = [
      "pending",
      "delivered",
      "Failed",
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

    if (status === "delivered" && article.status !== "pending") {
      throw new ApiError(400, "Only pending articles can be marked as delivered");
    }

    if (status !== "delivered" && !["writing", "submitted", "pending"].includes(article.status)) {
      throw new ApiError(
        400,
        "Article cannot be reviewed in its current state"
      );
    }

    article.status = status;
    if (deliveryNote !== undefined) article.deliveryNote = deliveryNote.trim();
    if (deliveryLink !== undefined) article.deliveryLink = deliveryLink.trim();
    if (status === "delivered") article.deliveredAt = new Date();

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

const deliverArticle = [
  deliveryUpload.single("file"),
  asyncHandler(async (req, res) => {
    const article = await Article.findOne({ articleId: req.params.articleId });
    if (!article) throw new ApiError(404, "Article not found");
    if (article.status !== "pending") {
      throw new ApiError(400, "Only pending articles can be delivered");
    }

    let deliveryLinks = [];
    if (req.body.deliveryLinks) {
      try {
        deliveryLinks = JSON.parse(req.body.deliveryLinks);
      } catch {
        throw new ApiError(400, "Delivery links must be valid JSON");
      }
    }
    if (!Array.isArray(deliveryLinks)) {
      throw new ApiError(400, "Delivery links must be an array");
    }
    deliveryLinks = deliveryLinks.map((link) => String(link).trim()).filter(Boolean);

    if (req.file) {
      if (!hasCloudinaryCredentials()) {
        throw new ApiError(500, "Cloudinary credentials are missing. Add real CLOUDINARY values before uploading delivery files.");
      }
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "seo-deliveries", resource_type: "raw" },
          (error, result) => (error ? reject(error) : resolve(result)),
        );
        stream.end(req.file.buffer);
      });
      article.deliveryFileUrl = uploaded.secure_url;
      article.deliveryFileName = req.file.originalname;
    }

    article.deliveryNote = String(req.body.deliveryNote || "").trim();
    article.deliveryLinks = deliveryLinks;
    article.deliveryLink = deliveryLinks[0] || "";
    article.status = "delivered";
    article.deliveredAt = new Date();
    await article.save();

    res.status(200).json(new ApiResponse(200, {
      articleId: article.articleId,
      status: article.status,
      deliveryNote: article.deliveryNote,
      deliveryLinks: article.deliveryLinks,
      deliveryFileUrl: article.deliveryFileUrl,
      deliveryFileName: article.deliveryFileName,
    }, "Article delivered successfully"));
  }),
];


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
  deliverArticle,
  getPaymentDetails,
};
