const MediaPartner = require("../Models/MediaPartner");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, file.mimetype.startsWith("image/")),
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

const uploadLogo = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: "seo-media-partners",
      resource_type: "image",
      transformation: [{ width: 500, height: 500, crop: "limit", quality: "auto", fetch_format: "auto" }],
    },
    (error, uploaded) => (error ? reject(error) : resolve(uploaded.secure_url)),
  );
  stream.end(file.buffer);
});

const starterPartners = [
  { name: "Forbes", logoUrl: "https://logo.clearbit.com/forbes.com", link: "https://www.forbes.com" },
  { name: "Entrepreneur", logoUrl: "https://logo.clearbit.com/entrepreneur.com", link: "https://www.entrepreneur.com" },
  { name: "TechCrunch", logoUrl: "https://logo.clearbit.com/techcrunch.com", link: "https://techcrunch.com" },
  { name: "The Guardian", logoUrl: "https://logo.clearbit.com/theguardian.com", link: "https://www.theguardian.com" },
  { name: "Fast Company", logoUrl: "https://logo.clearbit.com/fastcompany.com", link: "https://www.fastcompany.com" },
  { name: "Inc.", logoUrl: "https://logo.clearbit.com/inc.com", link: "https://www.inc.com" },
  { name: "BBC", logoUrl: "https://logo.clearbit.com/bbc.com", link: "https://www.bbc.com" },
  { name: "CNN", logoUrl: "https://logo.clearbit.com/cnn.com", link: "https://www.cnn.com" },
  { name: "Reuters", logoUrl: "https://logo.clearbit.com/reuters.com", link: "https://www.reuters.com" },
  { name: "Bloomberg", logoUrl: "https://logo.clearbit.com/bloomberg.com", link: "https://www.bloomberg.com" },
  { name: "The New York Times", logoUrl: "https://logo.clearbit.com/nytimes.com", link: "https://www.nytimes.com" },
  { name: "The Hindu", logoUrl: "https://logo.clearbit.com/thehindu.com", link: "https://www.thehindu.com" },
];

const getActiveMediaPartners = asyncHandler(async (req, res) => {
  let partners = await MediaPartner.find({ isActive: true }).sort({ createdAt: 1 });
  const admin = await require("../Models/User").findOne({ role: "admin" }).select("_id");
  if (admin) {
    const existing = await MediaPartner.find({ name: { $in: starterPartners.map((partner) => partner.name) } }).select("name");
    const existingNames = new Set(existing.map((partner) => partner.name));
    const missing = starterPartners.filter((partner) => !existingNames.has(partner.name));
    if (missing.length) {
      await MediaPartner.insertMany(missing.map((partner) => ({ ...partner, createdBy: admin._id })));
      partners = await MediaPartner.find({ isActive: true }).sort({ createdAt: 1 });
    }
  }
  res.status(200).json(new ApiResponse(200, partners, "Media partners fetched successfully"));
});

const getAllMediaPartners = asyncHandler(async (req, res) => {
  const partners = await MediaPartner.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, partners, "Media partners fetched successfully"));
});

const createMediaPartner = asyncHandler(async (req, res) => {
  const { name, logoUrl = "", link, isActive = true } = req.body;
  if (!name || !link || (!logoUrl && !req.file)) throw new ApiError(400, "Name, logo image, and link are required");
  if (req.file && !hasCloudinaryCredentials()) throw new ApiError(500, "Cloudinary credentials are missing. Add real CLOUDINARY values before uploading logos.");
  const uploadedLogoUrl = req.file ? await uploadLogo(req.file) : logoUrl;
  const partner = await MediaPartner.create({ name, logoUrl: uploadedLogoUrl, link, isActive: isActive === true || isActive === "true", createdBy: req.user.userId });
  res.status(201).json(new ApiResponse(201, partner, "Media partner created successfully"));
});

const updateMediaPartner = asyncHandler(async (req, res) => {
  const partner = await MediaPartner.findById(req.params.partnerId);
  if (!partner) throw new ApiError(404, "Media partner not found");
  if (req.file) {
    if (!hasCloudinaryCredentials()) throw new ApiError(500, "Cloudinary credentials are missing. Add real CLOUDINARY values before uploading logos.");
    partner.logoUrl = await uploadLogo(req.file);
  }
  ["name", "logoUrl", "link"].forEach((field) => {
    if (req.body[field] !== undefined) partner[field] = req.body[field];
  });
  if (req.body.isActive !== undefined) partner.isActive = req.body.isActive === true || req.body.isActive === "true";
  partner.updatedBy = req.user.userId;
  await partner.save();
  res.status(200).json(new ApiResponse(200, partner, "Media partner updated successfully"));
});

const deleteMediaPartner = asyncHandler(async (req, res) => {
  const partner = await MediaPartner.findByIdAndDelete(req.params.partnerId);
  if (!partner) throw new ApiError(404, "Media partner not found");
  res.status(200).json(new ApiResponse(200, { id: partner._id }, "Media partner deleted successfully"));
});

module.exports = { getActiveMediaPartners, getAllMediaPartners, createMediaPartner, updateMediaPartner, deleteMediaPartner, logoUpload };
