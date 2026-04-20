import { auth } from '../firebase/config';

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://gormaran-growth-hub.onrender.com";

async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// Stream AI response using fetch + ReadableStream
export async function streamAIResponse({ categoryId, toolId, inputs, conversationHistory, onChunk, onDone, onError, signal }) {
  try {
    const authHeaders = await getAuthHeader();
    const body = { categoryId, toolId, inputs };
    if (conversationHistory) body.conversationHistory = conversationHistory;
    const response = await fetch(`${API_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onDone?.();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk(parsed.text);
            if (parsed.error) {
              onError?.(parsed.error);
              return;
            }
          } catch (e) {
            // silently skip malformed JSON chunks (incomplete SSE frames)
          }
        }
      }
    }
    onDone?.();
  } catch (err) {
    if (err.name === 'AbortError') return; // user stopped — no error shown
    onError?.(err.message || 'Failed to generate response');
  }
}

// Stream a public demo AI response (no auth required)
export async function streamDemoResponse({ prompt, onChunk, onDone, onError, signal }) {
  try {
    const response = await fetch(`${API_URL}/api/ai/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') { onDone?.(); return; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk(parsed.text);
            if (parsed.error) { onError?.(parsed.error); return; }
          } catch (e) { /* skip malformed */ }
        }
      }
    }
    onDone?.();
  } catch (err) {
    if (err.name === 'AbortError') return;
    onError?.(err.message || 'Demo request failed');
  }
}

// Validate a Stripe promotion code
export async function validatePromoCode(code) {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/stripe/validate-promo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid discount code');
  }
  return response.json(); // { valid, promoId, discountLabel, name }
}

// Create Stripe checkout session
export async function createCheckoutSession(priceId, mode = 'subscription', promoId = null) {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/stripe/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ priceId, mode, promoId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create checkout session');
  }
  return response.json();
}

// Create customer portal session
export async function createPortalSession() {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/stripe/create-portal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create portal session');
  }
  return response.json();
}

export async function cancelSubscription() {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/stripe/cancel-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to cancel subscription');
  }
  return response.json();
}

// Generate logo image via DALL-E 3
export async function generateLogoImage(inputs) {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/image/generate-logo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ inputs }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate image');
  }
  return response.json(); // { imageUrl, revisedPrompt }
}

// Generate general image via DALL-E 3 (scene, style, mood, lighting, etc.)
export async function generateImage(inputs) {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/image/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ inputs }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate image');
  }
  return response.json(); // { imageUrl, revisedPrompt }
}

// ── API Key Management (Enterprise) ──────────────────────────────────────────

export async function listApiKeys() {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/apikeys`, { headers: authHeaders });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to list API keys');
  }
  return response.json(); // { keys: [{ id, name, prefix, createdAt, lastUsed }] }
}

export async function generateApiKey(name = 'API Key') {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/apikeys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate API key');
  }
  return response.json(); // { id, key, prefix, name }
}

export async function revokeApiKey(keyId) {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/apikeys/${keyId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to revoke API key');
  }
  return response.json();
}

// Get current subscription status
export async function getSubscriptionStatus() {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/stripe/subscription`, {
    headers: authHeaders,
  });
  if (!response.ok) return { subscription: 'free' };
  return response.json();
}
