const Publisher = require("../Models/Publisher");
const Article = require("../Models/Article");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const calculatePublisherPrice = (costPrice, margin, marginCategory) => {
  const cost = Number(costPrice);
  const profit = Number(margin);
  if (
    !Number.isFinite(cost) ||
    cost < 0 ||
    !Number.isFinite(profit) ||
    profit < 0
  ) {
    throw new ApiError(
      400,
      "Cost price and margin must be valid non-negative numbers",
    );
  }
  if (!["amount", "percentage"].includes(marginCategory)) {
    throw new ApiError(400, "Margin category must be amount or percentage");
  }
  const price =
    marginCategory === "percentage"
      ? cost + (cost * profit) / 100
      : cost + profit;
  return Math.round(price * 100) / 100;
};

const generatePublisherId = async () => {
  const prefix = `PUB-${new Date().getFullYear()}-`;
  const lastPublisher = await Publisher.findOne({
    publisherId: new RegExp(`^${prefix}`),
  })
    .sort({ publisherId: -1 })
    .select("publisherId");
  const lastNumber = lastPublisher
    ? Number(lastPublisher.publisherId.split("-")[2])
    : 0;
  return `${prefix}${String(lastNumber + 1).padStart(5, "0")}`;
};

const getActivePublishers = asyncHandler(async (req, res) => {
  const publishers = await Publisher.find({ isActive: true })
    .select(
      "publisherId publisherName category subCategory tag followers website sampleReportLink price currency",
    )
    .sort({ category: 1, publisherName: 1 });
  res
    .status(200)
    .json(new ApiResponse(200, publishers, "Publishers fetched successfully"));
});

const getAllPublishers = asyncHandler(async (req, res) => {
  const publishers = await Publisher.find()
    .populate("createdBy updatedBy", "name email")
    .sort({ createdAt: -1 });
  res
    .status(200)
    .json(new ApiResponse(200, publishers, "Publishers fetched successfully"));
});

const createPublisher = asyncHandler(async (req, res) => {
  const {
    publisherName,
    category = "",
    subCategory = "",
    tag = "",
    followers = "",
    website = "",
    sampleReportLink = "",
    costPrice,
    margin,
    marginCategory,
    currency = "INR",
  } = req.body;
  if (!publisherName) throw new ApiError(400, "Publisher name is required");
  const price = calculatePublisherPrice(costPrice, margin, marginCategory);
  const publisher = await Publisher.create({
    publisherId: await generatePublisherId(),
    publisherName,
    category,
    subCategory,
    tag,
    followers,
    website,
    sampleReportLink,
    costPrice: Number(costPrice),
    margin: Number(margin),
    marginCategory,
    price,
    currency,
    createdBy: req.user.userId,
  });
  res
    .status(201)
    .json(new ApiResponse(201, publisher, "Publisher created successfully"));
});

const updatePublisher = asyncHandler(async (req, res) => {
  const publisher = await Publisher.findOne({
    publisherId: req.params.publisherId,
  });
  if (!publisher) throw new ApiError(404, "Publisher not found");
  [
    "publisherName",
    "category",
    "subCategory",
    "tag",
    "followers",
    "website",
    "sampleReportLink",
    "currency",
  ].forEach((field) => {
    if (req.body[field] !== undefined) publisher[field] = req.body[field];
  });
  const costPrice =
    req.body.costPrice !== undefined ? req.body.costPrice : publisher.costPrice;
  const margin =
    req.body.margin !== undefined ? req.body.margin : publisher.margin;
  const marginCategory =
    req.body.marginCategory !== undefined
      ? req.body.marginCategory
      : publisher.marginCategory;
  publisher.costPrice = Number(costPrice);
  publisher.margin = Number(margin);
  publisher.marginCategory = marginCategory;
  publisher.price = calculatePublisherPrice(costPrice, margin, marginCategory);
  publisher.updatedBy = req.user.userId;
  await publisher.save();
  res
    .status(200)
    .json(new ApiResponse(200, publisher, "Publisher updated successfully"));
});

const setPublisherAvailability = asyncHandler(async (req, res) => {
  if (typeof req.body.isActive !== "boolean")
    throw new ApiError(400, "isActive must be true or false");
  const publisher = await Publisher.findOneAndUpdate(
    { publisherId: req.params.publisherId },
    { $set: { isActive: req.body.isActive, updatedBy: req.user.userId } },
    { new: true, runValidators: true },
  );
  if (!publisher) throw new ApiError(404, "Publisher not found");
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        publisher,
        "Publisher availability updated successfully",
      ),
    );
});

const deletePublisher = asyncHandler(async (req, res) => {
  const publisher = await Publisher.findOne({
    publisherId: req.params.publisherId,
  });
  if (!publisher) throw new ApiError(404, "Publisher not found");
  if (await Article.exists({ publisherId: publisher._id })) {
    throw new ApiError(
      409,
      "This publisher is used by article submissions and cannot be deleted. Deactivate it instead.",
    );
  }
  await publisher.deleteOne();
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { publisherId: publisher.publisherId },
        "Publisher deleted successfully",
      ),
    );
});

module.exports = {
  getActivePublishers,
  getAllPublishers,
  createPublisher,
  updatePublisher,
  setPublisherAvailability,
  deletePublisher,
};
