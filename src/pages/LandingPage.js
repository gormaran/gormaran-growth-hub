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
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

function AnimatedSection({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <motion.div
      ref={ref} className={className}
      initial="hidden" animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
    >{children}</motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Tool categories — mirrors the dashboard exactly
───────────────────────────────────────────────────────────────── */
const TOOL_CATEGORIES = [
  {
    id: 'marketing',
    emoji: '📈',
    name: 'Marketing & Growth',
    plan: 'free',
    color: '#7c3aed',
    tools: ['Keyword Research', 'Headline Generator', 'Social Captions', 'Email Campaign', 'Press Release'],
    count: 6,
  },
  {
    id: 'content',
    emoji: '✍️',
    name: 'Content Creation',
    plan: 'free',
    color: '#6366f1',
    tools: ['Blog Post Writer', 'Video Script', 'Newsletter', 'Logo Generator'],
    count: 5,
  },
  {
    id: 'strategy',
    emoji: '🎯',
    name: 'Business Strategy',
    plan: 'grow',
    color: '#0891b2',
    tools: ['Business Plan', 'Market Analysis', 'Competitor Research', 'SWOT Analysis'],
    count: 6,
  },
  {
    id: 'digital',
    emoji: '🛠️',
    name: 'Digital Marketing',
    plan: 'grow',
    color: '#059669',
    tools: ['Google Ads Creator', 'Meta Ads', 'Landing Page Copy'],
    count: 3,
  },
  {
    id: 'ecommerce',
    emoji: '🛒',
    name: 'E-commerce Growth',
    plan: 'scale',
    color: '#d97706',
    tools: ['Amazon Listing', 'Product Description', 'CRO Optimizer'],
    count: 3,
  },
  {
    id: 'agency',
    emoji: '🏢',
    name: 'Agency Tools',
    plan: 'scale',
    color: '#7c3aed',
    tools: ['Client Proposal', 'Client Report', 'Case Study'],
    count: 3,
  },
  {
    id: 'creative',
    emoji: '🎨',
    name: 'Creative Studio',
    plan: 'scale',
    color: '#be185d',
    tools: ['Brand Identity Guide', 'AI Image Studio', 'Video Production Plan', 'Kling Video Prompts'],
    count: 5,
  },
  {
    id: 'startup',
    emoji: '🚀',
    name: 'Startup Launchpad',
    plan: 'evolution',
    color: '#ea580c',
    tools: ['Investor Pitch Deck', 'Go-to-Market Strategy', 'User Story Generator'],
    count: 3,
  },
  {
    id: 'finance',
    emoji: '💰',
    name: 'Finance & Investment',
    plan: 'evolution',
    color: '#16a34a',
    tools: ['Financial Forecast', 'Investment Analysis', 'Cash Flow Optimiser'],
    count: 3,
  },
  {
    id: 'automation',
    emoji: '⚡',
    name: 'n8n Automation',
    plan: 'addon',
    color: '#0891b2',
    tools: ['n8n Workflow Designer'],
    count: 1,
    isAddon: true,
  },
];

const PLAN_LABELS = { free: 'Free', grow: 'Grow', scale: 'Scale', evolution: 'Evolution', addon: 'Add-on' };

/* ─────────────────────────────────────────────────────────────────
   AI models powering the platform
───────────────────────────────────────────────────────────────── */
const AI_MODELS = [
  { name: 'Claude Sonnet 4',  dot: '#e54717', by: 'Anthropic' },
  { name: 'GPT-4o',           dot: '#10a37f', by: 'OpenAI' },
  { name: 'Gemini 1.5 Pro',   dot: '#4285f4', by: 'Google' },
  { name: 'DALL·E 3',         dot: '#10a37f', by: 'OpenAI' },
  { name: 'Flux 1.1 Pro',     dot: '#7c3aed', by: 'Black Forest' },
  { name: 'Kling 3.0',        dot: '#ef4444', by: 'Kuaishou' },
];

/* ─────────────────────────────────────────────────────────────────
   Hero prompt box chips — real dashboard tools
───────────────────────────────────────────────────────────────── */
const HERO_CHIPS = [
  {
    icon: '📊',
    labelKey: 'landing.promptbox.chip.mktg', dLabel: 'Market Analysis',
    fillKey: 'landing.promptbox.chip.mktg.fill',
    dFill: 'Analyse the market opportunity for an AI writing tool targeting mid-size marketing teams in Europe',
    route: '/category/strategy', categoryId: 'strategy', toolId: 'market-analysis',
    exampleInputs: { market: 'AI writing tools', geography: 'Europe', customer_segment: 'Mid-size marketing teams' },
  },
  {
    icon: '🏗️',
    labelKey: 'landing.promptbox.chip.biz', dLabel: 'Business Plan',
    fillKey: 'landing.promptbox.chip.biz.fill',
    dFill: 'Write a business plan for a B2B SaaS project management tool targeting remote-first startups',
    route: '/category/strategy', categoryId: 'strategy', toolId: 'business-plan',
    exampleInputs: { business_name: 'FlowDesk', industry: 'B2B SaaS', product: 'Project management for remote-first startups', stage: 'Early Stage (< $100k ARR)' },
  },
  {
    icon: '✍️',
    labelKey: 'landing.promptbox.chip4', dLabel: 'Blog Post',
    fillKey: 'landing.promptbox.chip4.fill',
    dFill: 'Write an SEO blog post about the best AI tools for small businesses in 2025',
    route: '/category/content', categoryId: 'content', toolId: 'blog-post',
    exampleInputs: { topic: 'Best AI tools for small businesses in 2025', keyword: 'ai tools small business', audience: 'Founders and operators', word_count: '800', tone: 'Informative' },
  },
  {
    icon: '💰',
    labelKey: 'landing.promptbox.chip.fin', dLabel: 'Financial Forecast',
    fillKey: 'landing.promptbox.chip.fin.fill',
    dFill: 'Build a 12-month financial forecast for a SaaS product with a freemium model — 500 signups/month, 4% paid conversion',
    route: '/category/finance', categoryId: 'finance', toolId: 'financial-forecast',
    exampleInputs: { business: 'SaaS product', model: 'Freemium', monthly_signups: '500', conversion: '4%', avg_revenue: '$29/month' },
  },
  {
    icon: '🚀',
    labelKey: 'landing.promptbox.chip.pitch', dLabel: 'Investor Pitch',
    fillKey: 'landing.promptbox.chip.pitch.fill',
    dFill: 'Create an investor pitch deck for a climate tech startup raising a $2M pre-seed round',
    route: '/category/startup', categoryId: 'startup', toolId: 'investor-pitch',
    exampleInputs: { company: 'GreenSync', description: 'AI-powered energy optimisation for SMBs', round: 'Pre-seed $2M', traction: '12 pilots, €40k ARR' },
  },
  {
    icon: '🎨',
    labelKey: 'landing.promptbox.chip.brand', dLabel: 'Brand Identity',
    fillKey: 'landing.promptbox.chip.brand.fill',
    dFill: 'Create a brand identity guide for a premium D2C wellness supplement brand targeting health-conscious millennials',
    route: '/category/creative', categoryId: 'creative', toolId: 'brand-identity',
    exampleInputs: { brand_name: 'Aura Wellness', industry: 'D2C wellness supplements', target: 'Health-conscious millennials, 25–38', tone: 'Premium, clean, science-backed' },
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
    setValue(t(chip.fillKey, { defaultValue: chip.dFill }));
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
    setOutput(''); setIsStreaming(true); setSlowServer(false);
    slowTimerRef.current = setTimeout(() => setSlowServer(true), 3500);
    const controller = new AbortController();
    abortRef.current = controller;
    streamDemoResponse({
      prompt: value.trim(),
      signal: controller.signal,
      onChunk: (text) => {
        clearTimeout(slowTimerRef.current); setSlowServer(false);
        setOutput((prev) => prev + text);
        outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
      },
      onDone: () => { clearTimeout(slowTimerRef.current); setIsStreaming(false); },
      onError: () => { clearTimeout(slowTimerRef.current); setSlowServer(false); setIsStreaming(false); },
    });
  }, [value, isStreaming, currentUser, activeChip, navigate]);

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };
  const isLimitReached = !currentUser && usesLeft === 0;

  return (
    <motion.div
      className={`hero-promptbox${isFocused ? ' hero-promptbox--focused' : ''}${output ? ' hero-promptbox--has-output' : ''}`}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
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
                {t('landing.promptbox.upgradeCta', { defaultValue: 'Create a free account to access all 30 agents →' })}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hero-promptbox__input-row">
        <textarea
          ref={inputRef} className="hero-promptbox__input"
          value={value} onChange={(e) => { setValue(e.target.value); if (!e.target.value.trim()) setActiveChip(null); }}
          onKeyDown={handleKey} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          placeholder={isLimitReached
            ? t('landing.promptbox.limitReached', { defaultValue: 'Sign up free to keep going →' })
            : t('landing.promptbox.placeholder', { defaultValue: 'Describe what you need to build or analyse…' })}
          disabled={isLimitReached} rows={1}
        />
        <button
          className={`hero-promptbox__send${value.trim() && !isLimitReached ? ' hero-promptbox__send--active' : ''}${isLimitReached ? ' hero-promptbox__send--limit' : ''}`}
          onClick={isLimitReached ? () => navigate('/auth?mode=register') : handleSubmit}
          aria-label="Send"
        >
          {isStreaming
            ? <span className="hero-promptbox__spinner" />
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          }
        </button>
      </div>

      <div className="hero-promptbox__footer">
        <div className="hero-promptbox__chips">
          {HERO_CHIPS.map((chip, i) => (
            <button key={i} className={`hero-promptbox__chip${activeChip === i ? ' hero-promptbox__chip--active' : ''}`} onClick={() => handleChip(chip, i)} disabled={isLimitReached}>
              <span>{chip.icon}</span>
              {t(chip.labelKey, { defaultValue: chip.dLabel })}
            </button>
          ))}
          <span className="hero-promptbox__chip-more">+{30 - HERO_CHIPS.length} {isEs ? 'más' : 'more'}</span>
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
    const h = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  useEffect(() => { setPhraseIndex(0); setDisplayed(''); setIsDeleting(false); }, [rotatingPhrases]);
  useEffect(() => {
    if (isMobile) return;
    const current = rotatingPhrases[phraseIndex];
    if (!isDeleting && displayed === current) {
      const timer = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(timer);
    }
    if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setPhraseIndex((i) => (i + 1) % rotatingPhrases.length);
      return;
    }
    const speed = isDeleting ? 30 : 60;
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
  { value: '30', unit: '+',   labelKey: 'landing.stats.tools',   defaultLabel: 'specialized agents' },
  { value: '10', unit: '',    labelKey: 'landing.stats.cats',    defaultLabel: 'capability areas' },
  { value: '3',  unit: '',    labelKey: 'landing.stats.models',  defaultLabel: 'AI models (Claude, GPT-4o, Gemini)' },
  { value: '2',  unit: 'min', labelKey: 'landing.stats.pertool', defaultLabel: 'avg. per output' },
];

/* ─────────────────────────────────────────────────────────────────
   How It Works mockups
───────────────────────────────────────────────────────────────── */
const HOW_STEPS = [
  { num: '01', titleKey: 'landing.how.step1.title', descKey: 'landing.how.step1.desc', defaultTitle: 'Pick your agent', defaultDesc: 'Choose from 10 capability areas — strategy, content, finance, creative and more.' },
  { num: '02', titleKey: 'landing.how.step2.title', descKey: 'landing.how.step2.desc', defaultTitle: 'Fill in your brief', defaultDesc: 'Answer a few focused fields. No prompting required — the agent handles the rest.' },
  { num: '03', titleKey: 'landing.how.step3.title', descKey: 'landing.how.step3.desc', defaultTitle: 'Get structured output', defaultDesc: 'Professional output delivered in seconds — formatted, reasoned and ready to use.' },
  { num: '04', titleKey: 'landing.how.step4.title', descKey: 'landing.how.step4.desc', defaultTitle: 'Copy, refine, ship', defaultDesc: 'Edit inline, regenerate, or copy directly to your workflow. Full control, zero friction.' },
];

const TOOL_TILES = [
  { emoji: '🎯', labelEs: 'Estrategia', labelEn: 'Strategy', active: true },
  { emoji: '✍️', labelEs: 'Contenido',  labelEn: 'Content' },
  { emoji: '📈', labelEs: 'Marketing',  labelEn: 'Marketing' },
  { emoji: '🎨', labelEs: 'Creative',   labelEn: 'Creative' },
  { emoji: '💰', labelEs: 'Finanzas',   labelEn: 'Finance' },
  { emoji: '🚀', labelEs: 'Startup',    labelEn: 'Startup' },
];
const OUTPUT_LINES_WIDTHS = [72, 90, 65, 85, 55, 78, 60];

function HiwMockup({ step, active, isEs }) {
  if (step === 0) return (
    <div className="hiw-mock">
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
    <div className="hiw-mock">
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__chrome-label">🎯 {isEs ? 'Análisis de Mercado' : 'Market Analysis'}</div>
      </div>
      <div className="hiw-mock__form-fields">
        {(isEs ? ['Mercado / Industria', 'Geografía', 'Segmento objetivo'] : ['Market / Industry', 'Geography', 'Target Segment']).map((label, i) => (
          <div key={i} className="hiw-mock__field">
            <div className="hiw-mock__field-label">{label}</div>
            <div className="hiw-mock__field-input">
              <motion.div className="hiw-mock__field-fill" initial={{ width: 0 }} animate={active ? { width: ['40%', '75%', '88%'][i] } : { width: 0 }} transition={{ duration: 0.7, delay: i * 0.25, ease: 'easeOut' }} />
            </div>
          </div>
        ))}
        <motion.div className="hiw-mock__gen-btn" initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.9 }}>
          {isEs ? '⚡ Analizar con IA' : '⚡ Analyse with AI'}
        </motion.div>
      </div>
    </div>
  );
  if (step === 2) return (
    <div className="hiw-mock">
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__output-badge">✨ {isEs ? 'Análisis listo' : 'Analysis ready'}</div>
        <div className="hiw-mock__word-count">~720 {isEs ? 'palabras' : 'words'}</div>
      </div>
      <div className="hiw-mock__lines">
        {OUTPUT_LINES_WIDTHS.map((w, i) => (
          <motion.div key={i} className={`hiw-mock__line${i === 0 ? ' hiw-mock__line--title' : ''}`} style={{ width: `${w}%` }}
            initial={{ scaleX: 0 }} animate={active ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' }} />
        ))}
      </div>
    </div>
  );
  if (step === 3) return (
    <div className="hiw-mock">
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__review-done">✓ {isEs ? 'Listo · 720 palabras' : 'Done · 720 words'}</div>
      </div>
      <div className="hiw-mock__lines hiw-mock__lines--done">
        {[80, 65, 90, 55].map((w, i) => <div key={i} className="hiw-mock__line" style={{ width: `${w}%` }} />)}
      </div>
      <div className="hiw-mock__actions">
        <div className="hiw-mock__action-btn hiw-mock__action-btn--primary">{isEs ? 'Copiar ✓' : 'Copy ✓'}</div>
        <div className="hiw-mock__action-btn">{isEs ? 'Descargar' : 'Download'}</div>
        <div className="hiw-mock__action-btn">{isEs ? 'Editar' : 'Refine'}</div>
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
        <motion.button key={i} className={`hiw-card${active === i ? ' hiw-card--active' : ''}`}
          onClick={() => { setActive(i); startTimer(); }}
          whileHover={{ scale: 1.015 }} transition={{ duration: 0.2 }}
        >
          <div className="hiw-card__visual"><HiwMockup step={i} active={active === i} isEs={isEs} /></div>
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
   FAQ
───────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'What is Gormaran, exactly?',
    a: 'Gormaran is a workspace of 30 purpose-built AI agents — each one trained for a specific business task across strategy, content, marketing, finance, creative and more. You fill in a structured brief; it delivers professional output.',
  },
  {
    q: 'How is it different from ChatGPT or Claude?',
    a: 'General AI gives you answers. Gormaran gives you structured, domain-specific deliverables. No prompting, no iteration loops — each agent knows its task, asks the right questions, and formats the output for direct use.',
  },
  {
    q: 'Which AI models does it use?',
    a: 'The platform runs on Claude Sonnet 4, GPT-4o and Gemini 1.5 Pro for text agents. Creative Studio uses DALL·E 3, Flux 1.1 and Kling 3.0 for image and video prompts.',
  },
  {
    q: 'Who uses Gormaran?',
    a: 'Founders building their first pitch. Strategists running market analysis. Content teams shipping at scale. Agency owners writing client proposals. Finance leads modelling forecasts. Anyone who needs professional output fast.',
  },
  {
    q: 'Do I need to know how to prompt AI?',
    a: 'No. The prompting is built into each agent. You answer focused fields in plain language — topic, audience, goal — and the agent handles everything else.',
  },
  {
    q: 'What are the plan differences?',
    a: 'The free plan gives access to Marketing and Content agents (10 uses/month). Grow adds Digital Marketing and unlimited generations. Scale adds Strategy, E-commerce, Agency and Creative. Evolution unlocks Finance and Startup. Automation is a separate add-on.',
  },
  {
    q: 'Is my data private?',
    a: "Yes. Your inputs and outputs are stored privately in your workspace. They're never shared with other users or used to train any AI model.",
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes — no lock-in, no cancellation fees. Your access continues until the end of the billing period.',
  },
];

function FAQSection() {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <section className="landing__faq section">
      <div className="container container-sm">
        <AnimatedSection>
          <span className="section-pill">{t('landing.faq.pill', { defaultValue: 'FAQ' })}</span>
          <h2 className="section-title">
            {t('landing.faq.title', { defaultValue: 'Questions & ' })}<span className="gradient-text">{t('landing.faq.titleHighlight', { defaultValue: 'answers' })}</span>
          </h2>
        </AnimatedSection>
        <div className="landing__faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`landing__faq-item${openIdx === i ? ' landing__faq-item--open' : ''}`}>
              <button className="landing__faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                {item.q}
                <span className="landing__faq-chevron">{openIdx === i ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div className="landing__faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <p>{item.a}</p>
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
   Tool Categories Section
───────────────────────────────────────────────────────────────── */
function ToolCategoriesSection() {
  const { t } = useTranslation();
  return (
    <section className="landing__cats section">
      <div className="container">
        <AnimatedSection>
          <span className="section-pill">{t('landing.cats.pill', { defaultValue: 'The Agents' })}</span>
          <h2 className="section-title">
            {t('landing.cats.titlePre', { defaultValue: '30 agents.' })}{' '}
            <span className="gradient-text">{t('landing.cats.titleHighlight', { defaultValue: '10 capability areas.' })}</span>
          </h2>
          <p className="section-subtitle">
            {t('landing.cats.subtitle', { defaultValue: 'Each agent is purpose-built for one task. Structured inputs, professional outputs — ready to use.' })}
          </p>
        </AnimatedSection>

        <motion.div
          className="landing__cats-grid"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
          variants={stagger}
        >
          {TOOL_CATEGORIES.map((cat) => (
            <motion.div key={cat.id} variants={fadeUp}>
              <Link
                to={`/category/${cat.id}`}
                className="landing__cat-card"
                style={{ '--cat-color': cat.color }}
              >
                <div className="landing__cat-header">
                  <span className="landing__cat-icon">{cat.emoji}</span>
                  <span className={`landing__cat-badge landing__cat-badge--${cat.plan}`}>
                    {PLAN_LABELS[cat.plan]}
                  </span>
                </div>
                <div className="landing__cat-name">{cat.name}</div>
                <div className="landing__cat-tools-list">
                  {cat.tools.slice(0, 3).map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                  {cat.count > 3 && <span>+{cat.count - 3} more</span>}
                </div>
                <div className="landing__cat-count">{cat.count} agent{cat.count !== 1 ? 's' : ''} →</div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Powered by AI
───────────────────────────────────────────────────────────────── */
function PoweredBySection() {
  const { t } = useTranslation();
  return (
    <div className="landing__powered-by">
      <div className="container">
        <span className="landing__powered-label">
          {t('landing.models.label', { defaultValue: 'Powered by' })}
        </span>
        <div className="landing__models-row">
          {AI_MODELS.map((m) => (
            <span key={m.name} className="landing__model-chip">
              <span className="landing__model-dot" style={{ background: m.dot }} />
              {m.name}
            </span>
          ))}
        </div>
      </div>
    </div>
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

      {/* ── HERO ─────────────────────────────────────────────── */}
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
              <span className="landing__hero-badge">
                {t('landing.hero.badge', { defaultValue: '⚡ One subscription' })}
              </span>
            </motion.div>

            <motion.h1 className="landing__hero-title" variants={fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
              <RotatingText />
              <span className="gradient-text">{t('landing.hero.title2')}</span>
            </motion.h1>

            <motion.p className="landing__hero-subtitle" variants={fadeUp} transition={{ duration: 0.35, delay: 0.1 }}>
              {t('landing.hero.subtitleLine1', { defaultValue: 'Unlimited access to top AI tools.' })}
              <br />
              {t('landing.hero.subtitleLine2', { defaultValue: '30+ specialized agents. No prompting required.' })}
            </motion.p>

            <HeroPromptBox />

            <motion.div className="landing__hero-actions" variants={fadeUp} transition={{ duration: 0.35, delay: 0.15 }}>
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                {t('landing.hero.cta')}
                <span className="landing__cta-arrow">→</span>
              </Link>
              <button className="btn btn-secondary btn-lg"
                onClick={() => document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('landing.hero.getDemo', { defaultValue: 'See the agents ↓' })}
              </button>
            </motion.div>

            <motion.div className="landing__hero-trust" variants={fadeUp} transition={{ duration: 0.35, delay: 0.2 }}>
              <span className="landing__trust-item"><span className="landing__trust-check">✓</span>{t('landing.hero.trust1', { defaultValue: 'No credit card required' })}</span>
              <span className="landing__trust-divider">·</span>
              <span className="landing__trust-item"><span className="landing__trust-check">✓</span>{t('landing.hero.trust2', { defaultValue: '24-hour free trial' })}</span>
              <span className="landing__trust-divider">·</span>
              <span className="landing__trust-item"><span className="landing__trust-check">✓</span>{t('landing.hero.trust3', { defaultValue: 'Cancel anytime' })}</span>
            </motion.div>

            <motion.div className="landing__hero-social-proof" variants={fadeUp} transition={{ duration: 0.35, delay: 0.25 }}>
              <div className="landing__avatars">
                {['A','B','C','D','E'].map((l) => <div key={l} className="landing__avatar">{l}</div>)}
              </div>
              <span>
                {t('landing.hero.joinPre', { defaultValue: 'Join' })}{' '}
                <strong>{t('landing.hero.joinCount', { defaultValue: '331+' })}</strong>{' '}
                {t('landing.hero.socialProof', { defaultValue: 'founders, builders & creators' })}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── POWERED BY ─────────────────────────────────────── */}
      <PoweredBySection />

      {/* ── TOOL CATEGORIES ────────────────────────────────── */}
      <div id="agents">
        <ToolCategoriesSection />
      </div>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="landing__how section">
        <div className="container">
          <AnimatedSection>
            <span className="section-pill">{t('landing.how.pill', { defaultValue: 'How It Works' })}</span>
            <h2 className="section-title">{t('landing.how.title')}</h2>
          </AnimatedSection>
          <HowItWorksGrid />
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────── */}
      <section className="landing__stats">
        <div className="container">
          <motion.div className="landing__stats-grid" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {STATS.map((stat) => (
              <motion.div key={stat.labelKey} className="landing__stat-item" variants={fadeUp}>
                <div className="landing__stat-value">
                  <span className="gradient-text">{stat.value}{stat.unit}</span>
                </div>
                <div className="landing__stat-label">{t(stat.labelKey, { defaultValue: stat.defaultLabel })}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────── */}
      <section className="landing__plans section">
        <div className="container">
          <AnimatedSection>
            <span className="section-pill">{t('landing.plans.pill', { defaultValue: isEs ? 'Precios' : 'Pricing' })}</span>
            <h2 className="section-title">
              {t('landing.plans.title2', { defaultValue: isEs ? 'Empieza gratis. Escala cuando lo necesites.' : 'Start free. Scale when you need it.' })}
            </h2>
          </AnimatedSection>
          <motion.div className="landing__plans2" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>

            {/* FREE */}
            <motion.div className="landing__plan2" variants={fadeUp}>
              <h3 className="landing__plan2-name">Free</h3>
              <div className="landing__plan2-price">€0 <span>/{isEs ? 'mes' : 'mo'}</span></div>
              <ul className="landing__plan2-features">
                <li>✓ 10 {isEs ? 'generaciones/mes' : 'generations/month'}</li>
                <li>✓ Marketing & Content agents</li>
                <li>✓ 1 workspace</li>
                <li className="landing__plan2-locked">✗ {isEs ? 'Generaciones ilimitadas' : 'Unlimited generations'}</li>
              </ul>
              <Link to="/auth?mode=register" className="btn btn-secondary landing__plan2-cta">
                {isEs ? 'Empezar gratis' : 'Start free'}
              </Link>
            </motion.div>

            {/* GROW */}
            <motion.div className="landing__plan2 landing__plan2--pro" variants={fadeUp}>
              <div className="landing__plan2-badge">⭐ {isEs ? 'Más Popular' : 'Most Popular'}</div>
              <h3 className="landing__plan2-name">Grow</h3>
              <div className="landing__plan2-price">€15 <span>/{isEs ? 'mes (anual)' : 'mo (annual)'}</span></div>
              <p className="landing__plan2-annual">{isEs ? 'o €19/mes mensual' : 'or €19/mo monthly'}</p>
              <ul className="landing__plan2-features">
                <li>✓ <strong>{isEs ? 'Generaciones ilimitadas' : 'Unlimited generations'}</strong></li>
                <li>✓ Marketing, Content & Digital agents</li>
                <li>✓ {isEs ? '3 workspaces con perfil de marca' : '3 workspaces + brand profile'}</li>
                <li>✓ {isEs ? 'Templates por nicho' : 'Niche-optimized templates'}</li>
              </ul>
              <Link to="/pricing" className="btn btn-primary landing__plan2-cta">
                {isEs ? 'Ver Plan Grow →' : 'See Grow Plan →'}
              </Link>
              <p className="landing__plan2-guarantee">
                🔒 {isEs ? 'Garantía 7 días · Sin permanencia' : '7-day guarantee · No lock-in'}
              </p>
            </motion.div>

            {/* SCALE */}
            <motion.div className="landing__plan2" variants={fadeUp}>
              <h3 className="landing__plan2-name">Scale</h3>
              <div className="landing__plan2-price">€39 <span>/{isEs ? 'mes (anual)' : 'mo (annual)'}</span></div>
              <p className="landing__plan2-annual">{isEs ? 'o €49/mes mensual' : 'or €49/mo monthly'}</p>
              <ul className="landing__plan2-features">
                <li>✓ {isEs ? 'Todo en Grow' : 'Everything in Grow'}</li>
                <li>✓ Strategy, E-commerce & Agency agents</li>
                <li>✓ Creative Studio (AI images + video prompts)</li>
                <li>✓ {isEs ? 'Soporte dedicado' : 'Dedicated support'}</li>
              </ul>
              <Link to="/pricing" className="btn btn-secondary landing__plan2-cta">
                {isEs ? 'Ver Scale →' : 'See Scale →'}
              </Link>
            </motion.div>
          </motion.div>

          <div className="landing__plans-footer">
            <Link to="/pricing" className="btn btn-ghost btn-sm">
              {isEs ? 'Ver todos los planes (Evolution, Add-ons) →' : 'See all plans (Evolution, Add-ons) →'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <FAQSection />

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="landing__cta-full section">
        <div className="container">
          <AnimatedSection>
            <div className="landing__cta-full-card">
              <span className="landing__hero-badge landing__cta-full-badge">
                {t('landing.cta.badge', { defaultValue: 'Get started — it\'s free' })}
              </span>
              <h2 className="landing__cta-full-title">
                {t('landing.cta.title', { defaultValue: 'Build faster.' })}
                <br />
                <span className="gradient-text">
                  {t('landing.cta.titleHighlight', { defaultValue: 'Ship better work.' })}
                </span>
              </h2>
              <p className="landing__cta-full-subtitle">
                {t('landing.cta.subtitle', { defaultValue: '30 purpose-built AI agents. Structured outputs. No prompting required.' })}
              </p>
              <div className="landing__cta-actions">
                <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                  {t('landing.cta.startFree', { defaultValue: 'Start Creating Free →' })}
                </Link>
                <button className="btn btn-secondary btn-lg"
                  onClick={() => document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth' })}>
                  {t('landing.cta.explore', { defaultValue: 'Explore agents ↓' })}
                </button>
              </div>
              <div className="landing__cta-trust">
                <span className="landing__trust-item"><span className="landing__trust-check">✓</span>{t('landing.hero.trust1', { defaultValue: 'No credit card required' })}</span>
                <span className="landing__trust-divider">·</span>
                <span className="landing__trust-item"><span className="landing__trust-check">✓</span>{t('landing.hero.trust2', { defaultValue: '24-hour free trial' })}</span>
                <span className="landing__trust-divider">·</span>
                <span className="landing__trust-item"><span className="landing__trust-check">✓</span>{t('landing.hero.trust3', { defaultValue: 'Cancel anytime' })}</span>
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
