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

const CATEGORY_PROMPTS = require('./categoryPrompts');

// POST /api/ai/generate  — streaming SSE response
router.post('/generate', aiLimiter, verifyToken, async (req, res) => {
  const { categoryId, toolId, inputs, conversationHistory } = req.body;

  if (!categoryId || !toolId || !inputs) {
    return res.status(400).json({ error: 'Missing required fields: categoryId, toolId, inputs' });
  }

  const tool = CATEGORY_PROMPTS[categoryId]?.[toolId];
  if (!tool) {
    return res.status(404).json({ error: `Tool "${toolId}" not found in category "${categoryId}"` });
  }

  // --- ACCESS CONTROL ---
  const PLAN_ACCESS = {
    free:      { allowedTools: ['marketing:seo-keyword-research', 'marketing:seo-meta-tags', 'marketing:instagram-audit'] },
    grow:      { categories: ['marketing', 'content', 'digital'], allowedTools: ['strategy:business-plan'] },
    scale:     { categories: ['marketing', 'content', 'digital', 'ecommerce', 'agency', 'creative'], allowedTools: ['strategy:business-plan'] },
    evolution: { categories: ['marketing', 'content', 'digital', 'ecommerce', 'agency', 'creative', 'finance', 'startup', 'strategy'], allowedTools: [] },
    admin:     { allAccess: true },
  };
  const PLAN_ALIASES = { 'pro': 'grow', 'business': 'evolution' };
  const TRIAL_DAYS = 14;

  const adminUids = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const isAdminUid = adminUids.includes(req.user?.uid);

  let userSubscription = req.user?.subscription || 'free';
  let userCreatedAt = null;

  if (!isAdminUid) {
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
      console.error('[Subscription] Firestore read failed:', err.message);
    }
    userSubscription = PLAN_ALIASES[userSubscription] || userSubscription;
  } else {
    userSubscription = 'admin';
  }

  const plan = PLAN_ACCESS[userSubscription] || PLAN_ACCESS.free;
  const inTrial = userSubscription === 'free' && userCreatedAt && (Date.now() - userCreatedAt) < TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const toolKey = `${categoryId}:${toolId}`;
  const hasAccess = plan.allAccess || inTrial || plan.categories?.includes(categoryId) || plan.allowedTools?.includes(toolKey);

  if (!hasAccess) {
    return res.status(403).json({ error: 'Upgrade required', upgradeRequired: true });
  }

  // --- PROMPT OPTIMIZATION (CONCISE MODE) ---
  const LANGUAGE_NAMES = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian' };
  const lang = inputs._language && LANGUAGE_NAMES[inputs._language] ? inputs._language : 'en';
  
  const languageInstruction = `\n\nIMPORTANT: Respond entirely in ${LANGUAGE_NAMES[lang]}.`;
  
  // Brevedad forzada al final del System Prompt
  const brevityInstruction = "\n\nCRITICAL: Be extremely concise. NO introductions. NO filler text. Go straight to the tables and data. Use bullet points.";
  
  const systemPrompt = tool.systemPrompt + languageInstruction + brevityInstruction;
  const userMessageText = tool.buildUserMessage(inputs);

  const userMessageContent = (inputs._ref_image_b64 && inputs._ref_image_mime)
    ? [
        { type: 'image', source: { type: 'base64', media_type: inputs._ref_image_mime, data: inputs._ref_image_b64 } },
        { type: 'text', text: userMessageText },
      ]
    : userMessageText;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    // Build messages: always start with the original user request, then append conversation history (for refinements)
    let messages;
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      messages = [{ role: 'user', content: userMessageText }, ...conversationHistory];
    } else {
      messages = [{ role: 'user', content: userMessageContent }];
    }

    const stream = client.messages.stream({
      model: tool.model || 'claude-sonnet-4-6',
      max_tokens: tool.maxTokens || 4000,
      system: systemPrompt,
      messages,
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('error', (err) => {
      console.error('[AI Stream Error]', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

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