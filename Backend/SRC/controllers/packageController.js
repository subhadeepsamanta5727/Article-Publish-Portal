const Package = require("../Models/PackageSchema");
const Article = require("../Models/Article");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const calculatePackagePrice = (costPrice, margin, marginCategory) => {
  const cost = Number(costPrice);
  const profit = Number(margin);
  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(profit) || profit < 0) {
    throw new ApiError(400, "Cost price and margin must be valid non-negative numbers");
  }
  if (!["amount", "percentage"].includes(marginCategory)) {
    throw new ApiError(400, "Margin category must be amount or percentage");
  }

  const sellingPrice = marginCategory === "percentage"
    ? cost + (cost * profit) / 100
    : cost + profit;
  return Math.round(sellingPrice * 100) / 100;
};

const generatePackageId = async () => {
  const year = new Date().getFullYear();
  const prefix = `PKG-${year}-`;
  const lastPackage = await Package.findOne({ packageId: new RegExp(`^${prefix}`) })
    .sort({ packageId: -1 })
    .select("packageId");
  const lastNumber = lastPackage ? Number(lastPackage.packageId.split("-")[2]) : 0;
  return `${prefix}${String(lastNumber + 1).padStart(5, "0")}`;
};

const getActivePackages = asyncHandler(async (req, res) => {
  const packages = await Package.find({ isActive: true })
    .select("packageId packageName category mediaCoverage price currency")
    .sort({ category: 1, packageName: 1 });

  res.status(200).json(new ApiResponse(200, packages, "Packages fetched successfully"));
});

const getAllPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find()
    .populate("createdBy updatedBy", "name email")
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, packages, "Packages fetched successfully"));
});

const createPackage = asyncHandler(async (req, res) => {
  const {
    packageName,
    category,
    mediaCoverage = [],
    costPrice,
    margin,
    marginCategory,
    currency = "INR",
  } = req.body;

  if (!packageName || !category) {
    throw new ApiError(400, "Package name and category are required");
  }

  const price = calculatePackagePrice(costPrice, margin, marginCategory);
  const packageId = await generatePackageId();

  const packageItem = await Package.create({
    packageId,
    packageName,
    category,
    mediaCoverage,
    costPrice: Number(costPrice),
    margin: Number(margin),
    marginCategory,
    price,
    currency,
    createdBy: req.user.userId,
  });

  res.status(201).json(new ApiResponse(201, packageItem, "Package created successfully"));
});

const updatePackage = asyncHandler(async (req, res) => {
  const packageItem = await Package.findOne({ packageId: req.params.packageId });
  if (!packageItem) throw new ApiError(404, "Package not found");

  const editableFields = ["packageName", "category", "mediaCoverage", "currency"];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) packageItem[field] = req.body[field];
  });

  const nextCostPrice = req.body.costPrice !== undefined ? req.body.costPrice : packageItem.costPrice;
  const nextMargin = req.body.margin !== undefined ? req.body.margin : packageItem.margin;
  const nextMarginCategory = req.body.marginCategory !== undefined ? req.body.marginCategory : packageItem.marginCategory;
  packageItem.costPrice = Number(nextCostPrice);
  packageItem.margin = Number(nextMargin);
  packageItem.marginCategory = nextMarginCategory;
  packageItem.price = calculatePackagePrice(nextCostPrice, nextMargin, nextMarginCategory);
  packageItem.updatedBy = req.user.userId;
  await packageItem.save();

  res.status(200).json(new ApiResponse(200, packageItem, "Package updated successfully"));
});

const setPackageAvailability = asyncHandler(async (req, res) => {
  if (typeof req.body.isActive !== "boolean") {
    throw new ApiError(400, "isActive must be true or false");
  }
  const packageItem = await Package.findOneAndUpdate(
    { packageId: req.params.packageId },
    { $set: { isActive: req.body.isActive, updatedBy: req.user.userId } },
    { new: true, runValidators: true }
  );
  if (!packageItem) throw new ApiError(404, "Package not found");
  res.status(200).json(new ApiResponse(200, packageItem, "Package availability updated successfully"));
});

const deletePackage = asyncHandler(async (req, res) => {
  const packageItem = await Package.findOne({ packageId: req.params.packageId });
  if (!packageItem) throw new ApiError(404, "Package not found");

  const isUsed = await Article.exists({ packageId: packageItem._id });
  if (isUsed) {
    throw new ApiError(409, "This package is used by article submissions and cannot be deleted. Deactivate it instead.");
  }

  await packageItem.deleteOne();
  res.status(200).json(new ApiResponse(200, { packageId: packageItem.packageId }, "Package deleted successfully"));
});

module.exports = { getActivePackages, getAllPackages, createPackage, updatePackage, setPackageAvailability, deletePackage };
