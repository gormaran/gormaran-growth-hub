import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../utils/seo';
import './LandingPage.css';
import WhatsAppPopup from '../components/WhatsAppPopup';
import NichePopup from '../components/NichePopup';

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
   Popular Agents — Pletor-style cards
───────────────────────────────────────────────────────────────── */
const POPULAR_AGENTS = [
  {
    id: 'blog-post',
    emoji: '✍️',
    name: 'Blog Post Writer',
    desc: 'Full SEO-optimized blog posts from a brief. H1, headings, body — ready to publish.',
    category: 'Content',
    plan: 'free',
    color: '#6366f1',
    route: '/category/content',
  },
  {
    id: 'market-analysis',
    emoji: '📊',
    name: 'Market Analysis',
    desc: 'Landscape, sizing, competition and opportunity assessment in structured format.',
    category: 'Strategy',
    plan: 'grow',
    color: '#0891b2',
    route: '/category/strategy',
  },
  {
    id: 'google-ads',
    emoji: '🎯',
    name: 'Google Ads Creator',
    desc: 'Campaign-ready headlines, descriptions and ad groups from your product brief.',
    category: 'Digital',
    plan: 'grow',
    color: '#059669',
    route: '/category/digital',
  },
  {
    id: 'brand-identity',
    emoji: '🎨',
    name: 'Brand Identity Guide',
    desc: 'Voice, palette, typography and usage rules for any brand — in minutes.',
    category: 'Creative',
    plan: 'scale',
    color: '#be185d',
    route: '/category/creative',
  },
  {
    id: 'investor-pitch',
    emoji: '🚀',
    name: 'Investor Pitch Deck',
    desc: 'Slide-by-slide narrative, financials and investor-ready positioning.',
    category: 'Startup',
    plan: 'evolution',
    color: '#ea580c',
    route: '/category/startup',
  },
  {
    id: 'financial-forecast',
    emoji: '💰',
    name: 'Financial Forecast',
    desc: '12-month P&L, MRR projections and scenario analysis from your assumptions.',
    category: 'Finance',
    plan: 'evolution',
    color: '#16a34a',
    route: '/category/finance',
  },
];

const PLAN_COLORS = {
  free: { bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc' },
  grow: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  scale: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
  evolution: { bg: 'rgba(239,68,68,0.1)', text: '#f87171' },
  addon: { bg: 'rgba(6,182,212,0.12)', text: '#22d3ee' },
};
const PLAN_LABELS = { free: 'Free', grow: 'Grow', scale: 'Scale', evolution: 'Evolution', addon: 'Add-on' };

/* ─────────────────────────────────────────────────────────────────
   All tool categories — mirrors the dashboard
───────────────────────────────────────────────────────────────── */
const TOOL_CATEGORIES = [
  { id: 'marketing', emoji: '📈', name: 'Marketing & Growth', plan: 'free', color: '#7c3aed', tools: ['Keyword Research', 'Headline Generator', 'Social Captions', 'Email Campaign', 'Press Release'], count: 6 },
  { id: 'content', emoji: '✍️', name: 'Content Creation', plan: 'free', color: '#6366f1', tools: ['Blog Post Writer', 'Video Script', 'Newsletter', 'Logo Generator'], count: 5 },
  { id: 'strategy', emoji: '🎯', name: 'Business Strategy', plan: 'grow', color: '#0891b2', tools: ['Business Plan', 'Market Analysis', 'Competitor Research', 'SWOT Analysis'], count: 6 },
  { id: 'digital', emoji: '🛠️', name: 'Digital Marketing', plan: 'grow', color: '#059669', tools: ['Google Ads Creator', 'Meta Ads', 'Landing Page Copy'], count: 3 },
  { id: 'ecommerce', emoji: '🛒', name: 'E-commerce Growth', plan: 'scale', color: '#d97706', tools: ['Amazon Listing', 'Product Description', 'CRO Optimizer'], count: 3 },
  { id: 'agency', emoji: '🏢', name: 'Agency Tools', plan: 'scale', color: '#7c3aed', tools: ['Client Proposal', 'Client Report', 'Case Study'], count: 3 },
  { id: 'creative', emoji: '🎨', name: 'Creative Studio', plan: 'scale', color: '#be185d', tools: ['Brand Identity Guide', 'AI Image Studio', 'Video Production Plan', 'Kling Video Prompts'], count: 5 },
  { id: 'startup', emoji: '🚀', name: 'Startup Launchpad', plan: 'evolution', color: '#ea580c', tools: ['Investor Pitch Deck', 'Go-to-Market Strategy', 'User Story Generator'], count: 3 },
  { id: 'finance', emoji: '💰', name: 'Finance & Investment', plan: 'evolution', color: '#16a34a', tools: ['Financial Forecast', 'Investment Analysis', 'Cash Flow Optimiser'], count: 3 },
  { id: 'automation', emoji: '⚡', name: 'n8n Automation', plan: 'addon', color: '#0891b2', tools: ['n8n Workflow Designer'], count: 1, isAddon: true },
];

/* ─────────────────────────────────────────────────────────────────
   Hero Tabs Showcase
───────────────────────────────────────────────────────────────── */
const HERO_TABS = [
  {
    id: 'text', icon: '✍️', label: 'Text & Chat', color: '#6366f1',
    credit: '2 credits',
    desc: 'Chat with AI, write content, analyse markets, plan strategies.',
    preview: () => (
      <div className="htab__preview htab__preview--text">
        <div className="htab__chat-msg htab__chat-msg--user">Create a go-to-market strategy for my SaaS startup</div>
        <div className="htab__chat-msg htab__chat-msg--ai">
          <div className="htab__ai-label">⚡ Gormaran AI</div>
          <div className="htab__bars">
            {[85,70,90,60,75,45,80].map((w,i) => <div key={i} className="htab__bar" style={{ width: `${w}%`, animationDelay: `${i*0.08}s` }} />)}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'design', icon: '🎨', label: 'Design', color: '#7c3aed',
    credit: '10 credits',
    desc: 'Generate stunning images, product shots, social visuals with DALL·E 3.',
    preview: () => (
      <div className="htab__preview htab__preview--design">
        {['#7c3aed22','#6366f122','#be185d22','#0891b222'].map((bg, i) => (
          <div key={i} className="htab__img-card" style={{ background: bg }}>
            <div className="htab__img-inner" />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'video', icon: '🎬', label: 'Video', color: '#0284c7',
    credit: '25 credits',
    desc: 'Turn text prompts into cinematic AI videos with Kling, Higgsfield and more.',
    preview: () => (
      <div className="htab__preview htab__preview--video">
        <div className="htab__video-frame">
          <div className="htab__video-play">▶</div>
          <div className="htab__video-bar" />
          <div className="htab__video-label">AI Video · 16:9</div>
        </div>
      </div>
    ),
  },
  {
    id: 'audio', icon: '🎵', label: 'Audio', color: '#059669',
    credit: '10 credits',
    desc: 'Text to speech in 8 languages. AI music generation from a description.',
    preview: () => (
      <div className="htab__preview htab__preview--audio">
        <div className="htab__waveform">
          {[30,55,80,45,90,35,70,60,85,40,65,75,50,95,30].map((h,i) => (
            <div key={i} className="htab__wave-bar" style={{ height: `${h}%`, animationDelay: `${i*0.06}s` }} />
          ))}
        </div>
        <div className="htab__audio-label">🎙️ EN · Normal · ▶ Play · ⬇ Download</div>
      </div>
    ),
  },
  {
    id: 'agents', icon: '⚡', label: 'AI Agents', color: '#7c3aed',
    credit: '30 credits',
    desc: 'Build interactive mini-apps and visual AI workflows — no code needed.',
    preview: () => (
      <div className="htab__preview htab__preview--agents">
        <div className="htab__app-bar">
          <span className="htab__app-dot" /><span className="htab__app-dot" /><span className="htab__app-dot" />
          <span className="htab__app-title">KPI Dashboard · Live Preview</span>
        </div>
        <div className="htab__app-content">
          {[['MRR','€24.8k','+12%'],['Churn','2.4%','-0.3%'],['DAU','1,240','+8%']].map(([k,v,d]) => (
            <div key={k} className="htab__kpi"><div className="htab__kpi-label">{k}</div><div className="htab__kpi-val">{v}</div><div className="htab__kpi-delta">{d}</div></div>
          ))}
        </div>
      </div>
    ),
  },
];

function HeroTabsShowcase() {
  const [active, setActive] = useState(0);
  const tab = HERO_TABS[active];
  const PreviewComp = tab.preview;

  return (
    <div className="htab">
      {/* Tab pills */}
      <div className="htab__tabs">
        {HERO_TABS.map((t, i) => (
          <button
            key={t.id}
            className={`htab__tab${active === i ? ' htab__tab--active' : ''}`}
            style={active === i ? { '--tc': t.color } : {}}
            onClick={() => setActive(i)}
          >
            <span className="htab__tab-icon">{t.icon}</span>
            <span className="htab__tab-label">{t.label}</span>
            <span className="htab__credit">{t.credit}</span>
          </button>
        ))}
      </div>

      {/* Preview card */}
      <motion.div
        key={active}
        className="htab__card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{ '--tc': tab.color }}
      >
        <div className="htab__card-left">
          <div className="htab__card-icon">{tab.icon}</div>
          <h3 className="htab__card-title">{tab.label}</h3>
          <p className="htab__card-desc">{tab.desc}</p>
          <div className="htab__card-credit">{tab.credit} per generation</div>
        </div>
        <div className="htab__card-right">
          <PreviewComp />
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI models marquee
───────────────────────────────────────────────────────────────── */
const MARQUEE_MODELS = [
  { name: 'Claude Sonnet 4', dot: '#e54717' },
  { name: 'GPT-4o', dot: '#10a37f' },
  { name: 'Gemini 1.5 Pro', dot: '#4285f4' },
  { name: 'DALL·E 3', dot: '#10a37f' },
  { name: 'Flux 1.1 Pro', dot: '#7c3aed' },
  { name: 'Kling 3.0', dot: '#ef4444' },
  { name: 'Grok 2', dot: '#e2e8f0' },
  { name: 'Mistral Large', dot: '#f97316' },
  { name: 'Deepseek R1', dot: '#1677ff' },
  { name: 'ElevenLabs', dot: '#f59e0b' },
];

/* ─────────────────────────────────────────────────────────────────
   [Hero prompt chips removed — replaced by HeroTabsShowcase]
───────────────────────────────────────────────────────────────── */
const HERO_CHIPS_UNUSED = [
  { icon: '📊', labelKey: 'landing.promptbox.chip.mktg', dLabel: 'Market Analysis', fillKey: 'landing.promptbox.chip.mktg.fill', dFill: 'Analyse the market opportunity for an AI writing tool targeting mid-size marketing teams in Europe', route: '/category/strategy', categoryId: 'strategy', toolId: 'market-analysis', exampleInputs: { market: 'AI writing tools', geography: 'Europe', customer_segment: 'Mid-size marketing teams' } },
  { icon: '🏗️', labelKey: 'landing.promptbox.chip.biz', dLabel: 'Business Plan', fillKey: 'landing.promptbox.chip.biz.fill', dFill: 'Write a business plan for a B2B SaaS project management tool targeting remote-first startups', route: '/category/strategy', categoryId: 'strategy', toolId: 'business-plan', exampleInputs: { business_name: 'FlowDesk', industry: 'B2B SaaS', product: 'Project management for remote-first startups', stage: 'Early Stage (< $100k ARR)' } },
  { icon: '✍️', labelKey: 'landing.promptbox.chip4', dLabel: 'Blog Post', fillKey: 'landing.promptbox.chip4.fill', dFill: 'Write an SEO blog post about the best AI tools for small businesses in 2025', route: '/category/content', categoryId: 'content', toolId: 'blog-post', exampleInputs: { topic: 'Best AI tools for small businesses in 2025', keyword: 'ai tools small business', audience: 'Founders and operators', word_count: '800', tone: 'Informative' } },
  { icon: '💰', labelKey: 'landing.promptbox.chip.fin', dLabel: 'Financial Forecast', fillKey: 'landing.promptbox.chip.fin.fill', dFill: 'Build a 12-month financial forecast for a SaaS product with a freemium model — 500 signups/month, 4% paid conversion', route: '/category/finance', categoryId: 'finance', toolId: 'financial-forecast', exampleInputs: { business: 'SaaS product', model: 'Freemium', monthly_signups: '500', conversion: '4%', avg_revenue: '$29/month' } },
  { icon: '🚀', labelKey: 'landing.promptbox.chip.pitch', dLabel: 'Investor Pitch', fillKey: 'landing.promptbox.chip.pitch.fill', dFill: 'Create an investor pitch deck for a climate tech startup raising a $2M pre-seed round', route: '/category/startup', categoryId: 'startup', toolId: 'investor-pitch', exampleInputs: { company: 'GreenSync', description: 'AI-powered energy optimisation for SMBs', round: 'Pre-seed $2M', traction: '12 pilots, €40k ARR' } },
  { icon: '🎨', labelKey: 'landing.promptbox.chip.brand', dLabel: 'Brand Identity', fillKey: 'landing.promptbox.chip.brand.fill', dFill: 'Create a brand identity guide for a premium D2C wellness supplement brand targeting health-conscious millennials', route: '/category/creative', categoryId: 'creative', toolId: 'brand-identity', exampleInputs: { brand_name: 'Aura Wellness', industry: 'D2C wellness supplements', target: 'Health-conscious millennials, 25–38', tone: 'Premium, clean, science-backed' } },
];

/* eslint-disable */
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
   Animated Models Marquee (Pletor-style)
───────────────────────────────────────────────────────────────── */
function ModelsMarquee() {
  const { t } = useTranslation();
  const doubled = [...MARQUEE_MODELS, ...MARQUEE_MODELS];
  return (
    <div className="landing__marquee-section">
      <div className="landing__marquee-label">
        {t('landing.models.label', { defaultValue: 'Access the best AI models in one platform' })}
      </div>
      <div className="landing__marquee-wrapper" aria-hidden="true">
        <div className="landing__marquee-track">
          {doubled.map((m, i) => (
            <span key={i} className="landing__marquee-chip">
              <span className="landing__marquee-dot" style={{ background: m.dot }} />
              {m.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Feature highlights (Pletor "Built for marketers" style)
───────────────────────────────────────────────────────────────── */
function FeatureMockup({ type }) {
  if (type === 'agents') return (
    <div className="feat-mock">
      <div className="feat-mock__chrome">
        <span className="feat-mock__dot" /><span className="feat-mock__dot" /><span className="feat-mock__dot" />
        <span className="feat-mock__title">Gormaran — Agent Hub</span>
      </div>
      <div className="feat-mock__body">
        <div className="feat-mock__sidebar">
          {['📈 Marketing', '✍️ Content', '🎯 Strategy', '🛠️ Digital', '🎨 Creative'].map((item, i) => (
            <div key={i} className={`feat-mock__sidebar-item${i === 1 ? ' feat-mock__sidebar-item--active' : ''}`}>{item}</div>
          ))}
        </div>
        <div className="feat-mock__main">
          <div className="feat-mock__agent-card">
            <div className="feat-mock__agent-icon">✍️</div>
            <div className="feat-mock__agent-info">
              <div className="feat-mock__agent-name">Blog Post Writer</div>
              <div className="feat-mock__agent-desc">SEO-optimised content in 2 min</div>
            </div>
            <div className="feat-mock__agent-btn">Run →</div>
          </div>
          <div className="feat-mock__agent-card">
            <div className="feat-mock__agent-icon">🎬</div>
            <div className="feat-mock__agent-info">
              <div className="feat-mock__agent-name">Video Script</div>
              <div className="feat-mock__agent-desc">Hook, body, CTA — structured</div>
            </div>
            <div className="feat-mock__agent-btn">Run →</div>
          </div>
          <div className="feat-mock__agent-card feat-mock__agent-card--faded">
            <div className="feat-mock__agent-icon">📧</div>
            <div className="feat-mock__agent-info">
              <div className="feat-mock__agent-name">Newsletter</div>
              <div className="feat-mock__agent-desc">Segments, subject line, body</div>
            </div>
            <div className="feat-mock__agent-btn">Run →</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (type === 'output') return (
    <div className="feat-mock">
      <div className="feat-mock__chrome">
        <span className="feat-mock__dot" /><span className="feat-mock__dot" /><span className="feat-mock__dot" />
        <span className="feat-mock__title">Market Analysis · Claude Sonnet 4</span>
        <span className="feat-mock__badge">✓ Done</span>
      </div>
      <div className="feat-mock__output">
        <div className="feat-mock__output-line feat-mock__output-line--heading" style={{ width: '62%' }} />
        {[90, 78, 85, 55, 70, 88, 45].map((w, i) => (
          <div key={i} className="feat-mock__output-line" style={{ width: `${w}%`, animationDelay: `${i * 0.06}s` }} />
        ))}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          {['Copy ✓', 'Refine', 'Translate', 'Export'].map((label, i) => (
            <div key={i} className={`feat-mock__output-btn${i === 0 ? ' feat-mock__output-btn--primary' : ''}`}>{label}</div>
          ))}
        </div>
      </div>
    </div>
  );

  if (type === 'models') return (
    <div className="feat-mock">
      <div className="feat-mock__chrome">
        <span className="feat-mock__dot" /><span className="feat-mock__dot" /><span className="feat-mock__dot" />
        <span className="feat-mock__title">Select AI model</span>
      </div>
      <div style={{ padding: '0.75rem' }}>
        {[
          { letter: 'C', name: 'Claude Sonnet 4', dot: '#e54717', active: true },
          { letter: 'G', name: 'GPT-4o', dot: '#10a37f' },
          { letter: 'G', name: 'Gemini 1.5 Pro', dot: '#4285f4' },
          { letter: 'X', name: 'Grok 2', dot: '#e2e8f0' },
          { letter: 'D', name: 'Deepseek R1', dot: '#1677ff' },
        ].map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.4rem 0.5rem', borderRadius: '8px', marginBottom: '0.3rem',
            background: m.active ? 'rgba(99,102,241,0.08)' : 'transparent',
            border: `1px solid ${m.active ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
          }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: `${m.dot}22`, color: m.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}>{m.letter}</div>
            <span style={{ fontSize: '0.78rem', color: m.active ? 'var(--color-primary-light)' : 'var(--text-secondary)', fontWeight: m.active ? 600 : 400 }}>{m.name}</span>
            {m.active && <div style={{ marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-primary)' }} /></div>}
          </div>
        ))}
      </div>
    </div>
  );

  return null;
}

const FEATURE_ROWS = [
  {
    pill: 'The Agents',
    title: 'Agents that think',
    highlight: 'like marketers',
    desc: 'Every agent is purpose-built for one task. Structured inputs, professional outputs — no prompting knowledge required. Just fill in a brief and ship.',
    bullets: ['30 specialized agents across 10 areas', 'Structured brief → professional output', 'From strategy to creative to finance'],
    mockupType: 'agents',
    reverse: false,
  },
  {
    pill: 'The Output',
    title: 'Professional output',
    highlight: 'ready to use',
    desc: 'Every agent delivers formatted, structured output designed for direct use — not a draft to clean up. Copy in one click, translate, refine, or export.',
    bullets: ['Copy in one click', 'Follow-up, refine, iterate in context', 'Multi-language output built in'],
    mockupType: 'output',
    reverse: true,
  },
  {
    pill: 'The Models',
    title: 'Best AI models',
    highlight: 'in one place',
    desc: 'Stop platform hopping. Access Claude, GPT-4o, Gemini and more from one workspace — each agent automatically uses the best model for its task.',
    bullets: ['Claude Sonnet 4, GPT-4o, Gemini 1.5', 'DALL·E 3, Flux 1.1, Kling 3.0 for creative', 'One subscription, all models'],
    mockupType: 'models',
    reverse: false,
  },
];

function FeatureHighlightsSection() {
  return (
    <section className="landing__features section">
      <div className="container">
        <AnimatedSection>
          <h2 className="section-title">
            Built for teams that{' '}
            <span className="gradient-text">move fast</span>
          </h2>
          <p className="section-subtitle">
            From AI agents to structured output to model selection — everything in one platform.
          </p>
        </AnimatedSection>
        <motion.div
          className="landing__feature-cards"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
          variants={stagger}
        >
          {FEATURE_ROWS.map((row, i) => (
            <motion.div key={i} className="landing__feature-card" variants={fadeUp}>
              <div className="landing__feature-card-visual">
                <FeatureMockup type={row.mockupType} />
              </div>
              <div className="landing__feature-card-body">
                <span className="section-pill">{row.pill}</span>
                <h3 className="landing__feature-card-title">
                  {row.title} <span className="gradient-text">{row.highlight}</span>
                </h3>
                <p className="landing__feature-card-desc">{row.desc}</p>
                <ul className="landing__feature-bullets">
                  {row.bullets.map((b, j) => (
                    <li key={j}><span className="landing__feature-check">✓</span>{b}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Popular Agents (Pletor-style cards)
───────────────────────────────────────────────────────────────── */
function PopularAgentsSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const handleTryAgent = (route) => {
    if (currentUser) { navigate(route); } else { navigate('/auth?mode=register'); }
  };
  return (
    <section id="agents" className="landing__agents section">
      <div className="container">
        <AnimatedSection>
          <span className="section-pill">Popular Agents</span>
          <h2 className="section-title">
            Start with proven{' '}
            <span className="gradient-text">AI agents</span>
          </h2>
          <p className="section-subtitle">
            {t('landing.cats.subtitle', { defaultValue: 'Each agent is purpose-built for one task. Structured inputs, professional outputs — ready to use.' })}
          </p>
        </AnimatedSection>

        <motion.div
          className="landing__agent-cards"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
          variants={stagger}
        >
          {POPULAR_AGENTS.map((agent) => (
            <motion.div key={agent.id} variants={fadeUp} className="landing__agent-card" style={{ '--agent-color': agent.color }}>
              <div className="landing__agent-card-top">
                <div className="landing__agent-emoji" style={{ background: `${agent.color}18` }}>{agent.emoji}</div>
                <span className="landing__agent-plan-badge" style={{ background: PLAN_COLORS[agent.plan].bg, color: PLAN_COLORS[agent.plan].text }}>
                  {PLAN_LABELS[agent.plan]}
                </span>
              </div>
              <div className="landing__agent-name">{agent.name}</div>
              <div className="landing__agent-desc">{agent.desc}</div>
              <div className="landing__agent-footer">
                <span className="landing__agent-cat">{agent.category}</span>
                <button className="landing__agent-try-btn" onClick={() => handleTryAgent(agent.route)}>
                  Try Agent →
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="landing__agents-footer">
          <Link to="/auth?mode=register" className="btn btn-primary">
            Get your credits free →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   How It Works
───────────────────────────────────────────────────────────────── */
const HOW_STEPS = [
  { num: '01', titleKey: 'landing.how.step1.title', descKey: 'landing.how.step1.desc', defaultTitle: 'Choose your AI model', defaultDesc: 'Select from Claude, GPT-4o, Gemini and more — each optimised for different tasks.' },
  { num: '02', titleKey: 'landing.how.step2.title', descKey: 'landing.how.step2.desc', defaultTitle: 'Describe what you need', defaultDesc: 'Type your request in plain language. No prompting knowledge required.' },
  { num: '03', titleKey: 'landing.how.step3.title', descKey: 'landing.how.step3.desc', defaultTitle: 'Get AI output instantly', defaultDesc: 'Watch the response stream in real time — text, strategy, code, or images.' },
  { num: '04', titleKey: 'landing.how.step4.title', descKey: 'landing.how.step4.desc', defaultTitle: 'Copy, refine, iterate', defaultDesc: 'Copy in one click, ask follow-ups, or generate images — all in the same conversation.' },
];

const HIW_MODELS = [
  { letter: 'G', name: 'ChatGPT',  color: '#10a37f', active: true },
  { letter: 'C', name: 'Claude',   color: '#e54717' },
  { letter: 'G', name: 'Gemini',   color: '#4285f4' },
  { letter: 'X', name: 'Grok',     color: '#e0e0e0' },
  { letter: 'D', name: 'Deepseek', color: '#1677ff' },
];
const HIW_OUTPUT_LINES = [78, 92, 68, 85, 55, 80, 62];

function HiwMockup({ step, active, isEs }) {
  if (step === 0) return (
    <div className="hiw-mock" style={{ width: '100%' }}>
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__chrome-label">{isEs ? 'Selección de modelo' : 'Model selection'}</div>
      </div>
      <div style={{ padding: '0.5rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {HIW_MODELS.map((m) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', borderRadius: '7px', background: m.active ? 'rgba(99,102,241,0.07)' : 'transparent', border: `1px solid ${m.active ? 'rgba(99,102,241,0.2)' : 'transparent'}` }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `${m.color}22`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>{m.letter}</div>
            <span style={{ fontSize: '0.72rem', color: m.active ? 'var(--color-primary-light)' : 'var(--text-muted)', fontWeight: m.active ? 600 : 400 }}>{m.name}</span>
            {m.active && <div style={{ marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-primary)' }} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
  if (step === 1) return (
    <div className="hiw-mock" style={{ width: '100%' }}>
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__chrome-label">Gormaran · ChatGPT</div>
      </div>
      <div style={{ padding: '0.75rem 0.6rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ height: 32, background: 'var(--bg-surface-2)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 0 2px rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', padding: '0 0.6rem', gap: '0.4rem' }}>
          <motion.div style={{ height: 7, background: 'rgba(99,102,241,0.3)', borderRadius: 3 }} initial={{ width: 0 }} animate={active ? { width: '70%' } : { width: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
          <motion.span style={{ fontSize: '0.6rem', background: 'var(--color-primary)', color: '#fff', width: 14, height: 14, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', flexShrink: 0 }} initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 1.2 }}>↑</motion.span>
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'right' }}>{isEs ? 'Intro para enviar' : 'Enter to send'}</div>
      </div>
    </div>
  );
  if (step === 2) return (
    <div className="hiw-mock" style={{ width: '100%' }}>
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__chrome-label">ChatGPT</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {[0,1,2].map(i => (
            <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary-light)' }}
              animate={active ? { opacity: [0.3,1,0.3], scale: [0.8,1.1,0.8] } : { opacity: 0.3 }}
              transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
      <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {HIW_OUTPUT_LINES.map((w, i) => (
          <motion.div key={i} style={{ height: i === 0 ? 9 : 6, borderRadius: 3, background: i === 0 ? 'linear-gradient(90deg,rgba(99,102,241,0.4),rgba(139,92,246,0.15))' : 'var(--bg-elevated, var(--bg-surface-3))', transformOrigin: 'left' }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={active ? { scaleX: w / 100, opacity: 1 } : { scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.5, delay: i * 0.09, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  );
  if (step === 3) return (
    <div className="hiw-mock" style={{ width: '100%' }}>
      <div className="hiw-mock__bar-row hiw-mock__chrome-mini">
        <span className="hiw-mock__dot" /><span className="hiw-mock__dot" /><span className="hiw-mock__dot" />
        <div className="hiw-mock__review-done">✓ {isEs ? 'Respuesta lista' : 'Response ready'}</div>
      </div>
      <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {[80, 65, 90, 55, 75].map((w, i) => (
          <div key={i} style={{ height: 6, borderRadius: 3, width: `${w}%`, background: 'rgba(52,211,153,0.18)' }} />
        ))}
        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
          {[{ label: isEs ? 'Copiar ✓' : 'Copy ✓', primary: true }, { label: isEs ? 'Seguir' : 'Follow-up' }, { label: isEs ? 'Imagen' : 'Image' }].map(btn => (
            <div key={btn.label} style={{ flex: 1, textAlign: 'center', padding: '0.28rem 0', borderRadius: 5, fontSize: '0.6rem', background: btn.primary ? 'rgba(99,102,241,0.12)' : 'var(--bg-card,rgba(255,255,255,0.04))', border: `1px solid ${btn.primary ? 'rgba(99,102,241,0.25)' : 'var(--border-color,rgba(255,255,255,0.08))'}`, color: btn.primary ? '#a5b4fc' : 'var(--text-muted)' }}>{btn.label}</div>
          ))}
        </div>
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
   Stats
───────────────────────────────────────────────────────────────── */
const STATS = [
  { value: '30', unit: '+', labelKey: 'landing.stats.tools', defaultLabel: 'specialized agents' },
  { value: '10', unit: '', labelKey: 'landing.stats.cats', defaultLabel: 'capability areas' },
  { value: '6', unit: '', labelKey: 'landing.stats.models', defaultLabel: 'AI models built in' },
  { value: '2', unit: 'min', labelKey: 'landing.stats.pertool', defaultLabel: 'avg. output time' },
];

/* ─────────────────────────────────────────────────────────────────
   Testimonials
───────────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Marco T.', role: 'Founder, B2B SaaS', quote: 'I shipped my investor deck, market analysis and go-to-market plan in one afternoon. Used to take me two weeks.', avatar: 'M' },
  { name: 'Sofia R.', role: 'Marketing Manager', quote: 'My team now runs 40% more campaigns with the same headcount. The Google Ads and social agents are incredible.', avatar: 'S' },
  { name: 'James K.', role: 'Agency Owner', quote: "Client proposals that used to take 3 hours now take 20 minutes. The output quality is genuinely better than what I wrote.", avatar: 'J' },
  { name: 'Ana M.', role: 'E-commerce Director', quote: 'Product descriptions, Amazon listings, landing copy — all done. I just fill in the brief and the agent handles the rest.', avatar: 'A' },
];

function TestimonialsSection() {
  return (
    <section className="landing__testimonials section">
      <div className="container">
        <AnimatedSection>
          <span className="section-pill">What users say</span>
          <h2 className="section-title">
            Built for{' '}
            <span className="gradient-text">results</span>
          </h2>
        </AnimatedSection>
        <motion.div
          className="landing__testimonials-grid"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
          variants={stagger}
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} variants={fadeUp} className="landing__testimonial-card">
              <p className="landing__testimonial-quote">"{t.quote}"</p>
              <div className="landing__testimonial-author">
                <div className="landing__testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="landing__testimonial-name">{t.name}</div>
                  <div className="landing__testimonial-role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FAQ
───────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  { q: 'What is Gormaran, exactly?', a: 'Gormaran is a workspace of 30 purpose-built AI agents — each one trained for a specific business task across strategy, content, marketing, finance, creative and more. You fill in a structured brief; it delivers professional output.' },
  { q: 'How is it different from ChatGPT or Claude?', a: 'General AI gives you answers. Gormaran gives you structured, domain-specific deliverables. No prompting, no iteration loops — each agent knows its task, asks the right questions, and formats the output for direct use.' },
  { q: 'Which AI models does it use?', a: 'The platform runs on Claude Sonnet 4, GPT-4o and Gemini 1.5 Pro for text agents. Creative Studio uses DALL·E 3, Flux 1.1 and Kling 3.0 for image and video prompts.' },
  { q: 'Who uses Gormaran?', a: 'Founders building their first pitch. Strategists running market analysis. Content teams shipping at scale. Agency owners writing client proposals. Finance leads modelling forecasts. Anyone who needs professional output fast.' },
  { q: 'Do I need to know how to prompt AI?', a: 'No. The prompting is built into each agent. You answer focused fields in plain language — topic, audience, goal — and the agent handles everything else.' },
  { q: 'How do credits work?', a: 'You start with 50 free credits. Each action costs: Text chat 2 credits, Design image 10, Video 25, Audio 10, AI Agents run 30. Paid plans give monthly credit allowances — Grow gets 500 credits/month, Scale 2,000, Evolution unlimited.' },
  { q: 'Is my data private?', a: "Yes. Your inputs and outputs are stored privately in your workspace. They're never shared with other users or used to train any AI model." },
  { q: 'Can I cancel at any time?', a: 'Yes — no lock-in, no cancellation fees. Your access continues until the end of the billing period.' },
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
   Main Landing Page
───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const { currentUser } = useAuth();

  const seoEl = useSEO({
    title: 'Gormaran.io | Top AI Marketing Tools — Text, Design, Video & More',
    description: '50 free credits. All-in-one AI platform: chat, image generation, video, audio and AI app builder. No prompting required. Start free.',
    canonical: 'https://gormaran.io/',
  });

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'https://gormaran-growth-hub-2.onrender.com'}/health`).catch(() => {});
  }, []);

  return (
    <>{seoEl}<div className="landing">

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
                {t('landing.hero.badge', { defaultValue: '⚡ 50 free credits. No card required.' })}
              </span>
            </motion.div>

            <motion.h1 className="landing__hero-title" variants={fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
              <RotatingText />
              <span className="gradient-text">{t('landing.hero.title2')}</span>
            </motion.h1>

            <motion.p className="landing__hero-subtitle" variants={fadeUp} transition={{ duration: 0.35, delay: 0.1 }}>
              {t('landing.hero.subtitleLine1', { defaultValue: 'Purpose-built AI agents for marketing, strategy, content, and more.' })}
              <br />
              {t('landing.hero.subtitleLine2', { defaultValue: 'Structured inputs. Professional outputs. No prompting required.' })}
            </motion.p>

            <motion.div className="landing__hero-actions" variants={fadeUp} transition={{ duration: 0.35, delay: 0.12 }}>
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                Get your credits free →
              </Link>
              <button className="btn btn-secondary btn-lg"
                onClick={() => document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth' })}>
                See what's inside ↓
              </button>
            </motion.div>

            <motion.div className="landing__hero-trust" variants={fadeUp} transition={{ duration: 0.35, delay: 0.15 }}>
              <span className="landing__trust-item"><span className="landing__trust-check">✓</span>50 free credits — no card needed</span>
              <span className="landing__trust-divider">·</span>
              <span className="landing__trust-item"><span className="landing__trust-check">✓</span>Text · Design · Video · Audio · AI Agents</span>
              <span className="landing__trust-divider">·</span>
              <span className="landing__trust-item"><span className="landing__trust-check">✓</span>Cancel anytime</span>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.35, delay: 0.2 }} style={{ width: '100%', maxWidth: '860px' }}>
              <HeroTabsShowcase />
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

      {/* ── VALUE PROP BAR ─────────────────────────────────── */}
      <div className="landing__value-bar">
        <div className="container">
          <span className="landing__value-pill">⚡ One Subscription</span>
          <span className="landing__value-text">All-In-One AI Marketing Tools — Text · Design · Video · Audio · AI Agents</span>
          <Link to="/pricing" className="landing__value-cta">See plans →</Link>
        </div>
      </div>

      {/* ── FEATURE HIGHLIGHTS ─────────────────────────────── */}
      <FeatureHighlightsSection />

      {/* ── POPULAR AGENTS + ALL CATEGORIES ───────────────── */}
      <PopularAgentsSection />

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="landing__how section">
        <div className="container">
          <AnimatedSection>
            <span className="section-pill">{t('landing.how.pill', { defaultValue: 'How It Works' })}</span>
            <h2 className="section-title">{t('landing.how.title', { defaultValue: 'From brief to output in minutes' })}</h2>
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

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <TestimonialsSection />

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
                {isEs ? 'Escala tu output.' : 'Scale your output.'}
                <br />
                <span className="gradient-text">
                  {isEs ? 'Sin límites.' : 'Without limits.'}
                </span>
              </h2>
              <p className="landing__cta-full-subtitle">
                {t('landing.cta.subtitle', { defaultValue: '30 purpose-built AI agents. Structured outputs. No prompting required.' })}
              </p>
              <div className="landing__cta-actions">
                <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                  {isEs ? 'Obtén tus créditos gratis →' : 'Get your credits free →'}
                </Link>
                <button className="btn btn-secondary btn-lg"
                  onClick={() => document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth' })}>
                  {isEs ? 'Ver los agentes ↓' : 'Explore agents ↓'}
                </button>
              </div>
              <div className="landing__cta-trust">
                <span className="landing__trust-item"><span className="landing__trust-check">✓</span>{t('landing.hero.trust1', { defaultValue: 'No credit card required' })}</span>
                <span className="landing__trust-divider">·</span>
                <span className="landing__trust-item"><span className="landing__trust-check">✓</span>{t('landing.hero.trust2', { defaultValue: '50 free credits' })}</span>
                <span className="landing__trust-divider">·</span>
                <span className="landing__trust-item"><span className="landing__trust-check">✓</span>{t('landing.hero.trust3', { defaultValue: 'Cancel anytime' })}</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <WhatsAppPopup />
      {!currentUser && <NichePopup />}
    </div></>
  );
}
