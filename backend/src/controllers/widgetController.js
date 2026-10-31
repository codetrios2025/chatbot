const Organization = require("../models/Organization");
const FAQ = require("../models/FAQ");

// Bootstrap initialization endpoint
exports.initWidgetold = async (req, res) => {
  try {
    const { apiKey } = req.query;
    if (!apiKey) {
      return res.status(400).json({ error: "Missing API key" });
    }

    const org = await Organization.findOne({ apiKey }).select(
      "+allowedDomains",
    );
    if (!org) {
      return res.status(404).json({ error: "Invalid API key" });
    }

    // Subscription & Active Guard
    if (!org.isChatbotEnabled()) {
      return res.status(403).json({
        active: false,
        message: "Chatbot service inactive or subscription expired.",
      });
    }

    // Optional Domain Referrer Verification for extra security
    const origin = req.get("origin") || req.get("referer");
    if (org.allowedDomains && org.allowedDomains.length > 0 && origin) {
      const urlHost = new URL(origin).hostname;
      const isAllowed = org.allowedDomains.some((d) => urlHost.endsWith(d));
      if (!isAllowed) {
        return res
          .status(403)
          .json({ active: false, message: "Unauthorized domain" });
      }
    }

    // Fetch initial predefined FAQs
    const faqs = await FAQ.find({ organizationId: org._id })
      .select("question answer")
      .limit(20);

    res.json({
      active: true,
      branding: org.branding,
      organizationName: org.name,
      faqs,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error initializing widget" });
  }
};

exports.initWidget = async (req, res) => {
  try {
    const { apiKey } = req.query;

    if (!apiKey) {
      return res.status(400).json({ active: false, error: "Missing API key" });
    }

    // 1. Fetch organization
    // const org = await Organization.findOne({ apiKey });
    // if (!org) {
    //   return res.status(404).json({ active: false, error: "Invalid API key" });
    // }

    const org = await Organization.findOne({ apiKey });
    if (!org || !org.isSubscriptionValid()) {
      return res.status(403).json({
        success: false,
        reply:
          "This chatbot service is currently inactive. Please contact the site administrator.",
      });
    }

    // 2. Safe Subscription Check (handles missing methods or undefined dates)
    const isActive = Boolean(org.subscription?.isActive);
    const expiresAt = org.subscription?.expiresAt
      ? new Date(org.subscription.expiresAt)
      : null;
    const isNotExpired = expiresAt ? new Date() <= expiresAt : true;

    if (!isActive || !isNotExpired) {
      return res.status(200).json({
        active: false,
        message: "Chatbot service inactive or subscription expired.",
      });
    }

    // 3. Domain Check - bypass if testing locally (file:// or localhost)
    const origin = req.get("origin") || req.get("referer");
    if (
      org.allowedDomains &&
      org.allowedDomains.length > 0 &&
      origin &&
      origin !== "null"
    ) {
      try {
        if (origin.startsWith("http")) {
          const urlHost = new URL(origin).hostname;
          const isAllowed = org.allowedDomains.some(
            (d) =>
              d === "*" ||
              urlHost === d ||
              urlHost.endsWith(`.${d}`) ||
              urlHost === "localhost",
          );
          if (!isAllowed) {
            return res
              .status(403)
              .json({ active: false, message: "Unauthorized domain" });
          }
        }
      } catch (err) {
        console.warn("Origin parse skipped:", err.message);
      }
    }

    // 4. Fetch FAQs safely
    let faqs = [];
    try {
      faqs = await FAQ.find({ organizationId: org._id })
        .select("question answer isDefaultChip")
        .sort({ isDefaultChip: -1, createdAt: -1 })
        .limit(20)
        .lean();
    } catch (faqErr) {
      console.warn(
        "Could not load FAQs, returning empty list:",
        faqErr.message,
      );
    }

    // 5. Always return clean config defaults
    return res.status(200).json({
      active: true,
      branding: {
        themeColor: org.branding?.themeColor || "#2563EB",
        botName: org.branding?.botName || "Support Bot",
        welcomeMessage:
          org.branding?.welcomeMessage || "Hello! How can we help you?",
        logoUrl: org.branding?.logoUrl || "",
        position: org.branding?.position || "bottom-right",
      },
      contactDetails: {
        phone: org.contactDetails?.phone || "",
        email: org.contactDetails?.email || org.adminEmail || "",
        address: org.contactDetails?.address || "",
        mapUrl: org.contactDetails?.mapUrl || "",
      },
      organizationName: org.name,
      faqs: faqs || [],
    });
  } catch (error) {
    console.error("CRITICAL WIDGET INIT ERROR:", error);
    return res.status(500).json({ active: false, error: error.message });
  }
};

// Query resolution endpoint (Fuzzy match / Text match)
exports.askQuestion = async (req, res) => {
  try {
    const { apiKey, query } = req.body;
    const org = await Organization.findOne({ apiKey });

    if (!org || !org.isChatbotEnabled()) {
      return res.status(403).json({ error: "Chatbot unavailable" });
    }

    // Step 1: Text search match
    let match = await FAQ.findOne(
      { organizationId: org._id, $text: { $search: query } },
      { score: { $meta: "textScore" } },
    ).sort({ score: { $meta: "textScore" } });

    // Step 2: Fallback regex match if no strict index score
    if (!match) {
      match = await FAQ.findOne({
        organizationId: org._id,
        $or: [
          { question: { $regex: query, $options: "i" } },
          { keywords: { $in: [query.toLowerCase().trim()] } },
        ],
      });
    }

    if (match) {
      return res.json({ answer: match.answer });
    }

    return res.json({
      answer:
        "I'm sorry, I don't have the answer to that. Feel free to submit your enquiry below, and our team will get back to you directly!",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process question" });
  }
};
