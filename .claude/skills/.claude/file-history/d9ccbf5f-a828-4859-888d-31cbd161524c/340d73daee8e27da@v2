require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require('helmet');

const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const aiRoutes = require("./routes/ai");
const stripeRoutes = require("./routes/stripe");
const imageRoutes = require("./routes/imageGeneration");
const oauthRoutes = require("./routes/oauth");
const instagramWebhook = require("./routes/instagramWebhook");
const emailTrackingRoutes = require("./routes/emailTracking");


const app = express();
app.set('trust proxy', 1);

/* ===============================
   🔒 SECURITY HEADERS (helmet)
================================ */
app.use(helmet({
  // This is an API-only server — no HTML pages served, so CSP is intentionally minimal
  contentSecurityPolicy: false,
  // Prevent MIME-type sniffing
  noSniff: true,
  // Deny framing from any origin
  frameguard: { action: 'deny' },
  // Remove X-Powered-By
  hidePoweredBy: true,
  // Strict Transport Security (1 year, include subdomains)
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  // Prevent IE from opening downloads in the site's context
  ieNoOpen: true,
  // Disable XSS filter (deprecated, modern browsers ignore it — CSP is the right tool)
  xssFilter: false,
})); // Required for Render (proxy) — fixes express-rate-limit X-Forwarded-For error
const PORT = process.env.PORT || 5000;


/* ===============================
   🔥 CORS CONFIG (PRODUCTION READY)
================================ */

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://gormaran-growth-hub-1.onrender.com", // frontend
  "https://gormaran-growth-hub.onrender.com",   // backend
  "https://gormaran.io",
  "https://www.gormaran.io",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);



/* ===============================
   🔥 BODY PARSING
================================ */

// Stripe webhook necesita raw body
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ===============================
   🔥 HEALTH CHECK
================================ */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      firebase: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    },
  });
});

/* ===============================
   🔥 ROUTES
================================ */
app.use("/api/ai", aiRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/webhooks/instagram", instagramWebhook);
app.use("/api/email", emailTrackingRoutes);

/* ===============================
   🔥 404
================================ */
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.url} not found`,
  });
});

/* ===============================
   🔥 ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.message);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

/* ===============================
   🔥 START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`\n🚀 Gormaran AI Growth Hub Server`);
  console.log(`   Running on port: ${PORT}`);
  console.log(`   Health: /health\n`);
});

module.exports = app;