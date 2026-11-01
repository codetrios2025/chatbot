require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const connectDB = require("./src/config/db");

const app = express();

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const FRONTEND_DIST = path.resolve(__dirname, "../admin/dist");
const BACKEND_PUBLIC = path.resolve(__dirname, "public");

// Hostinger runs the application behind a proxy.
app.set("trust proxy", 1);

// Disable Express identification header.
app.disable("x-powered-by");

// ============================================
// CORS CONFIGURATION
// ============================================

// Same-origin frontend requests do not require CORS.
// External websites embedding your chatbot widget
// may require cross-origin access.

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://chatbot.codetrios.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured origins.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow external websites to use the chatbot widget.
      // Restrict this list later if your widget has
      // a defined customer-domain allowlist.
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ============================================
// BODY PARSERS
// ============================================

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  }),
);

// ============================================
// NO-SQL INJECTION SANITIZATION
// ============================================

const sanitizeNoSql = (obj) => {
  if (!obj || typeof obj !== "object") return;

  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeNoSql(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeNoSql(req.body);

  if (req.params) sanitizeNoSql(req.params);

  if (req.query) sanitizeNoSql(req.query);

  next();
});

// ============================================
// SERVE CHATBOT WIDGET FILES
// ============================================

if (fs.existsSync(BACKEND_PUBLIC)) {
  app.use(express.static(BACKEND_PUBLIC));
}

// ============================================
// API ROUTES
// ============================================

app.use("/api/v1/auth", require("./src/routes/authRoutes"));

app.use("/api/v1/admin", require("./src/routes/adminRoutes"));

app.use("/api/v1/widget", require("./src/routes/widgetRoutes"));

app.use("/api/v1/tenant", require("./src/routes/tenantRoutes"));

// Unknown API routes should return JSON, not React HTML.
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ============================================
// SERVE REACT PRODUCTION BUILD
// ============================================

if (fs.existsSync(FRONTEND_DIST)) {
  console.log("Frontend build found:", FRONTEND_DIST);

  // Serve React static assets.
  app.use(express.static(FRONTEND_DIST));

  // React Router fallback.
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    const indexPath = path.join(FRONTEND_DIST, "index.html");

    res.sendFile(indexPath, (err) => {
      if (err) next(err);
    });
  });
} else {
  console.warn("WARNING: Frontend build not found at:", FRONTEND_DIST);
}

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
});

// ============================================
// START SERVER AFTER DATABASE CONNECTION
// ============================================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log("--------------------------------");
      console.log("Chatbot Platform Started");
      console.log("Environment:", NODE_ENV);
      console.log("Port:", PORT);
      console.log(
        "Frontend:",
        fs.existsSync(FRONTEND_DIST) ? "Available" : "Build not found",
      );
      console.log("--------------------------------");
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
