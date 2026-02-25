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

  // Plan-based access control (read from Firestore for accuracy)
  const PLAN_ACCESS = {
    free:      { allowedTools: ['marketing:seo-keyword-research', 'marketing:seo-meta-tags', 'marketing:instagram-audit'] },
    grow:      { categories: ['marketing', 'content', 'digital'], allowedTools: ['strategy:business-plan'] },
    scale:     { categories: ['marketing', 'content', 'digital', 'ecommerce', 'agency', 'creative'], allowedTools: ['strategy:business-plan'] },
    evolution: { categories: ['marketing', 'content', 'digital', 'ecommerce', 'agency', 'creative', 'finance', 'startup', 'strategy'], allowedTools: [] },
    admin:     { allAccess: true },
  };
  // Backward compat: map legacy plan names to current ones
  const PLAN_ALIASES = { 'pro': 'grow', 'business': 'evolution' };
  const TRIAL_DAYS = 14;

  let userSubscription = req.user?.subscription || 'free';
  let userCreatedAt = null;
  try {
    const adminSdk = require('firebase-admin');
    if (adminSdk.apps.length > 0) {
      const fsDb = adminSdk.firestore();
      const userDoc = await fsDb.collection('users').doc(req.user.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        userSubscription = data.subscription || 'free';
        userCreatedAt = data.createdAt?.toMillis?.() || null;
      }
    }
  } catch (err) {
    console.error('[Subscription] Firestore read failed for uid', req.user?.uid, ':', err.message);
  }

  // Normalize legacy plan names
  userSubscription = PLAN_ALIASES[userSubscription] || userSubscription;

  // Admin UID override — set ADMIN_UIDS env var as comma-separated Firebase UIDs
  const adminUids = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (adminUids.includes(req.user.uid)) {
    userSubscription = 'admin';
  }

  const plan = PLAN_ACCESS[userSubscription] || PLAN_ACCESS.free;

  // Check trial: free users within 14 days get full access
  const inTrial = userSubscription === 'free'
    && userCreatedAt !== null
    && (Date.now() - userCreatedAt) < TRIAL_DAYS * 24 * 60 * 60 * 1000;

  const toolKey = `${categoryId}:${toolId}`;
  const hasAccess = plan.allAccess
    || inTrial
    || plan.categories?.includes(categoryId)
    || plan.allowedTools?.includes(toolKey);

  if (!hasAccess) {
    return res.status(403).json({
      error: 'This tool is not available on your current plan. Upgrade to access it.',
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
      model: tool.model || 'claude-sonnet-4-6',
      max_tokens: tool.maxTokens || 4096,
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
