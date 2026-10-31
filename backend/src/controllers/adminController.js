const mongoose = require("mongoose");
const WebsiteScraper = require("../services/scraperService");
const { generateFaqsFromText } = require("../services/llmService");
const Organization = require("../models/Organization");
const FAQ = require("../models/FAQ");
const crypto = require("crypto");
const transporter = require("../config/mailer");
const Enquiry = require("../models/Enquiry");
// const {
//   deduplicateFaqs,
//   getJaccardSimilarity,
//   tokenize,
// } = require("../utils/faqDeduplicator");

// ==========================================
// FAQ DEDUPLICATION & SIMILARITY HELPERS
// ==========================================
function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

function getJaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionCount++;
  }
  const unionCount = new Set([...setA, ...setB]).size;
  return intersectionCount / unionCount;
}

function deduplicateFaqs(faqs, similarityThreshold = 0.65) {
  const uniqueFaqs = [];
  const tokenizedQuestions = [];

  for (const item of faqs) {
    if (!item.question || !item.answer) continue;

    const currentTokens = tokenize(item.question);
    let isDuplicate = false;

    for (let i = 0; i < uniqueFaqs.length; i++) {
      const existingTokens = tokenizedQuestions[i];
      const similarity = getJaccardSimilarity(currentTokens, existingTokens);

      if (similarity >= similarityThreshold) {
        isDuplicate = true;
        // Keep the answer with more detail/length
        if (item.answer.length > uniqueFaqs[i].answer.length) {
          uniqueFaqs[i] = item;
          tokenizedQuestions[i] = currentTokens;
        }
        break;
      }
    }

    if (!isDuplicate) {
      uniqueFaqs.push(item);
      tokenizedQuestions.push(currentTokens);
    }
  }

  return uniqueFaqs;
}

/**
 * @desc    Fetch all registered organisations for the admin dashboard
 * @route   GET /api/v1/admin/organizations
 * @access  Admin Private
 */
exports.getAllOrganizations = async (req, res) => {
  try {
    // Sort descending by creation date so new additions show up at the top
    const organizations = await Organization.find()
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations,
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch organizations.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Create a new organisation, generate unique API key, and return embed script
 * @route   POST /api/v1/admin/organizations
 * @access  Admin Private
 */

exports.createOrganization = async (req, res) => {
  try {
    const {
      name,
      adminEmail,
      allowedDomains,
      branding,
      subscription,
      contactDetails,
    } = req.body;

    if (!name || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: "Organization name and admin email are required.",
      });
    }

    // 1. Check if email already registered
    const existingOrg = await Organization.findOne({
      adminEmail: adminEmail.toLowerCase().trim(),
    });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: "An organization with this admin email already exists.",
      });
    }

    // 2. Generate random unique API key & Initial Temporary Password
    const apiKey = "org_" + crypto.randomBytes(16).toString("hex");
    const initialTempPassword = crypto.randomBytes(6).toString("hex") + "A1!";

    // 3. Normalize plan to uppercase ('TRIAL' or 'PREMIUM')
    const selectedPlan = subscription?.plan
      ? subscription.plan.toUpperCase()
      : "TRIAL";
    const durationDays =
      Number(subscription?.durationDays) || (selectedPlan === "TRIAL" ? 7 : 30);

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + durationDays * 24 * 60 * 60 * 1000,
    );

    // 4. Create Organization with sanitized defaults
    const organization = await Organization.create({
      name: name.trim(),
      adminEmail: adminEmail.toLowerCase().trim(),
      password: initialTempPassword, // Satisfies Mongoose 'required' rule
      apiKey,
      allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : [],
      branding: {
        botName: branding?.botName?.trim() || "Support Assistant",
        welcomeMessage:
          branding?.welcomeMessage?.trim() ||
          "Hello! How can we help you today?",
        themeColor: branding?.themeColor || "#2563EB",
        logoUrl: branding?.logoUrl?.trim() || "",
        position: branding?.position || "bottom-right",
      },
      contactDetails: {
        phone: contactDetails?.phone?.trim() || "",
        email: contactDetails?.email?.trim() || adminEmail.toLowerCase().trim(),
        address: contactDetails?.address?.trim() || "",
        mapUrl: contactDetails?.mapUrl?.trim() || "",
      },
      subscription: {
        plan: selectedPlan,
        isActive: true,
        trialStartedAt: now,
        expiresAt: expiresAt,
        warningEmailSent: false,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Organization created successfully.",
      data: organization,
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create organization.",
    });
  }
};

exports.updateOrganizationold = async (req, res) => {
  try {
    const { name, adminEmail, allowedDomains, branding, subscription } =
      req.body;
    const orgId = req.params.id;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (adminEmail) updateFields.adminEmail = adminEmail.trim().toLowerCase();
    if (Array.isArray(allowedDomains))
      updateFields.allowedDomains = allowedDomains;

    if (branding) {
      if (branding.botName) updateFields["branding.botName"] = branding.botName;
      if (branding.welcomeMessage)
        updateFields["branding.welcomeMessage"] = branding.welcomeMessage;
      if (branding.themeColor)
        updateFields["branding.themeColor"] = branding.themeColor;
      if (branding.logoUrl !== undefined)
        updateFields["branding.logoUrl"] = branding.logoUrl;
      if (branding.position)
        updateFields["branding.position"] = branding.position;
    }

    if (subscription) {
      if (subscription.plan)
        updateFields["subscription.plan"] = subscription.plan.toUpperCase();
      if (typeof subscription.isActive === "boolean")
        updateFields["subscription.isActive"] = subscription.isActive;
      if (subscription.expiresAt) {
        updateFields["subscription.expiresAt"] = new Date(
          subscription.expiresAt,
        );
        updateFields["subscription.warningEmailSent"] = false;
      }
    }

    const updated = await Organization.findByIdAndUpdate(
      orgId,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const {
      name,
      adminEmail,
      allowedDomains,
      branding,
      subscription,
      contactDetails,
    } = req.body;
    const orgId = req.params.id;

    const updateFields = {};

    // 1. Root fields
    if (name) updateFields.name = name.trim();
    if (adminEmail) updateFields.adminEmail = adminEmail.trim().toLowerCase();
    if (Array.isArray(allowedDomains))
      updateFields.allowedDomains = allowedDomains;

    // Contact details (Dot notation)
    if (contactDetails) {
      if (contactDetails.phone !== undefined)
        updateFields["contactDetails.phone"] = contactDetails.phone.trim();
      if (contactDetails.email !== undefined)
        updateFields["contactDetails.email"] = contactDetails.email
          .trim()
          .toLowerCase();
      if (contactDetails.address !== undefined)
        updateFields["contactDetails.address"] = contactDetails.address.trim();
      if (contactDetails.mapUrl !== undefined)
        updateFields["contactDetails.mapUrl"] = contactDetails.mapUrl.trim();
    }

    // 2. Branding (Dot notation)
    if (branding) {
      if (branding.botName !== undefined)
        updateFields["branding.botName"] = branding.botName;
      if (branding.welcomeMessage !== undefined)
        updateFields["branding.welcomeMessage"] = branding.welcomeMessage;
      if (branding.themeColor !== undefined)
        updateFields["branding.themeColor"] = branding.themeColor;
      if (branding.logoUrl !== undefined)
        updateFields["branding.logoUrl"] = branding.logoUrl;
      if (branding.position !== undefined)
        updateFields["branding.position"] = branding.position;
    }

    // 3. Subscription (CRITICAL: Use exact dot notation)
    if (subscription) {
      if (subscription.plan) {
        updateFields["subscription.plan"] = subscription.plan.toUpperCase();
      }
      if (typeof subscription.isActive === "boolean") {
        updateFields["subscription.isActive"] = subscription.isActive;
      }
      if (subscription.expiresAt) {
        updateFields["subscription.expiresAt"] = new Date(
          subscription.expiresAt,
        );
        updateFields["subscription.warningEmailSent"] = false;
      }
    }

    // Direct atomic MongoDB update
    const updated = await Organization.findByIdAndUpdate(
      orgId,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("[updateOrganization Error]:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
/**
 * @desc    Toggle subscription status or extend validity (Instant Activation/Deactivation)
 * @route   PATCH /api/v1/admin/organizations/:id/subscription
 * @access  Admin Private
 */
exports.updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, expiresAt, plan } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Organization ID format.",
      });
    }

    // Build the dynamic update query
    const updateFields = {};

    if (typeof isActive === "boolean") {
      updateFields["subscription.isActive"] = isActive;
    }

    if (expiresAt) {
      const parsedDate = new Date(expiresAt);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid expiration date format.",
        });
      }
      updateFields["subscription.expiresAt"] = parsedDate;
    }

    if (plan && ["trial", "pro", "enterprise"].includes(plan)) {
      updateFields["subscription.plan"] = plan;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid subscription fields provided for update.",
      });
    }

    // Execute atomic update
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!updatedOrg) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Organization subscription updated. Status is now ${updatedOrg.subscription.isActive ? "Active" : "Inactive"}.`,
      data: updatedOrg,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating subscription.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Fetch FAQs for a specific organisation
 * @route   GET /api/v1/admin/organizations/:id/faqs
 * @access  Admin Private
 */
exports.getOrganizationFAQs = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Organization ID." });
    }

    const faqs = await FAQ.find({ organizationId: id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Add a FAQ item to an organisation's knowledge base
 * @route   POST /api/v1/admin/organizations/:id/faqs
 * @access  Admin Private
 */
exports.addOrganizationFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, keywords } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Organization ID." });
    }

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required.",
      });
    }

    const faq = await FAQ.create({
      organizationId: id,
      question: question.trim(),
      answer: answer.trim(),
      keywords: Array.isArray(keywords)
        ? keywords.map((k) => k.toLowerCase().trim())
        : [],
    });

    return res.status(201).json({
      success: true,
      message: "FAQ item added successfully.",
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Crawl an organisation's website and generate FAQ entries automatically
 * @route   POST /api/v1/admin/organizations/:id/scrape
 * @access  Private (Superadmin / Admin)
 */
exports.scrapeAndTrainFromWebsitewithDuplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const { websiteUrl, maxPages = 8 } = req.body;

    if (!websiteUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Website URL is required" });
    }

    const org = await Organization.findById(id);
    if (!org) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    console.log(`[Scrape] Starting crawl on: ${websiteUrl}`);
    const scraper = new WebsiteScraper(websiteUrl, maxPages);
    await scraper.crawl(websiteUrl);

    console.log(`[Scrape] Pages crawled: ${scraper.extractedArticles.length}`);

    if (scraper.extractedArticles.length === 0) {
      return res.status(422).json({
        success: false,
        message:
          "Could not access or extract readable HTML from the specified website.",
      });
    }

    const allGeneratedFaqs = [];

    for (const article of scraper.extractedArticles) {
      // Build text: prefer structured sections, fallback to body text
      let textToAnalyze = "";
      if (article.sections && article.sections.length > 0) {
        textToAnalyze = article.sections
          .map((s) => `${s.heading}:\n${s.content}`)
          .join("\n\n");
      }

      if (textToAnalyze.length < 100 && article.fallbackText) {
        textToAnalyze = article.fallbackText;
      }

      if (textToAnalyze.trim().length > 50) {
        console.log(`[LLM] Generating FAQs for page: "${article.title}"...`);
        const faqs = await generateFaqsFromText(article.title, textToAnalyze);
        console.log(
          `[LLM] Produced ${faqs.length} FAQs for "${article.title}"`,
        );
        allGeneratedFaqs.push(...faqs);
      }
    }

    if (allGeneratedFaqs.length === 0) {
      return res.status(500).json({
        success: false,
        message:
          "LLM synthesis produced no Q&A pairs. Please check your backend terminal to verify if GEMINI_API_KEY is valid.",
      });
    }

    // Prepare documents with organizationId
    const docsToInsert = allGeneratedFaqs.map((item) => ({
      organizationId: org._id,
      question: item.question.trim(),
      answer: item.answer.trim(),
      keywords: (item.keywords || []).map((k) => k.toLowerCase().trim()),
    }));

    const inserted = await FAQ.insertMany(docsToInsert);

    return res.status(200).json({
      success: true,
      message: `Successfully generated and saved ${inserted.length} FAQs from ${websiteUrl}!`,
      count: inserted.length,
      data: inserted,
    });
  } catch (error) {
    console.error("[Scraper Controller Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process website.",
      error: error.message,
    });
  }
};

exports.scrapeAndTrainFromWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const { websiteUrl, maxPages = 5 } = req.body;

    if (!websiteUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Website URL is required" });
    }

    const org = await Organization.findById(id);
    if (!org) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    // 1. Scrape internal pages
    const scraper = new WebsiteScraper(websiteUrl, maxPages);
    await scraper.crawl(websiteUrl);

    if (scraper.extractedArticles.length === 0) {
      return res.status(422).json({
        success: false,
        message: "Could not access or extract content from the website.",
      });
    }

    // 2. Synthesize FAQs across all crawled pages
    const rawFaqs = [];
    for (const article of scraper.extractedArticles) {
      const textToAnalyze = article.sections?.length
        ? article.sections
            .map((s) => `${s.heading}:\n${s.content}`)
            .join("\n\n")
        : article.fallbackText;

      if (textToAnalyze && textToAnalyze.trim().length > 50) {
        const pageFaqs = await generateFaqsFromText(
          article.title,
          textToAnalyze,
        );
        rawFaqs.push(...pageFaqs);
      }
    }

    if (rawFaqs.length === 0) {
      return res.status(500).json({
        success: false,
        message: "No FAQ pairs could be synthesized.",
      });
    }

    // 3. Step A: Deduplicate cross-page items against each other
    const uniqueAcrossCrawl = deduplicateFaqs(rawFaqs, 0.65);

    // 4. Step B: Filter out any items that already exist in this organization's database
    const existingFaqs = await FAQ.find({ organizationId: org._id })
      .select("question")
      .lean();
    const existingTokenSets = existingFaqs.map((f) => tokenize(f.question));

    const finalDocsToInsert = [];
    for (const item of uniqueAcrossCrawl) {
      const itemTokens = tokenize(item.question);
      const existsInDb = existingTokenSets.some(
        (dbTokens) => getJaccardSimilarity(itemTokens, dbTokens) >= 0.65,
      );

      if (!existsInDb) {
        finalDocsToInsert.push({
          organizationId: org._id,
          question: item.question.trim(),
          answer: item.answer.trim(),
          keywords: (item.keywords || []).map((k) => k.toLowerCase().trim()),
        });
      }
    }

    if (finalDocsToInsert.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "Crawl completed, but all generated questions were already present in your knowledge base.",
        count: 0,
        data: [],
      });
    }

    const inserted = await FAQ.insertMany(finalDocsToInsert);

    return res.status(200).json({
      success: true,
      message: `Generated and saved ${inserted.length} unique FAQs (filtered out ${rawFaqs.length - inserted.length} duplicates).`,
      count: inserted.length,
      data: inserted,
    });
  } catch (error) {
    console.error("[Scrape Controller Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process website.",
      error: error.message,
    });
  }
};
exports.deleteOrganizationFAQ = async (req, res) => {
  try {
    const { id, faqId } = req.params;
    await FAQ.findOneAndDelete({ _id: faqId, organizationId: id });
    return res
      .status(200)
      .json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a specific FAQ question, answer, and keywords
 * @route   PUT /api/v1/admin/organizations/:id/faqs/:faqId
 * @access  Private (Superadmin / Admin)
 */
exports.updateOrganizationFAQ = async (req, res) => {
  try {
    const { id, faqId } = req.params;
    const { question, answer, keywords } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required.",
      });
    }

    const updatedFaq = await FAQ.findOneAndUpdate(
      { _id: faqId, organizationId: id },
      {
        question: question.trim(),
        answer: answer.trim(),
        keywords: Array.isArray(keywords)
          ? keywords.map((k) => k.toLowerCase().trim())
          : [],
      },
      { new: true },
    );

    if (!updatedFaq) {
      return res
        .status(404)
        .json({ success: false, message: "FAQ not found." });
    }

    return res.status(200).json({
      success: true,
      message: "FAQ updated successfully.",
      data: updatedFaq,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update organization profile, allowed domains, and branding
 * @route   PUT /api/v1/admin/organizations/:id
 * @access  Private (Superadmin)
 */
exports.updateOrganizationold2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, adminEmail, allowedDomains, branding } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (adminEmail) updateData.adminEmail = adminEmail.toLowerCase().trim();
    if (Array.isArray(allowedDomains))
      updateData.allowedDomains = allowedDomains;

    if (branding) {
      if (branding.themeColor)
        updateData["branding.themeColor"] = branding.themeColor;
      if (branding.botName) updateData["branding.botName"] = branding.botName;
      if (branding.welcomeMessage)
        updateData["branding.welcomeMessage"] = branding.welcomeMessage;
      if (branding.logoUrl !== undefined)
        updateData["branding.logoUrl"] = branding.logoUrl;
      if (branding.position)
        updateData["branding.position"] = branding.position;
    }

    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedOrg) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: updatedOrg,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle whether an FAQ shows as a default quick chip in widget
 * @route   PATCH /api/v1/admin/organizations/:id/faqs/:faqId/toggle-chip
 */
exports.toggleDefaultChip = async (req, res) => {
  try {
    const { id, faqId } = req.params;
    const faq = await FAQ.findOne({ _id: faqId, organizationId: id });

    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    faq.isDefaultChip = !faq.isDefaultChip;
    await faq.save();

    return res.status(200).json({
      success: true,
      message: `FAQ ${faq.isDefaultChip ? "pinned to" : "removed from"} default widget chips.`,
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendOrganizationCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const org = await Organization.findById(id);

    if (!org) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    // Generate a secure temporary password
    const tempPassword = crypto.randomBytes(4).toString("hex") + "A1!";
    org.password = tempPassword;
    await org.save();

    const portalLoginUrl =
      process.env.CLIENT_URL || "http://localhost:5173/login";
    const widgetOrigin = process.env.SERVER_URL || "http://localhost:5000";
    const embedScript = `<script src="${widgetOrigin}/widget.js" data-api-key="${org.apiKey}" async></script>`;
    const mailSender = process.env.MAIL_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from: `"Platform Admin" <${mailSender}>`,
      to: org.adminEmail,
      subject: `Your Chatbot Portal Credentials & Setup Script - ${org.name}`,
      html: `
        <h2>Welcome to your Chatbot Platform, ${org.name}!</h2>
        <p>Here are your access details to configure your AI Knowledge Base, theme, and logo.</p>
        
        <div style="background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;margin:16px 0;">
          <p><strong>Login Portal:</strong> <a href="${portalLoginUrl}">${portalLoginUrl}</a></p>
          <p><strong>Login Email:</strong> ${org.adminEmail}</p>
          <p><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
        </div>

        <h3>Your Website Embed Script</h3>
        <p>Paste this script right before the closing <code>&lt;/body&gt;</code> tag of your website:</p>
        <pre style="background:#0f172a;color:#f8fafc;padding:14px;border-radius:8px;font-size:12px;overflow-x:auto;">${embedScript.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        
        <p>Best regards,<br/>The Platform Team</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: `Credentials and setup instructions sent to ${org.adminEmail}`,
    });
  } catch (error) {
    console.error("Error sending credentials:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 1. Record manual payment & upgrade/renew subscription
exports.recordSubscriptionPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      currency,
      transactionId,
      paymentMethod,
      durationDays,
      notes,
    } = req.body;

    if (!amount || !transactionId || !durationDays) {
      return res.status(400).json({
        success: false,
        message: "Amount, transaction ID, and duration in days are required.",
      });
    }

    const org = await Organization.findById(id);
    if (!org) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    const parsedDays = Number(durationDays);
    const now = new Date();

    // If existing subscription is still active and in the future, extend from that future date.
    // Otherwise, start from right now.
    const baseDate =
      org.subscription?.expiresAt && new Date(org.subscription.expiresAt) > now
        ? new Date(org.subscription.expiresAt)
        : now;

    const newExpiryDate = new Date(
      baseDate.getTime() + parsedDays * 24 * 60 * 60 * 1000,
    );

    const paymentEntry = {
      amount: Number(amount),
      currency: currency || "INR",
      transactionId: transactionId.trim(),
      paymentMethod: paymentMethod || "UPI",
      durationDays: parsedDays,
      notes: notes ? notes.trim() : "",
      recordedBy: req.user?._id || req.user?.id,
      paidAt: now,
    };

    org.subscription.plan = "PREMIUM";
    org.subscription.isActive = true;
    org.subscription.expiresAt = newExpiryDate;
    org.subscription.paymentHistory.push(paymentEntry);

    await org.save();

    return res.status(200).json({
      success: true,
      message: `Subscription successfully renewed for ${parsedDays} days until ${newExpiryDate.toDateString()}.`,
      data: org.subscription,
    });
  } catch (error) {
    console.error("Payment Record Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Toggle active status manually (Pause / Resume)
exports.toggleOrganizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const org = await Organization.findById(id);
    if (!org) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    org.subscription.isActive = !org.subscription.isActive;
    await org.save();

    return res.status(200).json({
      success: true,
      message: `Organization has been ${org.subscription.isActive ? "activated" : "deactivated"}.`,
      isActive: org.subscription.isActive,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Fetch all enquiries for a specific organisation
 * @route   GET /api/v1/admin/organizations/:id/enquiries
 */
exports.getOrganizationEnquiries = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Organization ID" });
    }

    const enquiries = await Enquiry.find({ organizationId: id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWidgetConfig = async (req, res) => {
  try {
    const { apiKey } = req.query;
    const org = await Organization.findOne({ apiKey }).select(
      "name branding subscription contactDetails",
    );

    if (!org || !org.isSubscriptionValid()) {
      return res
        .status(403)
        .json({ success: false, message: "Widget inactive" });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: org.name,
        branding: org.branding,
        contactDetails: org.contactDetails || {},
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
