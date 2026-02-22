const admin = require('firebase-admin');

let adminInitialized = false;

function initAdmin() {
  if (adminInitialized) return;
  if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'your_project_id') {
    console.warn('[Firebase Admin] Not configured — auth middleware will allow all requests in dev mode');
    adminInitialized = true;
    return;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  adminInitialized = true;
}

async function verifyToken(req, res, next) {
  initAdmin();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In development without Firebase configured, allow pass-through with mock user
    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'your_project_id') {
      req.user = { uid: 'dev-user', email: 'dev@localhost', subscription: 'pro' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized — missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'your_project_id') {
      req.user = { uid: 'dev-user', email: 'dev@localhost', subscription: 'pro' };
      return next();
    }
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
}

module.exports = { verifyToken };
