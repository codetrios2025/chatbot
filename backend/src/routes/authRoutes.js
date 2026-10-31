const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authPasswordController = require("../controllers/authPasswordController");
const { protect, protectTenant } = require("../middlewares/authMiddleware");

router.post("/login", authController.login);

// Public Forgot & Reset
router.post("/forgot-password", authPasswordController.forgotPassword);
router.post("/reset-password", authPasswordController.resetPassword);

// Change password for logged-in superadmin
router.put("/change-password", protect, authPasswordController.changePassword);

// Change password for logged-in tenant
router.put(
  "/tenant-change-password",
  protectTenant,
  authPasswordController.changePassword,
);

module.exports = router;
