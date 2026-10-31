// src/models/Enquiry.js
const mongoose = require("mongoose");
const enquirySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    company: { type: String, trim: true },
    serviceInterest: {
      type: String,
      enum: [
        "IoT & Embedded",
        "Cloud & DevOps",
        "Telecom & Networking",
        "Custom Software",
        "General Inquiry",
      ],
      default: "General Inquiry",
    },
    phone: { type: String, trim: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "closed"],
      default: "new",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Enquiry", enquirySchema);
