/**
 * One-time migration: creates missing Firestore user documents for all
 * existing Firebase Auth users.
 *
 * Usage:
 *   node migrate-users.js
 *
 * Requirements:
 *   npm install firebase-admin   (already present in /functions, or install
 *                                 temporarily: npm install --no-save firebase-admin)
 */

'use strict';

const admin = require('./functions/node_modules/firebase-admin');

// ── Config ────────────────────────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = './server/firebase-service-account.json';
// ─────────────────────────────────────────────────────────────────────────────

admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
});

const auth = admin.auth();
const db   = admin.firestore();

async function migrateUsers() {
  let pageToken;
  let totalChecked  = 0;
  let totalCreated  = 0;
  let totalSkipped  = 0;
  let totalErrors   = 0;

  console.log('Starting migration…\n');

  do {
    // Firebase Auth paginates users in batches of up to 1 000
    const listResult = await auth.listUsers(1000, pageToken);
    pageToken = listResult.pageToken;

    for (const user of listResult.users) {
      totalChecked++;
      const { uid, email, displayName, photoURL, metadata } = user;

      try {
        const userRef = db.collection('users').doc(uid);
        const snap    = await userRef.get();

        if (snap.exists) {
          console.log(`  SKIP  ${uid}  (${email || '—'})`);
          totalSkipped++;
          continue;
        }

        const now = admin.firestore.Timestamp.now();
        const createdAt = metadata?.creationTime
          ? admin.firestore.Timestamp.fromDate(new Date(metadata.creationTime))
          : now;

        await userRef.set({
          uid,
          email:        email        || '',
          displayName:  displayName  || '',
          photoURL:     photoURL     || '',
          subscription: 'free',
          usageCount:   0,
          usageResetDate: now,
          createdAt,
          updatedAt:    now,
        });

        console.log(`  CREATE ${uid}  (${email || '—'})  displayName="${displayName || ''}"`);
        totalCreated++;
      } catch (err) {
        console.error(`  ERROR  ${uid}  ${err.message}`);
        totalErrors++;
      }
    }
  } while (pageToken);

  console.log(`
──────────────────────────────────
Migration complete
  Checked : ${totalChecked}
  Created : ${totalCreated}
  Skipped : ${totalSkipped}  (already had a document)
  Errors  : ${totalErrors}
──────────────────────────────────`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

migrateUsers().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
