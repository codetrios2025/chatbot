const express = require("express");
const router = express.Router();
const widgetController = require("../controllers/widgetController");
const enquiryController = require("../controllers/enquiryController");
const widgetLimiter = require("../middlewares/rateLimiter");

router.use(widgetLimiter);

router.get("/init", widgetController.initWidget);
router.post("/ask", widgetController.askQuestion);
router.post("/enquiry", enquiryController.submitEnquiry);

module.exports = router;
