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

// ── Stats ─────────────────────────────────────────────────────────
const STATS = [
  { value: '10', unit: '',  labelKey: 'landing.stats.categories' },
  { value: '32', unit: '+', labelKey: 'landing.stats.tools' },
  { value: '99', unit: '%', labelKey: 'landing.stats.precision' },
  { value: '10', unit: 'x', labelKey: 'landing.stats.faster' },
];

// ── How It Works (Step Cards) ─────────────────────────────────────
const HOW_STEPS = [
  {
    num: '01',
    titleKey: 'landing.how.step1.title',
    descKey:  'landing.how.step1.desc',
    defaultTitle: 'Choose Your Tool',
    defaultDesc:  'Pick from 35+ specialized AI tools across 10 business categories — from marketing to finance.',
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
];

const HOW_TAGS = ['📈 Marketing', '✍️ Content', '🛒 E-commerce', '🏢 Agency', '🚀 Startup', '💰 Finance'];

function StepVisual({ index }) {
  if (index === 0) {
    return (
      <div className="how-visual how-visual--1">
        <div className="how-visual__tags">
          {HOW_TAGS.map((tag) => (
            <span key={tag} className="how-visual__tag">{tag}</span>
          ))}
        </div>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="how-visual how-visual--2">
        <div className="how-visual__form">
          <div className="how-visual__field">
            <span className="how-visual__label">Topic</span>
            <div className="how-visual__input">
              AI tools for small businesses<span className="how-visual__cursor" />
            </div>
          </div>
          <div className="how-visual__field">
            <span className="how-visual__label">Audience</span>
            <div className="how-visual__input">Marketers & Founders</div>
          </div>
          <div className="how-visual__btn">
            <span className="preview-dot" />
            <span className="preview-dot" style={{ animationDelay: '0.18s' }} />
            <span className="preview-dot" style={{ animationDelay: '0.36s' }} />
            Generating…
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="how-visual how-visual--3">
      <div className="how-visual__output">
        <span className="how-visual__output-badge">✨ AI Output</span>
        {[88, 72, 95, 60, 82, 50].map((w, i) => (
          <div
            key={i}
            className="how-visual__line"
            style={{ '--w': `${w}%`, '--delay': `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <div ref={ref} className="landing__how-steps">
      {HOW_STEPS.map((step, i) => (
        <motion.div
          key={step.num}
          className="landing__how-step"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <StepVisual index={i} />
          <div className="landing__how-step-body">
            <div className="landing__how-step-num">{step.num}</div>
            <h3 className="landing__how-step-title">
              {t(step.titleKey, { defaultValue: step.defaultTitle })}
            </h3>
            <p className="landing__how-step-desc">
              {t(step.descKey, { defaultValue: step.defaultDesc })}
            </p>
          </div>
        </motion.div>
      ))}
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
    tools: ['tool.blog-post.name','tool.newsletter.name','tool.video-script.name'],
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
  { name: 'Grow',      price: '€19', descKey: 'landing.plans.grow.desc',  featured: false, categories: GROW_CATS,        includesKey: null },
  { name: 'Scale',     price: '€49', descKey: 'landing.plans.scale.desc', featured: true,  categories: SCALE_EXTRA_CATS, includesKey: 'landing.plans.scale.includes' },
  { name: 'Evolution', price: '€99', descKey: 'landing.plans.evo.desc',   featured: false, categories: EVO_EXTRA_CATS,   includesKey: 'landing.plans.evo.includes' },
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
          <span className="landing__plan-flip__hint">
            <span className="landing__plan-flip__hint-icon">↻</span>
            {t('landing.plans.flip.hint', { defaultValue: 'Hover to see all tools' })}
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

      {/* ── SECTION 2: Stats ── */}
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
                <div className="landing__stat-label">{t(stat.labelKey)}</div>
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
              <motion.div key={plan.name} variants={fadeUp}>
                <PlanFlipCard plan={plan} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 5: Why Different ── */}
      <section className="landing__features section">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title">
              {t('landing.features.titlePre', { defaultValue: 'Why' })}{' '}
              <span className="gradient-text">Gormaran</span>{' '}
              {t('landing.features.titlePost', { defaultValue: 'is Different' })}
            </h2>
            <p className="section-subtitle">
              {t('landing.features.subtitle')}
            </p>
          </AnimatedSection>
          <motion.div
            className="grid-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-20px' }}
            variants={stagger}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div key={i} className="landing__feature-card" variants={fadeUp}>
                <div className="landing__feature-icon">
                  {['🎯', '⚡', '🛠️', '🔒', '📊', '🚀'][i]}
                </div>
                <h3 className="landing__feature-title">
                  {t(`landing.feature.${i}.title`)}
                </h3>
                <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {t(`landing.feature.${i}.desc`)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 6: Instagram Compact ── */}
      <InstagramCompact />

      {/* ── SECTION 7: Client Logos ── */}
      <ClientLogos />

      {/* ── SECTION 8: Stop Wasting Time ── */}
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
                <Link to="/pricing" className="btn btn-secondary btn-lg">
                  {t('landing.cta.seePricing', { defaultValue: 'See Pricing' })}
                </Link>
              </div>
              <p className="landing__cta-note">
                {t('landing.cta.note', { defaultValue: '14-day free trial · No credit card required' })}
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <WhatsAppPopup />
    </div>
  );
}
