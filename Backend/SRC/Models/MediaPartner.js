const mongoose = require("mongoose");

const mediaPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

mediaPartnerSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("MediaPartner", mediaPartnerSchema);
