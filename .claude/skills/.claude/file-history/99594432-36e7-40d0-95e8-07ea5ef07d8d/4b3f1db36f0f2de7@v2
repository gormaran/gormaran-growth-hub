const REQUIRED_VARS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_STRIPE_PUBLISHABLE_KEY',
  'REACT_APP_API_URL',
];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length === 0) return;

  const msg = `[Config] Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}`;

  if (process.env.NODE_ENV === 'development') {
    // Fail loudly in dev so misconfiguration is caught immediately
    throw new Error(msg);
  } else {
    // In prod, log and continue — the app will degrade gracefully
    console.error(msg);
  }
}
