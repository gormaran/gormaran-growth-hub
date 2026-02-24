import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../data/categories';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';
import './FlipCard.css';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import WhatsAppPopup from '../components/WhatsAppPopup';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

const STATS = [
  { value: '7', suffix: '', labelKey: 'landing.stats.categories' },
  { value: '35', suffix: '+', labelKey: 'landing.stats.tools' },
  { value: '99', suffix: '%', labelKey: 'landing.stats.precision' },
  { value: '10x', suffix: '', labelKey: 'landing.stats.faster' },
];

const FEATURES = [
  { icon: '🧠', idx: 0 },
  { icon: '⚡', idx: 1 },
  { icon: '🎯', idx: 2 },
  { icon: '🔒', idx: 3 },
  { icon: '📊', idx: 4 },
  { icon: '🚀', idx: 5 },
];

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

const CATEGORY_MIN_PLAN = {
  marketing:  'free',
  content:    'free',
  strategy:   'pro',
  digital:    'pro',
  ecommerce:  'business',
  agency:     'business',
  startup:    'business',
  automation: 'business',
};

function getVideoContent(catId) {
  switch (catId) {
    case 'marketing':
      return (
        <div className="fvc-bars">
          {[65, 82, 58, 90, 74].map((h, i) => (
            <div key={i} className="fvc-bar" style={{ '--bar-h': `${h}%`, '--bar-delay': `${i * 0.15}s` }} />
          ))}
        </div>
      );
    case 'content':
      return (
        <div className="fvc-typing">
          {[90, 70, 85, 55, 80].map((w, i) => (
            <div key={i} className="fvc-typing-line" style={{ '--tw': `${w}%`, '--td': `${i * 0.2}s` }} />
          ))}
        </div>
      );
    case 'strategy':
      return (
        <div className="fvc-swot">
          {['S', 'W', 'O', 'T'].map((l, i) => (
            <div key={l} className="fvc-swot-cell" style={{ '--td': `${i * 0.15}s` }}>
              <span>{l}</span>
            </div>
          ))}
        </div>
      );
    case 'digital':
      return (
        <div className="fvc-metrics">
          {[['CTR', '4.2%'], ['ROAS', '3.8x'], ['Conv', '12%'], ['CPC', '$0.84']].map(([label, val], i) => (
            <div key={label} className="fvc-metric-card" style={{ '--td': `${i * 0.12}s` }}>
              <span className="fvc-metric-label">{label}</span>
              <span className="fvc-metric-val">{val}</span>
            </div>
          ))}
        </div>
      );
    case 'ecommerce':
      return (
        <div className="fvc-products">
          {[['👟', '$89'], ['👜', '$149'], ['⌚', '$299']].map(([icon, price], i) => (
            <div key={icon} className="fvc-product-card" style={{ '--td': `${i * 0.15}s` }}>
              <span className="fvc-product-icon">{icon}</span>
              <span className="fvc-product-price">{price}</span>
            </div>
          ))}
        </div>
      );
    case 'agency':
      return (
        <div className="fvc-pipeline">
          {['Lead', 'Prop.', 'Rev.', 'Signed'].map((stage, i) => (
            <>
              <div key={stage} className="fvc-stage" style={{ '--td': `${i * 0.15}s` }}>{stage}</div>
              {i < 3 && <div key={`${stage}-arrow`} className="fvc-arrow">›</div>}
            </>
          ))}
        </div>
      );
    case 'startup':
      return (
        <div className="fvc-kpi">
          {[['MRR', '↑ 24%'], ['Users', '↑ 189'], ['Churn', '↓ 1.2%']].map(([label, val], i) => (
            <div key={label} className="fvc-kpi-row" style={{ '--td': `${i * 0.18}s` }}>
              <span className="fvc-kpi-label">{label}</span>
              <span className="fvc-kpi-val">{val}</span>
            </div>
          ))}
        </div>
      );
    case 'automation':
      return (
        <div className="fvc-nodes">
          {['⚡', '🔗', '📤'].map((icon, i) => (
            <>
              <div key={icon} className="fvc-node" style={{ '--td': `${i * 0.2}s` }}>{icon}</div>
              {i < 2 && <div key={`${icon}-conn`} className="fvc-connector" />}
            </>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function FlipCard({ cat, i }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { isCategoryLocked } = useSubscription();

  const minPlan = CATEGORY_MIN_PLAN[cat.id] || 'pro';
  const isLocked = currentUser ? isCategoryLocked(cat.id) : false;

  let ctaKey, ctaTo, ctaLocked;
  if (currentUser && !isLocked) {
    // logged in and has access → go directly to the tool
    ctaKey = 'landing.categories.openTool';
    ctaTo = `/dashboard/${cat.id}`;
    ctaLocked = false;
  } else if (minPlan === 'business') {
    ctaKey = 'landing.categories.availableBusiness';
    ctaTo = currentUser ? '/pricing' : '/auth?mode=register';
    ctaLocked = true;
  } else if (minPlan === 'pro') {
    ctaKey = 'landing.categories.availablePro';
    ctaTo = currentUser ? '/pricing' : '/auth?mode=register';
    ctaLocked = true;
  } else {
    // free category — invite to register
    ctaKey = 'landing.categories.tryFree';
    ctaTo = '/auth?mode=register';
    ctaLocked = false;
  }

  const ctaDefaults = {
    'landing.categories.tryFree': 'Try Free →',
    'landing.categories.openTool': 'Open Tool →',
    'landing.categories.availablePro': 'Available on Pro →',
    'landing.categories.availableBusiness': 'Available on Business →',
  };

  return (
    <motion.div
      className="flip-card-wrapper"
      variants={fadeUp}
      transition={{ duration: 0.5, delay: i * 0.05 }}
    >
      <div className="flip-card" style={{ '--cat-color': cat.color }}>
        <div className="flip-card__inner">

          {/* ── FRONT ── */}
          <div className="flip-card__front">
            <div
              className="landing__category-icon"
              style={{ background: `${cat.color}20`, borderColor: `${cat.color}40` }}
            >
              {cat.icon}
            </div>
            <h3 className="landing__category-name">
              {t(`cat.${cat.id}.name`, { defaultValue: cat.name })}
            </h3>
            <p className="landing__category-desc">
              {t(`cat.${cat.id}.desc`, { defaultValue: cat.description })}
            </p>
            <div className="landing__category-tools">
              {cat.tools.slice(0, 3).map((tool) => (
                <span key={tool.id} className="landing__tool-tag">
                  {tool.icon} {t(`tool.${tool.id}.name`, { defaultValue: tool.name })}
                </span>
              ))}
              {cat.tools.length > 3 && (
                <span className="landing__tool-tag landing__tool-tag--more">
                  +{cat.tools.length - 3} {t('landing.categories.more', { defaultValue: 'more' })}
                </span>
              )}
            </div>
            <div className="flip-card__hint">
              <span className="flip-card__hint-icon">↻</span>
              {t('landing.categories.flipHint', { defaultValue: 'hover for demo' })}
            </div>
          </div>

          {/* ── BACK ── */}
          <div className="flip-card__back">
            {/* Category-specific animated preview */}
            <div className="flip-card__video">
              <div className="flip-card__video-bg-icon">{cat.icon}</div>
              <div className="flip-card__video-content">
                {getVideoContent(cat.id)}
              </div>
              <div className="flip-card__play">▶</div>
            </div>

            <p className="flip-card__back-title">
              {t(`cat.${cat.id}.name`, { defaultValue: cat.name })}
            </p>

            <div className="flip-card__tool-grid">
              {cat.tools.map((tool) => (
                <div key={tool.id} className="flip-card__tool-row">
                  <span className="flip-card__tool-icon">{tool.icon}</span>
                  <span>{t(`tool.${tool.id}.name`, { defaultValue: tool.name })}</span>
                </div>
              ))}
            </div>

            <Link
              to={ctaTo}
              className={`flip-card__cta-btn${ctaLocked ? ' flip-card__cta-btn--locked' : ''}`}
            >
              {t(ctaKey, { defaultValue: ctaDefaults[ctaKey] })}
            </Link>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

const PREVIEW_STEPS = [
  { catIdx: 0, tool: '🔍 Keyword Research',    label: 'Target Keyword', value: 'email marketing automation',      lines: [90, 75, 85, 60, 80] },
  { catIdx: 2, tool: '✍️ Blog Post Writer',     label: 'Topic',          value: 'AI tools for small businesses',   lines: [85, 70, 90, 65, 75] },
  { catIdx: 1, tool: '📊 SWOT Analysis',        label: 'Company',        value: 'Gormaran AI Growth Hub',          lines: [80, 92, 70, 88, 76] },
  { catIdx: 3, tool: '💡 Google Ads Generator', label: 'Product',        value: 'AI-powered marketing suite',      lines: [88, 72, 95, 68, 82] },
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
      {/* Sidebar */}
      <div className="landing__preview-sidebar">
        {PREVIEW_CATS.map((cat, i) => (
          <div
            key={cat}
            className={`landing__preview-cat${i === cur.catIdx ? ' active' : ''}`}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* Main content — animates on step change */}
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

        {/* Generating indicator */}
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

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="landing__hero">
        {/* Background elements */}
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
                {t('landing.hero.badge', { defaultValue: '⚡ Powered by Claude AI' })}
              </span>
            </motion.div>

            <motion.h1 className="landing__hero-title" variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
              {t('landing.hero.title1', { defaultValue: 'The AI Growth Hub' })}
              <br />
              <span className="gradient-text">{t('landing.hero.title2', { defaultValue: 'Built for Results' })}</span>
            </motion.h1>

            <motion.p className="landing__hero-subtitle" variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
              {t('landing.hero.subtitle', { defaultValue: '7 AI-powered categories. 35+ precision-engineered tools. One platform to grow your business faster.' })}
            </motion.p>

            <motion.div className="landing__hero-actions" variants={fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg landing__cta-btn">
                {t('landing.hero.cta', { defaultValue: 'Start Free — No Credit Card' })}
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
                <strong>{t('landing.hero.joinCount', { defaultValue: '2,000+' })}</strong>{' '}
                {t('landing.hero.socialProof', { defaultValue: 'marketers & founders' })}
              </span>
            </motion.div>
          </motion.div>

          {/* Hero UI Preview */}
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

      {/* Stats */}
      <section className="landing__stats">
        <div className="container">
          <motion.div
            className="landing__stats-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            {STATS.map((stat) => (
              <motion.div key={stat.labelKey} className="landing__stat" variants={fadeUp}>
                <div className="landing__stat-value">
                  <span className="gradient-text">{stat.value}</span>{stat.suffix}
                </div>
                <div className="landing__stat-label">{t(stat.labelKey)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="landing__categories section" id="features">
        <div className="container">
          <AnimatedSection>
            <div className="landing__badge-wrap">
              <span className="badge badge-primary">{t('landing.categories.badge', { defaultValue: '7 Powerful Categories' })}</span>
            </div>
            <h2 className="section-title" style={{ marginTop: '1rem' }}>
              {t('landing.categories.titlePre', { defaultValue: 'Every Tool You Need to' })}{' '}
              <span className="gradient-text">{t('landing.categories.titleHighlight', { defaultValue: 'Grow' })}</span>
            </h2>
            <p className="section-subtitle">
              {t('landing.categories.subtitle', { defaultValue: 'Each category is precision-tuned with expert AI prompts. Not generic AI — real expertise built into every tool.' })}
            </p>
          </AnimatedSection>

          <motion.div
            className="landing__categories-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {CATEGORIES.map((cat, i) => (
              <FlipCard key={cat.id} cat={cat} i={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="landing__features section">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title">
              {t('landing.features.titlePre', { defaultValue: 'Why' })}{' '}
              <span className="gradient-text">Gormaran</span>{' '}
              {t('landing.features.titlePost', { defaultValue: 'is Different' })}
            </h2>
            <p className="section-subtitle">
              {t('landing.features.subtitle', { defaultValue: "We didn't just add a chat box. Every tool is purpose-engineered with expert knowledge for precise, actionable output." })}
            </p>
          </AnimatedSection>

          <motion.div
            className="grid-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.idx} className="landing__feature-card" variants={fadeUp}>
                <div className="landing__feature-icon">{feature.icon}</div>
                <h3 className="landing__feature-title">{t(`landing.feature.${feature.idx}.title`)}</h3>
                <p>{t(`landing.feature.${feature.idx}.desc`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing__testimonials section">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title">
              {t('landing.testimonials.titlePre', { defaultValue: 'Loved by' })}{' '}
              <span className="gradient-text">{t('landing.testimonials.titleHighlight', { defaultValue: 'Growth Teams' })}</span>
            </h2>
          </AnimatedSection>
          <motion.div
            className="grid-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
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

      {/* CTA Section */}
      <section className="landing__cta section">
        <div className="container">
          <AnimatedSection>
            <div className="landing__cta-card">
              <div className="landing__cta-orb" />
              <span className="badge badge-primary" style={{ marginBottom: '1.5rem' }}>
                {t('landing.cta.badge', { defaultValue: 'Get Started Today' })}
              </span>
              <h2 className="landing__cta-title">
                {t('landing.cta.title', { defaultValue: 'Stop Wasting Time on Manual Work.' })}
                <br />
                <span className="gradient-text">{t('landing.cta.titleHighlight', { defaultValue: 'Let AI Handle It.' })}</span>
              </h2>
              <p>
                {t('landing.cta.subtitle', { defaultValue: 'Join thousands of marketers, founders, and agencies growing faster with Gormaran. Start free — no credit card required.' })}
              </p>
              <div className="landing__cta-actions">
                <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                  {t('landing.cta.startFree', { defaultValue: 'Start Free Now →' })}
                </Link>
                <Link to="/pricing" className="btn btn-secondary btn-lg">
                  {t('landing.cta.seePricing', { defaultValue: 'See Pricing' })}
                </Link>
              </div>
              <small className="landing__cta-note">
                {t('landing.cta.note', { defaultValue: 'Free plan includes 3 AI requests/day · No credit card required' })}
              </small>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <WhatsAppPopup />
    </div>
  );
}
