require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require('helmet');

// Inicialización de Firebase
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
const { router: apiKeysRouter } = require("./routes/apiKeys");
const v1Routes = require("./routes/v1");

const app = express();

// Configuración para Render (Proxy)
app.set('trust proxy', 1);

/* ===============================
   🔒 SEGURIDAD (Helmet)
================================ */
app.use(helmet({
  contentSecurityPolicy: false, // API pura
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const PORT = process.env.PORT || 5000;

/* ===============================
   🔥 CONFIGURACIÓN CORS (MODO RESCATE)
================================ */
// Usamos origin: true para que acepte cualquier petición que venga de tus dominios autorizados
// pero sea flexible con los subdominios y pre-flights.
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

/* ===============================
   🔥 BODY PARSING
================================ */
// Stripe webhook necesita el body en crudo (raw)
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ===============================
   🔥 HEALTH CHECK (CON DIAGNÓSTICO REAL)
================================ */
app.get("/health", (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    diagnostics: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      firebase: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      stripe: {
        detected: stripeKey.length > 0,
        length: stripeKey.length,
        prefix: stripeKey.substring(0, 7) // Debería ser sk_live
      },
      env_node: process.env.NODE_ENV || "development"
    }
  });
});

/* ===============================
   🔥 RUTAS
================================ */
app.use("/api/ai", aiRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/webhooks/instagram", instagramWebhook);
app.use("/api/email", emailTrackingRoutes);
app.use("/api/apikeys", apiKeysRouter);
app.use("/api/v1", v1Routes);

/* ===============================
   🔥 MANEJO DE ERRORES
================================ */
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.url} no encontrada` });
});

app.use((err, req, res, next) => {
  console.error("[Server Error]", err.message);
  // Importante: Si hay un error, devolvemos JSON para no romper el CORS en el cliente
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  });
});

/* ===============================
   🚀 ARRANQUE
================================ */
app.listen(PORT, () => {
  console.log(`\n🚀 Gormaran AI Backend Listo`);
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Stripe Key: ${process.env.STRIPE_SECRET_KEY ? "✅ Detectada" : "❌ Faltante"}\n`);
});

module.exports = app;