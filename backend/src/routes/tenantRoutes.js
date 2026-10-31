const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const adminController = require("../controllers/adminController");
const { protectTenant } = require("../middlewares/authMiddleware");

router.post("/login", tenantController.loginTenant);

// Protected Tenant routes
router.use(protectTenant);
router.get("/profile", tenantController.getMyProfile);
router.put("/profile", tenantController.updateMyProfile);
router.get("/enquiries", tenantController.getMyEnquiries);

// FAQ management inside tenant dashboard
router.get("/faqs", (req, res, next) => {
  req.params.id = req.user.orgId;
  adminController.getOrganizationFAQs(req, res, next);
});
router.post("/faqs", (req, res, next) => {
  req.params.id = req.user.orgId;
  adminController.createFAQ(req, res, next);
});
router.put("/faqs/:faqId", (req, res, next) => {
  req.params.id = req.user.orgId;
  adminController.updateOrganizationFAQ(req, res, next);
});
router.delete("/faqs/:faqId", (req, res, next) => {
  req.params.id = req.user.orgId;
  adminController.deleteOrganizationFAQ(req, res, next);
});
router.patch("/faqs/:faqId/toggle-chip", (req, res, next) => {
  req.params.id = req.user.orgId;
  adminController.toggleDefaultChip(req, res, next);
});
router.post("/scrape", (req, res, next) => {
  req.params.id = req.user.orgId;
  adminController.scrapeAndTrainFromWebsite(req, res, next);
});

module.exports = router;
