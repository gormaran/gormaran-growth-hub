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
  
  // Output quality instruction — format must match content, not be uniformly bulleted
  const brevityInstruction = "\n\nCRITICAL: No \"Sure, I'd be happy to...\" openings. No filler. No restating the prompt back to the user. Start directly with the output. Use the format the content calls for: prose for strategy and narrative, tables for data and comparisons, numbered lists for sequential steps. Never default to bullet points when prose or a table communicates better. Write like a senior expert, not like a generic AI assistant.";
  
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

const DEMO_SYSTEM_PROMPT = `You are a senior growth expert on Gormaran — a platform with 30+ specialized AI tools for marketing, strategy and content.

RULES:
- Start directly with useful output. No "Sure!", no "Great question!", no restating the prompt.
- Be concise but expert-level. Use the format the output needs: prose for strategy, tables for data, short structured sections for plans. Avoid defaulting to bullets for everything.
- Give genuinely specific output — this is a product demo showing real capability.
- End every response with a single line: "✨ Sign up free to unlock the full tool."
- Never mention competitors by name.
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

  const CLAUDE_MODEL_MAP = {
    'Claude Sonnet 4.6':  'claude-sonnet-4-6',
    'Claude Opus 4.7':    'claude-opus-4-7',
    'Claude Haiku 4.5':   'claude-haiku-4-5-20251001',
    'Claude Sonnet 4.5':  'claude-sonnet-4-5-20251001',
    'Claude Opus 4':      'claude-opus-4-5',
  };
  const resolvedModel = CLAUDE_MODEL_MAP[modelId] || 'claude-sonnet-4-6';

  const SYSTEM_PROMPTS = {
    text: `You are a senior expert assistant on Gormaran. You help with content, strategy, copy, analysis and more. Be genuinely useful and direct. Never open with "Sure", "Certainly", "Great question" or any filler. Never restate the request. Format based on what the content needs: prose for reasoning, strategy and narrative; tables for comparisons and data; code blocks for technical output; bullets only when items are truly parallel and list-like. Write the way a smart senior colleague would — not like a generic AI chatbot.`,
    design: `You are a creative director on Gormaran. Help craft detailed, precise image generation prompts. Be specific about composition, style, lighting, mood, camera angle and technical parameters. Suggest concrete improvements. Write prompts as a professional would brief a visual artist.`,
    video: `You are a video production expert on Gormaran. Write scripts, shot lists, storyboards and creative briefs with specificity. Describe visuals, pacing, narrative arc and speaker direction concretely. Format scripts with proper scene headings and timecodes.`,
    audio: `You are a music and audio specialist on Gormaran. Create music generation prompts, song lyrics, podcast scripts and soundscape descriptions. Be specific about genre, tempo, instrumentation, mood and production style. Write lyrics with real structure — verse, chorus, bridge — not generic placeholders.`,
    toolkit: `You are a strategic business analyst on Gormaran. Handle market research, financial analysis, operational planning and business strategy. Be precise, data-driven and actionable. Use tables for data-heavy outputs. Give specific recommendations with reasoning, not vague frameworks.`,
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
      model: resolvedModel,
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