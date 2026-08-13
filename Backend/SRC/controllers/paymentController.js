const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Article = require("../Models/Article");
const Payment = require("../Models/Payment");
const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const createPaymentOrder = asyncHandler(async (req, res) => {
  // articleId remains supported for an existing single-article client.
  const requestedIds = Array.isArray(req.body.articleIds)
    ? req.body.articleIds
    : req.body.articleId ? [req.body.articleId] : [];
  const articleIds = [...new Set(requestedIds.map((id) => String(id).trim()).filter(Boolean))];

  if (!articleIds.length) throw new ApiError(400, "At least one article ID is required");

  const articles = await Article.find({ articleId: { $in: articleIds }, userId: req.user.userId })
    .populate("packageId", "packageName currency");

  if (articles.length !== articleIds.length) throw new ApiError(404, "One or more articles were not found");
  
  // Validate no articles are already paid
  if (articles.some((article) => article.paymentStatus === "paid")) {
    throw new ApiError(400, "Payment is already completed for one or more articles");
  }
  
  // Validate all articles have required price field
  const articlesWithoutPrice = articles.filter((a) => !a.packagePrice || a.packagePrice < 0);
  if (articlesWithoutPrice.length > 0) {
    throw new ApiError(400, "One or more articles have invalid pricing information");
  }
  
  // Validate currency consistency
  const currencies = [...new Set(articles.map((a) => a.currency))];
  if (currencies.length > 1) {
    throw new ApiError(400, "All articles must have the same currency");
  }
  
  if (articles.some((article) => article.currency !== "INR")) {
    throw new ApiError(400, "Only INR packages are currently supported for Razorpay checkout");
  }

  // Prices are captured when an article is created, in rupees. Razorpay accepts paise.
  const totalInRupees = articles.reduce((total, article) => total + article.packagePrice, 0);
  const amount = Math.round(totalInRupees * 100);
  
  if (!Number.isSafeInteger(amount) || amount < 100) {
    throw new ApiError(400, `Invalid payment amount calculated: ₹${totalInRupees}. Minimum is ₹1.`);
  }

  const summaries = new Map();
  articles.forEach((article) => {
    const packageKey = String(article.packageId._id);
    const current = summaries.get(packageKey);
    if (current) current.quantity += 1;
    else summaries.set(packageKey, {
      packageId: article.packageId._id,
      packageName: article.packageId.packageName,
      unitPrice: article.packagePrice,
      quantity: 1,
    });
  });
  const packageSummary = [...summaries.values()];

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `ink-${Date.now()}`,
      notes: { articleIds: articleIds.join(","), userId: req.user.userId.toString() },
    });

    const payment = await Payment.create({
      userId: req.user.userId,
      articleIds: articles.map((article) => article._id),
      packageSummary,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "created",
    });

    await Article.updateMany(
      { _id: { $in: articles.map((article) => article._id) } },
      { $set: { paymentId: payment._id, status: "payment_pending" } }
    );

    res.status(201).json(new ApiResponse(201, {
      orderId: order.id,
      amount: order.amount,
      totalInRupees,
      currency: order.currency,
      articleIds,
      totalArticles: articles.length,
      packages: packageSummary,
      keyId: process.env.RAZORPAY_KEY_ID,
    }, "Payment order created successfully"));
  } catch (razorpayError) {
    console.error("Razorpay order creation failed:", razorpayError.message);
    throw new ApiError(500, `Payment gateway error: ${razorpayError.message || "Failed to create payment order"}`);
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, "Payment verification data is incomplete");
  }

  const payment = await Payment.findOne({ razorpayOrderId, userId: req.user.userId });
  if (!payment) {
    throw new ApiError(404, "Payment record not found. Please try creating a new payment order.");
  }

  try {
    const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
    
    if (generatedSignature !== razorpaySignature) {
      payment.status = "failed";
      await payment.save();
      console.error("Payment signature verification failed for order:", razorpayOrderId);
      throw new ApiError(400, "Payment verification failed. The payment may have been tampered with.");
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    payment.paidAt = new Date();
    await payment.save();

    const result = await Article.updateMany(
      { _id: { $in: payment.articleIds } },
      { $set: { paymentStatus: "paid", status: "writing", paymentId: payment._id } }
    );
    
    if (!result.matchedCount) {
      throw new ApiError(404, "Articles linked to this payment were not found. Please contact support.");
    }

    const articles = await Article.find({ _id: { $in: payment.articleIds } }).select("articleId");
    res.status(200).json(new ApiResponse(200, {
      articleIds: articles.map((article) => article.articleId),
      paymentId: payment._id,
      razorpayPaymentId,
      status: "paid",
    }, "Payment verified successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Payment verification error:", error);
    throw new ApiError(500, "Payment verification failed. Please contact support if the problem persists.");
  }
});

const getMyPayments = asyncHandler(async (req, res) => {
  const { paymentId } = req.query;
  const filter = { userId: req.user.userId };
  const andFilters = [];
  if (paymentId) {
    const paymentIdConditions = [
      { razorpayPaymentId: { $regex: paymentId, $options: "i" } },
      { razorpayOrderId: { $regex: paymentId, $options: "i" } },
    ];
    if (mongoose.isValidObjectId(paymentId)) paymentIdConditions.push({ _id: paymentId });
    andFilters.push({ $or: paymentIdConditions });
  }
  if (andFilters.length) filter.$and = andFilters;
  const payments = await Payment.find(filter)
    .populate("articleIds", "articleId articleTitle packageId")
    .populate("packageSummary.packageId", "packageName category")
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, payments, "Payment history fetched successfully"));
});

const getAllPayments = asyncHandler(async (req, res) => {
  const { paymentId } = req.query;
  const filter = {};
  const andFilters = [];
  if (paymentId) {
    const paymentIdConditions = [
      { razorpayPaymentId: { $regex: paymentId, $options: "i" } },
      { razorpayOrderId: { $regex: paymentId, $options: "i" } },
    ];
    if (mongoose.isValidObjectId(paymentId)) paymentIdConditions.push({ _id: paymentId });
    andFilters.push({ $or: paymentIdConditions });
  }
  if (andFilters.length) filter.$and = andFilters;

  const payments = await Payment.find(filter)
    .populate({
      path: "userId",
      select: "name email",
    })
    .populate({
      path: "articleIds",
      select: "articleId articleTitle packageId",
    })
    .populate({
      path: "packageSummary.packageId",
      select: "packageName category",
    })
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, payments, "All payment history fetched successfully"));
});

module.exports = { createPaymentOrder, verifyPayment, getMyPayments, getAllPayments };
