/**
 * Video generation routes
 * Providers: Replicate (minimax/video-01, kling-video, runway-gen3)
 * ENV: REPLICATE_API_TOKEN
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/firebaseAuth');
const { trackCredits } = require('../utils/credits');

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

  // Model routing — using stable Replicate model slugs
  const modelVersions = {
    wan:        { path: '/models/wavespeedai/wan-2.1-1.3b/predictions',    input: { prompt, aspect_ratio } },
    minimax:    { path: '/models/minimax/video-01/predictions',             input: { prompt, prompt_optimizer: true } },
    kling:      { path: '/models/minimax/video-01/predictions',             input: { prompt, prompt_optimizer: true } }, // fallback to minimax — klingai not on Replicate
    sora:       { path: '/models/minimax/video-01/predictions',             input: { prompt, prompt_optimizer: true } }, // sora not on Replicate, fallback
    veo:        { path: '/models/wavespeedai/wan-2.1-1.3b/predictions',    input: { prompt, aspect_ratio } },
    seedance:   { path: '/models/wavespeedai/wan-2.1-1.3b/predictions',    input: { prompt, aspect_ratio } },
    higgsfield: { path: '/models/wavespeedai/wan-2.1-1.3b/predictions',    input: { prompt, aspect_ratio } },
  };

  const adminUids = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const creditResult = await trackCredits(req.user?.uid, 25, adminUids);
  if (!creditResult.allowed) return res.status(402).json({ error: creditResult.error, creditsExceeded: true });

  const cfg = modelVersions[model] || modelVersions.wan;

  try {
    const raw = await fetch(`${REPLICATE_BASE}${cfg.path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: cfg.input }),
    });
    const prediction = await raw.json();

    console.log('[Video] Replicate response status:', raw.status, 'id:', prediction.id, 'detail:', prediction.detail || prediction.error);

    if (!prediction.id) {
      let errMsg = prediction.detail || prediction.error || `Replicate error (${raw.status})`;
      if (raw.status === 401) errMsg = 'Replicate API token invalid or expired. Check REPLICATE_API_TOKEN in Render dashboard → Environment variables.';
      return res.status(raw.status >= 400 ? raw.status : 500).json({ error: errMsg });
    }

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
