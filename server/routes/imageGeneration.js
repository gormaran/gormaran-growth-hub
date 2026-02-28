const express = require('express');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/firebaseAuth');

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const response = await openai.images.generate({
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

module.exports = router;
