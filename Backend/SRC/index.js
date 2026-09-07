const { PORT } = require("./config/env");
const paymentRoutes = require("./routes/paymentRoutes");
const articleRoutes = require("./routes/articleRoutes");
const adminRoutes = require("./routes/adminRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const packageRoutes = require("./routes/packageRoutes");
const publisherRoutes = require("./routes/publisherRoutes");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const errorMiddleware = require("./middlewares/errorMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");

const app = express();

// ================================
// Security Middleware
// ================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL || "http://localhost:5173"],
      upgradeInsecureRequests: [],
    },
  },
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
}));
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ================================
// Body Parser
// ================================

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================================
// Health Check
// ================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Article Publish Portal API is running",
  });
});

// ================================
// API Routes
// ================================

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/publishers", publisherRoutes);
app.use(
  "/api/payments",
  paymentRoutes
);
app.use(
  "/api/admin",
  adminRoutes
);
app.use("/api/pdfs", pdfRoutes);
// Later:
// app.use("/api/articles", articleRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/admin", adminRoutes);

// ================================
// 404 Handler
// ================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ================================
// Global Error Handler
// ================================

app.use(errorMiddleware);

// ================================
// Start Server
// ================================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
