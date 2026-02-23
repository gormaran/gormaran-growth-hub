const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/firebaseAuth');

const router = express.Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Rate limiter: 60 requests per 15 minutes per IP
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Category/tool definitions (mirrors frontend data/categories.js — system prompts and builders)
// We re-import these here so backend is the source of truth for prompts
const CATEGORY_PROMPTS = require('./categoryPrompts');

// POST /api/ai/generate  — streaming SSE response
router.post('/generate', aiLimiter, verifyToken, async (req, res) => {
  const { categoryId, toolId, inputs } = req.body;

  if (!categoryId || !toolId || !inputs) {
    return res.status(400).json({ error: 'Missing required fields: categoryId, toolId, inputs' });
  }

  // Look up the tool config
  const tool = CATEGORY_PROMPTS[categoryId]?.[toolId];
  if (!tool) {
    return res.status(404).json({ error: `Tool "${toolId}" not found in category "${categoryId}"` });
  }

  // Check subscription for premium categories
  const freeCategoryIds = ['marketing', 'content'];
  const userSubscription = req.user?.subscription || 'free';
  if (!freeCategoryIds.includes(categoryId) && userSubscription === 'free') {
    return res.status(403).json({
      error: 'This category requires a Pro or Business subscription.',
      upgradeRequired: true,
    });
  }

  // Language instruction based on user preference
  const LANGUAGE_NAMES = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian' };
  const lang = inputs._language && LANGUAGE_NAMES[inputs._language] ? inputs._language : 'en';
  const languageInstruction = lang !== 'en'
    ? `\n\nIMPORTANT: You MUST respond entirely in ${LANGUAGE_NAMES[lang]}. All section titles, content, analysis, tables and text must be written in ${LANGUAGE_NAMES[lang]}.`
    : '';

  const systemPrompt = tool.systemPrompt + languageInstruction;
  const userMessage = tool.buildUserMessage(inputs);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('error', (err) => {
      console.error('[AI Stream Error]', err.message);
      res.write(`data: ${JSON.stringify({ error: 'AI generation error' })}\n\n`);
      res.end();
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      stream.abort();
    });
  } catch (err) {
    console.error('[AI Route Error]', err.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
