const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    quote: { type: String, required: true, trim: true, maxlength: 500 },
    company: { type: String, default: "", trim: true },
    avatar: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

testimonialSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Testimonial", testimonialSchema);
