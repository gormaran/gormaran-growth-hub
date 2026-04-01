const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

/**
 * onCreate trigger — fires whenever a new user is created in Firebase Auth,
 * whether via email/password, Google OAuth, or any other provider.
 *
 * Creates the Firestore user document so it always exists from the moment
 * of registration, independently of any client-side race conditions.
 */
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  // Skip if the document already exists (e.g. created by the client side first)
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
  return null;
});
