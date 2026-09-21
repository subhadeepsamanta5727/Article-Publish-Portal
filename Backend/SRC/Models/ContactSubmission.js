const { default: mongoose } = require("mongoose");

const contactSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    attachmentName: { type: String, default: null },
    attachmentPath: { type: String, default: null },
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new", index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ContactSubmission", contactSubmissionSchema);
