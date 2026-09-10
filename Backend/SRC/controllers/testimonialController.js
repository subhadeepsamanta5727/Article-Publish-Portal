const Testimonial = require("../Models/Testimonial");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const starterTestimonials = [
  {
    name: "Maya Chen",
    role: "Content strategist",
    company: "Northstar Studio",
    avatar: "https://i.pravatar.cc/160?img=47",
    quote: "SEO gave our ideas a clear path to publication. We always know what is happening next.",
  },
  {
    name: "Jon Bell",
    role: "Founder",
    company: "Bell & Co.",
    avatar: "https://i.pravatar.cc/160?img=12",
    quote: "The editorial workflow feels calm and professional, even when we are moving quickly.",
  },
  {
    name: "Ava Singh",
    role: "Marketing lead",
    company: "Brightwell",
    avatar: "https://i.pravatar.cc/160?img=32",
    quote: "We can turn expert knowledge into polished articles without losing momentum or visibility.",
  },
];

const getActiveTestimonials = asyncHandler(async (req, res) => {
  let testimonials = await Testimonial.find({ isActive: true }).sort({ createdAt: 1 });

  if (!testimonials.length) {
    const admin = await require("../Models/User").findOne({ role: "admin" }).select("_id");
    if (admin) {
      await Testimonial.insertMany(starterTestimonials.map((testimonial) => ({ ...testimonial, createdBy: admin._id })));
      testimonials = await Testimonial.find({ isActive: true }).sort({ createdAt: 1 });
    }
  }

  res.status(200).json(new ApiResponse(200, testimonials, "Testimonials fetched successfully"));
});

const getAllTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, testimonials, "Testimonials fetched successfully"));
});

const createTestimonial = asyncHandler(async (req, res) => {
  const { name, role, company = "", avatar = "", quote, isActive = true } = req.body;
  if (!name || !role || !quote) throw new ApiError(400, "Name, role, and quote are required");
  const testimonial = await Testimonial.create({ name, role, company, avatar, quote, isActive, createdBy: req.user.userId });
  res.status(201).json(new ApiResponse(201, testimonial, "Testimonial created successfully"));
});

const updateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.testimonialId);
  if (!testimonial) throw new ApiError(404, "Testimonial not found");
  ["name", "role", "company", "avatar", "quote", "isActive"].forEach((field) => {
    if (req.body[field] !== undefined) testimonial[field] = req.body[field];
  });
  testimonial.updatedBy = req.user.userId;
  await testimonial.save();
  res.status(200).json(new ApiResponse(200, testimonial, "Testimonial updated successfully"));
});

const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.testimonialId);
  if (!testimonial) throw new ApiError(404, "Testimonial not found");
  res.status(200).json(new ApiResponse(200, { id: testimonial._id }, "Testimonial deleted successfully"));
});

module.exports = { getActiveTestimonials, getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
