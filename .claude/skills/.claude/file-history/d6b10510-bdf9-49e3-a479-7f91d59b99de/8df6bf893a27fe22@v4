const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

/* ── Provider configs ── */
const PROVIDERS = {
  google_analytics: {
    authUrl:      'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl:     'https://oauth2.googleapis.com/token',
    get clientId()     { return process.env.GOOGLE_OAUTH_CLIENT_ID; },
    get clientSecret() { return process.env.GOOGLE_OAUTH_CLIENT_SECRET; },
    get redirectUri()  { return process.env.GOOGLE_REDIRECT_URI; },
    // openid+email+profile needed to identify the user and auto-create Gormaran account
    scope:  'openid email profile https://www.googleapis.com/auth/analytics.readonly',
    extras: { access_type: 'offline', prompt: 'consent' },
  },
  instagram: {
    authUrl:      'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl:     'https://graph.facebook.com/v19.0/oauth/access_token',
    get clientId()     { return process.env.META_APP_ID; },
    get clientSecret() { return process.env.META_APP_SECRET; },
    get redirectUri()  { return process.env.META_REDIRECT_URI; },
    // email added so we can identify the user
    scope:  'email,instagram_basic,pages_show_list,pages_read_engagement,instagram_manage_insights',
    extras: {},
  },
  linkedin: {
    authUrl:      'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl:     'https://www.linkedin.com/oauth/v2/accessToken',
    get clientId()     { return process.env.LINKEDIN_CLIENT_ID; },
    get clientSecret() { return process.env.LINKEDIN_CLIENT_SECRET; },
    get redirectUri()  { return process.env.LINKEDIN_REDIRECT_URI; },
    scope:  'r_liteprofile r_emailaddress r_organization_social',
    extras: {},
  },
};

const frontendUrl = () => process.env.FRONTEND_URL || 'https://gormaran.io';

/* ── Popup response HTML ── */
function popupHtml(success, message = '', customToken = null) {
  const icon = success ? '✅' : '❌';
  const text = success ? 'Connected! Closing...' : `Error: ${message}`;
  const payload = { type: 'oauth_result', success, message };
  if (customToken) payload.customToken = customToken;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#09090f;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
  <div style="text-align:center;padding:2rem">
    <div style="font-size:3rem;margin-bottom:1rem">${icon}</div>
    <p style="margin:0;font-size:1rem">${text}</p>
  </div>
  <script>
    try {
      window.opener && window.opener.postMessage(
        ${JSON.stringify(payload)},
        '${frontendUrl()}'
      );
    } catch(e) {}
    setTimeout(() => window.close(), 1500);
  </script>
</body></html>`;
}

/* ── Extract user identity from provider after token exchange ── */
async function getProviderIdentity(provider, tokenData) {
  if (provider === 'google_analytics') {
    const idToken = tokenData.id_token;
    if (!idToken) throw new Error('No id_token returned by Google. Make sure openid scope is included.');
    const payloadB64 = idToken.split('.')[1];
    const googleUser = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    return { email: googleUser.email, displayName: googleUser.name || '' };
  }

  if (provider === 'instagram') {
    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`
    );
    const metaUser = await meRes.json();
    if (!metaUser.email) {
      throw new Error('Email not available from Meta. Enable the email permission in your Meta app.');
    }
    return { email: metaUser.email, displayName: metaUser.name || '' };
  }

  if (provider === 'linkedin') {
    const [profileRes, emailRes] = await Promise.all([
      fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }),
      fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }),
    ]);
    const profile  = await profileRes.json();
    const emailData = await emailRes.json();
    const email = emailData.elements?.[0]?.['handle~']?.emailAddress;
    if (!email) throw new Error('Email not available from LinkedIn.');
    const displayName = `${profile.localizedFirstName || ''} ${profile.localizedLastName || ''}`.trim();
    return { email, displayName };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

/* ── Find or create Firebase user by email ── */
async function findOrCreateFirebaseUser(email, displayName) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.uid;
  } catch {
    // User doesn't exist — create one
    const newUser = await admin.auth().createUser({
      email,
      displayName: displayName || '',
      emailVerified: true,
    });
    // Create Firestore profile (mirrors AuthContext.createUserProfile)
    const db = admin.firestore();
    await db.collection('users').doc(newUser.uid).set({
      uid:             newUser.uid,
      email,
      displayName:     displayName || '',
      subscription:    'free',
      usageCount:      0,
      usageResetDate:  new Date(),
      createdAt:       admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:       admin.firestore.FieldValue.serverTimestamp(),
    });
    return newUser.uid;
  }
}

/* ── GET /api/oauth/:provider/connect?token=... (token optional for guests) ── */
router.get('/:provider/connect', async (req, res) => {
  const { provider } = req.params;
  const { token } = req.query;
  const config = PROVIDERS[provider];

  if (!config) return res.status(400).send('Unknown provider');

  if (!config.clientId) {
    return res.send(popupHtml(false, `${provider} integration not yet available. Coming soon!`));
  }

  // Optional: if the user is already logged in, embed their uid in the state
  let uid = null;
  if (token) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      uid = decoded.uid;
    } catch { /* treat as guest */ }
  }

  const state = Buffer.from(JSON.stringify({ uid, provider, ts: Date.now() })).toString('base64url');

  const params = new URLSearchParams({
    client_id:     config.clientId,
    redirect_uri:  config.redirectUri,
    response_type: 'code',
    scope:         config.scope,
    state,
    ...config.extras,
  });

  res.redirect(`${config.authUrl}?${params.toString()}`);
});

/* ── GET /api/oauth/:provider/callback ── */
router.get('/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  const { code, state, error } = req.query;
  const config = PROVIDERS[provider];

  if (!config) return res.send(popupHtml(false, 'Unknown provider'));
  if (error || !code) return res.send(popupHtml(false, error || 'Authorization denied'));
  if (!state) return res.send(popupHtml(false, 'Missing state'));

  try {
    const { uid: existingUid } = JSON.parse(Buffer.from(state, 'base64url').toString());

    // Exchange code for tokens
    const tokenRes = await fetch(config.tokenUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        code,
        client_id:     config.clientId,
        client_secret: config.clientSecret,
        redirect_uri:  config.redirectUri,
        grant_type:    'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed');
    }

    // Determine uid: use existing if user was already logged in, otherwise find/create from provider identity
    let uid = existingUid;
    let customToken = null;

    if (!uid) {
      const { email, displayName } = await getProviderIdentity(provider, tokenData);
      uid = await findOrCreateFirebaseUser(email, displayName);
      customToken = await admin.auth().createCustomToken(uid);
    }

    // Store integration in Firestore
    const db = admin.firestore();
    const update = {};
    update[`integrations.${provider}`] = {
      connected:    true,
      accessToken:  tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt:    tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
      connectedAt:  Date.now(),
    };
    await db.collection('users').doc(uid).set(update, { merge: true });

    res.send(popupHtml(true, '', customToken));
  } catch (e) {
    console.error(`[OAuth ${provider}]`, e.message);
    res.send(popupHtml(false, e.message));
  }
});

/* ── GET /api/oauth/:provider/status ── */
router.get('/:provider/status', async (req, res) => {
  const { provider } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.json({ connected: false });

  try {
    const { uid } = await admin.auth().verifyIdToken(token);
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const integration = userDoc.data()?.integrations?.[provider];
    res.json({
      connected:   !!(integration?.connected && integration?.accessToken),
      connectedAt: integration?.connectedAt || null,
    });
  } catch {
    res.json({ connected: false });
  }
});

/* ── DELETE /api/oauth/:provider/disconnect ── */
router.delete('/:provider/disconnect', async (req, res) => {
  const { provider } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { uid } = await admin.auth().verifyIdToken(token);
    const db = admin.firestore();
    const update = {};
    update[`integrations.${provider}`] = admin.firestore.FieldValue.delete();
    await db.collection('users').doc(uid).update(update);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
