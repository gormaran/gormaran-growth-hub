const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

const VALID_EMAIL_TYPES = ['day1', 'day3', 'day12', 'day14', 'reactivation'];

/**
 * Middleware de seguridad
 */
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    console.error('⚠️ Intento de acceso no autorizado (API Key incorrecta o ausente)');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * POST /api/email/mark-sent
 * Body: { uid, emailType }
 * Auth: x-api-key header must match INTERNAL_API_KEY env var
 */
router.post('/mark-sent', requireApiKey, async (req, res) => {
  const { uid, emailType } = req.body;

  // 1. Validaciones de entrada
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

    // 2. Verificamos si el usuario existe antes de intentar actualizar
    const doc = await ref.get();

    if (!doc.exists) {
      console.warn(`[mark-email-sent] Usuario no encontrado: ${uid}`);
      return res.status(404).json({ error: `No user found with uid: ${uid}` });
    }

    // 3. Actualizamos el campo dinámico (Dot Notation)
    await ref.update({
      [`emailsSent.${emailType}`]: true
    });

    console.log(`✅ Firebase actualizado con éxito: Usuario ${uid} -> emailsSent.${emailType} = true`);

    return res.json({ 
      success: true, 
      message: 'Status updated in Firebase',
      uid, 
      emailType 
    });

  } catch (err) {
    // 4. Captura de errores detallada para los logs de Render
    console.error('[mark-email-sent] Error detallado:', err);
    
    // Si es un error de permisos (el que vimos antes), saldrá aquí
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