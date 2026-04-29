const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');

admin.initializeApp();

const db = admin.firestore();

const N8N_WEBHOOK_URL = 'https://gormaran.app.n8n.cloud/webhook/21087c94-9f6a-4311-8bd4-abccf5eb35af';

// Runs daily at 03:00 UTC — downgrades users whose subscription period has ended
exports.checkExpiredSubscriptions = functions.pubsub
  .schedule('0 3 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await db.collection('users')
      .where('subscriptionCancelAt', '<=', now)
      .get();

    if (snapshot.empty) return null;

    const batch = db.batch();
    let count = 0;
    snapshot.forEach((doc) => {
      const { subscription } = doc.data();
      if (subscription === 'free' || subscription === 'admin') return;
      batch.update(doc.ref, {
        subscription: 'free',
        stripeSubscriptionId: null,
        subscriptionCancelAt: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      count++;
    });

    if (count > 0) await batch.commit();
    console.log(`[checkExpiredSubscriptions] Downgraded ${count} users to free`);
    return null;
  });

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