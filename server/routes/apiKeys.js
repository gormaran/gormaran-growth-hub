const express = require('express');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/firebaseAuth');

const router = express.Router();

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function generateKey() {
  const raw = crypto.randomBytes(32).toString('hex');
  return `grm_live_${raw}`;
}

// GET /api/apikeys — list API keys for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const adminSdk = require('firebase-admin');
    const fsDb = adminSdk.firestore();
    const snap = await fsDb
      .collection('users').doc(req.user.uid)
      .collection('apiKeys').orderBy('createdAt', 'desc').get();
    const keys = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        prefix: data.prefix,
        createdAt: data.createdAt?.toMillis?.() || null,
        lastUsed: data.lastUsed?.toMillis?.() || null,
      };
    });
    res.json({ keys });
  } catch (err) {
    console.error('[APIKeys] list error:', err.message);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

// POST /api/apikeys — generate a new API key
router.post('/', verifyToken, async (req, res) => {
  try {
    const adminSdk = require('firebase-admin');
    const fsDb = adminSdk.firestore();

    // Check subscription — Enterprise only
    const userDoc = await fsDb.collection('users').doc(req.user.uid).get();
    const sub = userDoc.data()?.subscription || 'free';
    const PLAN_ALIASES = { grow: 'pro', scale: 'pro', evolution: 'enterprise', business: 'enterprise' };
    const resolvedSub = PLAN_ALIASES[sub] || sub;
    const adminUids = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (resolvedSub !== 'enterprise' && !adminUids.includes(req.user.uid)) {
      return res.status(403).json({ error: 'API access requires Enterprise plan' });
    }

    // Max 5 keys per user
    const existing = await fsDb.collection('users').doc(req.user.uid).collection('apiKeys').get();
    if (existing.size >= 5) {
      return res.status(400).json({ error: 'Maximum 5 API keys per account' });
    }

    const key = generateKey();
    const prefix = key.slice(0, 18) + '...';
    const hashed = hashKey(key);
    const { name = 'API Key' } = req.body;

    const ref = fsDb.collection('users').doc(req.user.uid).collection('apiKeys').doc();
    await ref.set({
      name: name.slice(0, 50),
      prefix,
      keyHash: hashed,
      createdAt: adminSdk.firestore.FieldValue.serverTimestamp(),
      lastUsed: null,
    });

    // Return the plain key ONCE — not stored anywhere
    res.json({ id: ref.id, key, prefix, name });
  } catch (err) {
    console.error('[APIKeys] generate error:', err.message);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// DELETE /api/apikeys/:id — revoke an API key
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const adminSdk = require('firebase-admin');
    const fsDb = adminSdk.firestore();
    await fsDb.collection('users').doc(req.user.uid).collection('apiKeys').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('[APIKeys] delete error:', err.message);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// Middleware: validate API key from Authorization header — used by /api/v1/* routes
async function validateApiKey(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer grm_live_')) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  const key = auth.slice(7);
  const hashed = hashKey(key);
  try {
    const adminSdk = require('firebase-admin');
    const fsDb = adminSdk.firestore();
    const snap = await fsDb.collectionGroup('apiKeys').where('keyHash', '==', hashed).limit(1).get();
    if (snap.empty) return res.status(401).json({ error: 'API key not found or revoked' });
    const keyDoc = snap.docs[0];
    const uid = keyDoc.ref.parent.parent.id;
    // Update lastUsed async — don't await
    keyDoc.ref.update({ lastUsed: adminSdk.firestore.FieldValue.serverTimestamp() }).catch(() => {});
    req.user = { uid };
    next();
  } catch (err) {
    console.error('[APIKeys] validate error:', err.message);
    res.status(500).json({ error: 'Failed to validate API key' });
  }
}

module.exports = { router, validateApiKey };
