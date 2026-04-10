const express = require('express');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/firebaseAuth');

const router = express.Router();

// Lazy init — avoids crashing the server at startup if OPENAI_API_KEY is not yet set
let openai = null;
function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured on the server.');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// 10 images per hour per IP
const imageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Image generation limit reached. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/image/generate-logo
router.post('/generate-logo', imageLimiter, verifyToken, async (req, res) => {
  const { inputs } = req.body;

  if (!inputs?.brand_name || !inputs?.style) {
    return res.status(400).json({ error: 'Missing required fields: brand_name, style' });
  }

  const colorNote = inputs.colors ? `, using colors: ${inputs.colors}` : '';
  const valuesNote = inputs.values ? `, conveying: ${inputs.values}` : '';

  const prompt = `A professional, minimalist logo for "${inputs.brand_name}", a ${inputs.industry || 'business'} brand. Style: ${inputs.style}${colorNote}${valuesNote}. Clean vector-style logo isolated on a pure white background. No background gradients. High quality, scalable, suitable for business cards, websites and app icons.`;

  try {
    const response = await getOpenAI().images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    res.json({
      imageUrl: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt,
    });
  } catch (err) {
    console.error('[Image Generation Error]', err.message);
    res.status(500).json({ error: 'Failed to generate image: ' + err.message });
  }
});

// POST /api/image/generate — general-purpose image generation
router.post('/generate', imageLimiter, verifyToken, async (req, res) => {
  const { inputs } = req.body;

  if (!inputs?.subject || !inputs?.style) {
    return res.status(400).json({ error: 'Missing required fields: subject, style' });
  }

  // Map aspect ratio to DALL-E 3 supported sizes
  const sizeMap = {
    '1:1 — Square': '1024x1024',
    '16:9 — Landscape': '1792x1024',
    '9:16 — Portrait / Reel': '1024x1792',
    '4:3 — Classic': '1792x1024',
    '21:9 — Cinematic wide': '1792x1024',
    '3:2 — Photo': '1792x1024',
  };
  const size = sizeMap[inputs.aspect_ratio] || '1792x1024';

  const moodNote = inputs.mood ? `, mood: ${inputs.mood}` : '';
  const lightingNote = inputs.lighting ? `, lighting: ${inputs.lighting}` : '';
  const colorNote = inputs.colors ? `, color palette: ${inputs.colors}` : '';
  const negativeHint = inputs.negative ? ` Avoid: ${inputs.negative}.` : '';

  const prompt = `${inputs.subject}. Visual style: ${inputs.style}${moodNote}${lightingNote}${colorNote}. Ultra high quality, detailed, professional.${negativeHint}`;

  try {
    const response = await getOpenAI().images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'hd',
    });

    res.json({
      imageUrl: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt,
    });
  } catch (err) {
    console.error('[Image Generation Error]', err.message);
    res.status(500).json({ error: 'Failed to generate image: ' + err.message });
  }
});

module.exports = router;
