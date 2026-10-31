const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Organization = require("../models/Organization");

/**
 * Verifies Bearer JWT from Authorization Header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No authentication token provided.",
    });
  }

  try {
    // 1. Verify token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Ensure user still exists and is active
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact an administrator.",
      });
    }

    // Attach user record to request context
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

/**
 * Restricts access to specific roles (RBAC)
 * @param  {...string} roles - e.g. 'superadmin', 'admin'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

const protectTenant = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    const currentOrg = await Organization.findById(decoded.orgId || decoded.id);

    if (!currentOrg) {
      return res.status(401).json({
        success: false,
        message: "The organization belonging to this token no longer exists.",
      });
    }

    if (!currentOrg.isSubscriptionValid()) {
      return res.status(403).json({
        success: false,
        message:
          "Subscription expired. Chatbot and dashboard access are suspended.",
      });
    }

    if (!currentOrg.subscription?.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your organization account is inactive or suspended.",
      });
    }

    req.org = currentOrg;
    req.user = {
      id: currentOrg._id,
      orgId: currentOrg._id,
      role: "org_admin",
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token.",
    });
  }
};

module.exports = { protect, authorize, protectTenant };
