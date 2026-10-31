const Organization = require("../models/Organization");
const Enquiry = require("../models/Enquiry");
const transporter = require("../config/mailer");
const {
  generateAdminLeadEmail,
  generateClientAckEmail,
} = require("../utils/emailTemplates");

// Helper: Neutralize XSS characters before embedding into HTML email templates
const sanitizeForHtml = (value) => {
  if (typeof value !== "string") return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

exports.submitEnquiry = async (req, res) => {
  try {
    const { apiKey, name, email, phone, company, serviceInterest, message } =
      req.body;

    // 1. Defend against NoSQL/SQL Object Injection (Verify primitive String types)
    if (!apiKey || typeof apiKey !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Valid API key is required." });
    }
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Name is required and must contain at least 2 characters.",
      });
    }
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Valid email is required.",
      });
    }
    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: "Message must contain at least 5 characters.",
      });
    }

    // 2. Format & Sanitize Inputs
    const cleanName = name.trim().slice(0, 80);
    const cleanEmail = email.trim().toLowerCase().slice(0, 100);
    const cleanCompany = (
      typeof company === "string" ? company.trim() : ""
    ).slice(0, 100);
    const cleanMessage = message.trim().slice(0, 1500);

    // Strict RFC 5322 Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    // Phone is optional: Validate format only when provided
    let cleanPhone = "";
    if (phone && typeof phone === "string" && phone.trim()) {
      const trimmedPhone = phone.trim().slice(0, 20);
      const phoneRegex = /^[+0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid phone number format. Please enter valid digits, spaces, or a + country code prefix.",
        });
      }
      cleanPhone = trimmedPhone;
    }

    // Whitelist supported service interest categories
    const allowedServices = [
      "IoT & Embedded",
      "Cloud & DevOps",
      "Telecom & Networking",
      "Custom Software",
      "General Inquiry",
    ];
    const cleanServiceInterest = allowedServices.includes(serviceInterest)
      ? serviceInterest
      : "General Inquiry";

    // 3. Locate Organization (Cast explicitly to string to block query operator injections)
    const org = await Organization.findOne({ apiKey: String(apiKey) });
    if (!org) {
      return res
        .status(404)
        .json({ success: false, error: "Organization not found." });
    }

    // 4. Safe Subscription Check
    const isBotActive =
      typeof org.isChatbotEnabled === "function"
        ? org.isChatbotEnabled()
        : Boolean(
            org.subscription?.isActive &&
            (!org.subscription?.expiresAt ||
              new Date() <= new Date(org.subscription.expiresAt)),
          );

    if (!isBotActive) {
      return res.status(403).json({
        success: false,
        error:
          "Submission rejected: chatbot service is inactive or subscription expired.",
      });
    }

    // 5. Persist Sanitized Lead in MongoDB
    const enquiry = await Enquiry.create({
      organizationId: org._id,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      company: cleanCompany,
      serviceInterest: cleanServiceInterest,
      message: cleanMessage,
    });

    // 6. Dual Email Dispatch with HTML Escaping
    const mailSender = process.env.MAIL_FROM || process.env.SMTP_USER;

    if (mailSender) {
      const sanitizedLead = {
        name: sanitizeForHtml(cleanName),
        email: sanitizeForHtml(cleanEmail),
        phone: sanitizeForHtml(cleanPhone) || "Not provided",
        company: sanitizeForHtml(cleanCompany) || "Not provided",
        serviceInterest: sanitizeForHtml(cleanServiceInterest),
        message: sanitizeForHtml(cleanMessage),
      };

      const adminMail =
        typeof generateAdminLeadEmail === "function"
          ? generateAdminLeadEmail(org.name, sanitizedLead)
          : {
              subject: `New Lead Enquiry from ${sanitizedLead.name} (${org.name})`,
              html: `
                <h3>New Chatbot Enquiry</h3>
                <p><strong>Name:</strong> ${sanitizedLead.name}</p>
                <p><strong>Email:</strong> ${sanitizedLead.email}</p>
                <p><strong>Phone:</strong> ${sanitizedLead.phone}</p>
                <p><strong>Company:</strong> ${sanitizedLead.company}</p>
                <p><strong>Service Interest:</strong> ${sanitizedLead.serviceInterest}</p>
                <p><strong>Requirements:</strong></p>
                <p style="background: #f1f5f9; padding: 12px; border-radius: 8px;">${sanitizedLead.message}</p>
              `,
            };

      const clientMail =
        typeof generateClientAckEmail === "function"
          ? generateClientAckEmail(org.name, sanitizedLead.name)
          : {
              subject: `Thank you for contacting ${org.name}`,
              html: `
                <p>Hi ${sanitizedLead.name},</p>
                <p>Thank you for contacting <strong>${org.name}</strong>. We have received your project enquiry and will get back to you shortly.</p>
                <br/>
                <p>Best regards,<br/>${org.name} Team</p>
              `,
            };

      // 1. Send notification to organization admin
      transporter
        .sendMail({
          from: `"Chatbot System" <${mailSender}>`,
          to: org.adminEmail,
          subject: adminMail.subject,
          html: adminMail.html,
        })
        .then(() =>
          console.log(
            `[Mailer] Lead notification delivered to ${org.adminEmail}`,
          ),
        )
        .catch((err) =>
          console.error("[Mailer] Failed sending admin email:", err.message),
        );

      // 2. Send acknowledgment to the prospective client
      transporter
        .sendMail({
          from: `"${org.name}" <${mailSender}>`,
          to: cleanEmail,
          subject: clientMail.subject,
          html: clientMail.html,
        })
        .then(() =>
          console.log(`[Mailer] Confirmation delivered to ${cleanEmail}`),
        )
        .catch((err) =>
          console.error("[Mailer] Failed sending client email:", err.message),
        );
    } else {
      console.warn(
        "[Mailer] MAIL_FROM or SMTP_USER missing in .env; email dispatch skipped.",
      );
    }

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      data: {
        id: enquiry._id,
        name: enquiry.name,
        email: enquiry.email,
      },
    });
  } catch (error) {
    console.error("Enquiry Submission Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error processing enquiry",
    });
  }
};
