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
    free:       { allCategories: true },
    pro:        { allCategories: true, unlimitedUsage: true },
    enterprise: { allCategories: true, unlimitedUsage: true },
    admin:      { allAccess: true },
  };
  // Map legacy plan names from existing Firestore users
  const PLAN_ALIASES = { 'grow': 'pro', 'scale': 'pro', 'evolution': 'enterprise', 'business': 'enterprise' };

  const adminUids = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const isAdminUid = adminUids.includes(req.user?.uid);

  let userSubscription = req.user?.subscription || 'free';
  let userCreatedAt = null;

  const FREE_MONTHLY_LIMIT = 10;
  let usageCount = 0;
  let usageResetDate = null;

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
          usageCount = data.usageCount || 0;
          usageResetDate = data.usageResetDate?.toMillis?.() || null;
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

  // All plans have access to all tools; only usage quota matters for free
  if (!plan.allAccess && !plan.allCategories) {
    return res.status(403).json({ error: 'Upgrade required', upgradeRequired: true });
  }

  // --- MONTHLY LIMIT (free plan only) ---
  if (!plan.allAccess && !plan.unlimitedUsage && userSubscription === 'free' && !isAdminUid) {
    const now = new Date();
    const reset = usageResetDate ? new Date(usageResetDate) : null;
    const isNewMonth = !reset || reset.getMonth() !== now.getMonth() || reset.getFullYear() !== now.getFullYear();
    const effectiveCount = isNewMonth ? 0 : usageCount;
    if (effectiveCount >= FREE_MONTHLY_LIMIT) {
      return res.status(403).json({ error: 'Monthly limit reached', monthlyLimitReached: true });
    }
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

// POST /api/ai/demo  — public demo, no auth, strict rate limit
const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 6, // 6 per IP/hour — enough for 3 real attempts with some buffer
  message: { error: 'Demo limit reached. Create a free account to continue.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const DEMO_SYSTEM_PROMPT = `You are a sharp, results-focused AI growth assistant for Gormaran — a platform with 30+ specialized marketing, content and business tools.

RULES:
- Be concise. Max 5-7 bullet points or 3 short paragraphs. No filler.
- Give genuinely useful, specific output — this is a product demo.
- End every response with a single line: "✨ Sign up free to unlock the full tool."
- Never mention competitors (ChatGPT, Claude, etc.) by name.
- Respond in the same language the user writes in.`;

router.post('/demo', demoLimiter, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }
  if (prompt.length > 500) {
    return res.status(400).json({ error: 'Prompt too long.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: DEMO_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt.trim() }],
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    req.on('close', () => stream.abort());
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Demo failed.' });
    }
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// POST /api/ai/chat — general streaming chat, auth required
router.post('/chat', aiLimiter, verifyToken, async (req, res) => {
  const { message, history = [], tab = 'text', systemPrompt: customSystem, modelId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const SYSTEM_PROMPTS = {
    text: `You are a sharp, versatile AI assistant on Gormaran — an AI creation platform. Help users create content, strategies, copy, analyses and more. Be direct and genuinely useful. Format with markdown (bold, bullets, code blocks) when it improves clarity. Never pad responses.`,
    design: `You are a creative director AI on Gormaran. Help users craft detailed, effective image generation prompts. Describe composition, style, lighting, mood and technical parameters clearly. Suggest improvements to their visual concepts.`,
    video: `You are a video production AI on Gormaran. Help users write video scripts, shot lists, storyboards and creative briefs for video content. Be specific about visuals, pacing and narrative structure.`,
    audio: `You are a music and audio AI on Gormaran. Help users create prompts for music generation, write song lyrics, craft podcast scripts and design soundscapes. Be creative and specific about mood, tempo and style.`,
    toolkit: `You are a strategic AI assistant on Gormaran. Help users with business analysis, market research, financial planning and operational tasks. Be precise, data-oriented and actionable.`,
  };

  const basePrompt = SYSTEM_PROMPTS[tab] || SYSTEM_PROMPTS.text;
  const systemPrompt = customSystem?.trim() ? customSystem.trim() : basePrompt;

  // Build messages from history
  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  // Usage tracking for free users
  const adminUids = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const isAdmin = adminUids.includes(req.user?.uid);

  if (!isAdmin) {
    try {
      const adminSdk = require('firebase-admin');
      const fsDb = adminSdk.firestore();
      const userRef = fsDb.collection('users').doc(req.user.uid);
      const userDoc = await userRef.get();
      const data = userDoc.exists ? userDoc.data() : {};
      const planAliases = { grow: 'pro', scale: 'pro', evolution: 'enterprise' };
      const sub = planAliases[data.subscription] || data.subscription || 'free';
      const FREE_LIMIT = 10;

      if (sub === 'free') {
        const now = Date.now();
        const resetMs = data.usageResetDate?.toMillis?.() || 0;
        const count = resetMs > now ? (data.usageCount || 0) : 0;
        if (count >= FREE_LIMIT) {
          return res.status(403).json({ error: 'Monthly limit reached. Upgrade to continue.' });
        }
        const nextReset = new Date(now);
        nextReset.setMonth(nextReset.getMonth() + 1);
        nextReset.setDate(1);
        nextReset.setHours(0, 0, 0, 0);
        await userRef.set({
          usageCount: count + 1,
          usageResetDate: adminSdk.firestore.Timestamp.fromMillis(resetMs > now ? resetMs : nextReset.getTime()),
        }, { merge: true });
      }
    } catch (err) {
      console.error('[Chat] Firestore error:', err.message);
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    stream.on('text', (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`));
    stream.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
    stream.on('end', () => { res.write('data: [DONE]\n\n'); res.end(); });
    req.on('close', () => stream.abort());
  } catch (err) {
    if (!res.headersSent) return res.status(500).json({ error: 'Chat failed' });
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// POST /api/ai/translate — translate text using Claude
router.post('/translate', verifyToken, async (req, res) => {
  const { text, from = 'es', to = 'en' } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });

  const langNames = { es: 'Spanish', en: 'English', fr: 'French', de: 'German' };
  const fromLang = langNames[from] || from;
  const toLang = langNames[to] || to;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translated text, nothing else — no explanations, no quotes, no preamble.\n\n${text}`,
      }],
    });
    const translated = message.content[0]?.text || text;
    res.json({ translatedText: translated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;