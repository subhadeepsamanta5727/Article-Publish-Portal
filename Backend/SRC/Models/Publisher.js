const mongoose = require("mongoose");

const publisherSchema = new mongoose.Schema(
  {
    publisherId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    publisherName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    subCategory: {
      type: String,
      default: "",
      trim: true,
    },

    tag: {
      type: String,
      default: "",
      trim: true,
    },

    followers: {
      type: String,
      default: "",
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    sampleReportLink: {
      type: String,
      default: "",
      trim: true,
    },

    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    margin: {
      type: Number,
      required: true,
      min: 0,
    },
    marginCategory: {
      type: String,
      enum: ["amount", "percentage"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

publisherSchema.index({
  category: 1,
  isActive: 1,
});

module.exports = mongoose.model("Publisher", publisherSchema);
