const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { validateApiKey } = require('./apiKeys');
const CATEGORY_PROMPTS = require('./categoryPrompts');

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANGUAGE_NAMES = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian' };

// POST /api/v1/generate — Enterprise public API (Bearer grm_live_xxx)
router.post('/generate', validateApiKey, async (req, res) => {
  const { categoryId, toolId, inputs } = req.body;

  if (!categoryId || !toolId || !inputs) {
    return res.status(400).json({ error: 'Missing required fields: categoryId, toolId, inputs' });
  }

  const tool = CATEGORY_PROMPTS[categoryId]?.[toolId];
  if (!tool) {
    return res.status(404).json({ error: `Tool "${toolId}" not found in category "${categoryId}"` });
  }

  const lang = inputs._language && LANGUAGE_NAMES[inputs._language] ? inputs._language : 'en';
  const systemPrompt =
    tool.systemPrompt +
    `\n\nIMPORTANT: Respond entirely in ${LANGUAGE_NAMES[lang]}.` +
    '\n\nCRITICAL: Be extremely concise. NO introductions. NO filler text. Use bullet points.';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const stream = client.messages.stream({
      model: tool.model || 'claude-sonnet-4-6',
      max_tokens: tool.maxTokens || 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: tool.buildUserMessage(inputs) }],
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('error', (err) => {
      console.error('[V1 Stream Error]', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    req.on('close', () => { stream.abort(); });
  } catch (err) {
    console.error('[V1 Route Error]', err.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// GET /api/v1/tools — list available categories and tools
router.get('/tools', validateApiKey, (req, res) => {
  const tools = {};
  for (const [catId, catTools] of Object.entries(CATEGORY_PROMPTS)) {
    tools[catId] = Object.keys(catTools);
  }
  res.json({ tools });
});

module.exports = router;
