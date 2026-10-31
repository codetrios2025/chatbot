require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/db");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();

// Connect to MongoDB
connectDB();

// Whitelist for your admin dashboard
const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:3000",
];

// Apply CORS globally with a dynamic origin checker
app.use(
  cors({
    origin: function (origin, callback) {
      // 1. Allow server-to-server, curl, Postman, or requests without origin header
      if (!origin) return callback(null, true);

      // 2. Allow whitelisted admin frontend origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Allow any client website embedding the chatbot widget
      // (For widget requests coming from customer websites)
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body Parsers
// app.use(express.json());

// app.use(express.json({ limit: "10kb" })); // Reject oversized payloads
// app.use(express.urlencoded({ extended: true, limit: "10kb" }));
// 1. Recursive helper to strip NoSQL operators ($ and .) without reassigning req properties
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

// 2. Body Parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 3. In-Place Sanitizer Middleware (Express v5 safe)
app.use((req, res, next) => {
  if (req.body) sanitizeNoSql(req.body);
  if (req.params) sanitizeNoSql(req.params);
  if (req.query) sanitizeNoSql(req.query);
  next();
});
app.use(express.urlencoded({ extended: true }));

// Serve Widget Script statically
app.use(express.static(path.join(__dirname, "public")));

// Routes (No need to pass cors() here again)
app.use("/api/v1/auth", require("./src/routes/authRoutes"));
app.use("/api/v1/admin", require("./src/routes/adminRoutes"));
app.use("/api/v1/widget", require("./src/routes/widgetRoutes"));
app.use("/api/v1/tenant", require("./src/routes/tenantRoutes"));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
