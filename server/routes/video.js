/**
 * Video generation routes
 * Providers: Replicate (minimax/video-01, kling-video, runway-gen3)
 * ENV: REPLICATE_API_TOKEN
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/firebaseAuth');

const router = express.Router();

const videoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Video generation limit reached. Try again in an hour.' },
});

const REPLICATE_BASE = 'https://api.replicate.com/v1';

function getReplicateToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN is not configured on the server.');
  return token;
}

async function replicateRequest(path, body, token) {
  const res = await fetch(`${REPLICATE_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function pollPrediction(id, token, maxMs = 180000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${REPLICATE_BASE}/predictions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.status === 'succeeded') return data;
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(data.error || `Prediction ${data.status}`);
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  throw new Error('Video generation timed out (3 min). Try a shorter prompt.');
}

// POST /api/video/generate — text-to-video
router.post('/generate', videoLimiter, verifyToken, async (req, res) => {
  const { prompt, aspect_ratio = '16:9', duration = 5, model = 'minimax' } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt is required' });

  let token;
  try { token = getReplicateToken(); }
  catch (e) { return res.status(503).json({ error: e.message }); }

  // Model routing
  const modelVersions = {
    minimax:    { path: '/models/minimax/video-01/predictions',               input: { prompt, prompt_optimizer: true } },
    kling:      { path: '/models/klingai/kling-video/predictions',            input: { prompt, aspect_ratio, duration } },
    wan:        { path: '/models/wavespeedai/wan-2.1-1.3b/predictions',       input: { prompt, aspect_ratio } },
    higgsfield: { path: '/models/higgsfield-ai/higgsfield-movie/predictions', input: { prompt, aspect_ratio } },
  };

  const cfg = modelVersions[model] || modelVersions.minimax;

  try {
    const prediction = await replicateRequest(cfg.path, { input: cfg.input }, token);
    if (!prediction.id) throw new Error(prediction.detail || 'Failed to start generation');

    // Return task id for polling
    res.json({ taskId: prediction.id, status: 'processing' });
  } catch (err) {
    console.error('[Video] start error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/video/status/:id — poll generation status
router.get('/status/:id', verifyToken, async (req, res) => {
  let token;
  try { token = getReplicateToken(); }
  catch (e) { return res.status(503).json({ error: e.message }); }

  try {
    const data = await fetch(`${REPLICATE_BASE}/predictions/${req.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());

    if (data.status === 'succeeded') {
      const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
      return res.json({ status: 'done', videoUrl });
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      return res.json({ status: 'failed', error: data.error || 'Generation failed' });
    }
    res.json({ status: 'processing', progress: data.logs || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
