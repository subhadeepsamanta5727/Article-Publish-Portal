const Article = require("../Models/Article");
const Package = require("../Models/PackageSchema");
const mongoose = require("mongoose");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const generateArticleId = require("../utils/generateArticleId");

const createArticle = asyncHandler(async (req, res) => {
  const {
    author,
    packageItems,
    packageIds,
    quantity,
    adminCreate = false,
  } = req.body;

  const isAdminCreate = req.user.role === "admin" && adminCreate === true;

  if (!author) {
    throw new ApiError(
      400,
      "Author details are required"
    );
  }

  if (!author.name || !author.email) {
    throw new ApiError(
      400,
      "Author name and email are required"
    );
  }

  // Accept packageItems as the preferred payload: [{ packageId, quantity }].
  // packageIds and quantity are retained as a convenient shorthand.
  const requestedItems = Array.isArray(packageItems) && packageItems.length
    ? packageItems
    : Array.isArray(packageIds) && packageIds.length
      ? packageIds.map((packageId) => ({ packageId, quantity: quantity || 1 }))
      : [];

  if (!requestedItems.length) {
    throw new ApiError(400, "Select at least one package");
  }

  const quantities = new Map();
  for (const item of requestedItems) {
    const packageKey = String(item.packageId || "").trim();
    const itemQuantity = Number(item.quantity || 1);
    if (!packageKey || !Number.isInteger(itemQuantity) || itemQuantity < 1) {
      throw new ApiError(400, "Each package must have a whole-number quantity of at least 1");
    }
    quantities.set(packageKey, (quantities.get(packageKey) || 0) + itemQuantity);
  }

  const requestedKeys = [...quantities.keys()];
  const objectIds = requestedKeys.filter((key) => mongoose.isValidObjectId(key));
  const packages = await Package.find({
    isActive: true,
    $or: [{ _id: { $in: objectIds } }, { packageId: { $in: requestedKeys } }],
  });

  const packageByKey = new Map();
  packages.forEach((pkg) => {
    packageByKey.set(String(pkg._id), pkg);
    packageByKey.set(pkg.packageId, pkg);
  });

  const resolvedItems = requestedKeys.map((key) => ({ package: packageByKey.get(key), quantity: quantities.get(key) }));
  if (resolvedItems.some((item) => !item.package)) {
    throw new ApiError(400, "One or more selected packages are unavailable");
  }

  const articles = [];
  for (const { package: selectedPackage, quantity: itemQuantity } of resolvedItems) {
    for (let count = 0; count < itemQuantity; count += 1) {
      const articleId = await generateArticleId();
      articles.push(await Article.create({
        articleId,
        userId: req.user.userId,
        packageId: selectedPackage._id,
        packagePrice: selectedPackage.price,
        currency: selectedPackage.currency,
        author,
        category: {},
        status: isAdminCreate ? "writing" : "draft",
        paymentStatus: isAdminCreate ? "paid" : "pending",
      }));
    }
  }

  res.status(201).json(
    new ApiResponse(
      201,
      {
        articleId: articles.length === 1 ? articles[0].articleId : undefined,
        articleIds: articles.map((article) => article.articleId),
        articles,
        totalArticles: articles.length,
        totalAmount: articles.reduce((total, article) => total + article.packagePrice, 0),
        currency: "INR",
      },
      "Article submissions created successfully"
    )
  );
});

// ======================================
// GET MY ARTICLES
// ======================================

const getMyArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find({
    userId: req.user.userId,
  })
    .sort({ createdAt: -1 })
    .select("-content");

  res.status(200).json(
    new ApiResponse(
      200,
      articles,
      "Articles fetched successfully"
    )
  );
});


// ======================================
// GET SINGLE ARTICLE
// ======================================

const getArticleById = asyncHandler(async (req, res) => {
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

  res.status(200).json(
    new ApiResponse(
      200,
      article,
      "Article fetched successfully"
    )
  );
});


// ======================================
// SAVE ARTICLE CONTENT
// ======================================

const updateArticle = asyncHandler(async (req, res) => {
  const { articleId } = req.params;

  const {
    articleTitle,
    keywords,
    abstract,
    content,
    images,
    refLink,
  } = req.body;

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

  // Payment must be completed
  if (article.paymentStatus !== "paid") {
    throw new ApiError(
      403,
      "Payment is not completed"
    );
  }

  // Don't allow editing submitted/accepted articles
  if (
    ["submitted", "under_review", "accepted"].includes(
      article.status
    )
  ) {
    throw new ApiError(
      400,
      "Article can no longer be edited"
    );
  }

  if (articleTitle !== undefined) {
    article.articleTitle = articleTitle;
  }

  if (keywords !== undefined) {
    article.keywords = keywords;
  }

  if (abstract !== undefined) {
    article.abstract = abstract;
  }

  if (content !== undefined) {
    article.content = content;
  }
  if (images !== undefined) article.images = images;
  if (refLink !== undefined) article.refLink = refLink;

  article.status = "writing";

  await article.save();

  res.status(200).json(
    new ApiResponse(
      200,
      article,
      "Article saved successfully"
    )
  );
});


// ======================================
// SUBMIT ARTICLE
// ======================================

const submitArticle = asyncHandler(async (req, res) => {
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

  // Payment check
  if (article.paymentStatus !== "paid") {
    throw new ApiError(
      403,
      "Please complete payment before submitting"
    );
  }

  // Content validation
  if (
    !article.articleTitle ||
    !article.content ||
    article.content.trim().length === 0
  ) {
    throw new ApiError(
      400,
      "Article title and content are required"
    );
  }

  // Prevent duplicate submission
  if (
    ["submitted", "under_review", "accepted"].includes(
      article.status
    )
  ) {
    throw new ApiError(
      400,
      "Article has already been submitted"
    );
  }

  article.status = "submitted";

  article.submittedAt = new Date();

  await article.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        articleId: article.articleId,
        status: article.status,
        submittedAt: article.submittedAt,
      },
      "Article submitted successfully"
    )
  );
});

// ======================================
// GENERATE ARTICLE CONTENT USING AI
// ======================================

const generateArticleContent = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const { title, keywords, resourceLink } = req.body;

  if (!title || !keywords) {
    throw new ApiError(400, "Article title and keywords are required");
  }

  const article = await Article.findOne({
    articleId,
    userId: req.user.userId,
  });

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new ApiError(500, "AI service is not configured");
  }

  const prompt = `You are an expert article writer. Generate a high-quality, well-structured article based on the following details:

Title: ${title}
Keywords: ${keywords}
${resourceLink ? `Reference Link: ${resourceLink}` : ""}

Guidelines:
- Write a comprehensive article (800-1500 words)
- Include an engaging introduction
- Use the keywords naturally throughout the article
- Organize content with clear sections and headings
- Add practical examples and insights
- Include a conclusion with key takeaways
- Write in professional, clear language
- Format with HTML tags for better structure

Please generate the article content now:`;

  // Create an AbortController with 45 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || "Failed to generate content from AI"
      );
    }

    const data = await response.json();
    const generatedContent =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedContent) {
      throw new ApiError(500, "No content generated from AI");
    }

    res.status(200).json(
      new ApiResponse(200, { content: generatedContent }, "Article content generated successfully")
    );
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("AI generation error:", error);
    
    if (error.name === "AbortError") {
      throw new ApiError(
        408,
        "Article generation took too long (45 seconds). Please try again with simpler keywords or a shorter article title."
      );
    }
    
    throw new ApiError(
      500,
      error.message || "Failed to generate article content"
    );
  }
});


module.exports = {
  createArticle,
   getMyArticles,
  getArticleById,
  updateArticle,
  submitArticle,
  generateArticleContent,
};
