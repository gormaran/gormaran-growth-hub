import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { pushEvent } from '../utils/analytics';
import {
  streamChat,
  generateImage,
  startVideoGeneration,
  startHiggsfieldVideo,
  pollVideoStatus,
  generateSpeech,
  startMusicGeneration,
  pollMusicStatus,
  translateText,
  downloadFreeTTS,
} from '../utils/api';
import OnboardingModal from '../components/OnboardingModal';
import ProductTour, { shouldShowTour } from '../components/ProductTour';
import TemplateDetail from '../components/TemplateDetail';
import NodeFlowBuilder from '../components/NodeFlowBuilder';
import AppBuilder from '../components/AppBuilder';
import { TEMPLATES as TEMPLATES_DATA, NODE_TYPES } from '../data/templates';
import './Dashboard.css';

/* ─────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'text',      label: 'Text',       icon: '✍️' },
  { id: 'design',    label: 'Design',     icon: '🎨' },
  { id: 'video',     label: 'Video',      icon: '🎬' },
  { id: 'audio',     label: 'Audio',      icon: '🎵' },
  { id: 'agents',    label: 'AI Agents',  icon: '🤖' },
  { id: 'toolkit',   label: 'Tool-kit',   icon: '🛠️' },
  { id: 'templates', label: 'Templates',  icon: '⚡', isNew: true },
];

const MODELS = [
  { id: 'chatgpt',    name: 'ChatGPT',    by: 'OpenAI',     letter: 'G', color: '#10a37f',
    desc: 'Designed for tasks that require fast, accurate and general-purpose AI. Well suited for a wide variety of everyday queries.',
    caps: ['Fast responses', 'Link analysis', 'Up-to-date information', 'Context awareness'] },
  { id: 'claude',     name: 'Claude',     by: 'Anthropic',  letter: 'C', color: '#e54717',
    desc: 'Excels at nuanced reasoning, long documents and careful writing. Ideal for complex strategy and detailed outputs.',
    caps: ['Long context', 'Complex reasoning', 'Careful writing', 'Safety-focused'] },
  { id: 'gemini',     name: 'Gemini',     by: 'Google',     letter: 'G', color: '#4285f4',
    desc: 'Multimodal intelligence with real-time data access. Great for queries blending text, data and current knowledge.',
    caps: ['Multimodal', 'Real-time data', 'Fast inference', 'Code & analysis'] },
  { id: 'grok',       name: 'Grok',       by: 'xAI',        letter: 'X', color: '#e0e0e0',
    desc: 'Built for real-time web knowledge and X/Twitter data. Best for current events and trend analysis.',
    caps: ['Live web search', 'Current events', 'X/Twitter data', 'Witty reasoning'] },
  { id: 'deepseek',   name: 'Deepseek',   by: 'DeepSeek',   letter: 'D', color: '#1677ff',
    desc: 'Advanced reasoning with exceptional math and code capabilities. Efficient for complex technical tasks.',
    caps: ['Math & code', 'Deep reasoning', 'Chain-of-thought', 'Efficient'] },
  { id: 'perplexity', name: 'Perplexity', by: 'Perplexity', letter: 'P', color: '#20b2aa',
    desc: 'AI-powered search that provides cited, up-to-date answers. Best for research requiring source attribution.',
    caps: ['Cited answers', 'Web search', 'Up-to-date info', 'Source links'] },
  { id: 'qwen',       name: 'Qwen',       by: 'Alibaba',    letter: 'Q', color: '#ff6a00',
    desc: 'Strong multilingual model with long context support. Excellent for international content and coding.',
    caps: ['Multilingual', 'Long context', 'Code generation', 'Efficient'] },
];

const MODEL_LOGOS = {
  chatgpt:    'https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64',
  claude:     'https://www.google.com/s2/favicons?domain=claude.ai&sz=64',
  gemini:     'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64',
  grok:       'https://www.google.com/s2/favicons?domain=x.ai&sz=64',
  deepseek:   'https://www.google.com/s2/favicons?domain=deepseek.com&sz=64',
  perplexity: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64',
  qwen:       'https://www.google.com/s2/favicons?domain=chat.qwenlm.ai&sz=64',
};

function ModelLogo({ modelId, size = 24 }) {
  const src = MODEL_LOGOS[modelId];
  const m   = MODELS.find(x => x.id === modelId);
  if (!src) return <span style={{ fontWeight: 800, fontSize: size * 0.55 }}>{m?.letter}</span>;
  return <img src={src} alt={m?.name || modelId} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
}

const MODEL_VERSIONS = {
  chatgpt:    ['GPT-4.1', 'o3', 'o4-mini', 'GPT-4o', 'GPT-4o mini'],
  claude:     ['Claude Sonnet 4.6', 'Claude Opus 4.7', 'Claude Haiku 4.5'],
  gemini:     ['Gemini 2.5 Pro', 'Gemini 2.0 Flash', 'Gemini 1.5 Pro'],
  grok:       ['Grok-3', 'Grok-3 mini', 'Grok-2'],
  deepseek:   ['DeepSeek-V3', 'DeepSeek-R1', 'DeepSeek Coder'],
  perplexity: ['Sonar Pro', 'Sonar', 'Sonar Reasoning'],
  qwen:       ['Qwen2.5-Max', 'Qwen2.5-72B', 'Qwen-VL'],
};

const NEW_VERSIONS = new Set([
  'GPT-4.1', 'o3', 'o4-mini', 'Claude Sonnet 4.6', 'Claude Opus 4.7', 'Gemini 2.5 Pro', 'Grok-3', 'DeepSeek-V3',
]);

const TEMPLATES = [
  /* ── Marketing ── */
  { id: 'cold-email',       icon: '📧', name: 'Cold Email Sequence',   category: 'Marketing', tab: 'text',   creditCost: 1,
    desc: '5-email B2B outreach sequence with subject lines and CTAs',
    prompt: 'Write a 5-email cold email sequence for a B2B SaaS targeting [describe your ICP]. Include subject lines, preview text, and body copy for each email. Use pain-point → social proof → CTA structure. Keep each email under 150 words.' },
  { id: 'ad-copy',          icon: '🎯', name: 'Ad Copy Variations',    category: 'Marketing', tab: 'text',   creditCost: 1,
    desc: '10 headline + body variations for Google & Meta ads',
    prompt: 'Generate 10 ad copy variations for [product/service]. For each: headline (max 30 chars), description (max 90 chars), and CTA. Use different angles: urgency, FOMO, benefit, social proof, curiosity. Format as a numbered list.' },
  { id: 'social-calendar',  icon: '📅', name: '30-Day Social Calendar', category: 'Marketing', tab: 'text',   creditCost: 1,
    desc: 'Full month content plan for LinkedIn, Instagram & X',
    prompt: 'Create a 30-day social media content calendar for [brand/product] targeting [audience]. Include post ideas for LinkedIn, Instagram, and X/Twitter. Mix: 40% educational, 30% behind-the-scenes, 20% promotional, 10% engagement. Add caption length guidance per platform.' },
  { id: 'seo-outline',      icon: '🔍', name: 'SEO Blog Outline',       category: 'Marketing', tab: 'text',   creditCost: 1,
    desc: 'Full H1–H3 structure, meta description, and FAQs',
    prompt: 'Create a comprehensive SEO blog post outline for the keyword "[target keyword]". Include: H1, H2s, H3s, meta title (60 chars), meta description (155 chars), intro hook, key point per section, conclusion, 5 FAQs, and suggested internal link anchors.' },
  /* ── Content ── */
  { id: 'landing-copy',     icon: '🏠', name: 'Landing Page Copy',      category: 'Content',   tab: 'text',   creditCost: 1,
    desc: 'Hero, features, social proof, FAQ, CTA — full page',
    prompt: 'Write complete landing page copy for [product/service]. Sections: hero headline + subheadline, 3 feature blocks (benefit-led), social proof section (testimonials + stats), FAQ (5 Q&As), and closing CTA. Conversion-focused. Avoid jargon.' },
  { id: 'newsletter',       icon: '✉️', name: 'Newsletter Draft',        category: 'Content',   tab: 'text',   creditCost: 1,
    desc: 'Engaging weekly newsletter under 400 words',
    prompt: 'Write an engaging weekly newsletter about [topic] for [audience]. Structure: compelling subject line, story hook (2 sentences), 3 insights with actionable takeaways, one recommended resource, and a soft CTA. Conversational tone, under 400 words.' },
  { id: 'video-script',     icon: '🎬', name: 'Video Script',            category: 'Content',   tab: 'text',   creditCost: 1,
    desc: '60-second script with timestamps and speaker notes',
    prompt: 'Write a 60-second video script for [product/service]. Structure: [0-5s] hook, [5-15s] problem, [15-35s] solution demo, [35-50s] key features, [50-60s] CTA. Include speaker notes and visual direction cues in brackets.' },
  /* ── Strategy ── */
  { id: 'gtm-strategy',     icon: '🚀', name: 'Go-to-Market Strategy',   category: 'Strategy',  tab: 'text',   creditCost: 1,
    desc: 'ICP, channels, pricing, timeline, and 90-day plan',
    prompt: 'Create a go-to-market strategy for [product/service]. Cover: ICP definition, positioning statement, pricing model, top 3 acquisition channels with tactics, launch timeline (weeks 1-12), success KPIs, and first 90-day action plan. Be specific and actionable.' },
  { id: 'competitor-brief', icon: '🔬', name: 'Competitor Brief',        category: 'Strategy',  tab: 'text',   creditCost: 1,
    desc: 'Feature, pricing, and positioning comparison table',
    prompt: 'Perform a structured competitor analysis: [your product] vs [competitor 1] vs [competitor 2]. Compare across: core features, pricing, target segment, positioning, UX strengths, weaknesses, and differentiation gaps. Output as a comparison table + summary of your best attack angles.' },
  { id: 'pricing-strategy', icon: '💰', name: 'Pricing Strategy',        category: 'Strategy',  tab: 'text',   creditCost: 1,
    desc: 'Tier structure, anchoring, and psychological pricing',
    prompt: 'Design a pricing strategy for [product/service]. Include: recommended tier structure (free/pro/enterprise), price anchoring rationale, feature allocation per tier, monthly vs annual pricing (with discount logic), trial strategy, and key psychological pricing principles applied.' },
  /* ── Design ── */
  { id: 'product-hero',     icon: '🖼️', name: 'Product Hero Image',      category: 'Design',    tab: 'design', creditCost: 4,
    desc: 'Studio-quality product shot on clean background',
    prompt: 'Professional product photography of [describe your product], studio lighting, clean white background, commercial quality, sharp focus, minimalist composition, photorealistic, 4K resolution' },
  { id: 'social-visual',    icon: '📱', name: 'Social Media Visual',      category: 'Design',    tab: 'design', creditCost: 4,
    desc: 'Bold, scroll-stopping graphic for Instagram/LinkedIn',
    prompt: 'Bold social media graphic for [brand/campaign], modern design, vibrant complementary colors, large impactful typography, eye-catching geometric composition, professional marketing aesthetic, Instagram-ready format' },
  { id: 'brand-illustration', icon: '✨', name: 'Brand Illustration',    category: 'Design',    tab: 'design', creditCost: 4,
    desc: 'Custom illustration in your brand style',
    prompt: 'Custom flat design illustration for [topic/concept], modern brand illustration style, [primary color] and [accent color] palette, clean lines, professional business context, suitable for website hero or presentation slide' },
];

const VIDEO_MODELS = [
  { id: 'higgsfield', label: 'Higgsfield', by: 'Higgsfield AI' },
];

const TAB_SUGGESTIONS = {
  text: [
    { icon: '📊', text: 'Analyse the market opportunity for my SaaS product' },
    { icon: '✍️', text: 'Write a blog post about AI trends in 2025' },
    { icon: '📧', text: 'Draft a cold email sequence for B2B outreach' },
    { icon: '🎯', text: 'Create a go-to-market strategy for my startup' },
  ],
  design: [
    { icon: '🖼️', text: 'A minimalist brand logo for a fintech startup, blue and white' },
    { icon: '🌅', text: 'Cinematic product shot of wireless headphones on a dark background' },
    { icon: '🎨', text: 'Abstract geometric banner for a tech conference, purple gradient' },
    { icon: '🏙️', text: 'Modern office interior, clean and professional, natural light' },
  ],
};

const SESSIONS_KEY = 'gormaran_sessions_v2';
const MAX_SESSIONS = 30;

/* ─────────────────────────────────────────────────────────────────
   Session helpers (localStorage)
───────────────────────────────────────────────────────────────── */
function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); }
  catch { return []; }
}
function saveSessions(sessions) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS))); }
  catch {}
}
function makeSession(tab, model) {
  const titles = { text: 'New chat', design: 'New design', video: 'New video', audio: 'New audio', agents: 'New flow' };
  return { id: crypto.randomUUID(), title: titles[tab] || 'New session', tab, model, messages: [], items: [], nodes: [], edges: [], flowName: '', createdAt: Date.now() };
}
function sessionIcon(tab) {
  return TABS.find(t => t.id === tab)?.icon || '💬';
}

/* ─────────────────────────────────────────────────────────────────
   SimpleSpinner
───────────────────────────────────────────────────────────────── */
function Spinner() { return <span className="dash__spinner" />; }

function ThinkingDots() {
  return (
    <span className="dash__thinking">
      <span className="dash__thinking-dot" />
      <span className="dash__thinking-dot" />
      <span className="dash__thinking-dot" />
    </span>
  );
}

const MSG_LANGS = [
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'pt', label: '🇧🇷 Portuguese' },
  { code: 'it', label: '🇮🇹 Italian' },
  { code: 'zh', label: '🇨🇳 Chinese' },
  { code: 'ja', label: '🇯🇵 Japanese' },
];

function MessageActions({ content, isEs }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLangs, setShowLangs] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!showLangs) return;
    function handleClick(e) { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowLangs(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showLangs]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    try {
      const list = JSON.parse(localStorage.getItem('gormaran_saved_v1') || '[]');
      list.unshift({ id: Date.now(), content, preview: content.slice(0, 90), savedAt: Date.now() });
      localStorage.setItem('gormaran_saved_v1', JSON.stringify(list.slice(0, 50)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gormaran-output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTranslate = async (langCode, langLabel) => {
    setShowLangs(false);
    setTranslating(true);
    try {
      const result = await translateText(content, 'auto', langCode);
      setTranslated({ lang: langLabel, text: result });
    } catch {}
    finally { setTranslating(false); }
  };

  return (
    <div className="dash__msg-actions">
      <div className="dash__msg-action-row">
        <button className="dash__msg-action-btn" onClick={handleCopy} title="Copy">
          {copied ? '✅' : '📋'} {isEs ? 'Copiar' : 'Copy'}
        </button>
        <div className="dash__msg-action-group" ref={pickerRef}>
          <button className="dash__msg-action-btn" onClick={() => setShowLangs(p => !p)} title="Translate" disabled={translating}>
            {translating ? '⏳' : '🌐'} {isEs ? 'Traducir' : 'Translate'}
          </button>
          {showLangs && (
            <div className="dash__lang-picker">
              {MSG_LANGS.map(l => (
                <button key={l.code} className="dash__lang-option" onClick={() => handleTranslate(l.code, l.label)}>
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="dash__msg-action-btn" onClick={handleSave} title="Save">
          {saved ? '✅' : '💾'} {isEs ? 'Guardar' : 'Save'}
        </button>
        <button className="dash__msg-action-btn" onClick={handleExport} title="Export TXT">
          ⬇️ {isEs ? 'Exportar' : 'Export'}
        </button>
      </div>
      {translated && (
        <div className="dash__translated">
          <div className="dash__translated-bar">
            <span>🌐 {translated.lang}</span>
            <button className="dash__translated-close" onClick={() => setTranslated(null)}>✕</button>
          </div>
          <div className="dash__translated-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{translated.text}</ReactMarkdown>
          </div>
          <button className="dash__msg-action-btn" style={{ marginTop: '0.5rem' }} onClick={async () => { await navigator.clipboard.writeText(translated.text); }}>
            📋 {isEs ? 'Copiar traducción' : 'Copy translation'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Welcome / empty state
───────────────────────────────────────────────────────────────── */
function WelcomeState({ tab, onSuggestion }) {
  const suggestions = TAB_SUGGESTIONS[tab] || TAB_SUGGESTIONS.text;
  return (
    <div className="dash__welcome">
      <div className="dash__welcome-caps">
        {suggestions.map(s => (
          <button key={s.text} className="dash__suggestion" onClick={() => onSuggestion(s.text)}>
            <span className="dash__suggestion-icon">{s.icon}</span>
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Text Chat Area
───────────────────────────────────────────────────────────────── */
function ChatArea({ session, systemPrompt, onUpdate, usageCount, freeLimit, subscription, defaultPrompt }) {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [input, setInput]         = useState(defaultPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [slowServer, setSlowServer] = useState(false);
  const abortRef       = useRef(null);
  const slowTimerRef   = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [listening, setListening] = useState(false);
  const fileInputRef   = useRef(null);
  const recRef         = useRef(null);
  const messagesRef   = useRef(null);
  const textareaRef   = useRef(null);
  const messages      = session?.messages || [];

  const scrollToBottom = useCallback(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, streamText, scrollToBottom]);

  // Auto-focus on mount for new chats (preventScroll avoids page jump)
  useEffect(() => {
    if (messages.length === 0) {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [input]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if ((!text && !attachedFile) || isLoading) return;

    if (subscription === 'free' && usageCount >= freeLimit) {
      return;
    }

    setInput('');
    setStreamText('');
    setSlowServer(false);
    setIsLoading(true);
    const imageAttach = attachedFile?.type === 'image' ? { data: attachedFile.data, mimeType: attachedFile.mimeType } : null;
    const finalText = attachedFile?.type === 'text'
      ? `${text}\n\n[Attached file: ${attachedFile.name}]\n\`\`\`\n${attachedFile.textContent}\n\`\`\``
      : text;
    setAttachedFile(null);

    const userMsg = { role: 'user', content: finalText, ts: Date.now() };
    const nextMessages = [...messages, userMsg];
    const autoTitle = (!session.title || session.title === 'New chat')
      ? text.slice(0, 48) + (text.length > 48 ? '…' : '')
      : undefined;
    onUpdate({ messages: nextMessages, title: autoTitle });

    slowTimerRef.current = setTimeout(() => setSlowServer(true), 3500);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    streamChat({
      message: finalText,
      attachedImage: imageAttach,
      history: messages.map(m => ({ role: m.role, content: m.content })),
      systemPrompt: systemPrompt || undefined,
      modelId: undefined,
      tab: session.tab,
      signal: controller.signal,
      onChunk: (chunk) => {
        clearTimeout(slowTimerRef.current); setSlowServer(false);
        accumulated += chunk;
        setStreamText(accumulated);
      },
      onDone: () => {
        clearTimeout(slowTimerRef.current); setSlowServer(false);
        const aiMsg = { role: 'assistant', content: accumulated, ts: Date.now() };
        onUpdate({ messages: [...nextMessages, aiMsg] });
        setStreamText('');
        setIsLoading(false);
        abortRef.current = null;
      },
      onError: (err) => {
        clearTimeout(slowTimerRef.current); setSlowServer(false);
        const friendly = (err?.includes('credit') || err?.includes('limit')) ? err : (isEs ? 'Algo salió mal. Inténtalo de nuevo.' : 'Something went wrong. Please try again.');
        const errMsg = { role: 'assistant', content: `⚠️ ${friendly}`, ts: Date.now(), error: true };
        onUpdate({ messages: [...nextMessages, errMsg] });
        setStreamText('');
        setIsLoading(false);
        abortRef.current = null;
      },
    });
  }, [input, isLoading, messages, session, subscription, usageCount, freeLimit, onUpdate]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setAttachedFile({ type: 'image', data: dataUrl.split(',')[1], mimeType: file.type, name: file.name, preview: dataUrl });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedFile({ type: 'text', textContent: (ev.target.result || '').slice(0, 12000), name: file.name });
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = isEs ? 'es-ES' : 'en-US';
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
      textareaRef.current?.focus();
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const handleStop = () => {
    clearTimeout(slowTimerRef.current);
    setSlowServer(false);
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamText) {
      onUpdate({ messages: [...messages, { role: 'assistant', content: streamText, ts: Date.now() }] });
    }
    setStreamText('');
    setIsLoading(false);
  };

  const limitReached = subscription === 'free' && usageCount >= freeLimit;
  const placeholder = limitReached
    ? (isEs ? 'Límite alcanzado — actualiza para continuar' : 'Limit reached — upgrade to continue')
    : (isEs ? 'Escribe tu mensaje…' : 'Write your message…');

  return (
    <>
      {messages.length === 0 && !isLoading ? (
        <WelcomeState
          tab={session.tab}
          onSuggestion={(text) => { setInput(text); textareaRef.current?.focus(); }}
        />
      ) : (
        <div className="dash__messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`dash__message dash__message--${msg.role}`}>
              <div
                className="dash__message-avatar"
                style={msg.role === 'assistant'
                  ? { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }
                  : {}}
              >
                {msg.role === 'assistant' ? '⚡' : '👤'}
              </div>
              <div className="dash__message-body">
                {msg.role === 'assistant' && (
                  <div className="dash__message-role">Gormaran AI</div>
                )}
                <div className="dash__message-text">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.role === 'assistant' && !msg.error && (
                  <MessageActions content={msg.content} isEs={isEs} />
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="dash__message dash__message--assistant">
              <div
                className="dash__message-avatar"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                ⚡
              </div>
              <div className="dash__message-body">
                <div className="dash__message-role">Gormaran AI</div>
                <div className="dash__message-text">
                  {streamText
                    ? <><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown><span className="dash__cursor" /></>
                    : slowServer
                      ? <span className="dash__slow-server"><span className="dash__spinner" style={{ width: 14, height: 14, marginRight: 6 }} />{isEs ? 'Conectando servidor AI… un momento' : 'Connecting AI server… one moment'}</span>
                      : <ThinkingDots />
                  }
                </div>
              </div>
            </div>
          )}
          <div />
        </div>
      )}

      <div className="dash__input-bar">
        <div className="dash__input-wrap">
          {attachedFile && (
            <div className="dash__attach-preview">
              {attachedFile.type === 'image' ? (
                <img src={attachedFile.preview} className="dash__attach-thumb" alt={attachedFile.name} />
              ) : (
                <span className="dash__attach-file">📄 {attachedFile.name}</span>
              )}
              <button className="dash__attach-remove" onClick={() => setAttachedFile(null)}>✕</button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,.txt,.md,.csv,.json" style={{ display: 'none' }} onChange={handleFileChange} />
          <div className="dash__input-row">
            <button
              className="dash__attach-btn"
              onClick={() => fileInputRef.current?.click()}
              type="button"
              title={isEs ? 'Adjuntar imagen o archivo' : 'Attach image or file'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <textarea
              ref={textareaRef}
              className="dash__textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              disabled={limitReached}
              rows={1}
            />
            {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
              <button
                className={`dash__voice-btn${listening ? ' dash__voice-btn--active' : ''}`}
                onClick={handleVoice}
                type="button"
                title={isEs ? 'Entrada por voz' : 'Voice input'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
              </button>
            )}
            <button
              className={`dash__send${input.trim() && !limitReached ? ' dash__send--active' : ''}${isLoading ? ' dash__send--loading' : ''}`}
              onClick={isLoading ? handleStop : handleSubmit}
              title={isLoading ? 'Stop' : 'Send'}
            >
              {isLoading
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
            </button>
          </div>
          <div className="dash__input-footer">
            {isLoading ? (
              <span className="dash__generating-label">
                <ThinkingDots /> {isEs ? 'Generando…' : 'Generating…'}
                <button className="dash__stop-btn" style={{ marginLeft: '0.5rem' }} onClick={handleStop}>■ Stop</button>
              </span>
            ) : <span />}
            <span className="dash__input-hint">
              {limitReached
                ? <Link to="/pricing" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Upgrade →</Link>
                : isEs ? 'Intro para enviar · Shift+Intro para nueva línea' : 'Enter to send · Shift+Enter for new line'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Design / Image Generation Area
───────────────────────────────────────────────────────────────── */
function DesignArea({ subscription, usageCount, freeLimit, defaultPrompt, session, onUpdate }) {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [prompt, setPrompt]     = useState(defaultPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages]     = useState(() => session?.items || []);
  const [error, setError]       = useState(null);

  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading || limitReached) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateImage({ subject: prompt.trim(), style: 'photorealistic', aspect_ratio: '16:9 — Landscape', mood: 'professional', lighting: 'natural light' });
      if (result.imageUrl) {
        const newImages = [{ url: result.imageUrl, prompt: prompt.trim(), ts: Date.now() }, ...images];
        setImages(newImages);
        onUpdate?.(newImages, prompt.trim().slice(0, 45));
        setPrompt('');
      }
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
  };

  return (
    <>
      <div className="dash__image-area">
        {images.length === 0 && !isLoading && (
          <WelcomeState
            tab="design"
            onSuggestion={(text) => setPrompt(text)}
          />
        )}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Spinner />
            {isEs ? 'Generando imagen con DALL·E 3…' : 'Generating image with DALL·E 3…'}
          </div>
        )}
        {error && (
          <div style={{ padding: '0.75rem 1.1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', maxWidth: 520 }}>
            ⚠️ {error}
          </div>
        )}
        {images.map((img) => (
          <div key={img.ts} className="dash__image-card">
            <img src={img.url} alt={img.prompt} loading="lazy" />
            <div className="dash__image-prompt">"{img.prompt}"</div>
            <div className="dash__image-actions">
              <a href={img.url} download={`gormaran-${img.ts}.png`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                ↓ {isEs ? 'Descargar' : 'Download'}
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="dash__input-bar">
        <div className="dash__input-wrap">
          <div className="dash__input-row">
            <textarea
              className="dash__textarea"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              placeholder={limitReached
                ? (isEs ? 'Límite alcanzado — actualiza' : 'Limit reached — upgrade to continue')
                : (isEs ? 'Describe la imagen que quieres crear…' : 'Describe the image you want to create…')}
              disabled={limitReached || isLoading}
              rows={1}
            />
            <button
              className={`dash__send${prompt.trim() && !limitReached ? ' dash__send--active' : ''}`}
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading || limitReached}
              title="Generate"
            >
              {isLoading ? <Spinner /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
            </button>
          </div>
          <div className="dash__input-footer">
            <span />
            <span className="dash__input-hint">
              {limitReached
                ? <Link to="/pricing" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Upgrade →</Link>
                : 'Powered by DALL·E 3'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Video Generation Area (Replicate)
───────────────────────────────────────────────────────────────── */
const VIDEO_SUGGESTIONS = [
  { icon: '🌊', text: 'Cinematic ocean waves crashing at sunset, slow motion' },
  { icon: '🏙️', text: 'Futuristic city at night with neon lights and flying cars' },
  { icon: '🌿', text: 'Time-lapse of a flower blooming in a misty forest' },
  { icon: '🚀', text: 'Rocket launching through clouds into a starry sky' },
];

function VideoArea({ subscription, usageCount, freeLimit, session, onUpdate }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [prompt, setPrompt]         = useState('');
  const [videos, setVideos]         = useState(() => session?.items || []);
  const [status, setStatus]         = useState(null); // null | 'generating' | 'polling'
  const [progress, setProgress]     = useState('');
  const [error, setError]           = useState(null);
  const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0].id);
  const pollRef                     = useRef(null);

  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  const stopPoll = () => { clearInterval(pollRef.current); pollRef.current = null; };

  const handleGenerate = async () => {
    if (!prompt.trim() || status || limitReached) return;
    setError(null);
    setStatus('generating');
    setProgress('');
    const savedPrompt = prompt.trim();
    try {
      // Higgsfield uses its own direct API, all others go through Replicate
      const isHighsfield = videoModel === 'higgsfield';
      const startFn = isHighsfield ? startHiggsfieldVideo : startVideoGeneration;
      const startArgs = isHighsfield
        ? { prompt: savedPrompt, aspect_ratio: '16:9' }
        : { prompt: savedPrompt, aspect_ratio: '16:9', model: videoModel };
      const { taskId, provider } = await startFn(startArgs);
      setStatus('polling');
      setPrompt('');
      pollRef.current = setInterval(async () => {
        try {
          const res = await pollVideoStatus(taskId, isHighsfield ? 'higgsfield' : 'replicate');
          if (res.status === 'done') {
            stopPoll();
            setVideos(prev => {
              const next = [{ url: res.videoUrl, prompt: savedPrompt || 'video', ts: Date.now() }, ...prev];
              onUpdate?.(next, (savedPrompt || 'video').slice(0, 45));
              return next;
            });
            setStatus(null);
          } else if (res.status === 'failed') {
            stopPoll();
            setError(res.error || 'Video generation failed');
            setStatus(null);
          } else {
            setProgress(res.progress || '');
          }
        } catch (e) { stopPoll(); setError(e.message); setStatus(null); }
      }, 4000);
    } catch (err) {
      setError(err.message);
      setStatus(null);
    }
  };

  useEffect(() => () => stopPoll(), []);

  const isApiError = error?.includes('API_TOKEN') || error?.includes('not configured') || error?.includes('HIGGSFIELD_API_KEY');
  const isReplicateBilling = error?.includes('free time limit') || error?.includes('billing') || error?.includes('activate');

  return (
    <div className="dash__media-layout">
      {/* Content area */}
      <div className="dash__media-content">
        {!status && videos.length === 0 && !error && (
          <div className="dash__media-empty">
            <div className="dash__media-empty-icon">🎬</div>
            <h3 className="dash__media-empty-title">{isEs ? 'Genera vídeos con IA' : 'Generate AI Videos'}</h3>
            <p className="dash__media-empty-sub">{isEs ? 'Convierte texto en vídeos cinematográficos' : 'Turn text into cinematic videos with state-of-the-art AI'}</p>
            <div className="dash__media-suggestions">
              {VIDEO_SUGGESTIONS.map((s, i) => (
                <button key={i} className="dash__media-suggestion" onClick={() => setPrompt(s.text)}>
                  <span className="dash__media-suggestion-icon">{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isReplicateBilling && (
          <div className="dash__api-setup">
            <div className="dash__api-setup-icon">💳</div>
            <h3 className="dash__api-setup-title">Replicate free tier exhausted</h3>
            <p className="dash__api-setup-sub">Add billing at <strong>replicate.com/account/billing</strong> — OR — switch to <strong>Higgsfield</strong> model and add <code>HIGGSFIELD_API_KEY</code> in Render.</p>
            <ol className="dash__api-setup-steps">
              <li><strong>Option A:</strong> Go to <strong>replicate.com/account/billing</strong> and add a payment method (pay per use, ~$0.05–0.30/video)</li>
              <li><strong>Option B:</strong> Get a Higgsfield key at <strong>higgsfield.ai</strong> → add <code>HIGGSFIELD_API_KEY</code> to Render → select Higgsfield model</li>
            </ol>
            <button className="dash__api-setup-dismiss" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {isApiError && !isReplicateBilling && (
          <div className="dash__api-setup">
            <div className="dash__api-setup-icon">🔑</div>
            <h3 className="dash__api-setup-title">API key missing for selected model</h3>
            <p className="dash__api-setup-sub">Each model needs its own API key:</p>
            <ol className="dash__api-setup-steps">
              <li>🟣 <strong>Higgsfield</strong> → <code>HIGGSFIELD_API_KEY</code> in Render (you have this ✓ — select Higgsfield model)</li>
              <li>🔵 <strong>KLING / WAN / Minimax</strong> → <code>REPLICATE_API_TOKEN</code> in Render</li>
              <li>To add: Render dashboard → your service → <strong>Environment</strong> → Save & redeploy</li>
            </ol>
            <button className="dash__api-setup-dismiss" onClick={() => { setError(null); setVideoModel('higgsfield'); }}>
              Switch to Higgsfield →
            </button>
          </div>
        )}

        {error && !isApiError && (
          <div className="dash__gen-error">⚠️ {error} <button onClick={() => setError(null)} style={{ marginLeft: '0.5rem', opacity: 0.6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div>
        )}

        {status && (
          <div className="dash__gen-progress">
            <div className="dash__gen-progress-icon">🎬</div>
            <div className="dash__gen-progress-title">{isEs ? 'Generando vídeo…' : 'Generating video…'}</div>
            <div className="dash__gen-progress-sub">
              {isEs ? 'Esto puede tardar 1–3 minutos.' : 'This may take 1–3 minutes.'}
              {progress && <div className="dash__gen-progress-log">{progress.slice(-120)}</div>}
            </div>
            <div className="dash__thinking"><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/></div>
          </div>
        )}

        {videos.map(v => (
          <div key={v.ts} className="dash__image-card">
            <video src={v.url} controls style={{ width: '100%', display: 'block', borderRadius: '12px 12px 0 0' }} />
            <div className="dash__image-prompt">"{v.prompt}"</div>
            <div className="dash__image-actions">
              <a href={v.url} download={`video-${v.ts}.mp4`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                ↓ {isEs ? 'Descargar' : 'Download'}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Input + model bar */}
      <div className="dash__media-input-area">
        <div className="dash__video-model-row">
          <span className="dash__audio-voice-label">{isEs ? 'Modelo:' : 'Model:'}</span>
          <div className="dash__video-model-list">
            {VIDEO_MODELS.map(vm => (
              <button key={vm.id}
                className={`dash__video-model-chip${videoModel === vm.id ? ' dash__video-model-chip--active' : ''}`}
                onClick={() => setVideoModel(vm.id)} disabled={!!status}>
                {vm.label}
                <span className="dash__video-model-by">{vm.by}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="dash__input-bar" style={{ borderTop: 'none' }}>
          <div className="dash__input-wrap">
            <div className="dash__input-row">
              <textarea className="dash__textarea" value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder={limitReached ? 'Upgrade to generate videos' : (isEs ? 'Describe el vídeo que quieres crear…' : 'Describe the video you want to create…')}
                disabled={!!status || limitReached} rows={1}
              />
              <button className={`dash__send${prompt.trim() && !status ? ' dash__send--active' : ''}`}
                onClick={handleGenerate} disabled={!prompt.trim() || !!status || limitReached}>
                {status ? <span className="dash__spinner" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
              </button>
            </div>
            <div className="dash__input-footer">
              <span />
              <span className="dash__input-hint">{VIDEO_MODELS.find(v => v.id === videoModel)?.label} · {VIDEO_MODELS.find(v => v.id === videoModel)?.by}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Audio Area (ElevenLabs TTS + MusicGen)
───────────────────────────────────────────────────────────────── */
const SPEECH_LANGS = [
  { code: 'en', label: '🇺🇸 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'pt', label: '🇧🇷 Português' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'zh', label: '🇨🇳 中文' },
];

function detectGender(name) {
  const n = name.toLowerCase();
  if (/female|femme|woman|mujer/.test(n)) return 'female';
  if (/\bmale\b|homme|man\b/.test(n)) return 'male';
  const f = ['alice','anna','aria','ava','bella','emma','ella','fiona','grace','karen','kate','laila','laura','lily','lisa','lucia','mia','michelle','moira','natasha','nicole','nora','olivia','rachel','rosa','samantha','sara','sarah','serena','silvia','sofia','sonya','susan','tessa','tina','veena','victoria','zara','zira','cortana','siri'];
  const m = ['aaron','adam','arthur','ben','brian','carlos','chris','daniel','david','diego','eric','fred','george','jack','james','jorge','juan','kevin','liam','mark','michael','nicolas','noah','oliver','pablo','paul','peter','rick','robert','ryan','thomas','tom','tony','william','reed','alex'];
  const first = n.split(/[\s\-_]/)[0];
  if (f.some(x => first.startsWith(x) || first === x)) return 'female';
  if (m.some(x => first.startsWith(x) || first === x)) return 'male';
  return 'unknown';
}
const MUSIC_SUGGESTIONS = [
  { icon: '🎵', text: 'Upbeat electronic music for a product demo, 120 BPM' },
  { icon: '🎹', text: 'Calm piano background music for focus and productivity' },
  { icon: '🎸', text: 'Epic cinematic orchestral score for an action trailer' },
  { icon: '🌊', text: 'Relaxing ambient music with nature sounds and soft synths' },
];

function AudioArea({ subscription, usageCount, freeLimit, session, onUpdate }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [mode, setMode]           = useState('speech');
  const [text, setText]           = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [gender, setGender]       = useState('all');     // 'female' | 'male' | 'all'
  const [pitchType, setPitchType] = useState('normal');  // 'high' | 'normal' | 'low'
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [browserVoices, setBrowserVoices] = useState([]);
  const [musicPrompt, setMusicPrompt] = useState('');
  const [duration, setDuration]   = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [audioItems, setAudioItems] = useState(() => session?.items || []);
  const [error, setError]         = useState(null);
  const [musicStatus, setMusicStatus] = useState(null);
  const pollRef = useRef(null);
  const utterRef = useRef(null);

  const limitReached = subscription === 'free' && usageCount >= freeLimit;
  const stopPoll = () => { clearInterval(pollRef.current); pollRef.current = null; };
  useEffect(() => () => { stopPoll(); window.speechSynthesis?.cancel(); }, []);

  // Load browser voices
  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (voices.length) setBrowserVoices(voices);
    };
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  // Filter voices by language + gender
  const filteredVoices = browserVoices.filter(v => {
    const langMatch = v.lang.toLowerCase().startsWith(selectedLang.toLowerCase());
    if (!langMatch) return false;
    if (gender === 'all') return true;
    return detectGender(v.name) === gender || detectGender(v.name) === 'unknown';
  });

  const activeVoice = filteredVoices.find(v => v.name === selectedVoiceName) || filteredVoices[0] || null;

  // Pitch/rate settings
  const PITCH_MAP = {
    high:   { pitch: 1.5, rate: 1.05 },
    normal: { pitch: 1.0, rate: 0.92 },
    low:    { pitch: 0.55, rate: 0.82 },
  };

  const handleSpeech = () => {
    if (!text.trim() || isLoading || limitReached) return;
    const synth = window.speechSynthesis;
    if (!synth) { setError('Web Speech API not supported in this browser.'); return; }
    synth.cancel();
    setError(null); setIsLoading(true);
    const utter = new SpeechSynthesisUtterance(text.trim());
    if (activeVoice) utter.voice = activeVoice;
    else utter.lang = `${selectedLang}-${selectedLang.toUpperCase()}`;
    const { pitch, rate } = PITCH_MAP[pitchType] || PITCH_MAP.normal;
    utter.pitch = pitch; utter.rate = rate;
    utterRef.current = utter;
    utter.onend = () => {
      const newItems = [{
        url: null, label: text.slice(0, 60), mode: 'speech', ts: Date.now(),
        speechText: text.trim(), voiceName: activeVoice?.name || '', lang: selectedLang, pitchType,
      }, ...audioItems];
      setAudioItems(newItems);
      onUpdate?.(newItems, text.slice(0, 45));
      setText(''); setIsLoading(false);
    };
    utter.onerror = (e) => { setError(`Speech error: ${e.error}`); setIsLoading(false); };
    synth.speak(utter);
  };

  const handleDownloadSpeech = async (item) => {
    setDownloading(item.ts);
    try { await downloadFreeTTS(item.speechText, item.lang || selectedLang); }
    catch (e) { setError(e.message); }
    finally { setDownloading(null); }
  };

  const handleMusic = async () => {
    if (!musicPrompt.trim() || musicStatus || limitReached) return;
    setError(null); setMusicStatus('generating');
    try {
      const { taskId } = await startMusicGeneration({ prompt: musicPrompt.trim(), duration });
      setMusicPrompt('');
      pollRef.current = setInterval(async () => {
        try {
          const res = await pollMusicStatus(taskId);
          if (res.status === 'done') {
            stopPoll(); setMusicStatus(null);
            setAudioItems(prev => {
              const next = [{ url: res.audioUrl, label: musicPrompt.slice(0, 50), mode: 'music', ts: Date.now() }, ...prev];
              onUpdate?.(next, musicPrompt.slice(0, 45));
              return next;
            });
          } else if (res.status === 'failed') {
            stopPoll(); setMusicStatus(null); setError(res.error || 'Music generation failed');
          }
        } catch (e) { stopPoll(); setMusicStatus(null); setError(e.message); }
      }, 4000);
    } catch (err) { setMusicStatus(null); setError(err.message); }
  };

  const isApiError = (err) => err?.includes('API_TOKEN') || err?.includes('not configured') || err?.includes('API_KEY');

  return (
    <div className="dash__media-layout">
      {/* Content area */}
      <div className="dash__media-content">
        {/* Mode toggle */}
        <div className="dash__audio-mode-toggle">
          <button className={`dash__audio-mode-btn${mode === 'speech' ? ' active' : ''}`} onClick={() => setMode('speech')}>
            🎙️ {isEs ? 'Voz (TTS)' : 'Voice (TTS)'}
          </button>
          <button className={`dash__audio-mode-btn${mode === 'music' ? ' active' : ''}`} onClick={() => setMode('music')}>
            🎵 {isEs ? 'Música' : 'Music'}
          </button>
        </div>

        {/* Speech empty state */}
        {mode === 'speech' && !isLoading && audioItems.filter(a => a.mode === 'speech').length === 0 && (
          <div className="dash__media-empty">
            <div className="dash__media-empty-icon">🎙️</div>
            <h3 className="dash__media-empty-title">{isEs ? 'Texto a voz' : 'Text to Speech'}</h3>
            <p className="dash__media-empty-sub">{isEs ? 'Convierte cualquier texto en audio natural con voces de IA' : 'Convert any text into natural-sounding audio with AI voices'}</p>
          </div>
        )}

        {/* Music empty state */}
        {mode === 'music' && !musicStatus && audioItems.filter(a => a.mode === 'music').length === 0 && (
          <div className="dash__media-empty">
            <div className="dash__media-empty-icon">🎵</div>
            <h3 className="dash__media-empty-title">{isEs ? 'Genera música con IA' : 'Generate AI Music'}</h3>
            <p className="dash__media-empty-sub">{isEs ? 'Crea música original a partir de una descripción' : 'Create original music from a text description'}</p>
            <div className="dash__media-suggestions">
              {MUSIC_SUGGESTIONS.map((s, i) => (
                <button key={i} className="dash__media-suggestion" onClick={() => setMusicPrompt(s.text)}>
                  <span className="dash__media-suggestion-icon">{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && isApiError(error) && mode === 'music' && (
          <div className="dash__api-setup">
            <div className="dash__api-setup-icon">🔑</div>
            <h3 className="dash__api-setup-title">{isEs ? 'Configuración requerida' : 'Setup required'}</h3>
            <p className="dash__api-setup-sub">{isEs ? 'Añade tu REPLICATE_API_TOKEN para generar música' : 'Add REPLICATE_API_TOKEN to enable music generation'}</p>
            <ol className="dash__api-setup-steps">
              <li>Go to <strong>dashboard.render.com</strong> → your service → <strong>Environment</strong></li>
              <li>Add: <code>REPLICATE_API_TOKEN</code></li>
              <li>Get key at <strong>replicate.com/account/api-tokens</strong></li>
              <li>Save and redeploy</li>
            </ol>
            <button className="dash__api-setup-dismiss" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        {error && (!isApiError(error) || mode === 'speech') && (
          <div className="dash__gen-error">⚠️ {error} <button onClick={() => setError(null)} style={{ marginLeft: '0.5rem', opacity: 0.6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div>
        )}

        {musicStatus && (
          <div className="dash__gen-progress">
            <div className="dash__gen-progress-icon">🎵</div>
            <div className="dash__gen-progress-title">{isEs ? 'Generando música…' : 'Generating music…'}</div>
            <div className="dash__gen-progress-sub">{isEs ? 'Esto puede tardar 30–60 segundos.' : 'This may take 30–60 seconds.'}</div>
            <div className="dash__thinking"><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/></div>
          </div>
        )}
        {isLoading && <div className="dash__gen-progress"><div className="dash__gen-progress-icon">🎙️</div><div className="dash__gen-progress-title">{isEs ? 'Generando audio…' : 'Generating audio…'}</div><div className="dash__thinking"><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/></div></div>}

        {audioItems.filter(a => a.mode === mode).map(item => (
          <div key={item.ts} className="dash__audio-card">
            <div className="dash__audio-card-label">{item.mode === 'speech' ? '🎙️' : '🎵'} {item.label}</div>
            {item.url ? (
              <>
                <audio controls src={item.url} style={{ width: '100%', marginTop: '0.5rem' }} />
                <div className="dash__image-actions">
                  <a href={item.url} download={`audio-${item.ts}.mp3`} className="btn btn-secondary btn-sm">
                    ↓ {isEs ? 'Descargar' : 'Download'}
                  </a>
                </div>
              </>
            ) : item.speechText ? (
              <div className="dash__audio-replay">
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  const synth = window.speechSynthesis;
                  if (!synth) return; synth.cancel();
                  const u = new SpeechSynthesisUtterance(item.speechText);
                  const sv = browserVoices.find(v => v.name === item.voiceName);
                  if (sv) u.voice = sv;
                  const { pitch, rate } = PITCH_MAP[item.pitchType] || PITCH_MAP.normal;
                  u.pitch = pitch; u.rate = rate;
                  synth.speak(u);
                }}>▶ {isEs ? 'Reproducir' : 'Play'}</button>
                <button className="btn btn-primary btn-sm" onClick={() => handleDownloadSpeech(item)}
                  disabled={downloading === item.ts}>
                  {downloading === item.ts ? '⏳' : '⬇️'} {isEs ? 'Descargar MP3' : 'Download MP3'}
                </button>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {item.voiceName?.split(' ').slice(0, 2).join(' ')} · {item.pitchType}
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="dash__media-input-area">
        {mode === 'speech' ? (
          <div className="dash__input-bar">
            <div className="dash__audio-controls">
              {/* Language */}
              <select className="dash__audio-select" value={selectedLang} onChange={e => { setSelectedLang(e.target.value); setSelectedVoiceName(''); }}>
                {SPEECH_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              {/* Gender */}
              <div className="dash__audio-toggle-group">
                {[['all','All'],['female','👩 F'],['male','👨 M']].map(([v,lbl]) => (
                  <button key={v} className={`dash__audio-toggle${gender === v ? ' active' : ''}`} onClick={() => { setGender(v); setSelectedVoiceName(''); }}>{lbl}</button>
                ))}
              </div>
              {/* Pitch */}
              <div className="dash__audio-toggle-group">
                {[['high', isEs ? 'Aguda' : 'High'],['normal', isEs ? 'Normal' : 'Normal'],['low', isEs ? 'Grave' : 'Deep']].map(([v,lbl]) => (
                  <button key={v} className={`dash__audio-toggle${pitchType === v ? ' active' : ''}`} onClick={() => setPitchType(v)}>{lbl}</button>
                ))}
              </div>
              {/* Filtered voice picker */}
              {filteredVoices.length > 1 && (
                <select className="dash__audio-select dash__audio-select--voice" value={selectedVoiceName || filteredVoices[0]?.name || ''} onChange={e => setSelectedVoiceName(e.target.value)}>
                  {filteredVoices.map(v => <option key={v.name} value={v.name}>{v.name.replace('Google ','').replace('Microsoft ','').split('(')[0].trim()}</option>)}
                </select>
              )}
            </div>
            <div className="dash__input-wrap">
              <div className="dash__input-row">
                <textarea className="dash__textarea" value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); handleSpeech(); } }}
                  placeholder={isEs ? 'Escribe el texto para convertir a voz…' : 'Type the text to convert to speech…'}
                  disabled={isLoading || limitReached} rows={2}
                />
                <button className={`dash__send${text.trim() && !isLoading ? ' dash__send--active' : ''}`}
                  onClick={handleSpeech} disabled={!text.trim() || isLoading || limitReached}>
                  {isLoading ? <span className="dash__spinner" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                </button>
              </div>
              <div className="dash__input-footer"><span /><span className="dash__input-hint">Powered by Web Speech API — free, browser-native</span></div>
            </div>
          </div>
        ) : (
          <div className="dash__input-bar">
            <div className="dash__audio-duration-row">
              <label className="dash__audio-voice-label">{isEs ? `Duración: ${duration}s` : `Duration: ${duration}s`}</label>
              <input type="range" min={5} max={30} step={5} value={duration} onChange={e => setDuration(+e.target.value)} className="dash__audio-duration-slider" />
            </div>
            <div className="dash__input-wrap">
              <div className="dash__input-row">
                <textarea className="dash__textarea" value={musicPrompt}
                  onChange={e => setMusicPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleMusic(); } }}
                  placeholder={isEs ? 'Describe la música que quieres generar…' : 'Describe the music you want to generate…'}
                  disabled={!!musicStatus || limitReached} rows={1}
                />
                <button className={`dash__send${musicPrompt.trim() && !musicStatus ? ' dash__send--active' : ''}`}
                  onClick={handleMusic} disabled={!musicPrompt.trim() || !!musicStatus || limitReached}>
                  {musicStatus ? <span className="dash__spinner" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                </button>
              </div>
              <div className="dash__input-footer"><span /><span className="dash__input-hint">Powered by Meta MusicGen via Replicate</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI Agents Area
───────────────────────────────────────────────────────────────── */
const AGENTS_KEY = 'gormaran_agents_v1';
function loadAgents() { try { return JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]'); } catch { return []; } }
function saveAgents(a) { try { localStorage.setItem(AGENTS_KEY, JSON.stringify(a)); } catch {} }

function AgentsArea({ subscription, usageCount, freeLimit }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [agents, setAgents]       = useState(loadAgents);
  const [activeAgent, setActiveAgent] = useState(null);
  const [creating, setCreating]   = useState(false);
  const [form, setForm]           = useState({ name: '', desc: '', prompt: '' });
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const abortRef   = useRef(null);
  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  useEffect(() => { saveAgents(agents); }, [agents]);
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages.length, streamText]);

  const handleCreateAgent = () => {
    if (!form.name.trim()) return;
    const agent = { id: crypto.randomUUID(), name: form.name.trim(), desc: form.desc.trim(), prompt: form.prompt.trim(), model: 'claude', createdAt: Date.now() };
    const next = [agent, ...agents];
    setAgents(next);
    setCreating(false);
    setForm({ name: '', desc: '', prompt: '' });
    setActiveAgent(agent);
    setMessages([]);
  };

  const handleDeleteAgent = (id) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    if (activeAgent?.id === id) { setActiveAgent(null); setMessages([]); }
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || limitReached || !activeAgent) return;
    setInput('');
    setStreamText('');
    setIsLoading(true);
    const userMsg = { role: 'user', content: text, ts: Date.now() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    const controller = new AbortController();
    abortRef.current = controller;
    let acc = '';
    streamChat({
      message: text,
      history: messages.map(m => ({ role: m.role, content: m.content })),
      tab: 'text',
      systemPrompt: activeAgent.prompt || undefined,
      signal: controller.signal,
      onChunk: (c) => { acc += c; setStreamText(acc); },
      onDone: () => {
        setMessages([...nextMsgs, { role: 'assistant', content: acc, ts: Date.now() }]);
        setStreamText(''); setIsLoading(false); abortRef.current = null;
      },
      onError: (err) => {
        setMessages([...nextMsgs, { role: 'assistant', content: `⚠️ ${err}`, ts: Date.now(), error: true }]);
        setStreamText(''); setIsLoading(false); abortRef.current = null;
      },
    });
  }, [input, isLoading, messages, activeAgent, limitReached]);

  return (
    <div className="dash__agents">
      {/* Agent list sidebar */}
      <div className="dash__agents-sidebar">
        <div className="dash__agents-sidebar-hd">
          <span className="dash__agents-title">{isEs ? 'Mis Agentes' : 'My Agents'}</span>
          <button className="dash__agents-new-btn" onClick={() => { setCreating(true); setActiveAgent(null); }}>+</button>
        </div>
        <div className="dash__agents-list">
          {agents.length === 0 && !creating && (
            <div className="dash__agents-empty">{isEs ? 'Sin agentes aún. Crea uno.' : 'No agents yet. Create one.'}</div>
          )}
          {agents.map(a => (
            <div key={a.id} className={`dash__agents-item${activeAgent?.id === a.id ? ' dash__agents-item--active' : ''}`}
              onClick={() => { setActiveAgent(a); setMessages([]); setCreating(false); }}>
              <div className="dash__agents-item-icon">🤖</div>
              <div className="dash__agents-item-body">
                <div className="dash__agents-item-name">{a.name}</div>
                {a.desc && <div className="dash__agents-item-desc">{a.desc}</div>}
              </div>
              <button className="dash__agents-item-del" onClick={e => { e.stopPropagation(); handleDeleteAgent(a.id); }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="dash__agents-main">
        {creating && (
          <div className="dash__agents-form">
            <h3 className="dash__agents-form-title">{isEs ? 'Crear agente' : 'Create agent'}</h3>
            <label className="dash__agents-label">{isEs ? 'Nombre *' : 'Name *'}</label>
            <input className="dash__agents-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={isEs ? 'Mi agente de marketing' : 'My marketing agent'} />
            <label className="dash__agents-label">{isEs ? 'Descripción' : 'Description'}</label>
            <input className="dash__agents-input" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder={isEs ? 'Para qué sirve este agente' : 'What this agent does'} />
            <label className="dash__agents-label">System Prompt</label>
            <textarea className="dash__agents-textarea" rows={6} value={form.prompt}
              onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              placeholder={isEs ? 'Eres un experto en marketing B2B. Responde siempre con datos y ejemplos concretos...' : 'You are a B2B marketing expert. Always respond with data and concrete examples...'}
            />
            <div className="dash__agents-form-actions">
              <button className="dash__agents-cancel-btn" onClick={() => setCreating(false)}>{isEs ? 'Cancelar' : 'Cancel'}</button>
              <button className="dash__agents-create-btn" onClick={handleCreateAgent} disabled={!form.name.trim()}>{isEs ? 'Crear agente' : 'Create agent'}</button>
            </div>
          </div>
        )}

        {!creating && !activeAgent && (
          <div className="dash__agents-placeholder">
            <div className="dash__agents-placeholder-icon">🤖</div>
            <div className="dash__agents-placeholder-title">{isEs ? 'Agentes de IA' : 'AI Agents'}</div>
            <p className="dash__agents-placeholder-sub">
              {isEs ? 'Crea agentes con instrucciones personalizadas, especializados en tareas concretas.' : 'Create agents with custom instructions, specialized for specific tasks.'}
            </p>
            <button className="dash__agents-create-btn" onClick={() => setCreating(true)}>{isEs ? '+ Crear primer agente' : '+ Create first agent'}</button>
          </div>
        )}

        {!creating && activeAgent && (
          <>
            <div className="dash__agents-chat-hd">
              <div className="dash__agents-chat-name">🤖 {activeAgent.name}</div>
              {activeAgent.desc && <div className="dash__agents-chat-desc">{activeAgent.desc}</div>}
            </div>
            <div className="dash__messages" ref={messagesRef} style={{ flex: 1 }}>
              {messages.length === 0 && (
                <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  {isEs ? `Habla con ${activeAgent.name}` : `Start talking to ${activeAgent.name}`}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`dash__message dash__message--${msg.role}`}>
                  <div className="dash__message-avatar" style={msg.role === 'assistant' ? { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' } : {}}>
                    {msg.role === 'assistant' ? '🤖' : '👤'}
                  </div>
                  <div className="dash__message-body">
                    {msg.role === 'assistant' && <div className="dash__message-role">{activeAgent.name}</div>}
                    <div className="dash__message-text"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="dash__message dash__message--assistant">
                  <div className="dash__message-avatar" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>🤖</div>
                  <div className="dash__message-body">
                    <div className="dash__message-role">{activeAgent.name}</div>
                    <div className="dash__message-text">
                      {streamText ? <><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown><span className="dash__cursor" /></> : <ThinkingDots />}
                    </div>
                  </div>
                </div>
              )}
              <div />
            </div>
            <div className="dash__input-bar">
              <div className="dash__input-wrap">
                <div className="dash__input-row">
                  <textarea ref={textareaRef} className="dash__textarea" value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={limitReached ? 'Upgrade to continue' : (isEs ? `Escribe a ${activeAgent.name}…` : `Message ${activeAgent.name}…`)}
                    disabled={limitReached} rows={1}
                  />
                  <button className={`dash__send${input.trim() && !limitReached ? ' dash__send--active' : ''}`}
                    onClick={isLoading ? () => { abortRef.current?.abort(); setIsLoading(false); setStreamText(''); } : handleSend}>
                    {isLoading
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                  </button>
                </div>
                <div className="dash__input-footer"><span /><span className="dash__input-hint">{isEs ? 'Intro para enviar' : 'Enter to send'}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Toolkit — structured form-based AI tools hub
───────────────────────────────────────────────────────────────── */
function ToolkitArea() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');

  return (
    <div className="dash__toolkit">
      <div className="dash__toolkit-header">
        <h2 className="dash__toolkit-title">{isEs ? 'Herramientas IA' : 'AI Toolkit'}</h2>
        <p className="dash__toolkit-sub">
          {isEs
            ? 'Resultados estructurados para tareas concretas. Rellena el formulario, obtén la salida perfecta.'
            : 'Structured output for specific tasks. Fill a form, get professional results instantly.'}
        </p>
      </div>
      <div className="dash__toolkit-grid">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className="dash__toolkit-card"
            onClick={() => navigate(`/category/${cat.id}`)}
          >
            <div className="dash__toolkit-card-icon">{cat.icon}</div>
            <div className="dash__toolkit-card-body">
              <div className="dash__toolkit-card-name">{cat.name}</div>
              <div className="dash__toolkit-card-desc">{cat.description}</div>
            </div>
            <div className="dash__toolkit-card-count">
              {cat.tools?.length || 0} {isEs ? 'herramientas' : 'tools'} →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Templates Area — Pletor-style marketplace
───────────────────────────────────────────────────────────────── */
const TEMPLATE_CATEGORIES = ['All', 'Marketing', 'Content', 'Strategy', 'Design'];

function TemplateThumbnail({ tpl }) {
  const nodes = tpl.nodes || [];
  return (
    <div style={{
      height: 140, background: tpl.thumbnail?.gradient || 'linear-gradient(135deg,#fff7ed,#fed7aa)',
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, overflow: 'hidden',
    }}>
      {/* Mini flow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {nodes.slice(0, 4).map((id, i) => {
          const n = NODE_TYPES[id] || NODE_TYPES.text;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 800, color: n.color,
                border: `1.5px solid ${n.color}30`,
              }}>
                {n.icon}
              </div>
              {i < nodes.slice(0, 4).length - 1 && (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0 3px' }}>→</div>
              )}
            </div>
          );
        })}
      </div>
      {/* Category pill */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
        borderRadius: 6, padding: '3px 8px',
        fontSize: '0.6rem', fontWeight: 700, color: '#475569',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        {tpl.category}
      </div>
    </div>
  );
}

function TemplateCard({ tpl, onOpen }) {
  return (
    <button
      className="mkt-tpl-card"
      onClick={() => onOpen(tpl)}
    >
      <TemplateThumbnail tpl={tpl} />
      <div className="mkt-tpl-body">
        <div className="mkt-tpl-name">{tpl.name}</div>
        <div className="mkt-tpl-desc">{tpl.tagline || tpl.desc}</div>
        <div className="mkt-tpl-footer">
          <div className="mkt-tpl-nodes">
            {(tpl.nodes || []).slice(0, 3).map((id, i) => {
              const n = NODE_TYPES[id] || NODE_TYPES.text;
              return (
                <div key={i} className="mkt-tpl-node-dot" style={{ background: n.bg, color: n.color }}>
                  {n.icon}
                </div>
              );
            })}
            {(tpl.nodes || []).length > 3 && (
              <span className="mkt-tpl-more">+{(tpl.nodes || []).length - 3}</span>
            )}
          </div>
          <span className="mkt-tpl-credits">⚡ {tpl.creditCost} {tpl.creditCost === 1 ? 'credit' : 'credits'}</span>
        </div>
      </div>
    </button>
  );
}

function TemplatesArea({ onSelectTemplate }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [activeCategory, setActiveCategory] = useState('All');
  const [detailTemplate, setDetailTemplate] = useState(null);

  const filtered = activeCategory === 'All'
    ? TEMPLATES_DATA
    : TEMPLATES_DATA.filter(t => t.category === activeCategory);

  const handleUseTemplate = (tpl) => {
    setDetailTemplate(null);
    onSelectTemplate(tpl);
  };

  return (
    <>
      <div className="dash__templates">
        <div className="dash__templates-header">
          <div className="dash__templates-title-row">
            <h2 className="dash__templates-title">
              {isEs ? 'Plantillas' : 'Templates'}
            </h2>
            <span className="dash__new-badge">NEW</span>
          </div>
          <p className="dash__templates-sub">
            {isEs
              ? 'Prompts y flujos probados para tareas concretas. Haz clic para ver los detalles.'
              : 'Proven prompts and workflows for real tasks. Click to see how each one works.'}
          </p>
          <div className="dash__templates-filters">
            {TEMPLATE_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`dash__templates-filter${activeCategory === cat ? ' dash__templates-filter--active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mkt-tpl-grid">
          {filtered.map(tpl => (
            <TemplateCard key={tpl.id} tpl={tpl} onOpen={setDetailTemplate} />
          ))}
        </div>
      </div>

      {detailTemplate && (
        <TemplateDetail
          template={detailTemplate}
          onClose={() => setDetailTemplate(null)}
          onUse={handleUseTemplate}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Coming Soon placeholder (unused — kept for future tabs)
───────────────────────────────────────────────────────────────── */
function ComingSoon({ tab }) {
  const cfg = {
    video:   { icon: '🎬', title: 'Video generation', sub: 'Create cinematic AI videos from a text prompt. Powered by Sora, Runway and Kling.' },
    audio:   { icon: '🎵', title: 'Audio & Music AI', sub: 'Generate music, voiceovers and soundscapes with Suno, ElevenLabs and Udio.' },
    toolkit: { icon: '🛠️', title: 'Tool-kit',         sub: 'Structured AI tools for ads, automation and specialised business tasks.' },
  }[tab] || { icon: '⚡', title: 'Coming soon', sub: '' };

  return (
    <div className="dash__coming-soon">
      <div className="dash__coming-icon">{cfg.icon}</div>
      <div className="dash__coming-title">{cfg.title}</div>
      <p className="dash__coming-sub">{cfg.sub}</p>
      <span className="dash__coming-badge">✦ Coming soon</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Left Sidebar
───────────────────────────────────────────────────────────────── */
function Sidebar({ sessions, activeId, activeTab, onNew, onSelect, onDelete, subscription, usageCount, freeLimit, sessionListRef }) {
  const [navTab, setNavTab] = useState('chats');
  useEffect(() => {
    setNavTab(activeTab === 'text' ? 'chats' : 'history');
  }, [activeTab]);
  const { t } = useTranslation();

  const usagePct = subscription === 'free' ? Math.min(100, Math.round((usageCount / freeLimit) * 100)) : 100;
  const chatSessions = sessions.filter(s => s.tab === 'text');
  const historySessions = sessions.filter(s => s.tab !== 'text');
  const displaySessions = navTab === 'chats' ? chatSessions : historySessions;

  function fmt(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <aside className="dash__sidebar">
      <div className="dash__sidebar-top">
        <button className="dash__new-btn" onClick={onNew}>
          <span>✦</span> New
        </button>
      </div>

      <div className="dash__nav-tabs">
        <button className={`dash__nav-tab${navTab === 'chats' ? ' dash__nav-tab--active' : ''}`} onClick={() => setNavTab('chats')}>Chats</button>
        <button className={`dash__nav-tab${navTab === 'history' ? ' dash__nav-tab--active' : ''}`} onClick={() => setNavTab('history')}>History</button>
      </div>

      <div className="dash__session-list" ref={sessionListRef}>
        {displaySessions.length === 0 ? (
          <div className="dash__session-empty">
            {navTab === 'chats'
              ? 'There\'s a blank page here for now\nSend a message, and a chat will\nappear right away'
              : 'No generation history yet.\nCreate images, videos, audio or AI flows.'}
          </div>
        ) : displaySessions.map(s => (
          <button
            key={s.id}
            className={`dash__session-item${s.id === activeId ? ' dash__session-item--active' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="dash__session-icon">{sessionIcon(s.tab)}</span>
            <div className="dash__session-body">
              <span className="dash__session-title">{s.title}</span>
              <span className="dash__session-meta">{fmt(s.createdAt)}</span>
            </div>
          </button>
        ))}
      </div>

      {subscription === 'free' && (
        <div className="dash__sidebar-footer">
          <div className="dash__usage-row">
            <span>⚡ {Math.max(0, freeLimit - usageCount)} {t('dashboard.creditsLeft', { defaultValue: 'credits left' })}</span>
            <span className="dash__usage-fraction">{usageCount}/{freeLimit}</span>
          </div>
          <div className="dash__usage-track">
            <div className="dash__usage-fill" style={{ width: `${usagePct}%` }} />
          </div>
          <Link to="/pricing" className="dash__upgrade-link">Upgrade for unlimited →</Link>
        </div>
      )}
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { currentUser, refreshUserProfile, userProfile } = useAuth();
  const { subscription, usageCount, FREE_MONTHLY_LIMIT } = useSubscription();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');

  const [activeTab, setActiveTab]             = useState('text');
  const [systemPrompt, setSystemPrompt]       = useState('');
  const [sessions, setSessions]               = useState(loadSessions);
  const [currentId, setCurrentId]             = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [defaultPrompt, setDefaultPrompt]     = useState('');
  const [showTour, setShowTour]               = useState(false);
  const [activeFlowTemplate, setActiveFlowTemplate] = useState(null);
  const sidebarListRef = useRef(null);
  const showOnboarding = userProfile && !userProfile.onboardingCompleted;

  useEffect(() => {
    if (userProfile?.onboardingCompleted && shouldShowTour()) {
      const timer = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, [userProfile?.onboardingCompleted]); // eslint-disable-line

  const paymentStatus = searchParams.get('payment');
  const planChip = { free: 'free', grow: 'grow', scale: 'scale', evolution: 'evolution' }[subscription] || 'free';
  const planLabel = { free: 'Free', grow: '⭐ Grow', scale: '💎 Scale', evolution: '🚀 Evolution' }[subscription] || 'Free';
  const [agentMode, setAgentMode] = useState('builder'); // 'builder' | 'flow'

  useEffect(() => {
    if (paymentStatus === 'success' && currentUser) {
      pushEvent('Suscribe', { value: 0, currency: 'EUR' });
      setTimeout(() => refreshUserProfile(currentUser.uid), 2000);
    }
  }, [paymentStatus, currentUser]); // eslint-disable-line

  // Sync sessions to localStorage
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  const currentSession = useMemo(() => sessions.find(s => s.id === currentId) || null, [sessions, currentId]);

  const handleNew = useCallback(() => {
    const s = makeSession(activeTab, 'claude');
    currentIdRef.current = s.id; // sync before setState so first message goes to correct session
    setSessions(prev => [s, ...prev]);
    setCurrentId(s.id);
    requestAnimationFrame(() => {
      sidebarListRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, [activeTab]);

  const handleSelectSession = useCallback((id) => {
    const s = sessions.find(s => s.id === id);
    if (s) { currentIdRef.current = id; setCurrentId(id); setActiveTab(s.tab); }
  }, [sessions]);

  const handleTabChange = useCallback((tabId) => {
    const latest = sessionsRef.current.filter(s => s.tab === tabId).sort((a,b) => b.createdAt - a.createdAt)[0];
    currentIdRef.current = latest?.id || null;
    setCurrentId(latest?.id || null);
    setActiveTab(tabId);
    setDefaultPrompt('');
  }, []);

  const handleMediaUpdate = useCallback((tab, updates, title) => {
    const id = currentIdRef.current;
    const existing = id ? sessionsRef.current.find(s => s.id === id && s.tab === tab) : null;
    if (existing) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, ...(title ? { title } : {}) } : s));
    } else {
      const s = { ...makeSession(tab, 'claude'), ...updates, ...(title ? { title } : {}) };
      currentIdRef.current = s.id;
      setCurrentId(s.id);
      setSessions(prev => [s, ...prev]);
    }
  }, []);

  const handleTemplateSelect = useCallback((template) => {
    // Templates with nodes → open visual flow builder in Agents tab
    if (template.nodes && template.nodes.length > 0) {
      setActiveFlowTemplate(template);
      handleTabChange('agents');
    } else {
      setDefaultPrompt(template.prompt);
      handleTabChange(template.tab);
    }
  }, [handleTabChange]);

  const updateMessages = useCallback((id, messages) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, messages } : s));
  }, []);

  const updateTitle = useCallback((id, title) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  }, []);

  // Atomic session update — creates session on first call if needed
  const currentIdRef = useRef(null);
  useEffect(() => { currentIdRef.current = currentId; }, [currentId]);

  const sessionsRef = useRef(sessions);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  const handleChatUpdate = useCallback(({ messages, title }) => {
    setSessions(prev => {
      const id = currentIdRef.current;
      if (id) {
        return prev.map(s => s.id === id
          ? { ...s, messages, ...(title ? { title } : {}) }
          : s
        );
      }
      // Create new session atomically — title + messages in one shot
      const s = makeSession(activeTab, 'claude');
      currentIdRef.current = s.id;
      setCurrentId(s.id);
      return [{ ...s, messages, ...(title ? { title } : {}) }, ...prev];
    });
  }, [activeTab]);

  const session = currentSession || { id: null, tab: activeTab, model: 'claude', messages: [], title: 'New chat' };

  const cols = '256px 1fr';

  return (
    <div className="dash">
      {showOnboarding && (
        <OnboardingModal onComplete={() => {
          refreshUserProfile(currentUser.uid);
          setTimeout(() => setShowTour(true), 600);
        }} />
      )}
      {showTour && !showOnboarding && <ProductTour onClose={() => setShowTour(false)} />}

      {/* Banners */}
      {paymentStatus === 'success' && !bannerDismissed && (
        <div className="dash__banner dash__banner--success">
          <span>🎉 Welcome to {planLabel}!</span>
          <button className="dash__banner-x" onClick={() => setBannerDismissed(true)}>✕</button>
        </div>
      )}
      {usageCount >= FREE_MONTHLY_LIMIT && subscription === 'free' && (
        <div className="dash__banner dash__banner--warning">
          <span>🚫 {isEs ? 'Límite mensual alcanzado —' : 'Monthly limit reached —'} <Link to="/pricing" style={{ color: 'inherit', fontWeight: 700 }}>{isEs ? 'actualiza para continuar' : 'upgrade to continue'}</Link></span>
        </div>
      )}

      {/* Tab bar */}
      <div className="dash__tabbar">
        <div className="dash__tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`dash__tab${activeTab === tab.id ? ' dash__tab--active' : ''}${tab.comingSoon ? ' dash__tab--soon' : ''}`}
              onClick={() => !tab.comingSoon && handleTabChange(tab.id)}
            >
              {tab.label}
              {tab.comingSoon && <span className="dash__soon-badge">Soon</span>}
              {tab.isNew && <span className="dash__new-badge dash__new-badge--tab">NEW</span>}
            </button>
          ))}
        </div>
        <div className="dash__tabbar-right">
          <span className={`dash__plan-chip dash__plan-chip--${planChip}`}>{planLabel}</span>
        </div>
      </div>

      {/* Workspace */}
      <div className="dash__workspace" style={{ gridTemplateColumns: cols }}>

        <Sidebar
          sessions={sessions}
          activeId={currentId}
          activeTab={activeTab}
          onNew={handleNew}
          onSelect={handleSelectSession}
          onDelete={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
          subscription={subscription}
          usageCount={usageCount}
          freeLimit={FREE_MONTHLY_LIMIT}
          sessionListRef={sidebarListRef}
        />

        <main className="dash__main">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}
            >
              {activeTab === 'text' && (
                <ChatArea
                  key={session.id || 'new'}
                  session={session}
                  systemPrompt={systemPrompt}
                  onUpdate={handleChatUpdate}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                  subscription={subscription}
                  defaultPrompt={defaultPrompt}
                />
              )}
              {activeTab === 'design' && (
                <DesignArea
                  key={currentId || 'new-design'}
                  subscription={subscription}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                  defaultPrompt={defaultPrompt}
                  session={currentSession}
                  onUpdate={(items, title) => handleMediaUpdate('design', { items }, title)}
                />
              )}
              {activeTab === 'video' && (
                <VideoArea
                  key={currentId || 'new-video'}
                  subscription={subscription}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                  session={currentSession}
                  onUpdate={(videos, title) => handleMediaUpdate('video', { items: videos }, title)}
                />
              )}
              {activeTab === 'audio' && (
                <AudioArea
                  key={currentId || 'new-audio'}
                  subscription={subscription}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                  session={currentSession}
                  onUpdate={(audioItems, title) => handleMediaUpdate('audio', { items: audioItems }, title)}
                />
              )}
              {activeTab === 'agents' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {/* Mode toggle */}
                  <div className="dash__agent-mode-bar">
                    <button className={`dash__agent-mode-btn${agentMode === 'builder' ? ' active' : ''}`} onClick={() => setAgentMode('builder')}>
                      ⚡ App Builder
                    </button>
                    <button className={`dash__agent-mode-btn${agentMode === 'flow' ? ' active' : ''}`} onClick={() => setAgentMode('flow')}>
                      ⬡ Flow Builder
                    </button>
                  </div>
                  {agentMode === 'builder' ? (
                    <AppBuilder
                      key={currentId || 'new-app'}
                      session={currentSession}
                      onUpdate={(data, title) => handleMediaUpdate('agents', data, title)}
                      subscription={subscription}
                      usageCount={usageCount}
                      freeLimit={FREE_MONTHLY_LIMIT}
                    />
                  ) : (
                    <NodeFlowBuilder
                      key={currentId || 'new-flow'}
                      preloadTemplate={activeFlowTemplate}
                      session={currentSession}
                      onUpdate={(data, title) => handleMediaUpdate('agents', data, title)}
                      subscription={subscription}
                      usageCount={usageCount}
                      freeLimit={FREE_MONTHLY_LIMIT}
                    />
                  )}
                </div>
              )}
              {activeTab === 'toolkit' && (
                <ToolkitArea />
              )}
              {activeTab === 'templates' && (
                <TemplatesArea onSelectTemplate={handleTemplateSelect} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
