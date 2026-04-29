const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');

admin.initializeApp();

const db = admin.firestore();

const N8N_WEBHOOK_URL = 'https://gormaran.app.n8n.cloud/webhook/21087c94-9f6a-4311-8bd4-abccf5eb35af';

exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();

  if (snap.exists) {
    console.log(`[createUserProfile] Doc already exists for uid=${uid}, skipping.`);
    return null;
  }

  const profile = {
    uid,
    email: email || '',
    displayName: displayName || '',
    photoURL: photoURL || '',
    subscription: 'free',
    usageCount: 0,
    usageResetDate: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await userRef.set(profile);
  console.log(`[createUserProfile] Created profile for uid=${uid} (${email})`);

  // Notify n8n webhook
  try {
    const payload = JSON.stringify({
      uid,
      email: email || '',
      displayName: displayName || '',
      firstname: displayName ? displayName.split(' ')[0] : '',
      lastname: displayName ? displayName.split(' ').slice(1).join(' ') : '',
    });

    await new Promise((resolve, reject) => {
      const req = https.request(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      }, (res) => {
        console.log(`[createUserProfile] n8n webhook status: ${res.statusCode}`);
        resolve();
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  } catch (err) {
    console.error('[createUserProfile] Failed to notify n8n webhook:', err);
  }

  return null;
});