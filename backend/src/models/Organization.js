const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const paymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  transactionId: { type: String, required: true, trim: true },
  paymentMethod: {
    type: String,
    enum: ["Bank Transfer", "UPI", "Stripe", "Cash", "Other"],
    default: "UPI",
  },
  durationDays: { type: Number, required: true }, // e.g. 30, 90, 365
  notes: { type: String, default: "" },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paidAt: { type: Date, default: Date.now },
});

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    adminEmail: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    apiKey: {
      type: String,
      unique: true,
      default: () => "org_key_" + crypto.randomBytes(16).toString("hex"),
    },
    // Domain restriction for widget security (prevents unauthorized embedding)
    allowedDomains: [{ type: String, trim: true }],
    branding: {
      themeColor: { type: String, default: "#2563EB" },
      botName: { type: String, default: "Support Bot" },
      welcomeMessage: {
        type: String,
        default: "Hi there! How can we help you today?",
      },
      logoUrl: { type: String, default: "" },
      position: {
        type: String,
        enum: ["bottom-right", "bottom-left"],
        default: "bottom-right",
      },
    },
    // NEW: Contact details for the widget "Contact Us" feature
    contactDetails: {
      phone: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true, lowercase: true },
      address: { type: String, default: "", trim: true },
      mapUrl: { type: String, default: "", trim: true }, // Google Maps link or embed
    },
    subscription: {
      plan: {
        type: String,
        enum: ["TRIAL", "PREMIUM", "trial", "premium"],
        default: "TRIAL",
        uppercase: true, // Automatically converts to uppercase
      },
      isActive: { type: Boolean, default: true },
      trialStartedAt: { type: Date, default: Date.now },
      expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      },
      warningEmailSent: { type: Boolean, default: false },
      paymentHistory: [paymentHistorySchema],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);

organizationSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return; // Simply return in an async function!
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  //next();
});

organizationSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Strict subscription validity check helper
organizationSchema.methods.isSubscriptionValid = function () {
  if (!this.subscription || !this.subscription.isActive) {
    return false;
  }
  if (!this.subscription.expiresAt) {
    return false;
  }
  return new Date() <= new Date(this.subscription.expiresAt);
};

// Helper method to verify if chatbot should render
// organizationSchema.methods.isChatbotEnabled = function () {
//   const isTimeValid = new Date() <= new Date(this.subscription.expiresAt);
//   return this.subscription.isActive && isTimeValid;
// };

organizationSchema.methods.isChatbotEnabled = function () {
  return this.isSubscriptionValid();
};

organizationSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};

module.exports = mongoose.model("Organization", organizationSchema);
