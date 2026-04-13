import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { pushEvent } from '../utils/analytics';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { CATEGORIES } from '../data/categories';
import { useTranslation } from 'react-i18next';
import InstagramAuditSection from '../components/InstagramAuditSection';
import './Dashboard.css';

const CATEGORY_MIN_TIER = {
  content:    'Grow',
  strategy:   'Grow',
  digital:    'Grow',
  ecommerce:  'Scale',
  agency:     'Scale',
  creative:   'Scale',
  startup:    'Evolution',
  finance:    'Evolution',
};

const GOALS = [
  { id: 'clients',  label: '🤝 Get Clients',     cats: ['strategy', 'agency'] },
  { id: 'content',  label: '✍️ Create Content',   cats: ['content', 'marketing', 'creative'] },
  { id: 'digital',  label: '📈 Grow Digital',     cats: ['digital', 'ecommerce'] },
];

const QUICK_WINS = [
  {
    icon: '🔬',
    label: 'Competitor Research',
    hint: 'for Airbnb',
    cat: 'strategy',
    toolId: 'competitor-research',
    inputs: {
      business_name: 'Airbnb',
      business_url: 'https://airbnb.com',
      your_product: 'Short-term rental marketplace connecting hosts and travelers',
      location: 'Global',
      target_customer: 'Travelers and property owners',
    },
  },
  {
    icon: '📄',
    label: 'Client Proposal',
    hint: 'for a design agency',
    cat: 'agency',
    toolId: 'client-proposal',
    inputs: {
      agency_name: 'Studio Nova',
      client_name: 'GreenLeaf Organic Co.',
      service: 'Brand Identity + Website Redesign',
      client_goal: 'Modernize brand and increase online conversions by 40%',
      budget: '$8,000 project',
      duration: 'Project-based',
    },
  },
  {
    icon: '📱',
    label: 'Social Captions',
    hint: 'for a fitness brand',
    cat: 'marketing',
    toolId: 'social-media-captions',
    inputs: {
      topic: 'Spring fitness challenge — 30 days to your best self',
      brand_voice: 'Inspiring',
      platforms: 'Instagram',
      goal: 'Engagement (comments/shares)',
    },
  },
  {
    icon: '📝',
    label: 'Blog Post',
    hint: 'about email marketing',
    cat: 'content',
    toolId: 'blog-post',
    inputs: {
      topic: '10 Email Marketing Strategies That Actually Convert in 2025',
      keyword: 'email marketing strategies',
      audience: 'small business owners and digital marketers',
      word_count: '1,500 words',
      tone: 'Educational & Authoritative',
    },
  },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Dashboard() {
  const { currentUser, refreshUserProfile, userProfile } = useAuth();
  const { subscription, isCategoryLocked, isInTrial, trialDaysRemaining } = useSubscription();
  const { brandProfile } = useWorkspace();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeGoal, setActiveGoal] = useState(null);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const paymentStatus = searchParams.get('payment');
  const PLAN_PRICES = { grow: 19, scale: 49, evolution: 129 };

  useEffect(() => {
    if (paymentStatus === 'success' && currentUser) {
      pushEvent('Suscribe', {
        value: PLAN_PRICES[subscription] ?? 0,
        currency: 'EUR',
      });
      const timer = setTimeout(() => refreshUserProfile(currentUser.uid), 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const inTrial = isInTrial();
  const daysLeft = trialDaysRemaining();
  const trialPct = Math.round((daysLeft / 14) * 100);
  const brandIncomplete = !brandProfile?.companyName;

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    for (const cat of CATEGORIES) {
      for (const tool of cat.tools) {
        if (
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q)
        ) {
          results.push({ tool, cat });
          if (results.length >= 8) return results;
        }
      }
    }
    return results;
  }, [search]);

  const visibleCategories = useMemo(() => {
    const base = [...CATEGORIES.filter(c => !c.isAddon), ...CATEGORIES.filter(c => c.isAddon)];
    if (!activeGoal) return base;
    const goal = GOALS.find(g => g.id === activeGoal);
    return goal ? base.filter(c => goal.cats.includes(c.id)) : base;
  }, [activeGoal]);

  function handleQuickWin(win) {
    sessionStorage.setItem('gormaran_rerun', JSON.stringify({ toolId: win.toolId, inputs: win.inputs }));
    navigate(`/category/${win.cat}`);
  }

  function handleSearchToolClick(catId, toolId) {
    sessionStorage.setItem('gormaran_select_tool', toolId);
    navigate(`/category/${catId}`);
  }

  return (
    <div className="page">
      <div className="container">
        <div className="dashboard">

          {/* Payment success banner */}
          {paymentStatus === 'success' && (
            <motion.div
              className="alert alert-success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              🎉 {t('dashboard.paymentSuccess', { plan: subscription.charAt(0).toUpperCase() + subscription.slice(1), defaultValue: `Payment successful! Welcome to ${subscription.charAt(0).toUpperCase() + subscription.slice(1)}!` })}
            </motion.div>
          )}

          {/* Onboarding banner — step 1: complete brand profile / step 2: try a tool */}
          {brandIncomplete ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="dashboard__onboarding-banner dashboard__onboarding-banner--brand"
            >
              <div>
                <p className="dashboard__onboarding-title">🏢 Set up your Brand Profile first</p>
                <p className="dashboard__onboarding-sub">
                  Fill in your business details once and every tool will auto-fill for you — no more typing the same info over and over.
                </p>
              </div>
              <Link to="/settings" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                Set up now →
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="dashboard__onboarding-banner dashboard__onboarding-banner--tool"
            >
              <div>
                <p className="dashboard__onboarding-title">👋 Ready to go, {currentUser?.displayName?.split(' ')[0] || 'there'}!</p>
                <p className="dashboard__onboarding-sub">
                  Your Brand Profile is set. Most users start with the <strong>Proposal Generator</strong> — it saves 2+ hours on your first use.
                </p>
              </div>
              <Link to="/category/strategy" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                Try it now →
              </Link>
            </motion.div>
          )}

          {/* Magic Bar */}
          <div className="dashboard__magic-bar">
            <div className="dashboard__magic-input-wrap">
              <span className="dashboard__magic-icon">🔍</span>
              <input
                className="dashboard__magic-input"
                type="text"
                placeholder="Search tools — e.g. keyword, proposal, ads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="dashboard__magic-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="dashboard__magic-results">
                {searchResults.map(({ tool, cat }) => (
                  <button
                    key={tool.id}
                    className="dashboard__magic-result"
                    onClick={() => handleSearchToolClick(cat.id, tool.id)}
                  >
                    <span className="dashboard__magic-result-icon">{tool.icon}</span>
                    <span className="dashboard__magic-result-name">{tool.name}</span>
                    <span className="dashboard__magic-result-cat">{cat.icon} {cat.name}</span>
                  </button>
                ))}
              </div>
            )}
            {search.trim() && searchResults.length === 0 && (
              <div className="dashboard__magic-empty">No tools found for "{search}"</div>
            )}
          </div>

          {/* Quick Wins */}
          <section className="dashboard__quick-wins">
            <h2 className="dashboard__section-title"><span>⚡</span> Try these now</h2>
            <div className="dashboard__quick-wins-grid">
              {QUICK_WINS.map((win) => (
                <button
                  key={win.toolId}
                  className="dashboard__qw-card"
                  onClick={() => handleQuickWin(win)}
                >
                  <span className="dashboard__qw-icon">{win.icon}</span>
                  <div className="dashboard__qw-body">
                    <span className="dashboard__qw-label">{win.label}</span>
                    <span className="dashboard__qw-hint">{win.hint}</span>
                  </div>
                  <span className="dashboard__qw-arrow">→</span>
                </button>
              ))}
            </div>
          </section>

          {/* Header */}
          <motion.div
            className="dashboard__header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="dashboard__greeting">
                {t('dashboard.greeting', { name: currentUser?.displayName?.split(' ')[0] || t('dashboard.guestName', { defaultValue: 'friend' }) })}
              </h1>
              <p className="dashboard__subtitle">{t('dashboard.subtitle')}</p>
            </div>

            <div className="dashboard__header-right">
              <div className="dashboard__plan-badge">
                <span className={`badge ${subscription === 'free' ? 'badge-free' : 'badge-pro'}`}>
                  {subscription === 'free' && inTrial
                    ? `🎁 ${t('ui.freeTrialBadge', { defaultValue: 'Free Trial' })} · ${daysLeft} / 14 ${t('ui.trialDaysLeft', { defaultValue: 'days left' })}`
                    : subscription === 'free'
                    ? t('ui.freePlan', { defaultValue: 'Free Plan' })
                    : subscription === 'grow'
                    ? `⭐ ${t('ui.growPlan', { defaultValue: 'Grow Plan' })}`
                    : subscription === 'scale'
                    ? `💎 ${t('ui.scalePlan', { defaultValue: 'Scale Plan' })}`
                    : subscription === 'evolution'
                    ? `🚀 ${t('ui.evolutionPlan', { defaultValue: 'Evolution Plan' })}`
                    : `✅ ${subscription}`}
                </span>
              </div>
              {(subscription === 'free' || subscription === 'grow') && (
                <Link to="/pricing" className="btn btn-primary btn-sm">
                  {t('ui.upgrade', { defaultValue: 'Upgrade' })} ↗
                </Link>
              )}
            </div>
          </motion.div>

          {/* Trial countdown */}
          {subscription === 'free' && inTrial && (
            <motion.div
              className="dashboard__usage"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="dashboard__usage-info">
                <span>🎁 {t('dashboard.trialActive', { defaultValue: 'Free trial — full access active' })}</span>
                <span className="dashboard__usage-count">
                  <strong>{daysLeft} / 14</strong> {t('ui.trialDaysLeft', { defaultValue: 'days left' })}
                </span>
              </div>
              <div className="dashboard__usage-bar">
                <div className="dashboard__usage-fill" style={{ width: `${trialPct}%` }} />
              </div>
              <p className="dashboard__usage-note">
                {t('dashboard.trialNote', { defaultValue: 'After your trial, only Keyword Research & Meta Tags remain free. ' })}
                <Link to="/pricing">{t('ui.upgradeForUnlimited', { defaultValue: 'Upgrade for unlimited access' })}</Link>
              </p>
            </motion.div>
          )}

          {/* Post-trial notice */}
          {subscription === 'free' && !inTrial && (
            <motion.div
              className="dashboard__usage"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="dashboard__usage-note" style={{ margin: 0 }}>
                🔒 {t('dashboard.trialEnded', { defaultValue: 'Your free trial has ended. Only Keyword Research & Meta Tags are available. ' })}
                <Link to="/pricing">{t('ui.upgrade', { defaultValue: 'Upgrade' })} →</Link>
              </p>
            </motion.div>
          )}

          {/* Category Grid */}
          <section className="dashboard__categories">
            <div className="dashboard__section-header">
              <h2 className="dashboard__section-title">
                <span>🚀</span> {t('ui.aiToolCategories', { defaultValue: 'AI Tool Categories' })}
              </h2>
              <div className="dashboard__goal-filters">
                {GOALS.map(goal => (
                  <button
                    key={goal.id}
                    className={`dashboard__goal-btn${activeGoal === goal.id ? ' dashboard__goal-btn--active' : ''}`}
                    onClick={() => setActiveGoal(prev => prev === goal.id ? null : goal.id)}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>

            <motion.div
              className="dashboard__grid"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {visibleCategories.map((cat) => {
                const locked = isCategoryLocked(cat.id);
                const catName = t(`cat.${cat.id}.name`, { defaultValue: cat.name });
                const catDesc = t(`cat.${cat.id}.desc`, { defaultValue: cat.description });

                if (cat.isAddon) {
                  return (
                    <motion.div
                      key={cat.id}
                      className="dashboard__addon-card"
                      variants={fadeUp}
                    >
                      <div className="dashboard__addon-left">
                        <span className="badge badge-primary dashboard__addon-badge">
                          {t('pricing.addon.badge', { defaultValue: '⚡ Add-on' })}
                        </span>
                        <h3 className="dashboard__addon-title">{catName}</h3>
                        <p className="dashboard__addon-desc">{catDesc}</p>
                        <ul className="dashboard__addon-features">
                          {[0, 1, 2, 3].map((i) => (
                            <li key={i}>✅ {t(`pricing.addon.feature.${i}`)}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="dashboard__addon-right">
                        <div className="dashboard__addon-price">
                          <span className="dashboard__addon-amount">
                            {t('pricing.addon.price', { defaultValue: '€10' })}
                          </span>
                          <span className="dashboard__addon-period">
                            {t('pricing.addon.period', { defaultValue: '/ 10 workflows' })}
                          </span>
                        </div>
                        <p className="dashboard__addon-renew">
                          {t('pricing.addon.renew', { defaultValue: 'No expiry · Works with any plan · Buy more when you need' })}
                        </p>
                        {subscription === 'admin' ? (
                          <Link to={`/category/${cat.id}`} className="btn btn-primary">
                            {t('ui.open', { defaultValue: 'Open →' })}
                          </Link>
                        ) : (
                          <Link to="/pricing" className="btn btn-primary">
                            {t('pricing.addon.cta', { defaultValue: 'Get Add-on →' })}
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={cat.id}
                    className={`dashboard__cat-card ${locked ? 'dashboard__cat-card--locked' : ''}`}
                    variants={fadeUp}
                    whileHover={{ y: -6, scale: 1.01 }}
                  >
                    <div
                      className="dashboard__cat-accent"
                      style={{ background: `linear-gradient(135deg, ${cat.color}40, ${cat.color}10)` }}
                    />
                    <div className="dashboard__cat-top">
                      <div
                        className="dashboard__cat-icon"
                        style={{ background: `${cat.color}20`, borderColor: `${cat.color}40` }}
                      >
                        {cat.icon}
                      </div>
                      {locked && (
                        <span className="dashboard__cat-lock">🔒 {CATEGORY_MIN_TIER[cat.id] || 'Grow'}</span>
                      )}
                    </div>
                    <h3 className="dashboard__cat-name">{catName}</h3>
                    <p className="dashboard__cat-desc">{catDesc}</p>
                    <div className="dashboard__cat-tools">
                      {cat.tools.filter((tool) => !tool.hidden).map((tool) => (
                        <span key={tool.id} className="dashboard__tool-chip">
                          {tool.icon} {t(`tool.${tool.id}.name`, { defaultValue: tool.name })}
                        </span>
                      ))}
                    </div>
                    <div className="dashboard__cat-footer">
                      <span className="dashboard__cat-count">
                        {cat.tools.length} {t('ui.tools', { defaultValue: 'tools' })}
                      </span>
                      {locked ? (
                        <Link to="/pricing" className="btn btn-secondary btn-sm">
                          {t('ui.upgrade', { defaultValue: 'Upgrade' })}
                        </Link>
                      ) : (
                        <Link to={`/category/${cat.id}`} className="btn btn-primary btn-sm">
                          {t('ui.open', { defaultValue: 'Open →' })}
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>

        </div>
      </div>

      <InstagramAuditSection />

      <div className="container">
        <div className="dashboard">
          <motion.div
            className="dashboard__tip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="dashboard__tip-icon">💡</span>
            <p>
              <strong>Pro tip:</strong> Each tool has custom-engineered AI prompts. Fill in all fields for the most precise, actionable output.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}