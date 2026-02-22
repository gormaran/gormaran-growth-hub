import { auth } from '../firebase/config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// Stream AI response using fetch + ReadableStream
export async function streamAIResponse({ categoryId, toolId, inputs, onChunk, onDone, onError }) {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ categoryId, toolId, inputs }),
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
            if (parsed.error) throw new Error(parsed.error);
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') {
              // silently skip malformed chunks
            }
          }
        }
      }
    }
    onDone?.();
  } catch (err) {
    onError?.(err.message || 'Failed to generate response');
  }
}

// Create Stripe checkout session
export async function createCheckoutSession(priceId) {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/stripe/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ priceId }),
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

// Get current subscription status
export async function getSubscriptionStatus() {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/stripe/subscription`, {
    headers: authHeaders,
  });
  if (!response.ok) return { subscription: 'free' };
  return response.json();
}
