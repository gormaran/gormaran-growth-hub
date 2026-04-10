const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

const VALID_EMAIL_TYPES = ['day1', 'day3', 'day12', 'day14', 'reactivation'];

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/email/mark-sent
// Body: { uid, emailType }
// Auth: x-api-key header must match INTERNAL_API_KEY env var
router.post('/mark-sent', requireApiKey, async (req, res) => {
  const { uid, emailType } = req.body;

  if (!uid || !emailType) {
    return res.status(400).json({ error: 'Missing required fields: uid, emailType' });
  }

  if (!VALID_EMAIL_TYPES.includes(emailType)) {
    return res.status(400).json({
      error: `Invalid emailType. Must be one of: ${VALID_EMAIL_TYPES.join(', ')}`,
    });
  }

  try {
    const db = admin.firestore();
    const ref = db.collection('users').doc(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: `No user found with uid: ${uid}` });
    }

    await ref.update({ [`emailsSent.${emailType}`]: true });

    return res.json({ success: true, uid, emailType });
  } catch (err) {
    console.error('[mark-email-sent]', err.message);
    return res.status(500).json({ error: 'Failed to update emailsSent field' });
  }
});

module.exports = router;
