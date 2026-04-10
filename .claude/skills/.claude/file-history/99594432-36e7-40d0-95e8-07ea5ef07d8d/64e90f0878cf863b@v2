const admin = require('firebase-admin');

const IS_DEV = process.env.NODE_ENV !== 'production';

// Firebase may be initialized by index.js via FIREBASE_SERVICE_ACCOUNT
function isFirebaseReady() {
  return admin.apps.length > 0;
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Dev-only bypass: allow unauthenticated requests when Firebase is not configured locally
    if (IS_DEV && !isFirebaseReady()) {
      req.user = { uid: 'dev-user', email: 'dev@localhost' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized — missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Dev-only bypass: if Firebase not initialized, skip real verification
  if (IS_DEV && !isFirebaseReady()) {
    req.user = { uid: 'dev-user', email: 'dev@localhost' };
    return next();
  }

  if (!isFirebaseReady()) {
    // Firebase should always be initialized in production — this is a server misconfiguration
    console.error('[Auth] Firebase Admin SDK not initialized');
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
}

module.exports = { verifyToken };
