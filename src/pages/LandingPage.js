import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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

// ── Hero Preview (unchanged) ─────────────────────────────────────
const PREVIEW_STEPS = [
  { catIdx: 0, tool: '🔍 Keyword Research',    label: 'Target Keyword', value: 'email marketing automation',    lines: [90, 75, 85, 60, 80] },
  { catIdx: 2, tool: '✍️ Blog Post Writer',     label: 'Topic',          value: 'AI tools for small businesses', lines: [85, 70, 90, 65, 75] },
  { catIdx: 1, tool: '📊 SWOT Analysis',        label: 'Company',        value: 'Gormaran AI Growth Hub',        lines: [80, 92, 70, 88, 76] },
  { catIdx: 3, tool: '💡 Google Ads Generator', label: 'Product',        value: 'AI-powered marketing suite',    lines: [88, 72, 95, 68, 82] },
];

const PREVIEW_CATS = [
  '📈 Marketing & Growth',
  '🎯 Business Strategy',
  '✍️ Content Creation',
  '🛠️ Digital Tools',
];

function HeroPreview() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % PREVIEW_STEPS.length), 3800);
    return () => clearInterval(id);
  }, []);
  const cur = PREVIEW_STEPS[step];
  return (
    <div className="landing__preview-body">
      <div className="landing__preview-sidebar">
        {PREVIEW_CATS.map((cat, i) => (
          <div key={cat} className={`landing__preview-cat${i === cur.catIdx ? ' active' : ''}`}>
            {cat}
          </div>
        ))}
      </div>
      <div className="landing__preview-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="landing__preview-tool-header">{cur.tool}</div>
            <div className="landing__preview-input">
              <div className="landing__preview-label">{cur.label}</div>
              <div className="landing__preview-value">{cur.value}</div>
            </div>
            <div className="landing__preview-output">
              {cur.lines.map((w, i) => (
                <motion.div
                  key={i}
                  className="landing__preview-line"
                  style={{ width: `${w}%`, transformOrigin: 'left' }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.1, ease: 'easeOut' }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="preview-generating">
          <span className="preview-dot" />
          <span className="preview-dot" style={{ animationDelay: '0.18s' }} />
          <span className="preview-dot" style={{ animationDelay: '0.36s' }} />
          <span className="preview-generating-text">AI generating…</span>
        </div>
      </div>
    </div>
  );
}

// ── Problem Section ──────────────────────────────────────────────
const PROBLEM_CARDS = [
  { icon: '⏳', key: 'landing.problem.card1' },
  { icon: '📉', key: 'landing.problem.card2' },
  { icon: '📄', key: 'landing.problem.card3' },
];

// ── How It Works ─────────────────────────────────────────────────
const HOW_TABS = [
  {
    tabKey: 'landing.how.tab1.label',
    toolKey: 'landing.how.tab1.tool',
    benefitKey: 'landing.how.tab1.benefit',
    output: `Subject: The tool saving marketers 2h/week

Hey {{first_name}},

We've been testing something new for 3 months.
The results were unexpected.

→ Open rates jumped 34%
→ Click-through rate doubled
→ Time to write: under 2 minutes

Here's the exact playbook we used...

Full breakdown inside.
Ready-to-use templates included.`,
  },
  {
    tabKey: 'landing.how.tab2.label',
    toolKey: 'landing.how.tab2.tool',
    benefitKey: 'landing.how.tab2.benefit',
    output: `CAMPAIGN: AI Marketing Platform
GOAL: Lead Generation
━━━━━━━━━━━━━━━━━━━━

Headline 1: AI Tools for Marketers   (30 ✓)
Headline 2: Save 10h/Week on Copy    (25 ✓)
Headline 3: Grow Faster with AI      (21 ✓)

Description 1:
Professional copy in seconds.
AI-powered. Conversion-optimized.
Start free — no credit card.

Description 2:
35+ marketing AI tools, one platform.
Results in minutes, not hours.`,
  },
  {
    tabKey: 'landing.how.tab3.label',
    toolKey: 'landing.how.tab3.tool',
    benefitKey: 'landing.how.tab3.benefit',
    output: `CLIENT PROPOSAL
━━━━━━━━━━━━━━━━━━━━━━━━
Social Media Management
Client: Pixel Growth Agency

INVESTMENT: €1,200/month

DELIVERABLES:
→ 12 Instagram posts/month
→ 8 LinkedIn articles/month
→ Weekly performance report
→ Monthly strategy call (60min)

TIMELINE: 3-month engagement`,
  },
];

function useTyping(text, speed = 16) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return displayed;
}

function HowItWorks() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const current = HOW_TABS[activeTab];
  const typed = useTyping(current.output);

  return (
    <div className="landing__how-wrapper">
      <div className="landing__how-tabs">
        {HOW_TABS.map((tab, i) => (
          <button
            key={i}
            className={`landing__how-tab${i === activeTab ? ' active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {t(tab.tabKey)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="landing__how-mockup"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          <div className="landing__how-mockup-header">
            <div className="landing__how-mockup-dots"><span /><span /><span /></div>
            <span className="landing__how-mockup-toolname">✨ {t(current.toolKey)}</span>
          </div>
          <div className="landing__how-mockup-body">
            <div className="landing__how-mockup-label">AI Output</div>
            <pre className="landing__how-mockup-output">
              {typed}<span className="landing__cursor" />
            </pre>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="landing__how-benefit">✦ {t(current.benefitKey)}</p>
    </div>
  );
}

// ── Plans ─────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Grow',
    price: '€19',
    toolKeys: ['landing.plans.grow.tool1', 'landing.plans.grow.tool2', 'landing.plans.grow.tool3'],
  },
  {
    name: 'Scale',
    price: '€49',
    toolKeys: ['landing.plans.scale.tool1', 'landing.plans.scale.tool2', 'landing.plans.scale.tool3'],
    featured: true,
  },
  {
    name: 'Evolution',
    price: '€99',
    toolKeys: ['landing.plans.evo.tool1', 'landing.plans.evo.tool2', 'landing.plans.evo.tool3'],
  },
];

// ── Testimonials ─────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    text: 'Gormaran cut our content production time by 70%. The category-specific prompts are unreal — it actually understands what we need.',
    name: 'Sarah K.',
    title: 'Head of Marketing, TechFlow',
    avatar: 'S',
  },
  {
    text: 'As a startup founder, I used the Investor Pitch tool to refine my deck. The Q&A prep section alone was worth 10x the subscription.',
    name: 'Marcus T.',
    title: 'Founder, LaunchPad AI',
    avatar: 'M',
  },
  {
    text: 'My agency uses the Proposal Generator and Client Report tools every week. Our clients love the professionalism of the output.',
    name: 'Olivia R.',
    title: 'CEO, Pixel Growth Agency',
    avatar: 'O',
  },
];

// ── Main Component ───────────────────────────────────────────────
export default function LandingPage() {
  const { t } = useTranslation();

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
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <span className="landing__hero-badge">
                {t('landing.hero.badge', { defaultValue: '⚡ AI-Powered Platform' })}
              </span>
            </motion.div>

            <motion.h1 className="landing__hero-title" variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
              {t('landing.hero.title1')}
              <br />
              <span className="gradient-text">{t('landing.hero.title2')}</span>
            </motion.h1>

            <motion.p className="landing__hero-subtitle" variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.div className="landing__hero-actions" variants={fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg landing__cta-btn">
                {t('landing.hero.cta')}
                <span className="landing__cta-arrow">→</span>
              </Link>
              <Link to="/pricing" className="btn btn-secondary btn-lg">
                {t('landing.hero.viewPricing', { defaultValue: 'View Pricing' })}
              </Link>
            </motion.div>

            <motion.div className="landing__hero-social-proof" variants={fadeUp} transition={{ duration: 0.6, delay: 0.4 }}>
              <div className="landing__avatars">
                {['A','B','C','D','E'].map((l) => (
                  <div key={l} className="landing__avatar">{l}</div>
                ))}
              </div>
              <span>
                {t('landing.hero.joinPre', { defaultValue: 'Join' })}{' '}
                <strong>{t('landing.hero.joinCount', { defaultValue: '70+' })}</strong>{' '}
                {t('landing.hero.socialProof', { defaultValue: 'marketers & founders' })}
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            className="landing__hero-preview"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="landing__preview-window">
              <div className="landing__preview-header">
                <div className="landing__preview-dots">
                  <span /><span /><span />
                </div>
                <span className="landing__preview-title">Gormaran AI Growth Hub</span>
              </div>
              <HeroPreview />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: Problem ── */}
      <section className="landing__problem section">
        <div className="container">
          <motion.div
            className="landing__problem-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-20px' }}
            variants={stagger}
          >
            {PROBLEM_CARDS.map((card) => (
              <motion.div key={card.key} className="landing__problem-card" variants={fadeUp}>
                <div className="landing__problem-icon">{card.icon}</div>
                <p className="landing__problem-text">{t(card.key)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3: How It Works ── */}
      <section className="landing__how section">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title">
              {t('landing.how.title')}
            </h2>
          </AnimatedSection>
          <HowItWorks />
        </div>
      </section>

      {/* ── SECTION 4: Plans ── */}
      <section className="landing__plans section">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title">
              {t('landing.plans.title')}
            </h2>
          </AnimatedSection>
          <motion.div
            className="landing__plans-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-20px' }}
            variants={stagger}
          >
            {PLANS.map((plan) => (
              <motion.div
                key={plan.name}
                className={`landing__plan-card${plan.featured ? ' landing__plan-card--featured' : ''}`}
                variants={fadeUp}
              >
                <div className="landing__plan-name">{plan.name}</div>
                <div className="landing__plan-price">
                  {plan.price}
                  <span className="landing__plan-period">{t('landing.plans.perMonth')}</span>
                </div>
                <ul className="landing__plan-tools">
                  {plan.toolKeys.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
                <Link to="/pricing" className="btn btn-secondary landing__plan-cta">
                  {t('landing.plans.cta')}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 5: Social Proof ── */}
      <section className="landing__testimonials section">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title">
              {t('landing.testimonials.titlePre', { defaultValue: 'Trusted by' })}{' '}
              <span className="gradient-text">
                {t('landing.testimonials.titleHighlight', { defaultValue: '70+ marketers & founders' })}
              </span>
            </h2>
          </AnimatedSection>
          <motion.div
            className="grid-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-20px' }}
            variants={stagger}
          >
            {TESTIMONIALS.map((t2) => (
              <motion.div key={t2.name} className="landing__testimonial" variants={fadeUp}>
                <div className="landing__testimonial-stars">★★★★★</div>
                <p className="landing__testimonial-text">"{t2.text}"</p>
                <div className="landing__testimonial-author">
                  <div className="landing__testimonial-avatar">{t2.avatar}</div>
                  <div>
                    <strong>{t2.name}</strong>
                    <small>{t2.title}</small>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 6: CTA Final ── */}
      <section className="landing__cta section">
        <div className="container">
          <AnimatedSection>
            <div className="landing__cta-card">
              <div className="landing__cta-orb" />
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg landing__cta-main-btn">
                {t('landing.cta.main')}
                <span className="landing__cta-arrow">→</span>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <WhatsAppPopup />
    </div>
  );
}
