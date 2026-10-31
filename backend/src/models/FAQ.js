const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    keywords: [{ type: String, lowercase: true, trim: true }],
    isDefaultChip: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound index for organization scoped queries
faqSchema.index({ organizationId: 1, question: "text", keywords: "text" });

module.exports = mongoose.model("FAQ", faqSchema);
