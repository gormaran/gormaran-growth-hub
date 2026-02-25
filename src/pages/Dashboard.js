
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
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

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { subscription, isCategoryLocked, isInTrial, trialDaysRemaining } = useSubscription();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const paymentStatus = searchParams.get('payment');
  const inTrial = isInTrial();
  const daysLeft = trialDaysRemaining();
  const trialPct = Math.round((daysLeft / 14) * 100);

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
                    ? `🎁 ${t('ui.freeTrialBadge', { defaultValue: 'Free Trial' })} · ${t('ui.trialDaysLeft', { count: daysLeft, defaultValue: `${daysLeft} days left` })}`
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

          {/* Trial countdown (free users in trial) */}
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
                  <strong>{daysLeft}</strong> {t('ui.trialDaysLeft', { count: daysLeft, defaultValue: `${daysLeft} days left` })}
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
          {/* Post-trial notice for free users */}
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
            <h2 className="dashboard__section-title">
              <span>🚀</span> {t('ui.aiToolCategories', { defaultValue: 'AI Tool Categories' })}
            </h2>

            <motion.div
              className="dashboard__grid"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {CATEGORIES.map((cat) => {
                const isAddon = !!cat.isAddon && subscription !== 'admin';
                const locked = !isAddon && isCategoryLocked(cat.id);
                const catName = t(`cat.${cat.id}.name`, { defaultValue: cat.name });
                const catDesc = t(`cat.${cat.id}.desc`, { defaultValue: cat.description });

                if (isAddon) {
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
                        <Link to="/pricing" className="btn btn-primary">
                          {t('pricing.addon.cta', { defaultValue: 'Get Add-on →' })}
                        </Link>
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

      {/* Instagram Audit standalone section */}
      <InstagramAuditSection />

      <div className="container">
        <div className="dashboard">
          {/* Quick tip */}
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
