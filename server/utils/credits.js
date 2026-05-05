const CREDIT_LIMIT = 50;

async function trackCredits(uid, cost, adminUids = []) {
  if (!uid || adminUids.includes(uid)) return { allowed: true };
  try {
    const adminSdk = require('firebase-admin');
    if (!adminSdk.apps.length) return { allowed: true };
    const fsDb = adminSdk.firestore();
    const userRef = fsDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const data = userDoc.exists ? userDoc.data() : {};
    const planAliases = { grow: 'pro', scale: 'pro', evolution: 'enterprise' };
    const sub = planAliases[data.subscription] || data.subscription || 'free';
    if (sub !== 'free') return { allowed: true };
    const now = Date.now();
    const resetMs = data.usageResetDate?.toMillis?.() || 0;
    const count = resetMs > now ? (data.usageCount || 0) : 0;
    if (count + cost > CREDIT_LIMIT) {
      return { allowed: false, remaining: CREDIT_LIMIT - count, cost, error: `Not enough credits. ${CREDIT_LIMIT - count} remaining, this action costs ${cost} credits.` };
    }
    const nextReset = new Date(now);
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1); nextReset.setHours(0, 0, 0, 0);
    await userRef.set({
      usageCount: count + cost,
      usageResetDate: adminSdk.firestore.Timestamp.fromMillis(resetMs > now ? resetMs : nextReset.getTime()),
    }, { merge: true });
    return { allowed: true };
  } catch (err) {
    console.error('[Credits]', err.message);
    return { allowed: true }; // fail open
  }
}

module.exports = { trackCredits, CREDIT_LIMIT };
