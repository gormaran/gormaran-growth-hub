import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { streamDemoResponse } from '../utils/api';
import './LandingPage.css';
import WhatsAppPopup from '../components/WhatsAppPopup';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
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


// ── Hero Prompt Box ───────────────────────────────────────────────
const HERO_CHIPS = [
  {
    icon: '📋',
    labelKey: 'landing.promptbox.chip1',
    dLabel: 'Client Proposal',
    fillKey: 'landing.promptbox.chip1.fill',
    dFill: 'Write a client proposal for a social media management service',
    route: '/category/agency',
    categoryId: 'agency',
    toolId: 'client-proposal',
    exampleInputs: {
      agency_name: 'Pixel Growth Agency',
      client_name: 'BlueSky Retail Co.',
      service: 'Social Media Management + Content Creation',
      client_goal: 'Increase brand awareness and grow Instagram from 2k to 20k followers',
      budget: '$2,500/month',
      duration: '6 months',
    },
  },
  {
    icon: '🔍',
    labelKey: 'landing.promptbox.chip2',
    dLabel: 'Keyword Research',
    fillKey: 'landing.promptbox.chip2.fill',
    dFill: 'Find the best keywords for my SaaS business blog',
    route: '/category/marketing',
    categoryId: 'marketing',
    toolId: 'seo-keyword-research',
    exampleInputs: {
      keyword: 'project management software',
      industry: 'SaaS',
      content_type: 'Blog Post',
      audience: 'small business owners and startup founders',
    },
  },
  {
    icon: '📣',
    labelKey: 'landing.promptbox.chip3',
    dLabel: 'Ads Campaign',
    fillKey: 'landing.promptbox.chip3.fill',
    dFill: 'Create a Facebook & Instagram ad campaign for my product launch',
    route: '/category/digital',
    categoryId: 'digital',
    toolId: 'meta-ads',
    exampleInputs: {
      product: 'AI-powered project management app for remote teams',
      target_audience: 'Startup founders and team leads, 25-45, interested in productivity',
      offer: 'Free 24-hour trial — no credit card required',
      objective: 'Lead Generation',
      budget: '$30-$100/day',
      funnel_stage: 'Top of Funnel (Cold Traffic)',
    },
  },
];

const DEMO_LIMIT = 3;
const DEMO_KEY = 'gormaran_demo_count';

function HeroPromptBox() {
  const { t } = useTranslation();
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

    if (currentUser) {
      if (activeChip !== null) {
        const chip = HERO_CHIPS[activeChip];
        if (chip.toolId && chip.exampleInputs) {
          sessionStorage.setItem('gormaran_rerun', JSON.stringify({
            toolId: chip.toolId,
            inputs: chip.exampleInputs,
          }));
        }
        navigate(chip.route);
      } else {
        navigate('/dashboard');
      }
      return;
    }

    const used = parseInt(localStorage.getItem(DEMO_KEY) || '0', 10);
    if (used >= DEMO_LIMIT) {
      navigate('/auth?mode=register');
      return;
    }

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
          <motion.div
            className="hero-promptbox__slow-msg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="hero-promptbox__spinner" />
            <span>Conectando servidor AI… un momento</span>
          </motion.div>
        )}
        {output && (
          <motion.div
            ref={outputRef}
            className="hero-promptbox__output"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="hero-promptbox__output-text">{output}</p>
            {!isStreaming && usesLeft === 0 && (
              <Link to="/auth?mode=register" className="hero-promptbox__upgrade-cta">
                {t('landing.promptbox.upgradeCta', { defaultValue: 'Sign up free to unlock all 30+ tools →' })}
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
          onChange={(e) => { setValue(e.target.value); setActiveChip(null); }}
          onKeyDown={handleKey}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            isLimitReached
              ? t('landing.promptbox.limitReached', { defaultValue: 'Sign up free to keep going →' })
              : t('landing.promptbox.placeholder', { defaultValue: 'What do you want to create today?' })
          }
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
        </div>
        {!currentUser && (
          <span className={`hero-promptbox__counter${isLimitReached ? ' hero-promptbox__counter--done' : ''}`}>
            {isLimitReached
              ? t('landing.promptbox.limitDone', { defaultValue: '3/3 demos used' })
              : t('landing.promptbox.remaining', { defaultValue: '{{n}} free left', n: usesLeft }).replace('{{n}}', usesLeft)
            }
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Rotating Hero Text ────────────────────────────────────────────
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

  // Reset typewriter when language changes
  useEffect(() => {
    setPhraseIndex(0);
    setDisplayed('');
    setIsDeleting(false);
  }, [rotatingPhrases]);

  useEffect(() => {
    if (isMobile) return;

    const current = rotatingPhrases[phraseIndex];

    if (!isDeleting && displayed === current) {
      const t = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(t);
    }

    if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setPhraseIndex((i) => (i + 1) % rotatingPhrases.length);
      return;
    }

    const speed = isDeleting ? 35 : 65;
    const t = setTimeout(() => {
      setDisplayed(isDeleting
        ? current.slice(0, displayed.length - 1)
        : current.slice(0, displayed.length + 1)
      );
    }, speed);
    return () => clearTimeout(t);
  }, [displayed, isDeleting, phraseIndex, isMobile, rotatingPhrases]);

  if (isMobile) {
    return (
      <span className="landing__hero-rotating">
        {rotatingPhrases[0]}
      </span>
    );
  }

  return (
    <span className="landing__hero-rotating">
      {displayed}<span className="landing__hero-cursor" />
    </span>
  );
}

// ── Stats ─────────────────────────────────────────────────────────
const STATS = [
  { value: '3h',  unit: '/day', labelKey: 'landing.stats.saved',   defaultLabel: 'saved per user' },
  { value: '2',   unit: 'min',  labelKey: 'landing.stats.pertool', defaultLabel: 'avg. per tool' },
  { value: '30',  unit: '+',    labelKey: 'landing.stats.tools',   defaultLabel: 'AI tools' },
  { value: '0',   unit: '',     labelKey: 'landing.stats.prompts', defaultLabel: 'prompts needed' },
];

// ── How It Works (Step Cards) ─────────────────────────────────────
const HOW_STEPS = [
  {
    num: '01',
    titleKey: 'landing.how.step1.title',
    descKey:  'landing.how.step1.desc',
    defaultTitle: 'Choose Your Tool',
    defaultDesc:  'Pick from 30+ specialized AI tools across 10 business categories — from marketing to finance.',
  },
  {
    num: '02',
    titleKey: 'landing.how.step2.title',
    descKey:  'landing.how.step2.desc',
    defaultTitle: 'Describe Your Goal',
    defaultDesc:  'Fill in a few simple inputs. No complex prompts, no technical knowledge needed.',
  },
  {
    num: '03',
    titleKey: 'landing.how.step3.title',
    descKey:  'landing.how.step3.desc',
    defaultTitle: 'Get AI Results',
    defaultDesc:  'Professional, ready-to-use content delivered in seconds. Copy, paste, done.',
  },
  {
    num: '04',
    titleKey: 'landing.how.step4.title',
    descKey:  'landing.how.step4.desc',
    defaultTitle: 'Review & Publish',
    defaultDesc:  'Edit, refine, or copy your output directly. You stay in full control — AI handles the heavy lifting.',
  },
];



// ── Workflow Demo ──────────────────────────────────────────────────
const DEMO_TOOLS = [
  { cat: '📈 Marketing', name: 'Keyword Research' },
  { cat: '✍️ Content',   name: 'Blog Post Writer', active: true },
  { cat: '✍️ Content',   name: 'Newsletter Writer' },
  { cat: '🛠️ Digital',   name: 'Google Ads Creator' },
  { cat: '🎯 Strategy',  name: 'SWOT Analysis' },
];

const DEMO_PHASES = [
  { labelKey: 'landing.how.demo.phase1', dLabel: 'Select your tool' },
  { labelKey: 'landing.how.demo.phase2', dLabel: 'Fill in your inputs' },
  { labelKey: 'landing.how.demo.phase3', dLabel: 'Get your AI output' },
];

const DEMO_OUTPUT_LINES = [92, 78, 95, 65, 83, 55, 88, 72];

function WorkflowDemo({ phase, setPhase }) {
  const { t } = useTranslation();
  const inViewRef = useRef(null);
  const inView = useInView(inViewRef, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={inViewRef}
      id="workflow-demo"
      className="wf-demo"
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Window chrome ── */}
      <div className="wf-demo__chrome">
        <div className="wf-demo__dots"><span /><span /><span /></div>
        <span className="wf-demo__chrome-title">Gormaran AI Growth Hub</span>
        <div className="wf-demo__phase-pills">
          {DEMO_PHASES.map((dp, i) => (
            <button
              key={i}
              className={`wf-demo__pill${phase === i ? ' active' : ''}`}
              onClick={() => setPhase(i)}
            >
              <span className="wf-demo__pill-num">{i + 1}</span>
              {t(dp.labelKey, { defaultValue: dp.dLabel })}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="wf-demo__body">
        {/* Sidebar */}
        <div className="wf-demo__sidebar">
          <div className="wf-demo__sidebar-label">
            {t('landing.how.demo.tools', { defaultValue: 'AI Tools' })}
          </div>
          {DEMO_TOOLS.map((tool) => (
            <motion.div
              key={tool.name}
              className={`wf-demo__tool${tool.active && phase >= 1 ? ' selected' : ''}${tool.active && phase === 0 ? ' highlight' : ''}`}
              animate={tool.active && phase === 0 ? { x: [0, 4, 0] } : {}}
              transition={{ duration: 0.5, delay: 0.8, repeat: 1 }}
            >
              <span className="wf-demo__tool-cat">{tool.cat}</span>
              <span className="wf-demo__tool-name">{tool.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Main panel */}
        <div className="wf-demo__main">
          <AnimatePresence mode="wait">
            {phase === 0 && (
              <motion.div
                key="select"
                className="wf-demo__panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="wf-demo__empty">
                  <div className="wf-demo__empty-icon">✍️</div>
                  <p className="wf-demo__empty-title">
                    {t('landing.how.demo.selectHint', { defaultValue: 'Select a tool from the sidebar' })}
                  </p>
                  <motion.div
                    className="wf-demo__arrow"
                    animate={{ x: [-4, 0, -4] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  >←</motion.div>
                </div>
              </motion.div>
            )}

            {phase === 1 && (
              <motion.div
                key="form"
                className="wf-demo__panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="wf-demo__tool-header">✍️ Blog Post Writer</div>
                <div className="wf-demo__form">
                  {[
                    { label: t('landing.how.demo.field1', { defaultValue: 'Topic' }),    val: 'AI tools for small businesses in 2025' },
                    { label: t('landing.how.demo.field2', { defaultValue: 'Audience' }), val: 'Freelancers & founders' },
                    { label: t('landing.how.demo.field3', { defaultValue: 'Keyword' }),  val: 'ai tools small business' },
                  ].map((field, i) => (
                    <div key={i} className="wf-demo__field">
                      <div className="wf-demo__field-label">{field.label}</div>
                      <motion.div
                        className="wf-demo__field-value"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.7, delay: i * 0.35, ease: 'easeOut' }}
                      >
                        <span>{field.val}</span>
                        {i === 2 && <span className="how-visual__cursor" />}
                      </motion.div>
                    </div>
                  ))}
                  <motion.button
                    className="wf-demo__generate-btn"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1.2 }}
                  >
                    <span className="preview-dot" />
                    <span className="preview-dot" style={{ animationDelay: '0.18s' }} />
                    <span className="preview-dot" style={{ animationDelay: '0.36s' }} />
                    {t('ui.generateWithAI', { defaultValue: 'Generate with AI' })}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {phase === 2 && (
              <motion.div
                key="output"
                className="wf-demo__panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="wf-demo__output-header">
                  <span className="wf-demo__output-badge">✨ {t('ui.aiOutput', { defaultValue: 'AI Output' })}</span>
                  <span className="wf-demo__word-count">~680 {t('ui.words', { defaultValue: 'words' })}</span>
                </div>
                <div className="wf-demo__output-lines">
                  {DEMO_OUTPUT_LINES.map((w, i) => (
                    <motion.div
                      key={i}
                      className={`wf-demo__output-line${i === 0 ? ' heading' : ''}`}
                      style={{ width: i === 0 ? '70%' : `${w}%` }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                    />
                  ))}
                </div>
                <motion.div
                  className="wf-demo__copy-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <button className="wf-demo__copy-btn">
                    {t('ui.copy', { defaultValue: 'Copy' })} ✓
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Animated output lines (loops) ────────────────────────────────
const OUTPUT_WIDTHS = [90, 75, 95, 60, 82];

function AnimatedOutputLines() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setKey((k) => k + 1), 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="landing__showcase-output">
      {OUTPUT_WIDTHS.map((w, i) => (
        <motion.div
          key={`${key}-${i}`}
          className="landing__showcase-line"
          style={{ width: `${w}%` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.55, delay: i * 0.1, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── Hero Showcase Cards ──────────────────────────────────────────
function HeroShowcase() {
  const { t } = useTranslation();
  return (
    <div className="landing__hero-showcase">
      <div className="container">
        <motion.div
          className="landing__showcase-cards"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="landing__showcase-card">
            <div className="landing__showcase-card-header">
              <div className="landing__showcase-card-icon">🗂️</div>
              <div>
                <div className="landing__showcase-card-title">{t('landing.showcase.card1.title')}</div>
                <div className="landing__showcase-card-sub">{t('landing.showcase.card1.sub')}</div>
              </div>
            </div>
            <div className="landing__showcase-tags">
              {['📈 Marketing', '✍️ Content', '🎯 Strategy', '🛒 E-com', '🚀 Startup'].map((tag) => (
                <span key={tag} className="landing__showcase-tag">{tag}</span>
              ))}
            </div>
          </div>

          <div className="landing__showcase-card landing__showcase-card--featured">
            <div className="landing__showcase-card-header">
              <div className="landing__showcase-card-icon">⚡</div>
              <div>
                <div className="landing__showcase-card-title">{t('landing.showcase.card2.title')}</div>
                <div className="landing__showcase-card-sub">{t('landing.showcase.card2.sub')}</div>
              </div>
            </div>
            <AnimatedOutputLines />
            <span className="landing__showcase-badge">{t('landing.showcase.card2.badge')}</span>
          </div>

          <div className="landing__showcase-card">
            <div className="landing__showcase-card-header">
              <div className="landing__showcase-card-icon">⚡</div>
              <div>
                <div className="landing__showcase-card-title">{t('landing.showcase.card3.title')}</div>
                <div className="landing__showcase-card-sub">{t('landing.showcase.card3.sub')}</div>
              </div>
            </div>
            <div className="landing__showcase-metrics">
              <div className="landing__showcase-metric">
                <span className="landing__showcase-metric-val">{t('landing.showcase.card3.metric1.val')}</span>
                <span className="landing__showcase-metric-label">{t('landing.showcase.card3.metric1.label')}</span>
              </div>
              <div className="landing__showcase-metric">
                <span className="landing__showcase-metric-val">{t('landing.showcase.card3.metric2.val')}</span>
                <span className="landing__showcase-metric-label">{t('landing.showcase.card3.metric2.label')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── How It Works New (BotDesk layout) ────────────────────────────
const PHASE_MAP = [0, 1, 2, 2]; // step index → WorkflowDemo phase
const STEP_DURATION = 3.5;      // seconds per step auto-advance

function HowItWorksNew() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [demoPhase, setDemoPhase] = useState(0);
  const progressRefs = useRef([]);
  const numRefs = useRef([]);
  const tlRef = useRef(null);

  const goToStep = useCallback((i) => {
    setActive(i);
    setDemoPhase(PHASE_MAP[i]);
  }, []);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, (context) => {
      const { reduceMotion } = context.conditions;

      tlRef.current?.kill();
      progressRefs.current.forEach((el) => {
        if (el) gsap.set(el, { scaleX: 0, transformOrigin: 'left center' });
      });

      if (reduceMotion) return;

      // Bounce the active step number
      const numEl = numRefs.current[active];
      if (numEl) {
        gsap.fromTo(numEl,
          { scale: 1 },
          { scale: 1.18, duration: 0.18, yoyo: true, repeat: 1, ease: 'back.out(2)' }
        );
      }

      // Fill progress bar, then advance to next step
      const progressEl = progressRefs.current[active];
      if (!progressEl) return;

      tlRef.current = gsap.to(progressEl, {
        scaleX: 1,
        duration: STEP_DURATION,
        ease: 'none',
        transformOrigin: 'left center',
        onComplete: () => {
          setActive((prev) => {
            const next = (prev + 1) % HOW_STEPS.length;
            setDemoPhase(PHASE_MAP[next]);
            return next;
          });
        },
      });
    });

    return () => mm.revert();
  }, [active]);

  const handleMouseEnter = () => tlRef.current?.pause();
  const handleMouseLeave = () => tlRef.current?.resume();

  return (
    <div
      className="landing__how-layout"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="landing__how-steps-col">
        {HOW_STEPS.map((step, i) => (
          <button
            key={step.num}
            className={`landing__how-step-row${active === i ? ' active' : ''}`}
            onClick={() => goToStep(i)}
          >
            <div
              className="landing__how-step-row-num"
              ref={(el) => (numRefs.current[i] = el)}
            >
              {step.num}
            </div>
            <div className="landing__how-step-row-content">
              <div className="landing__how-step-row-title">
                {t(step.titleKey, { defaultValue: step.defaultTitle })}
              </div>
              <div className="landing__how-step-progress">
                <div
                  className="landing__how-step-progress-bar"
                  ref={(el) => (progressRefs.current[i] = el)}
                />
              </div>
              <AnimatePresence>
                {active === i && (
                  <motion.div
                    className="landing__how-step-row-desc"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {t(step.descKey, { defaultValue: step.defaultDesc })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        ))}
      </div>
      <div className="landing__how-visual-col">
        <WorkflowDemo phase={demoPhase} setPhase={setDemoPhase} />
      </div>
    </div>
  );
}

// ── Plan category / tool data ─────────────────────────────────────
const GROW_CATS = [
  {
    nameKey: 'cat.marketing.name', emoji: '📈',
    tools: ['tool.seo-keyword-research.name','tool.seo-meta-tags.name','tool.copywriting-headlines.name','tool.social-media-captions.name','tool.email-campaign.name','tool.press-release.name'],
  },
  {
    nameKey: 'cat.content.name', emoji: '✍️',
    tools: ['tool.blog-post.name','tool.newsletter.name','tool.video-script.name','tool.logo-generator.name'],
  },
  {
    nameKey: 'cat.digital.name', emoji: '🛠️',
    tools: ['tool.google-ads.name','tool.meta-ads.name','tool.landing-page.name'],
  },
  {
    nameKey: 'cat.strategy.name', emoji: '🎯',
    tools: ['tool.business-plan.name'],
  },
];

const SCALE_EXTRA_CATS = [
  {
    nameKey: 'cat.ecommerce.name', emoji: '🛒',
    tools: ['tool.amazon-listing.name','tool.product-description.name','tool.cro-audit.name'],
  },
  {
    nameKey: 'cat.agency.name', emoji: '🏢',
    tools: ['tool.client-proposal.name','tool.client-report.name','tool.case-study.name'],
  },
  {
    nameKey: 'cat.creative.name', emoji: '🎨',
    tools: ['tool.brand-identity.name','tool.photo-direction.name','tool.video-production.name'],
  },
];

const EVO_EXTRA_CATS = [
  {
    nameKey: 'cat.strategy.name', emoji: '🎯',
    tools: ['tool.market-analysis.name','tool.competitor-research.name','tool.swot-analysis.name'],
  },
  {
    nameKey: 'cat.finance.name', emoji: '💰',
    tools: ['tool.financial-forecast.name','tool.investment-analysis.name','tool.cash-flow-optimizer.name'],
  },
  {
    nameKey: 'cat.startup.name', emoji: '🚀',
    tools: ['tool.investor-pitch.name','tool.gtm-strategy.name','tool.user-stories.name'],
  },
];

// ── Plans ─────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Grow', price: '€19', descKey: 'landing.plans.grow.desc', featured: false,
    categories: GROW_CATS, includesKey: null,
    benefitKeys: ['landing.plans.grow.benefit1', 'landing.plans.grow.benefit2', 'landing.plans.grow.benefit3'],
    bDefaults: ['Rank higher on Google with precision keywords', 'Full email campaigns ready in under 2 minutes', 'Launch-ready ad copy for Google Search'],
  },
  {
    name: 'Scale', price: '€49', descKey: 'landing.plans.scale.desc', featured: true,
    categories: SCALE_EXTRA_CATS, includesKey: 'landing.plans.scale.includes',
    benefitKeys: ['landing.plans.scale.benefit1', 'landing.plans.scale.benefit2', 'landing.plans.scale.benefit3'],
    bDefaults: ['Win more clients with professional proposals', 'Investor-ready business plan in one click', 'Complete visual identity for your brand'],
  },
  {
    name: 'Evolution', price: '€99', descKey: 'landing.plans.evo.desc', featured: false,
    categories: EVO_EXTRA_CATS, includesKey: 'landing.plans.evo.includes',
    benefitKeys: ['landing.plans.evo.benefit1', 'landing.plans.evo.benefit2', 'landing.plans.evo.benefit3'],
    bDefaults: ['TAM/SAM/SOM and competitive intelligence', '12-month forecast with break-even analysis', 'VC-ready pitch deck with Q&A preparation'],
  },
];

// ── Plan Flip Card ────────────────────────────────────────────────
function PlanFlipCard({ plan }) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`landing__plan-flip${plan.featured ? ' landing__plan-flip--featured' : ''}${flipped ? ' is-flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}
    >
      <div className="landing__plan-flip__inner">
        {/* ── Front ── */}
        <div className="landing__plan-flip__front">
          <div className="landing__plan-name">{plan.name}</div>
          <div className="landing__plan-price">
            {plan.price}
            <span className="landing__plan-period">{t('landing.plans.perMonth')}</span>
          </div>
          <p className="landing__plan-flip__desc">{t(plan.descKey)}</p>
          <ul className="landing__plan-benefits">
            {plan.benefitKeys.map((key, i) => (
              <li key={key} className="landing__plan-benefit">
                <span className="landing__plan-benefit-check">✓</span>
                {t(key, { defaultValue: plan.bDefaults[i] })}
              </li>
            ))}
          </ul>
          <span className="landing__plan-flip__hint">
            <span className="landing__plan-flip__hint-icon">↻</span>
            {t('landing.plans.flip.hint', { defaultValue: 'Flip to see all tools' })}
          </span>
          <Link
            to="/pricing"
            className="btn btn-secondary landing__plan-cta"
            onClick={(e) => e.stopPropagation()}
          >
            {t('landing.plans.cta')}
          </Link>
        </div>

        {/* ── Back ── */}
        <div className="landing__plan-flip__back">
          <div className="landing__plan-flip__back-title">
            {t('landing.plans.backTitle', { defaultValue: 'Included Tools' })}
          </div>
          {plan.includesKey && (
            <div className="landing__plan-flip__includes">
              {t(plan.includesKey)}
            </div>
          )}
          <div className="landing__plan-flip__categories">
            {plan.categories.map((cat) => (
              <div key={cat.nameKey} className="landing__plan-flip__cat">
                <div className="landing__plan-flip__cat-name">
                  {cat.emoji} {t(cat.nameKey)}
                </div>
                <div className="landing__plan-flip__tools">
                  {cat.tools.map((toolKey) => (
                    <span key={toolKey} className="landing__plan-flip__tool">
                      {t(toolKey)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/pricing"
            className="btn btn-primary landing__plan-flip__back-cta"
            onClick={(e) => e.stopPropagation()}
          >
            {t('landing.plans.cta')}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Instagram Compact ─────────────────────────────────────────────
const IG_ACTIONS = [
  'landing.ig.action.0',
  'landing.ig.action.1',
  'landing.ig.action.2',
];

function InstagramCompact() {
  const { t } = useTranslation();
  return (
    <section className="landing__ig-compact section">
      <div className="container">
        <div className="landing__ig-compact-inner">
          <motion.div
            className="landing__ig-compact-text"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="landing__ig-compact-badge">
              {t('landing.ig.badge', { defaultValue: '📸 Free Tool' })}
            </span>
            <h2 className="landing__ig-compact-title">
              {t('landing.ig.title', { defaultValue: 'Instagram Express Audit' })}
            </h2>
            <p className="landing__ig-compact-subtitle">
              {t('landing.ig.subtitle', { defaultValue: 'Analyze your profile in 5 minutes and get 3 priority actions to grow faster.' })}
            </p>
            <Link to="/dashboard" className="btn btn-primary">
              {t('landing.ig.cta', { defaultValue: 'Audit My Profile →' })}
            </Link>
          </motion.div>

          <motion.div
            className="landing__ig-compact-preview"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="landing__ig-score-ring">
              <div className="landing__ig-score-inner">
                <span className="landing__ig-score-num">72</span>
                <span className="landing__ig-score-label">/100</span>
              </div>
            </div>
            <div className="landing__ig-compact-actions">
              {IG_ACTIONS.map((key, i) => (
                <div key={i} className="landing__ig-action-item">
                  <span className="landing__ig-action-num">{i + 1}</span>
                  <span>{t(key, { defaultValue: ['Optimise bio with a keyword', 'Add a clear, strategic CTA link', 'Pin your best authority post'][i] })}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Client Logos ──────────────────────────────────────────────────
const CLIENTS = [
  {
    name: 'Ormaran Paisajismo',
    url: 'https://www.ormaran-paisajismo.com',
    logo: null,
  },
  {
    name: 'La Rioja Alta',
    url: 'https://www.riojalta.com',
    logo: 'https://www.riojalta.com/static/images/__logos/grupo-RA-desk.svg',
  },
  {
    name: 'Grupo Agromotor',
    url: 'https://www.grupoagromotor.com',
    logo: null,
  },
  {
    name: 'Just Drive',
    url: 'https://www.just-drive.es',
    logo: 'https://www.just-drive.es/wp-content/themes/just-drive/assets/images/logo-dark-n.png',
  },
];

function ClientLogos() {
  const { t } = useTranslation();
  return (
    <section className="landing__clients section">
      <div className="container">
        <p className="landing__clients-label">
          {t('landing.clients.title', { defaultValue: 'Trusted by real businesses' })}
        </p>
        <div className="landing__clients-strip">
          {CLIENTS.map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="landing__client-logo"
              aria-label={c.name}
            >
              {c.logo ? (
                <img src={c.logo} alt={c.name} />
              ) : (
                <span className="landing__client-name">{c.name}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── What You Get ──────────────────────────────────────────────────
const WHAT_CATS = [
  { emoji: '📈', nameKey: 'cat.marketing.name', plan: 'grow',      toolKeys: ['tool.seo-keyword-research.name', 'tool.seo-meta-tags.name', 'tool.copywriting-headlines.name', 'tool.social-media-captions.name', 'tool.email-campaign.name', 'tool.press-release.name'] },
  { emoji: '✍️', nameKey: 'cat.content.name',   plan: 'grow',      toolKeys: ['tool.blog-post.name', 'tool.newsletter.name', 'tool.video-script.name', 'tool.logo-generator.name', 'tool.social-media-strategy.name'] },
  { emoji: '🛠️', nameKey: 'cat.digital.name',   plan: 'grow',      toolKeys: ['tool.google-ads.name', 'tool.meta-ads.name', 'tool.landing-page.name'] },
  { emoji: '🛒', nameKey: 'cat.ecommerce.name', plan: 'scale',     toolKeys: ['tool.amazon-listing.name', 'tool.product-description.name', 'tool.cro-audit.name'] },
  { emoji: '🏢', nameKey: 'cat.agency.name',    plan: 'scale',     toolKeys: ['tool.client-proposal.name', 'tool.client-report.name', 'tool.case-study.name'] },
  { emoji: '🎨', nameKey: 'cat.creative.name',  plan: 'scale',     toolKeys: ['tool.brand-identity.name', 'tool.photo-direction.name', 'tool.video-production.name'] },
  { emoji: '🎯', nameKey: 'cat.strategy.name',  plan: 'evolution', toolKeys: ['tool.business-plan.name', 'tool.market-analysis.name', 'tool.competitor-research.name', 'tool.swot-analysis.name', 'tool.business-strategy-developer.name'] },
  { emoji: '🚀', nameKey: 'cat.startup.name',   plan: 'evolution', toolKeys: ['tool.investor-pitch.name', 'tool.gtm-strategy.name', 'tool.user-stories.name'] },
  { emoji: '💰', nameKey: 'cat.finance.name',   plan: 'evolution', toolKeys: ['tool.financial-forecast.name', 'tool.investment-analysis.name', 'tool.cash-flow-optimizer.name'] },
  { emoji: '⚡', nameKey: 'cat.automation.name', plan: 'addon',    toolKeys: ['tool.n8n-workflow.name'], isAddon: true },
];

function WygFlipCard({ cat }) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  const planLabel = { grow: 'Grow', scale: 'Scale', evolution: 'Evolution', addon: 'Add-on' }[cat.plan];
  return (
    <div
      className={`wyg-flip wyg-flip--${cat.plan}${flipped ? ' is-flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}
    >
      <div className="wyg-flip__inner">
        <div className="wyg-flip__front">
          <div className="wyg-flip__emoji">{cat.emoji}</div>
          <div className="wyg-flip__name">{t(cat.nameKey)}</div>
          <span className={`wyg-flip__badge wyg-flip__badge--${cat.plan}`}>{planLabel}</span>
          <div className="wyg-flip__count">{cat.toolKeys.length} {t('landing.wyg.toolsLabel', { defaultValue: 'tools' })}</div>
          <span className="wyg-flip__hint">↻ {t('landing.wyg.tap', { defaultValue: 'Tap to see tools' })}</span>
        </div>
        <div className="wyg-flip__back">
          <div className="wyg-flip__back-header">{cat.emoji} {t(cat.nameKey)}</div>
          <div className="wyg-flip__back-tools">
            {cat.toolKeys.map((k) => (
              <span key={k} className="wyg-flip__back-tool">✓ {t(k)}</span>
            ))}
            {cat.isAddon && <span className="wyg-flip__back-tool wyg-flip__back-tool--note">€10 / 10 workflows</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatYouGet() {
  const { t } = useTranslation();
  return (
    <section className="landing__wyg section">
      <div className="container">
        <AnimatedSection>
          <span className="section-pill">{t('landing.wyg.pill', { defaultValue: 'Tools' })}</span>
          <h2 className="section-title">
            {t('landing.wyg.titlePre', { defaultValue: 'Everything in' })}{' '}
            <span className="gradient-text">{t('landing.wyg.titleHighlight', { defaultValue: 'one hub' })}</span>
          </h2>
          <p className="section-subtitle">
            {t('landing.wyg.subtitle', { defaultValue: '30+ specialized AI tools across 10 business categories — structured outputs you can use immediately.' })}
          </p>
        </AnimatedSection>
        <motion.div
          className="landing__wyg-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
          variants={stagger}
        >
          {WHAT_CATS.map((cat) => (
            <motion.div key={cat.nameKey} variants={fadeUp}>
              <WygFlipCard cat={cat} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Workflow Chain Section ────────────────────────────────────────
const WORKFLOW_CHAIN = [
  { step: '01', tool: 'SEO Keyword Research', cat: '📈 Marketing', time: '2 min', output: '20 ranked keywords' },
  { step: '02', tool: 'Blog Post Writer',      cat: '✍️ Content',   time: '2 min', output: '800-word post' },
  { step: '03', tool: 'Social Media Captions', cat: '📈 Marketing', time: '1 min', output: '5 ready captions' },
  { step: '04', tool: 'Email Campaign',        cat: '📈 Marketing', time: '2 min', output: 'Full email copy' },
];

function WorkflowChain() {
  const { t } = useTranslation();
  return (
    <section className="landing__workflow section">
      <div className="container">
        <AnimatedSection>
          <span className="section-pill">{t('landing.workflow.pill', { defaultValue: 'Complete Workflow' })}</span>
          <h2 className="section-title">
            {t('landing.workflow.titlePre', { defaultValue: 'A full marketing workflow' })}{' '}
            <span className="gradient-text">{t('landing.workflow.titleHighlight', { defaultValue: 'in 10 minutes' })}</span>
          </h2>
          <p className="section-subtitle">
            {t('landing.workflow.subtitle', { defaultValue: 'Chain multiple tools together. Each output feeds the next — no copy-pasting, no switching apps.' })}
          </p>
        </AnimatedSection>
        <motion.div
          className="landing__workflow-chain"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
          variants={stagger}
        >
          {WORKFLOW_CHAIN.map((item, i) => (
            <motion.div key={item.step} className="landing__workflow-item" variants={fadeUp}>
              <div className="landing__workflow-step">{item.step}</div>
              <div className="landing__workflow-card">
                <div className="landing__workflow-cat">{item.cat}</div>
                <div className="landing__workflow-tool">{item.tool}</div>
                <div className="landing__workflow-meta">
                  <span className="landing__workflow-time">⏱ {item.time}</span>
                  <span className="landing__workflow-output">→ {item.output}</span>
                </div>
              </div>
              {i < WORKFLOW_CHAIN.length - 1 && (
                <div className="landing__workflow-arrow">→</div>
              )}
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          className="landing__workflow-total"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <span className="landing__workflow-total-label">Total time:</span>
          <span className="landing__workflow-total-value gradient-text">~7 minutes</span>
          <span className="landing__workflow-total-vs">vs. 3+ hours manually</span>
        </motion.div>
      </div>
    </section>
  );
}

// ── Automation Section ────────────────────────────────────────────
function AutomationSection() {
  const { t } = useTranslation();
  return (
    <section className="landing__automation section">
      <div className="container">
        <div className="landing__automation-inner">
          <motion.div
            className="landing__automation-text"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-pill">{t('landing.automation.pill', { defaultValue: 'Automation' })}</span>
            <h2 className="landing__automation-title">
              {t('landing.automation.titlePre', { defaultValue: "Don't just generate content." })}<br />
              <span className="gradient-text">{t('landing.automation.titleHighlight', { defaultValue: 'Automate your entire workflow.' })}</span>
            </h2>
            <p className="landing__automation-desc">
              {t('landing.automation.desc', { defaultValue: 'Connect Gormaran with n8n to build full marketing pipelines that run on autopilot — from research to publishing, without touching a screen.' })}
            </p>
            <ul className="landing__automation-list">
              {[
                t('landing.automation.feat1', { defaultValue: 'Trigger workflows from any event' }),
                t('landing.automation.feat2', { defaultValue: 'Connect to 400+ apps (Notion, Slack, Gmail…)' }),
                t('landing.automation.feat3', { defaultValue: 'Schedule & repeat any AI task automatically' }),
              ].map((feat, i) => (
                <li key={i} className="landing__automation-feat">
                  <span className="landing__trust-check">✓</span> {feat}
                </li>
              ))}
            </ul>
            <Link to="/pricing" className="btn btn-primary">
              {t('landing.automation.cta', { defaultValue: 'Add Automation — €10 →' })}
            </Link>
          </motion.div>
          <motion.div
            className="landing__automation-visual"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="landing__automation-card">
              <div className="landing__automation-card-header">
                <span className="landing__automation-card-dot landing__automation-card-dot--green" />
                <span className="landing__automation-card-label">⚡ n8n Workflow — Active</span>
              </div>
              {[
                { icon: '🔍', label: 'Keyword Research', status: '✓ Done' },
                { icon: '✍️', label: 'Blog Post Writer', status: '✓ Done' },
                { icon: '📱', label: 'Social Captions', status: '↻ Running…' },
                { icon: '📧', label: 'Email Campaign', status: '⏳ Queued' },
              ].map((node, i) => (
                <motion.div
                  key={i}
                  className={`landing__automation-node${node.status.includes('Running') ? ' running' : ''}`}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                >
                  <span className="landing__automation-node-icon">{node.icon}</span>
                  <span className="landing__automation-node-label">{node.label}</span>
                  <span className="landing__automation-node-status">{node.status}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Why Not ChatGPT ───────────────────────────────────────────────
const CHATGPT_VS = [
  { genericKey: 'landing.whychatgpt.vs.0.generic', gormaranKey: 'landing.whychatgpt.vs.0.gormaran', gDefault: 'Open-ended answers', rDefault: 'Execution frameworks by category' },
  { genericKey: 'landing.whychatgpt.vs.1.generic', gormaranKey: 'landing.whychatgpt.vs.1.gormaran', gDefault: 'Trial-and-error prompting', rDefault: 'Guided inputs, zero guesswork' },
  { genericKey: 'landing.whychatgpt.vs.2.generic', gormaranKey: 'landing.whychatgpt.vs.2.gormaran', gDefault: 'Same tool for everything', rDefault: 'Specialized tools per category' },
  { genericKey: 'landing.whychatgpt.vs.3.generic', gormaranKey: 'landing.whychatgpt.vs.3.gormaran', gDefault: 'Raw text you need to edit', rDefault: 'Structured outputs, ready to publish' },
];

function WhyNotChatGPT() {
  const { t } = useTranslation();
  return (
    <section className="landing__whychatgpt section">
      <div className="container">
        <AnimatedSection>
          <span className="section-pill">{t('landing.whychatgpt.pill', { defaultValue: 'Why Gormaran' })}</span>
          <h2 className="section-title">
            {t('landing.whychatgpt.title', { defaultValue: 'Why not just use ChatGPT, Gemini or Claude?' })}
          </h2>
          <p className="section-subtitle">
            {t('landing.whychatgpt.body', { defaultValue: 'Those tools give you answers. Gormaran gives you execution frameworks — specialized tools by category with structured outputs you can publish and use immediately, without trial-and-error.' })}
          </p>
        </AnimatedSection>

        <motion.div
          className="landing__whychatgpt-table"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="landing__whychatgpt-col landing__whychatgpt-col--generic">
            <div className="landing__whychatgpt-col-header">
              <span className="landing__whychatgpt-col-label">
                {t('landing.whychatgpt.col1', { defaultValue: 'Generic AI' })}
              </span>
            </div>
            {CHATGPT_VS.map((row, i) => (
              <div key={i} className="landing__whychatgpt-row">
                <span className="landing__whychatgpt-icon">✗</span>
                {t(row.genericKey, { defaultValue: row.gDefault })}
              </div>
            ))}
          </div>
          <div className="landing__whychatgpt-col landing__whychatgpt-col--gormaran">
            <div className="landing__whychatgpt-col-header">
              <span className="landing__whychatgpt-col-label gradient-text">Gormaran</span>
            </div>
            {CHATGPT_VS.map((row, i) => (
              <div key={i} className="landing__whychatgpt-row">
                <span className="landing__whychatgpt-icon landing__whychatgpt-icon--yes">✓</span>
                {t(row.gormaranKey, { defaultValue: row.rDefault })}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.blockquote
          className="landing__quote"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <p className="landing__quote-text">
            "I went from spending 3 hours a week on blog content to under 20 minutes. The outputs are structured and ready to publish — no editing needed."
          </p>
          <footer className="landing__quote-author">
            <strong>Laura M.</strong>
            <span>Marketing Manager</span>
          </footer>
        </motion.blockquote>
      </div>
    </section>
  );
}

// ── Support / Atención Section ────────────────────────────────────
const SUPPORT_ITEMS = [
  {
    icon: '💬',
    titleKey: 'landing.support.wa.title',
    descKey:  'landing.support.wa.desc',
    tDefault: 'WhatsApp Community',
    dDefault: 'Weekly marketing tips, AI strategies and direct access to the Gormaran team. Free, no spam.',
  },
  {
    icon: '📧',
    titleKey: 'landing.support.email.title',
    descKey:  'landing.support.email.desc',
    tDefault: 'Priority Email Support',
    dDefault: 'Get a real answer within 24 hours — not a bot. Available on Grow, Scale and Evolution plans.',
  },
  {
    icon: '👤',
    titleKey: 'landing.support.manager.title',
    descKey:  'landing.support.manager.desc',
    tDefault: 'Dedicated Account Manager',
    dDefault: 'Personalised onboarding and strategy sessions. Exclusive to Evolution plan subscribers.',
  },
];

function SupportSection() {
  const { t } = useTranslation();
  return (
    <section className="landing__support section">
      <div className="container">
        <AnimatedSection>
          <span className="section-pill">{t('landing.support.pill', { defaultValue: 'Support' })}</span>
          <h2 className="section-title">
            {t('landing.support.titlePre', { defaultValue: 'You are never' })}{' '}
            <span className="gradient-text">{t('landing.support.titleHighlight', { defaultValue: 'alone' })}</span>
          </h2>
          <p className="section-subtitle">
            {t('landing.support.subtitle', { defaultValue: 'Behind every plan there is a team ready to help you get results — not just a subscription.' })}
          </p>
        </AnimatedSection>
        <motion.div
          className="landing__support-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
          variants={stagger}
        >
          {SUPPORT_ITEMS.map((item) => (
            <motion.div key={item.titleKey} className="landing__support-card" variants={fadeUp}>
              <div className="landing__support-icon">{item.icon}</div>
              <h3 className="landing__support-title">
                {t(item.titleKey, { defaultValue: item.tDefault })}
              </h3>
              <p className="landing__support-desc">
                {t(item.descKey, { defaultValue: item.dDefault })}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function LandingPage() {
  const { t } = useTranslation();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'https://gormaran-growth-hub-2.onrender.com'}/health`).catch(() => {});
  }, []);

  return (
    <div className="landing">

      {/* ── SECTION 1: Hero ── */}
      <section className="landing__hero">
        <div className="landing__hero-bg">
          <div className="landing__orb landing__orb-1" />
          <div className="landing__orb landing__orb-2" />
          <div className="landing__orb landing__orb-3" />
          <div className="landing__grid-pattern" />
        </div>

        <div className="container">
          <motion.div
            className="landing__hero-content"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.3 }}>
              <span className="landing__hero-badge">
                {t('landing.hero.badge', { defaultValue: '⚡ AI-Powered Platform' })}
              </span>
            </motion.div>

            <motion.h1 className="landing__hero-title" variants={fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
              <RotatingText />
              <span className="gradient-text">{t('landing.hero.title2')}</span>
            </motion.h1>

            <motion.p className="landing__hero-subtitle" variants={fadeUp} transition={{ duration: 0.35, delay: 0.1 }}>
              {t('landing.hero.subtitleLine1', { defaultValue: '30+ AI tools for marketing, content & business growth.' })}
              <br />
              {t('landing.hero.subtitleLine2', { defaultValue: 'No generic prompts.' })}
            </motion.p>

            <HeroPromptBox />

            <motion.div className="landing__hero-actions" variants={fadeUp} transition={{ duration: 0.35, delay: 0.15 }}>
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg landing__cta-btn">
                {t('landing.hero.cta')}
                <span className="landing__cta-arrow">→</span>
              </Link>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('landing.hero.getDemo', { defaultValue: 'How it works ↓' })}
              </button>
            </motion.div>

            <motion.div className="landing__hero-trust" variants={fadeUp} transition={{ duration: 0.35, delay: 0.2 }}>
              <span className="landing__trust-item">
                <span className="landing__trust-check">✓</span>
                {t('landing.hero.trust1', { defaultValue: 'No credit card required' })}
              </span>
              <span className="landing__trust-divider">·</span>
              <span className="landing__trust-item">
                <span className="landing__trust-check">✓</span>
                {t('landing.hero.trust2', { defaultValue: '24-hour free trial' })}
              </span>
              <span className="landing__trust-divider">·</span>
              <span className="landing__trust-item">
                <span className="landing__trust-check">✓</span>
                {t('landing.hero.trust3', { defaultValue: 'Cancel anytime' })}
              </span>
            </motion.div>

            <motion.div className="landing__hero-social-proof" variants={fadeUp} transition={{ duration: 0.35, delay: 0.25 }}>
              <div className="landing__avatars">
                {['A','B','C','D','E'].map((l) => (
                  <div key={l} className="landing__avatar">{l}</div>
                ))}
              </div>
              <span>
                {t('landing.hero.joinPre', { defaultValue: 'Join' })}{' '}
                <strong>{t('landing.hero.joinCount', { defaultValue: '331+' })}</strong>{' '}
                {t('landing.hero.socialProof', { defaultValue: 'marketers & founders' })}
              </span>
            </motion.div>
          </motion.div>

        </div>
        <HeroShowcase />
      </section>

      {/* ── 2: How It Works ── */}
      <section id="how-it-works" className="landing__how section">
        <div className="container">
          <AnimatedSection>
            <span className="section-pill">{t('landing.how.pill', { defaultValue: 'How It Works' })}</span>
            <h2 className="section-title">
              {t('landing.how.title')}
            </h2>
          </AnimatedSection>
          <HowItWorksNew />
        </div>
      </section>

      {/* ── 3: Stats ── */}
      <section className="landing__stats">
        <div className="container">
          <motion.div
            className="landing__stats-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
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

      {/* ── 4: Why Not ChatGPT + Testimonial ── */}
      <WhyNotChatGPT />

      {/* ── 5: What You Get (tools) ── */}
      <WhatYouGet />

      {/* ── 6: Workflow Chain ── */}
      <WorkflowChain />

      {/* ── 7: Instagram Compact (free tool — no-risk entry) ── */}
      <InstagramCompact />

      {/* ── 8: Automation (upsell before pricing) ── */}
      <AutomationSection />

      {/* ── 9: Client Logos (social proof before price) ── */}
      <ClientLogos />

      {/* ── 10: Plans ── */}
      <section className="landing__plans section">
        <div className="container">
          <AnimatedSection>
            <span className="section-pill">{t('landing.plans.pill', { defaultValue: 'Precios' })}</span>
            <h2 className="section-title">
              {t('landing.plans.title2', { defaultValue: 'Empieza gratis. Escala sin límites.' })}
            </h2>
          </AnimatedSection>
          <motion.div
            className="landing__plans2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-20px' }}
            variants={stagger}
          >
            {/* FREE */}
            <motion.div className="landing__plan2 landing__plan2--free" variants={fadeUp}>
              <h3 className="landing__plan2-name">Free</h3>
              <div className="landing__plan2-price">€0 <span>/mes</span></div>
              <ul className="landing__plan2-features">
                <li>✓ {t('landing.plan.free.f1', { defaultValue: '10 automatizaciones al mes' })}</li>
                <li>✓ {t('landing.plan.free.f2', { defaultValue: 'Todas las herramientas de IA (30+)' })}</li>
                <li>✓ {t('landing.plan.free.f3', { defaultValue: '1 workspace' })}</li>
                <li className="landing__plan2-locked">✗ {t('landing.plan.free.locked', { defaultValue: 'Automatizaciones ilimitadas' })}</li>
              </ul>
              <Link to="/auth?mode=register" className="btn btn-secondary landing__plan2-cta">
                {t('landing.plan.free.cta', { defaultValue: 'Empezar gratis' })}
              </Link>
            </motion.div>

            {/* PRO */}
            <motion.div className="landing__plan2 landing__plan2--pro" variants={fadeUp}>
              <div className="landing__plan2-badge">⭐ {t('landing.plan.pro.badge', { defaultValue: 'Más Popular' })}</div>
              <h3 className="landing__plan2-name">Pro</h3>
              <div className="landing__plan2-price">
                €79 <span>/{t('landing.plan.annual', { defaultValue: 'mes (anual)' })}</span>
              </div>
              <p className="landing__plan2-annual">{t('landing.plan.pro.annual', { defaultValue: 'o €99/mes mensual' })}</p>
              <ul className="landing__plan2-features">
                <li>✓ <strong>{t('landing.plan.pro.f1', { defaultValue: 'Automatizaciones ilimitadas' })}</strong></li>
                <li>✓ {t('landing.plan.pro.f2', { defaultValue: 'Todas las herramientas de IA (30+)' })}</li>
                <li>✓ {t('landing.plan.pro.f3', { defaultValue: 'Workspace con perfil de marca' })}</li>
                <li>✓ {t('landing.plan.pro.f4', { defaultValue: 'Templates optimizados por nicho' })}</li>
                <li>✓ {t('landing.plan.pro.f5', { defaultValue: 'Soporte prioritario' })}</li>
              </ul>
              <Link to="/pricing" className="btn btn-primary landing__plan2-cta">
                {t('landing.plan.pro.cta', { defaultValue: 'Ver Plan Pro →' })}
              </Link>
              <p className="landing__plan2-guarantee">
                🔒 {t('landing.plan.guarantee', { defaultValue: 'Garantía 7 días · Sin permanencia' })}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 11: Support (remove last objections) ── */}
      <SupportSection />

      {/* ── SECTION 10: Stop Wasting Time ── */}
      <section className="landing__cta-full section">
        <div className="container">
          <AnimatedSection>
            <div className="landing__cta-full-card">
              <div className="landing__cta-orb" />
              <span className="landing__cta-full-badge">
                {t('landing.cta.badge', { defaultValue: 'Get Started Today' })}
              </span>
              <h2 className="landing__cta-full-title">
                {t('landing.cta.title', { defaultValue: 'Stop wasting time on manual work.' })}
                <br />
                <span className="gradient-text">
                  {t('landing.cta.titleHighlight', { defaultValue: 'Let AI handle it.' })}
                </span>
              </h2>
              <p className="landing__cta-full-subtitle">
                {t('landing.cta.subtitle')}
                <br />
                {t('landing.cta.subtitleNote')}
              </p>
              <div className="landing__cta-actions">
                <Link to="/auth?mode=register" className="btn btn-primary btn-lg landing__cta-btn">
                  {t('landing.cta.startFree', { defaultValue: 'Start Free Now →' })}
                  <span className="landing__cta-arrow">→</span>
                </Link>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('landing.cta.getDemo', { defaultValue: 'How it works ↓' })}
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
    </div>
  );
}
