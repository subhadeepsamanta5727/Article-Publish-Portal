const Article = require("../Models/Article");
const Package = require("../Models/PackageSchema");
const Publisher = require("../Models/Publisher");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const generateArticleId = require("../utils/generateArticleId");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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

const uploadArticleAsset = [
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!hasCloudinaryCredentials()) {
      throw new ApiError(500, "Cloudinary credentials are missing. Add real CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET values to SRC/.env.");
    }
    const article = await Article.findOne({ articleId: req.params.articleId, userId: req.user.userId });
    if (!article) throw new ApiError(404, "Article not found");
    if (!req.file) throw new ApiError(400, "Please select a file");
    if (["submitted", "pending", "delivered"].includes(article.status)) {
      throw new ApiError(400, "Article can no longer be edited");
    }

    const resourceType = req.file.mimetype === "application/pdf" ? "raw" : "image";
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "seo-articles", resource_type: resourceType },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded)),
      );
      stream.end(req.file.buffer);
    });

    if (resourceType === "raw") article.articlePdfUrl = result.secure_url;
    else article.images = [...article.images, result.secure_url];
    await article.save();
    res.status(201).json(new ApiResponse(201, {
      url: result.secure_url,
      type: resourceType,
      article,
    }, "File uploaded successfully"));
  }),
];

const createArticle = asyncHandler(async (req, res) => {
  const {
    author,
    packageItems,
    packageIds,
    publisherItems,
    publisherIds,
    publisherId,
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

  const quantities = new Map();
  for (const item of requestedItems) {
    const packageKey = String(item.packageId || "").trim();
    const itemQuantity = Number(item.quantity || 1);
    if (!packageKey || !Number.isInteger(itemQuantity) || itemQuantity < 1) {
      throw new ApiError(400, "Each package must have a whole-number quantity of at least 1");
    }
    quantities.set(packageKey, (quantities.get(packageKey) || 0) + itemQuantity);
  }

  const publisherRequestedItems = Array.isArray(publisherItems) && publisherItems.length
    ? publisherItems
    : (Array.isArray(publisherIds) && publisherIds.length
      ? publisherIds.map((id) => ({ publisherId: id, quantity: quantity || 1 }))
      : publisherId ? [{ publisherId, quantity: quantity || 1 }] : []);
  const publisherQuantities = new Map();
  for (const item of publisherRequestedItems) {
    const key = String(item.publisherId || "").trim();
    const itemQuantity = Number(item.quantity || 1);
    if (!key || !Number.isInteger(itemQuantity) || itemQuantity < 1) {
      throw new ApiError(400, "Each publisher must have a whole-number quantity of at least 1");
    }
    publisherQuantities.set(key, (publisherQuantities.get(key) || 0) + itemQuantity);
  }

  const resolveCatalogueItems = async (items, Model, field, unavailableMessage) => {
    const keys = [...items.keys()];
    const objectIds = keys.filter((key) => mongoose.isValidObjectId(key));
    const records = await Model.find({
      isActive: true,
      $or: [{ _id: { $in: objectIds } }, { [field]: { $in: keys } }],
    });
    const byKey = new Map();
    records.forEach((record) => {
      byKey.set(String(record._id), record);
      byKey.set(record[field], record);
    });
    const resolved = keys.flatMap((key) => Array.from({ length: items.get(key) }, () => byKey.get(key)));
    if (resolved.some((record) => !record)) throw new ApiError(400, unavailableMessage);
    return resolved;
  };

  if (!quantities.size && !publisherQuantities.size) {
    throw new ApiError(400, "Select at least one package or publisher");
  }
  const selectedPackages = await resolveCatalogueItems(quantities, Package, "packageId", "One or more selected packages are unavailable");
  const selectedPublishers = await resolveCatalogueItems(publisherQuantities, Publisher, "publisherId", "One or more selected publishers are unavailable");
  if (selectedPackages.length && selectedPublishers.length && selectedPackages.length !== selectedPublishers.length) {
    throw new ApiError(400, "When selecting packages and publishers together, their quantities must match");
  }

  const totalArticles = Math.max(selectedPackages.length, selectedPublishers.length);
  const articles = [];
  for (let index = 0; index < totalArticles; index += 1) {
    const selectedPackage = selectedPackages[index];
    const selectedPublisher = selectedPublishers[index];
    const articleId = await generateArticleId();
    articles.push(await Article.create({
      articleId,
      userId: req.user.userId,
      packageId: selectedPackage?._id,
      packagePrice: selectedPackage?.price || 0,
      packageCostPrice: selectedPackage?.costPrice || 0,
      publisherId: selectedPublisher?._id,
      publisherPrice: selectedPublisher?.price || 0,
      publisherCostPrice: selectedPublisher?.costPrice || 0,
      currency: selectedPackage?.currency || selectedPublisher?.currency || "INR",
      author,
      category: {},
      status: isAdminCreate ? "writing" : "draft",
      paymentStatus: isAdminCreate ? "paid" : "pending",
    }));
  }

  res.status(201).json(
    new ApiResponse(
      201,
      {
        articleId: articles.length === 1 ? articles[0].articleId : undefined,
        articleIds: articles.map((article) => article.articleId),
        articles,
        totalArticles: articles.length,
        totalAmount: articles.reduce((total, article) => total + article.packagePrice + article.publisherPrice, 0),
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
    articlePdfUrl,
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

  // Don't allow editing submitted/delivered articles
  if (
    ["submitted", "pending", "delivered"].includes(
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
  if (articlePdfUrl !== undefined) article.articlePdfUrl = articlePdfUrl;

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
    ["submitted", "pending", "delivered"].includes(
      article.status
    )
  ) {
    throw new ApiError(
      400,
      "Article has already been submitted"
    );
  }

  article.status = "pending";

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
  const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
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
      `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(geminiModel)}:generateContent`,
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
  uploadArticleAsset,
};
