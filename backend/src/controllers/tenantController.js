const jwt = require("jsonwebtoken");
const Organization = require("../models/Organization");
const Enquiry = require("../models/Enquiry");

const signToken = (org) => {
  return jwt.sign(
    { id: org._id, role: "org_admin", orgId: org._id },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "7d" },
  );
};

// Tenant Login
exports.loginTenant = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const org = await Organization.findOne({
      adminEmail: email.toLowerCase().trim(),
    });
    if (!org) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await org.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    // Subscription & expiry gate
    if (!org.isSubscriptionValid()) {
      return res.status(403).json({
        success: false,
        message:
          "Your subscription or 7-day trial has expired. Chatbot and portal access are disabled. Please contact the platform admin to renew.",
      });
    }

    if (!org.subscription?.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Account suspended or expired." });
    }

    const token = signToken(org);
    return res.status(200).json({
      success: true,
      token,
      org: {
        _id: org._id,
        name: org.name,
        adminEmail: org.adminEmail,
        apiKey: org.apiKey,
        branding: org.branding,
        allowedDomains: org.allowedDomains,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch Current Organization Profile
exports.getMyProfile = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select("-password");
    if (!org)
      return res.status(404).json({ success: false, message: "Not found." });
    return res.status(200).json({ success: true, data: org });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Organization Profile & Theme/Identity
exports.updateMyProfileold = async (req, res) => {
  try {
    const { adminEmail, branding, allowedDomains } = req.body;
    const org = await Organization.findById(req.user.orgId);

    if (!org)
      return res.status(404).json({ success: false, message: "Not found." });

    if (adminEmail && adminEmail !== org.adminEmail) {
      const exists = await Organization.findOne({
        adminEmail: adminEmail.toLowerCase().trim(),
      });
      if (exists) {
        return res
          .status(400)
          .json({ success: false, message: "Email already registered." });
      }
      org.adminEmail = adminEmail.toLowerCase().trim();
    }

    if (Array.isArray(allowedDomains)) {
      org.allowedDomains = allowedDomains;
    }

    if (branding) {
      org.branding = { ...org.branding, ...branding };
    }

    await org.save();
    return res
      .status(200)
      .json({ success: true, message: "Profile updated.", data: org });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateMyProfile = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || req.user?._id || req.user?.id;
    const { adminEmail, branding, contactDetails } = req.body;

    const updateFields = {};

    if (adminEmail) {
      updateFields.adminEmail = adminEmail.trim().toLowerCase();
    }

    // Branding updates
    if (branding) {
      if (branding.botName !== undefined)
        updateFields["branding.botName"] = branding.botName.trim();
      if (branding.welcomeMessage !== undefined)
        updateFields["branding.welcomeMessage"] =
          branding.welcomeMessage.trim();
      if (branding.themeColor !== undefined)
        updateFields["branding.themeColor"] = branding.themeColor;
      if (branding.logoUrl !== undefined)
        updateFields["branding.logoUrl"] = branding.logoUrl.trim();
      if (branding.position !== undefined)
        updateFields["branding.position"] = branding.position;
    }

    // Public Contact Details updates
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

    const updatedOrg = await Organization.findByIdAndUpdate(
      orgId,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Settings and contact details updated successfully.",
      data: updatedOrg,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Fetch enquiries exclusively for the logged-in organisation
 * @route   GET /api/v1/tenant/enquiries
 * @access  Tenant Protected (Organisation Admin only)
 */
exports.getMyEnquiries = async (req, res) => {
  try {
    // orgId is extracted from auth middleware (req.user.id or req.user.orgId)
    const orgId = req.user?.organizationId || req.user?._id || req.user?.id;

    if (!orgId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Organisation not identified.",
      });
    }

    const enquiries = await Enquiry.find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    console.error("[getMyEnquiries Error]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
