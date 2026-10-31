const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// Apply protection to all routes in this router
router.use(protect);

// Organization Management:
// - Any authenticated admin can view organizations
// - Only 'superadmin' can register new organizations
router
  .route("/organizations")
  .get(
    authorize("superadmin", "admin", "moderator"),
    adminController.getAllOrganizations,
  )
  .post(authorize("superadmin"), adminController.createOrganization);

// Subscription Toggle:
// - Critical billing action restricted purely to 'superadmin'
router.patch(
  "/organizations/:id/subscription",
  authorize("superadmin"),
  adminController.updateSubscriptionStatus,
);

// FAQ Management:
// - Both 'superadmin' and 'admin' can view and edit FAQs
router
  .route("/organizations/:id/faqs")
  .get(authorize("superadmin", "admin"), adminController.getOrganizationFAQs)
  .post(authorize("superadmin", "admin"), adminController.addOrganizationFAQ);

router.post(
  "/organizations/:id/scrape",
  authorize("superadmin", "admin"),
  adminController.scrapeAndTrainFromWebsite,
);

router
  .route("/organizations/:id/faqs/:faqId")
  .put(authorize("superadmin", "admin"), adminController.updateOrganizationFAQ)
  .delete(
    authorize("superadmin", "admin"),
    adminController.deleteOrganizationFAQ,
  );

// Organization Management:
// - Both 'superadmin' and 'admin' can view and edit organizations
router
  .route("/organizations/:id")
  .put(authorize("superadmin"), adminController.updateOrganization);

router.patch(
  "/organizations/:id/faqs/:faqId/toggle-chip",
  authorize("superadmin", "admin"),
  adminController.toggleDefaultChip,
);

router.post(
  "/organizations/:id/send-credentials",
  authorize("superadmin"),
  adminController.sendOrganizationCredentials,
);

router.post(
  "/organizations/:id/payment",
  authorize("superadmin"),
  adminController.recordSubscriptionPayment,
);

router.patch(
  "/organizations/:id/toggle-status",
  authorize("superadmin"),
  adminController.toggleOrganizationStatus,
);

router.get(
  "/organizations/:id/enquiries",
  adminController.getOrganizationEnquiries,
);

module.exports = router;
