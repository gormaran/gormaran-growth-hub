/**
 * Audio generation routes
 * Speech: ElevenLabs TTS (ENV: ELEVENLABS_API_KEY)
 * Music:  Replicate MusicGen (ENV: REPLICATE_API_TOKEN)
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/firebaseAuth');

const router = express.Router();

const audioLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Audio limit reached. Try again in an hour.' },
});

// ElevenLabs voices (curated selection)
const VOICES = {
  rachel:   'EXAVITQu4vr4xnSDxMaL',
  adam:     'pNInz6obpgDQGcFmaJgB',
  bella:    'EXAVITQu4vr4xnSDxMaL',
  clyde:    '2EiwWnXFnvU5JabPnv8n',
  domi:     'AZnzlk1XvdvUeBnXmlld',
  elli:     'MF3mGyEYCl7XYWbV9V6O',
  josh:     'TxGEqnHWrfWFTfGW9XjX',
  arnold:   'VR6AewLTigWG4xSOukaG',
  callum:   'N2lVS1w4EtoT3dr4eOWO',
  charlie:  'IKne3meq5aSn9XLyUdCD',
  liam:     'TX3LPaxmHKxFdv7VOQHJ',
  matilda:  'XrExE9yKIg1WjnnlVkGX',
};

// POST /api/audio/speech — ElevenLabs text-to-speech
router.post('/speech', audioLimiter, verifyToken, async (req, res) => {
  const { text, voice = 'rachel', model_id = 'eleven_multilingual_v2', stability = 0.5, similarity_boost = 0.75 } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });
  if (text.length > 5000) return res.status(400).json({ error: 'Text too long (max 5000 chars)' });

  const API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!API_KEY) return res.status(503).json({ error: 'ElevenLabs not configured. Add ELEVENLABS_API_KEY to server env.' });

  const voiceId = VOICES[voice] || VOICES.rachel;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id,
        voice_settings: { stability, similarity_boost },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail?.message || `ElevenLabs error ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('[Audio/speech]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/audio/voices — list available voices
router.get('/voices', verifyToken, (req, res) => {
  const list = Object.entries(VOICES).map(([name, id]) => ({ name, id }));
  res.json({ voices: list });
});

// POST /api/audio/music — music generation via Replicate MusicGen
router.post('/music', audioLimiter, verifyToken, async (req, res) => {
  const { prompt, duration = 15, model_version = 'stereo-large' } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt is required' });

  const TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!TOKEN) return res.status(503).json({ error: 'Replicate not configured. Add REPLICATE_API_TOKEN to server env.' });

  try {
    const prediction = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({
        input: {
          prompt: prompt.trim(),
          duration,
          model_version,
          output_format: 'mp3',
          normalization_strategy: 'peak',
        },
      }),
    }).then(r => r.json());

    if (prediction.error) throw new Error(prediction.error);

    // Return taskId for polling
    res.json({ taskId: prediction.id, status: 'processing' });
  } catch (err) {
    console.error('[Audio/music]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/audio/music/status/:id
router.get('/music/status/:id', verifyToken, async (req, res) => {
  const TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!TOKEN) return res.status(503).json({ error: 'Replicate not configured' });

  try {
    const data = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }).then(r => r.json());

    if (data.status === 'succeeded') {
      const audioUrl = Array.isArray(data.output) ? data.output[0] : data.output;
      return res.json({ status: 'done', audioUrl });
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      return res.json({ status: 'failed', error: data.error || 'Music generation failed' });
    }
    res.json({ status: 'processing' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
