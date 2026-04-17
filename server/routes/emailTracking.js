const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

const VALID_EMAIL_TYPES = ['hour1', 'hour6', 'hour23', 'day1', 'reactivation'];

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    console.error('⚠️ Intento de acceso no autorizado (API Key incorrecta o ausente)');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.post('/mark-sent', requireApiKey, async (req, res) => {
  const { uid, emailType } = req.body;

  if (!uid || !emailType) {
    return res.status(400).json({ error: 'Missing required fields: uid, emailType' });
  }

  const isValidEmailType =
    VALID_EMAIL_TYPES.includes(emailType) ||
    /^ai_day_\d+$/.test(emailType);

  if (!isValidEmailType) {
    return res.status(400).json({
      error: `Invalid emailType. Must be one of: ${VALID_EMAIL_TYPES.join(', ')} or ai_day_N`,
    });
  }

  try {
    const db = admin.firestore();
    const ref = db.collection('users').doc(uid);

    const doc = await ref.get();

    if (!doc.exists) {
      console.warn(`[mark-email-sent] Usuario no encontrado: ${uid}`);
      return res.status(404).json({ error: `No user found with uid: ${uid}` });
    }

    await ref.update({
      [`emailsSent.${emailType}`]: true
    });

    console.log(`✅ Firebase actualizado: Usuario ${uid} -> emailsSent.${emailType} = true`);

    return res.json({
      success: true,
      message: 'Status updated in Firebase',
      uid,
      emailType
    });

  } catch (err) {
    console.error('[mark-email-sent] Error detallado:', err);

    if (err.code === 16 || err.message.includes('UNAUTHENTICATED')) {
      return res.status(500).json({
        error: 'Firebase Auth Error. Check IAM roles in Google Cloud.'
      });
    }

    return res.status(500).json({
      error: 'Failed to update emailsSent field',
      details: err.message
    });
  }
});

module.exports = router;