const admin = require('firebase-admin');

// Firebase may be initialized by index.js via FIREBASE_SERVICE_ACCOUNT
function isFirebaseReady() {
  return admin.apps.length > 0;
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (!isFirebaseReady()) {
      req.user = { uid: 'dev-user', email: 'dev@localhost' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized — missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  if (!isFirebaseReady()) {
    req.user = { uid: 'dev-user', email: 'dev@localhost' };
    return next();
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
