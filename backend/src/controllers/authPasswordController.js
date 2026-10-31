const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Organization = require("../models/Organization");
const transporter = require("../config/mailer");

// Helper to hash passwords consistently
const hashPassword = async (pass) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pass, salt);
};

// -------------------------------------------------------------
// 1. CHANGE PASSWORD (Logged-in User or Organization)
// -------------------------------------------------------------
exports.changePasswordold = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password.",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }

    let account;
    if (req.user?.role === "org_admin") {
      account = await Organization.findById(req.user.orgId);
    } else {
      account = await User.findById(req.user.id);
    }

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found." });
    }

    const isMatch = await account.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect." });
    }

    account.password = newPassword; // Mongoose pre-save hook handles hashing
    await account.save();

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }

    let account;
    // Check if tenant or superadmin
    if (req.user?.role === "org_admin") {
      account = await Organization.findById(
        req.user.orgId || req.user.id,
      ).select("+password");
    } else {
      account = await User.findById(req.user.id || req.user._id).select(
        "+password",
      );
    }

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found." });
    }

    // Verify current password (using method or fallback direct bcrypt compare)
    const isMatch =
      typeof account.comparePassword === "function"
        ? await account.comparePassword(currentPassword)
        : await bcrypt.compare(currentPassword, account.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Set new password (the model's pre-save hook will hash it)
    account.password = newPassword;
    await account.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 2. FORGOT PASSWORD (Sends Email with Reset Token)
// -------------------------------------------------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email, accountType } = req.body; // accountType: 'admin' | 'tenant'
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter your email." });
    }

    const cleanEmail = email.toLowerCase().trim();
    let account;
    if (accountType === "admin") {
      account = await User.findOne({ email: cleanEmail });
    } else {
      account = await Organization.findOne({ adminEmail: cleanEmail });
    }

    if (!account) {
      // Return 200 for security so attackers cannot enumerate valid emails
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been dispatched.",
      });
    }

    const resetToken = account.getResetPasswordToken();
    await account.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&type=${accountType}`;
    const mailSender = process.env.MAIL_FROM || process.env.SMTP_USER;

    try {
      await transporter.sendMail({
        from: `"Security & Access" <${mailSender}>`,
        to: cleanEmail,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your ${accountType === "admin" ? "Superadmin" : "Organisation"} account.</p>
            <p>Click the button below to reset your password. This link is valid for <strong>60 minutes</strong>:</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="font-size: 12px; color: #64748b;">If you did not request this, please safely ignore this email.</p>
          </div>
        `,
      });

      return res.status(200).json({
        success: true,
        message: "Password reset link sent to your email.",
      });
    } catch (mailError) {
      account.resetPasswordToken = undefined;
      account.resetPasswordExpire = undefined;
      await account.save({ validateBeforeSave: false });
      return res
        .status(500)
        .json({ success: false, message: "Failed to send reset email." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 3. RESET PASSWORD (Verifies Token & Sets New Password)
// -------------------------------------------------------------
exports.resetPassword = async (req, res) => {
  try {
    const { token, accountType, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required.",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    let account;
    const query = {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    };

    if (accountType === "admin") {
      account = await User.findOne(query);
    } else {
      account = await Organization.findOne(query);
    }

    if (!account) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token." });
    }

    account.password = newPassword;
    account.resetPasswordToken = undefined;
    account.resetPasswordExpire = undefined;
    await account.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
