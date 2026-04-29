import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { streamDemoResponse } from '../utils/api';
import './LandingPage.css';
import WhatsAppPopup from '../components/WhatsAppPopup';
import NichePopup from '../components/NichePopup';

/* ─────────────────────────────────────────────────────────────────
   Animation helpers
───────────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

function AnimatedSection({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI Tool Types Data
───────────────────────────────────────────────────────────────── */
const AI_TOOLS = [
  {
    id: 'text',
    emoji: '✍️',
    titleKey: 'landing.tools.text.title',
    defaultTitle: 'Text AI',
    descKey: 'landing.tools.text.desc',
    defaultDesc: 'Blog posts, emails, social captions, ad copy and press releases — structured and ready to publish.',
    tools: ['Blog Posts & Articles', 'Email Campaigns', 'Social Media Captions', 'Ad Copy (Google / Meta)', 'Press Releases', 'SEO Content'],
    models: ['Claude Sonnet 4', 'GPT-4o', 'Gemini 1.5 Pro'],
  },
  {
    id: 'image',
    emoji: '🎨',
    titleKey: 'landing.tools.image.title',
    defaultTitle: 'Image AI',
    descKey: 'landing.tools.image.desc',
    defaultDesc: 'Generate logos, banners, product shots and creative visuals from a simple text description.',
    tools: ['Logo Design', 'Social Graphics', 'Product Photography', 'Ad Creatives', 'Brand Assets', 'Illustrations'],
    models: ['DALL-E 3', 'Flux 1.1 Pro', 'Midjourney v6', 'Ideogram 2.0'],
  },
  {
    id: 'video',
    emoji: '🎬',
    titleKey: 'landing.tools.video.title',
    defaultTitle: 'Video AI',
    descKey: 'landing.tools.video.desc',
    defaultDesc: 'Create promotional clips, social reels and explainer videos — no editing skills needed.',
    tools: ['Promo Videos', 'Social Reels & Stories', 'Explainer Videos', 'Product Demos', 'Video Ads', 'Talking-Head Videos'],
    models: ['Sora', 'Runway Gen-3', 'Kling 2.0', 'Hailuo MiniMax'],
  },
  {
    id: 'audio',
    emoji: '🎵',
    titleKey: 'landing.tools.audio.title',
    defaultTitle: 'Audio AI',
    descKey: 'landing.tools.audio.desc',
    defaultDesc: 'Generate background music, professional voiceovers and brand jingles in seconds.',
    tools: ['Background Music', 'Professional Voiceovers', 'Podcast Intros', 'Brand Jingles', 'Sound Effects', 'Audiobook Narration'],
    models: ['Suno v4', 'ElevenLabs', 'Udio'],
  },
  {
    id: 'design',
    emoji: '🖌️',
    titleKey: 'landing.tools.design.title',
    defaultTitle: 'Design AI',
    descKey: 'landing.tools.design.desc',
    defaultDesc: 'Full brand identity systems, landing page mockups and marketing templates from your brief.',
    tools: ['Brand Identity Systems', 'Landing Page Mockups', 'Presentation Templates', 'Social Media Templates', 'UI Mockups', 'Print Materials'],
    models: ['Adobe Firefly', 'Leonardo AI', 'Canva AI'],
  },
];

/* ─────────────────────────────────────────────────────────────────
   AI Models Data
───────────────────────────────────────────────────────────────── */
const AI_MODELS = [
  { id: 'claude',      name: 'Claude Sonnet 4', company: 'Anthropic',     type: 'text',   initial: 'C', color: '#e54717' },
  { id: 'gpt4o',       name: 'GPT-4o',          company: 'OpenAI',        type: 'text',   initial: 'G', color: '#10a37f' },
  { id: 'gemini',      name: 'Gemini 1.5 Pro',  company: 'Google',        type: 'text',   initial: 'G', color: '#4285f4' },
  { id: 'dalle3',      name: 'DALL-E 3',         company: 'OpenAI',        type: 'image',  initial: 'D', color: '#10a37f' },
  { id: 'flux',        name: 'Flux 1.1 Pro',     company: 'Black Forest',  type: 'image',  initial: 'F', color: '#7c3aed' },
  { id: 'midjourney',  name: 'Midjourney v6',    company: 'Midjourney',    type: 'image',  initial: 'M', color: '#334155' },
  { id: 'ideogram',    name: 'Ideogram 2.0',     company: 'Ideogram',      type: 'image',  initial: 'I', color: '#0891b2' },
  { id: 'sora',        name: 'Sora',             company: 'OpenAI',        type: 'video',  initial: 'S', color: '#10a37f' },
  { id: 'runway',      name: 'Runway Gen-3',     company: 'Runway',        type: 'video',  initial: 'R', color: '#f59e0b' },
  { id: 'kling',       name: 'Kling 2.0',        company: 'Kuaishou',      type: 'video',  initial: 'K', color: '#ef4444' },
  { id: 'hailuo',      name: 'Hailuo MiniMax',   company: 'MiniMax',       type: 'video',  initial: 'H', color: '#3b82f6' },
  { id: 'suno',        name: 'Suno v4',          company: 'Suno',          type: 'audio',  initial: 'S', color: '#8b5cf6' },
  { id: 'elevenlabs',  name: 'ElevenLabs',       company: 'ElevenLabs',    type: 'audio',  initial: 'E', color: '#f59e0b' },
  { id: 'udio',        name: 'Udio',             company: 'Udio',          type: 'audio',  initial: 'U', color: '#06b6d4' },
  { id: 'firefly',     name: 'Adobe Firefly',    company: 'Adobe',         type: 'design', initial: 'A', color: '#ff4500' },
  { id: 'leonardo',    name: 'Leonardo AI',      company: 'Leonardo',      type: 'design', initial: 'L', color: '#6d28d9' },
];

/* ─────────────────────────────────────────────────────────────────
   FAQ Data
───────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    questionKey: 'landing.faq.q1',
    dQuestion: 'What is Gormaran AI?',
    answerKey: 'landing.faq.a1',
    dAnswer: "Gormaran is an all-in-one AI Growth Hub. Create text, images, video, audio and design assets from a single platform — powered by the world's best AI models.",
  },
  {
    questionKey: 'landing.faq.q2',
    dQuestion: 'Which AI models can I use?',
    answerKey: 'landing.faq.a2',
    dAnswer: 'Claude Sonnet, GPT-4o, Gemini for text; DALL-E 3, Flux, Midjourney for images; Sora, Runway, Kling for video; Suno, ElevenLabs for audio — all from one interface.',
  },
  {
    questionKey: 'landing.faq.q3',
    dQuestion: 'How does model selection work?',
    answerKey: 'landing.faq.a3',
    dAnswer: 'Each creation tool lets you pick the AI model that suits your needs. Switch between models and compare outputs to find what works best for your project.',
  },
  {
    questionKey: 'landing.faq.q4',
    dQuestion: 'Is there a free plan?',
    answerKey: 'landing.faq.a4',
    dAnswer: 'Yes — the free plan gives you access to all AI agents with 10 free generations per month. No credit card required. Upgrade anytime.',
  },
  {
    questionKey: 'landing.faq.q5',
    dQuestion: "What's the difference between the plans?",
    answerKey: 'landing.faq.a5',
    dAnswer: 'Grow unlocks unlimited generations and all tool categories. Scale adds agency, e-commerce and creative tools. Evolution adds advanced strategy, finance and startup AI.',
  },
  {
    questionKey: 'landing.faq.q6',
    dQuestion: 'Can I cancel anytime?',
    answerKey: 'landing.faq.a6',
    dAnswer: 'Yes — no lock-in, no cancellation fees. Your access continues until the end of your billing period.',
  },
  {
    questionKey: 'landing.faq.q7',
    dQuestion: 'Is my content private?',
    answerKey: 'landing.faq.a7',
    dAnswer: 'Absolutely. Everything you create is stored privately in your workspace and never shared with other users or used to train AI models.',
  },
  {
    questionKey: 'landing.faq.q8',
    dQuestion: 'Do I need technical skills?',
    answerKey: 'landing.faq.a8',
    dAnswer: 'Zero. Describe what you want in plain language. Gormaran handles all prompt engineering — just fill a simple form and get professional results in seconds.',
  },
];

/* ─────────────────────────────────────────────────────────────────
   Hero Prompt Box chips
───────────────────────────────────────────────────────────────── */
const HERO_CHIPS = [
  {
    icon: '📋', labelKey: 'landing.promptbox.chip1', dLabel: 'Client Proposal',
    fillKey: 'landing.promptbox.chip1.fill',
    dFill: 'Write a client proposal for a social media management service — €2,500/month retainer',
    route: '/category/agency', categoryId: 'agency', toolId: 'client-proposal',
    exampleInputs: { agency_name: 'Pixel Growth Agency', client_name: 'BlueSky Retail Co.', service: 'Social Media Management + Content Creation', client_goal: 'Increase brand awareness and grow Instagram from 2k to 20k followers', budget: '$2,500/month', duration: '6 months' },
  },
  {
    icon: '🔍', labelKey: 'landing.promptbox.chip2', dLabel: 'B2B Outreach',
    fillKey: 'landing.promptbox.chip2.fill',
    dFill: 'Write a 3-email cold outreach sequence to offer my B2B SaaS to marketing directors',
    route: '/category/marketing', categoryId: 'marketing', toolId: 'seo-keyword-research',
    exampleInputs: { keyword: 'project management software', industry: 'SaaS', content_type: 'Blog Post', audience: 'small business owners and startup founders' },
  },
  {
    icon: '📣', labelKey: 'landing.promptbox.chip3', dLabel: 'Meta Ads',
    fillKey: 'landing.promptbox.chip3.fill',
    dFill: 'Create a Meta Ads campaign for my fashion e-commerce with a €500/month budget',
    route: '/category/digital', categoryId: 'digital', toolId: 'meta-ads',
    exampleInputs: { product: 'AI-powered project management app for remote teams', target_audience: 'Startup founders and team leads, 25-45', offer: 'Free 24-hour trial — no credit card required', objective: 'Lead Generation', budget: '$30-$100/day', funnel_stage: 'Top of Funnel' },
  },
  {
    icon: '✍️', labelKey: 'landing.promptbox.chip4', dLabel: 'SEO Blog Post',
    fillKey: 'landing.promptbox.chip4.fill',
    dFill: 'Write an SEO blog post about the best AI tools for small businesses in 2025',
    route: '/category/content', categoryId: 'content', toolId: 'blog-post',
    exampleInputs: { topic: 'Best AI tools for small businesses in 2025', keyword: 'ai tools small business', audience: 'Freelancers and founders', word_count: '800', tone: 'Informative' },
  },
  {
    icon: '📧', labelKey: 'landing.promptbox.chip5', dLabel: 'Email Sequence',
    fillKey: 'landing.promptbox.chip5.fill',
    dFill: 'Create a 3-email welcome sequence for new subscribers of my project management SaaS',
    route: '/category/marketing', categoryId: 'marketing', toolId: 'email-campaign',
    exampleInputs: { campaign_type: 'Welcome Sequence', product: 'Project management SaaS for remote teams', audience: 'New trial users', goal: 'Convert trial users into paying subscribers', tone: 'Friendly and professional' },
  },
  {
    icon: '🎯', labelKey: 'landing.promptbox.chip7', dLabel: 'SWOT Analysis',
    fillKey: 'landing.promptbox.chip7.fill',
    dFill: 'Do a full SWOT analysis for my EdTech startup targeting B2B clients',
    route: '/category/strategy', categoryId: 'strategy', toolId: 'swot-analysis',
    exampleInputs: { company: 'LearnFlow EdTech', description: 'B2B corporate training platform with AI-personalized learning paths', goal: 'Reach €1M ARR and close 50 enterprise clients in 12 months' },
  },
];

const DEMO_LIMIT = 3;
const DEMO_KEY = 'gormaran_demo_count';

/* ─────────────────────────────────────────────────────────────────
   Hero Prompt Box
───────────────────────────────────────────────────────────────── */
function HeroPromptBox() {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [value, setValue] = useState('');
  const [activeChip, setActiveChip] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [output, setOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [slowServer, setSlowServer] = useState(false);
  const slowTimerRef = useRef(null);
  const [usesLeft, setUsesLeft] = useState(() => {
    const used = parseInt(localStorage.getItem(DEMO_KEY) || '0', 10);
    return Math.max(0, DEMO_LIMIT - used);
  });
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  const handleChip = (chip, idx) => {
    setValue(t(chip.fillKey, { defaultValue: isEs ? (chip.esFill || chip.dFill) : chip.dFill }));
    setActiveChip(idx);
    setOutput('');
    inputRef.current?.focus();
  };

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isStreaming) return;
    if (activeChip !== null) {
      const chip = HERO_CHIPS[activeChip];
      if (chip.toolId && chip.exampleInputs) {
        sessionStorage.setItem('gormaran_rerun', JSON.stringify({ toolId: chip.toolId, inputs: chip.exampleInputs }));
      }
      navigate(chip.route);
      return;
    }
    if (currentUser) { navigate('/dashboard'); return; }
    const used = parseInt(localStorage.getItem(DEMO_KEY) || '0', 10);
    if (used >= DEMO_LIMIT) { navigate('/auth?mode=register'); return; }
    const newUsed = used + 1;
    localStorage.setItem(DEMO_KEY, String(newUsed));
    setUsesLeft(Math.max(0, DEMO_LIMIT - newUsed));
    setOutput('');
    setIsStreaming(true);
    setSlowServer(false);
    slowTimerRef.current = setTimeout(() => setSlowServer(true), 3500);
    const controller = new AbortController();
    abortRef.current = controller;
    streamDemoResponse({
      prompt: value.trim(),
      signal: controller.signal,
      onChunk: (text) => {
        clearTimeout(slowTimerRef.current);
        setSlowServer(false);
        setOutput((prev) => prev + text);
        outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
      },
      onDone: () => { clearTimeout(slowTimerRef.current); setIsStreaming(false); },
      onError: () => { clearTimeout(slowTimerRef.current); setSlowServer(false); setIsStreaming(false); },
    });
  }, [value, isStreaming, currentUser, activeChip, navigate]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };
  const isLimitReached = !currentUser && usesLeft === 0;

  return (
    <motion.div
      className={`hero-promptbox${isFocused ? ' hero-promptbox--focused' : ''}${output ? ' hero-promptbox--has-output' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
    >
      <AnimatePresence>
        {slowServer && !output && (
          <motion.div className="hero-promptbox__slow-msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <span className="hero-promptbox__spinner" />
            <span>{isEs ? 'Conectando servidor AI… un momento' : 'Connecting AI server… one moment'}</span>
          </motion.div>
        )}
        {output && (
          <motion.div ref={outputRef} className="hero-promptbox__output" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
            <p className="hero-promptbox__output-text">{output}</p>
            {!isStreaming && usesLeft === 0 && (
              <Link to="/auth?mode=register" className="hero-promptbox__upgrade-cta">
                {t('landing.promptbox.upgradeCta', { defaultValue: 'Sign up free to unlock all AI agents →' })}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hero-promptbox__input-row">
        <textarea
          ref={inputRef}
          className="hero-promptbox__input"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (!e.target.value.trim()) setActiveChip(null); }}
          onKeyDown={handleKey}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isLimitReached
            ? t('landing.promptbox.limitReached', { defaultValue: 'Sign up free to keep going →' })
            : t('landing.promptbox.placeholder', { defaultValue: 'What do you want to create today?' })}
          disabled={isLimitReached}
          rows={1}
        />
        <button
          className={`hero-promptbox__send${value.trim() && !isLimitReached ? ' hero-promptbox__send--active' : ''}${isLimitReached ? ' hero-promptbox__send--limit' : ''}`}
          onClick={isLimitReached ? () => navigate('/auth?mode=register') : handleSubmit}
          aria-label="Send"
        >
          {isStreaming ? (
            <span className="hero-promptbox__spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div className="hero-promptbox__footer">
        <div className="hero-promptbox__chips">
          {HERO_CHIPS.map((chip, i) => (
            <button
              key={i}
              className={`hero-promptbox__chip${activeChip === i ? ' hero-promptbox__chip--active' : ''}`}
              onClick={() => handleChip(chip, i)}
              disabled={isLimitReached}
            >
              <span>{chip.icon}</span>
              {t(chip.labelKey, { defaultValue: chip.dLabel })}
            </button>
          ))}
          <span className="hero-promptbox__chip-more">
            +{30 - HERO_CHIPS.length} {isEs ? 'más' : 'more'}
          </span>
        </div>
        {!currentUser && (
          <span className={`hero-promptbox__counter${isLimitReached ? ' hero-promptbox__counter--done' : ''}`}>
            {isLimitReached
              ? t('landing.promptbox.limitDone', { defaultValue: '3/3 demos used' })
              : t('landing.promptbox.remaining', { defaultValue: '{{n}} free left', n: usesLeft }).replace('{{n}}', usesLeft)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Rotating Hero Text
───────────────────────────────────────────────────────────────── */
function RotatingText() {
  const { t, i18n } = useTranslation();
  const rotatingPhrases = useMemo(() => [
    t('landing.hero.rotating.0'),
    t('landing.hero.rotating.1'),
    t('landing.hero.rotating.2'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [i18n.language]);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => { setPhraseIndex(0); setDisplayed(''); setIsDeleting(false); }, [rotatingPhrases]);
  useEffect(() => {
    if (isMobile) return;
    const current = rotatingPhrases[phraseIndex];
    if (!isDeleting && displayed === current) {
      const timer = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(timer);
    }
    if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setPhraseIndex((i) => (i + 1) % rotatingPhrases.length);
      return;
    }
    const speed = isDeleting ? 35 : 65;
    const timer = setTimeout(() => {
      setDisplayed(isDeleting ? current.slice(0, displayed.length - 1) : current.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [displayed, isDeleting, phraseIndex, isMobile, rotatingPhrases]);

  if (isMobile) return <span className="landing__hero-rotating">{rotatingPhrases[0]}</span>;
  return <span className="landing__hero-rotating">{displayed}<span className="landing__hero-cursor" /></span>;
}

/* ─────────────────────────────────────────────────────────────────
   Stats
───────────────────────────────────────────────────────────────── */
const STATS = [
  { value: '16', unit: '+', labelKey: 'landing.stats.models',  defaultLabel: 'AI models available' },
  { value: '5',  unit: '',  labelKey: 'landing.stats.types',   defaultLabel: 'content types' },
  { value: '30', unit: '+', labelKey: 'landing.stats.tools',   defaultLabel: 'AI tools' },
  { value: '2',  unit: 'min', labelKey: 'landing.stats.pertool', defaultLabel: 'avg. per tool' },
];

/* ─────────────────────────────────────────────────────────────────
   How It Works data & mockups
───────────────────────────────────────────────────────────────── */
const HOW_STEPS = [
  { num: '01', titleKey: 'landing.how.step1.title', descKey: 'landing.how.step1.desc', defaultTitle: 'Choose Your Agent', defaultDesc: 'Pick from text, image, video, audio or design AI — then select the specific tool and AI model.' },
  { num: '02', titleKey: 'landing.how.step2.title', descKey: 'landing.how.step2.desc', defaultTitle: 'Describe Your Goal', defaultDesc: 'Fill in a few simple fields. No complex prompts, no technical knowledge needed.' },
  { num: '03', titleKey: 'landing.how.step3.title', descKey: 'landing.how.step3.desc', defaultTitle: 'Get AI Results', defaultDesc: 'Professional, ready-to-use content delivered in seconds. Copy, paste, done.' },
  { num: '04', titleKey: 'landing.how.step4.title', descKey: 'landing.how.step4.desc', defaultTitle: 'Publish & Grow', defaultDesc: 'Edit, refine or copy your output directly. You stay in control — AI handles the heavy lifting.' },
];

const TOOL_TILES = [
  { emoji: '✍️', labelEs: 'Texto',   labelEn: 'Text' },
  { emoji: '🎨', labelEs: 'Imagen',  labelEn: 'Image', active: true },
  { emoji: '🎬', labelEs: 'Vídeo',   labelEn: 'Video' },
  { emoji: '🎵', labelEs: 'Audio',   labelEn: 'Audio' },
  { emoji: '🖌️', labelEs: 'Diseño', labelEn: 'Design' },
  { emoji: '🤖', labelEs: 'Agente', labelEn: 'Agent' },
];
const OUTPUT_LINES_WIDTHS = [72, 90, 65, 85, 55, 78, 60];

function HiwMockup({ step, active, isEs }) {
  if (step === 0) return (
    <div className="hiw-mock hiw-mock--tiles">
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__chrome-label">Gormaran AI</div>
      </div>
      <div className="hiw-mock__tile-grid">
        {TOOL_TILES.map((tile) => (
          <div key={tile.emoji} className={`hiw-mock__tile${tile.active ? ' hiw-mock__tile--active' : ''}`}>
            <span className="hiw-mock__tile-emoji">{tile.emoji}</span>
            <span className="hiw-mock__tile-label">{isEs ? tile.labelEs : tile.labelEn}</span>
            <div className="hiw-mock__tile-bar" />
            <div className="hiw-mock__tile-bar hiw-mock__tile-bar--sm" />
          </div>
        ))}
      </div>
    </div>
  );
  if (step === 1) return (
    <div className="hiw-mock hiw-mock--form">
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__chrome-label">✍️ {isEs ? 'Escritor de Blog' : 'Blog Post Writer'}</div>
      </div>
      <div className="hiw-mock__form-fields">
        {(isEs ? ['Tema', 'Keyword SEO', 'Audiencia'] : ['Topic', 'SEO Keyword', 'Audience']).map((label, i) => (
          <div key={i} className="hiw-mock__field">
            <div className="hiw-mock__field-label">{label}</div>
            <div className="hiw-mock__field-input">
              <motion.div
                className="hiw-mock__field-fill"
                initial={{ width: 0 }}
                animate={active ? { width: ['40%', '75%', '88%'][i] } : { width: 0 }}
                transition={{ duration: 0.7, delay: i * 0.25, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
        <motion.div className="hiw-mock__gen-btn" initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.9 }}>
          {isEs ? '⚡ Generar con IA' : '⚡ Generate with AI'}
        </motion.div>
      </div>
    </div>
  );
  if (step === 2) return (
    <div className="hiw-mock hiw-mock--output">
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__output-badge">✨ {isEs ? 'Resultado IA' : 'AI Output'}</div>
        <div className="hiw-mock__word-count">~680 {isEs ? 'palabras' : 'words'}</div>
      </div>
      <div className="hiw-mock__lines">
        {OUTPUT_LINES_WIDTHS.map((w, i) => (
          <motion.div
            key={i}
            className={`hiw-mock__line${i === 0 ? ' hiw-mock__line--title' : ''}`}
            style={{ width: `${w}%` }}
            initial={{ scaleX: 0 }}
            animate={active ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  );
  if (step === 3) return (
    <div className="hiw-mock hiw-mock--review">
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__review-done">✓ {isEs ? 'Listo · 680 palabras' : 'Done · 680 words'}</div>
      </div>
      <div className="hiw-mock__lines hiw-mock__lines--done">
        {[80, 65, 90, 55].map((w, i) => <div key={i} className="hiw-mock__line" style={{ width: `${w}%` }} />)}
      </div>
      <div className="hiw-mock__actions">
        <div className="hiw-mock__action-btn hiw-mock__action-btn--primary">{isEs ? 'Copiar ✓' : 'Copy ✓'}</div>
        <div className="hiw-mock__action-btn">{isEs ? 'Descargar' : 'Download'}</div>
        <div className="hiw-mock__action-btn">{isEs ? 'Editar' : 'Edit'}</div>
      </div>
    </div>
  );
  return null;
}

function HowItWorksGrid() {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive((prev) => (prev + 1) % HOW_STEPS.length), 3800);
  }, []);
  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, [startTimer]);

  return (
    <div className="hiw-grid">
      {HOW_STEPS.map((step, i) => (
        <motion.button
          key={i}
          className={`hiw-card${active === i ? ' hiw-card--active' : ''}`}
          onClick={() => { setActive(i); startTimer(); }}
          whileHover={{ scale: 1.015 }}
          transition={{ duration: 0.2 }}
        >
          <div className="hiw-card__visual">
            <HiwMockup step={i} active={active === i} isEs={isEs} />
          </div>
          <div className="hiw-card__footer">
            <span className="hiw-card__num">{step.num}</span>
            <div className="hiw-card__text">
              <div className="hiw-card__title">{t(step.titleKey, { defaultValue: step.defaultTitle })}</div>
              <div className="hiw-card__desc">{t(step.descKey, { defaultValue: step.defaultDesc })}</div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Tools Section
───────────────────────────────────────────────────────────────── */
function ToolsSection() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="landing__tools section">
      <div className="container">
        <AnimatedSection>
          <span className="sx-pill">{t('landing.tools.pill', { defaultValue: 'AI Agents' })}</span>
          <h2 className="sx-section-title">
            {t('landing.tools.titlePre', { defaultValue: 'One platform.' })}{' '}
            <span className="sx-accent-text">{t('landing.tools.titleHighlight', { defaultValue: 'Every AI tool.' })}</span>
          </h2>
          <p className="sx-section-subtitle">
            {t('landing.tools.subtitle', { defaultValue: "Text, image, video, audio and design — powered by the world's best AI models." })}
          </p>
        </AnimatedSection>

        <div className="sx-tools-tabs">
          {AI_TOOLS.map((tool, i) => (
            <button
              key={tool.id}
              className={`sx-tools-tab${activeTab === i ? ' sx-tools-tab--active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              <span className="sx-tools-tab-emoji">{tool.emoji}</span>
              {t(tool.titleKey, { defaultValue: tool.defaultTitle })}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {AI_TOOLS.map((tool, i) => activeTab === i && (
            <motion.div
              key={tool.id}
              className="sx-tools-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="sx-tools-card-left">
                <div className="sx-tools-card-icon">{tool.emoji}</div>
                <h3 className="sx-tools-card-title">
                  {t(tool.titleKey, { defaultValue: tool.defaultTitle })}
                </h3>
                <p className="sx-tools-card-desc">
                  {t(tool.descKey, { defaultValue: tool.defaultDesc })}
                </p>
                <ul className="sx-tools-card-list">
                  {tool.tools.map((name) => (
                    <li key={name} className="sx-tools-card-item">
                      <span className="sx-tools-card-check">✓</span>
                      {name}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?mode=register" className="sx-btn-primary">
                  {t('landing.tools.cta', { defaultValue: 'Start creating →' })}
                </Link>
              </div>

              <div className="sx-tools-card-right">
                <div className="sx-tools-card-preview">
                  <div className="sx-tools-card-preview-header">
                    <div className="sx-dots"><span /><span /><span /></div>
                    <span className="sx-tools-card-preview-label">
                      {tool.emoji} {t(tool.titleKey, { defaultValue: tool.defaultTitle })}
                    </span>
                  </div>
                  <div className="sx-tools-models">
                    <div className="sx-tools-models-label">AI Models</div>
                    <div className="sx-tools-models-list">
                      {tool.models.map((m) => (
                        <span key={m} className="sx-model-chip">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="sx-tools-output-preview">
                    {[90, 75, 95, 65, 82, 58].map((w, idx) => (
                      <motion.div
                        key={`${tool.id}-${idx}`}
                        className={`sx-output-line${idx === 0 ? ' sx-output-line--heading' : ''}`}
                        style={{ width: `${w}%` }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.06 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI Models Section
───────────────────────────────────────────────────────────────── */
const MODEL_FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'text',   label: '✍️ Text' },
  { id: 'image',  label: '🎨 Image' },
  { id: 'video',  label: '🎬 Video' },
  { id: 'audio',  label: '🎵 Audio' },
  { id: 'design', label: '🖌️ Design' },
];

function AIModelsSection() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
  const visible = activeFilter === 'all' ? AI_MODELS : AI_MODELS.filter((m) => m.type === activeFilter);

  return (
    <section className="landing__models section">
      <div className="container">
        <AnimatedSection>
          <span className="sx-pill">{t('landing.models.pill', { defaultValue: 'AI Models' })}</span>
          <h2 className="sx-section-title">
            {t('landing.models.title', { defaultValue: 'Choose your AI.' })}{' '}
            <span className="sx-accent-text">{t('landing.models.titleHighlight', { defaultValue: 'Any category.' })}</span>
          </h2>
          <p className="sx-section-subtitle">
            {t('landing.models.subtitle', { defaultValue: 'Access 16+ leading AI models for every content type — all in one platform.' })}
          </p>
        </AnimatedSection>

        <div className="sx-models-filters">
          {MODEL_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`sx-models-filter${activeFilter === f.id ? ' sx-models-filter--active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <motion.div className="sx-models-grid" layout>
          <AnimatePresence>
            {visible.map((model) => (
              <motion.div
                key={model.id}
                className="sx-model-card"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="sx-model-avatar"
                  style={{ background: `${model.color}22`, border: `1px solid ${model.color}44`, color: model.color }}
                >
                  {model.initial}
                </div>
                <div className="sx-model-info">
                  <div className="sx-model-name">{model.name}</div>
                  <div className="sx-model-company">{model.company}</div>
                </div>
                <span className={`sx-model-type sx-model-type--${model.type}`}>{model.type}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FAQ Section
───────────────────────────────────────────────────────────────── */
function FAQSection() {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="landing__faq section">
      <div className="container container-sm">
        <AnimatedSection>
          <span className="sx-pill">{t('landing.faq.pill', { defaultValue: 'FAQ' })}</span>
          <h2 className="sx-section-title">
            {t('landing.faq.title', { defaultValue: 'Frequently asked' })}{' '}
            <span className="sx-accent-text">{t('landing.faq.titleHighlight', { defaultValue: 'questions' })}</span>
          </h2>
        </AnimatedSection>

        <div className="sx-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`sx-faq-item${openIdx === i ? ' sx-faq-item--open' : ''}`}>
              <button className="sx-faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                {t(item.questionKey, { defaultValue: item.dQuestion })}
                <span className="sx-faq-chevron">{openIdx === i ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div
                    className="sx-faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p>{t(item.answerKey, { defaultValue: item.dAnswer })}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main Landing Page
───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'https://gormaran-growth-hub-2.onrender.com'}/health`).catch(() => {});
  }, []);

  return (
    <div className="landing">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="landing__hero">
        <div className="landing__hero-bg" aria-hidden="true">
          <div className="landing__orb landing__orb-1" />
          <div className="landing__orb landing__orb-2" />
          <div className="landing__orb landing__orb-3" />
          <div className="landing__grid-pattern" />
        </div>

        <div className="container">
          <motion.div className="landing__hero-content" initial="hidden" animate="visible" variants={stagger}>

            <motion.div variants={fadeUp} transition={{ duration: 0.3 }}>
              <span className="sx-hero-badge">
                {t('landing.hero.badge', { defaultValue: '⚡ AI-Powered Platform' })}
              </span>
            </motion.div>

            <motion.h1 className="sx-hero-title" variants={fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
              <RotatingText />
              <span className="sx-accent-text">{t('landing.hero.title2')}</span>
            </motion.h1>

            <motion.p className="sx-hero-subtitle" variants={fadeUp} transition={{ duration: 0.35, delay: 0.1 }}>
              {t('landing.hero.subtitleLine1', { defaultValue: 'Text · Image · Video · Audio · Design' })}
              <br />
              {t('landing.hero.subtitleLine2', { defaultValue: 'All AI models. One platform.' })}
            </motion.p>

            <HeroPromptBox />

            <motion.div className="sx-hero-actions" variants={fadeUp} transition={{ duration: 0.35, delay: 0.15 }}>
              <Link to="/auth?mode=register" className="sx-btn-primary sx-btn-lg">
                {t('landing.hero.cta')}
                <span>→</span>
              </Link>
              <button
                className="sx-btn-secondary sx-btn-lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('landing.hero.getDemo', { defaultValue: 'How it works ↓' })}
              </button>
            </motion.div>

            <motion.div className="sx-hero-trust" variants={fadeUp} transition={{ duration: 0.35, delay: 0.2 }}>
              {[
                t('landing.hero.trust1', { defaultValue: 'No credit card required' }),
                t('landing.hero.trust2', { defaultValue: '24-hour free trial' }),
                t('landing.hero.trust3', { defaultValue: 'Cancel anytime' }),
              ].map((item, i) => (
                <span key={i} className="sx-trust-item">
                  <span className="sx-trust-check">✓</span>{item}
                  {i < 2 && <span className="landing__trust-divider" style={{ margin: '0 0.25rem', opacity: 0.3 }}>·</span>}
                </span>
              ))}
            </motion.div>

            <motion.div className="landing__hero-social-proof" variants={fadeUp} transition={{ duration: 0.35, delay: 0.25 }}>
              <div className="landing__avatars">
                {['A','B','C','D','E'].map((l) => <div key={l} className="landing__avatar">{l}</div>)}
              </div>
              <span>
                {t('landing.hero.joinPre', { defaultValue: 'Join' })}{' '}
                <strong>{t('landing.hero.joinCount', { defaultValue: '331+' })}</strong>{' '}
                {t('landing.hero.socialProof', { defaultValue: 'marketers & founders' })}
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Tool type pills */}
        <div className="sx-hero-tool-pills">
          {AI_TOOLS.map((tool) => (
            <Link key={tool.id} to="/auth?mode=register" className="sx-tool-pill">
              <span>{tool.emoji}</span>
              {t(tool.titleKey, { defaultValue: tool.defaultTitle })}
            </Link>
          ))}
        </div>
      </section>

      {/* ── AI TOOLS SECTION ────────────────────────────────────── */}
      <ToolsSection />

      {/* ── AI MODELS ───────────────────────────────────────────── */}
      <AIModelsSection />

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="landing__how section">
        <div className="container">
          <AnimatedSection>
            <span className="sx-pill">{t('landing.how.pill', { defaultValue: 'How It Works' })}</span>
            <h2 className="sx-section-title">{t('landing.how.title')}</h2>
          </AnimatedSection>
          <HowItWorksGrid />
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section className="landing__stats">
        <div className="container">
          <motion.div
            className="sx-stats-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {STATS.map((stat) => (
              <motion.div key={stat.labelKey} className="sx-stat-item" variants={fadeUp}>
                <div className="sx-stat-value">
                  {stat.value}<span className="sx-accent-text">{stat.unit}</span>
                </div>
                <div className="sx-stat-label">{t(stat.labelKey, { defaultValue: stat.defaultLabel })}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section className="landing__plans section">
        <div className="container">
          <AnimatedSection>
            <span className="sx-pill">{t('landing.plans.pill', { defaultValue: isEs ? 'Precios' : 'Pricing' })}</span>
            <h2 className="sx-section-title">
              {t('landing.plans.title2', { defaultValue: isEs ? 'Empieza gratis. Escala sin límites.' : 'Start free. Scale without limits.' })}
            </h2>
          </AnimatedSection>
          <motion.div
            className="sx-plans-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {/* FREE */}
            <motion.div className="sx-plan" variants={fadeUp}>
              <h3 className="sx-plan-name">Free</h3>
              <div className="sx-plan-price">€0 <span>/{isEs ? 'mes' : 'mo'}</span></div>
              <ul className="sx-plan-features">
                <li>✓ 10 {isEs ? 'generaciones/mes' : 'generations/month'}</li>
                <li>✓ {isEs ? 'Todos los agentes IA (texto, imagen, vídeo…)' : 'All AI agents (text, image, video…)'}</li>
                <li>✓ 1 workspace</li>
                <li className="sx-plan-locked">✗ {isEs ? 'Generaciones ilimitadas' : 'Unlimited generations'}</li>
              </ul>
              <Link to="/auth?mode=register" className="sx-btn-secondary sx-plan-cta">
                {isEs ? 'Empezar gratis' : 'Start free'}
              </Link>
            </motion.div>

            {/* GROW */}
            <motion.div className="sx-plan sx-plan--featured" variants={fadeUp}>
              <div className="sx-plan-badge">⭐ {isEs ? 'Más Popular' : 'Most Popular'}</div>
              <h3 className="sx-plan-name">Grow</h3>
              <div className="sx-plan-price">€15 <span>/{isEs ? 'mes (anual)' : 'mo (annual)'}</span></div>
              <p className="sx-plan-alt">{isEs ? 'o €19/mes mensual' : 'or €19/mo monthly'}</p>
              <ul className="sx-plan-features">
                <li>✓ <strong>{isEs ? 'Generaciones ilimitadas' : 'Unlimited generations'}</strong></li>
                <li>✓ {isEs ? 'Todos los agentes IA + modelos' : 'All AI agents & models'}</li>
                <li>✓ {isEs ? '3 workspaces con perfil de marca' : '3 workspaces + brand profile'}</li>
                <li>✓ {isEs ? 'Templates optimizados por nicho' : 'Niche-optimized templates'}</li>
                <li>✓ {isEs ? 'Soporte prioritario' : 'Priority support'}</li>
              </ul>
              <Link to="/pricing" className="sx-btn-primary sx-plan-cta">
                {isEs ? 'Ver Plan Grow →' : 'See Grow Plan →'}
              </Link>
              <p className="sx-plan-guarantee">
                🔒 {isEs ? 'Garantía 7 días · Sin permanencia' : '7-day guarantee · No lock-in'}
              </p>
            </motion.div>

            {/* SCALE */}
            <motion.div className="sx-plan" variants={fadeUp}>
              <h3 className="sx-plan-name">Scale</h3>
              <div className="sx-plan-price">€39 <span>/{isEs ? 'mes (anual)' : 'mo (annual)'}</span></div>
              <p className="sx-plan-alt">{isEs ? 'o €49/mes mensual' : 'or €49/mo monthly'}</p>
              <ul className="sx-plan-features">
                <li>✓ {isEs ? 'Todo en Grow' : 'Everything in Grow'}</li>
                <li>✓ {isEs ? 'Herramientas de agencia' : 'Agency tools'}</li>
                <li>✓ {isEs ? 'E-commerce & Creative AI' : 'E-commerce & Creative AI'}</li>
                <li>✓ {isEs ? 'Gestión de equipo' : 'Team management'}</li>
                <li>✓ {isEs ? 'Soporte dedicado' : 'Dedicated support'}</li>
              </ul>
              <Link to="/pricing" className="sx-btn-secondary sx-plan-cta">
                {isEs ? 'Ver Scale →' : 'See Scale →'}
              </Link>
            </motion.div>
          </motion.div>

          <div className="sx-plans-footer">
            <Link to="/pricing" className="sx-btn-ghost">
              {isEs ? 'Ver todos los planes (Evolution, Add-ons) →' : 'See all plans (Evolution, Add-ons) →'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section className="landing__cta-full section">
        <div className="container">
          <AnimatedSection>
            <div className="sx-cta-card">
              <div className="sx-cta-orbs" aria-hidden="true">
                <div className="sx-cta-orb sx-cta-orb--1" />
                <div className="sx-cta-orb sx-cta-orb--2" />
              </div>
              <span className="sx-hero-badge" style={{ position: 'relative', zIndex: 1 }}>
                {t('landing.cta.badge', { defaultValue: 'Get Started Today' })}
              </span>
              <h2 className="sx-cta-title">
                {t('landing.cta.title', { defaultValue: 'Stop wasting time on manual work.' })}
                <br />
                <span className="sx-accent-text">
                  {t('landing.cta.titleHighlight', { defaultValue: 'Let AI handle it.' })}
                </span>
              </h2>
              <p className="sx-cta-subtitle">
                {t('landing.cta.subtitle', { defaultValue: 'Text, images, video, audio, design — all AI models in one platform.' })}
              </p>
              <div className="sx-cta-actions">
                <Link to="/auth?mode=register" className="sx-btn-primary sx-btn-lg" style={{ position: 'relative', zIndex: 1 }}>
                  {t('landing.cta.startFree', { defaultValue: 'Start Free Now →' })}
                </Link>
                <button
                  className="sx-btn-secondary sx-btn-lg"
                  style={{ position: 'relative', zIndex: 1 }}
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('landing.hero.getDemo', { defaultValue: 'How it works ↓' })}
                </button>
              </div>
              <div className="sx-hero-trust" style={{ position: 'relative', zIndex: 1 }}>
                {[
                  t('landing.hero.trust1', { defaultValue: 'No credit card required' }),
                  t('landing.hero.trust2', { defaultValue: '24-hour free trial' }),
                  t('landing.hero.trust3', { defaultValue: 'Cancel anytime' }),
                ].map((item, i) => (
                  <span key={i} className="sx-trust-item">
                    <span className="sx-trust-check">✓</span>{item}
                    {i < 2 && <span style={{ margin: '0 0.25rem', opacity: 0.3 }}>·</span>}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <WhatsAppPopup />
      {!currentUser && <NichePopup />}
    </div>
  );
}
