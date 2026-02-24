
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { CATEGORIES } from '../data/categories';
import { useTranslation } from 'react-i18next';
import InstagramAuditSection from '../components/InstagramAuditSection';
import './Dashboard.css';

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
  const { subscription, usageCount, isCategoryLocked, PLANS } = useSubscription();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const paymentStatus = searchParams.get('payment');

  const plan = PLANS[subscription] || PLANS.free;
  const usagePercent = plan.dailyLimit !== Infinity
    ? Math.min(100, (usageCount / plan.dailyLimit) * 100)
    : 0;

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
              🎉 Payment successful! Your plan has been upgraded. Welcome to {subscription === 'pro' ? 'Pro' : 'Business'}!
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
                  {subscription === 'free'
                    ? t('ui.freePlan', { defaultValue: 'Free Plan' })
                    : subscription === 'pro'
                    ? `⭐ ${t('ui.proPlan', { defaultValue: 'Pro Plan' })}`
                    : `💎 ${t('ui.businessPlan', { defaultValue: 'Business Plan' })}`}
                </span>
              </div>
              {subscription === 'free' && (
                <Link to="/pricing" className="btn btn-primary btn-sm">
                  {t('ui.upgrade', { defaultValue: 'Upgrade' })} ↗
                </Link>
              )}
            </div>
          </motion.div>

          {/* Usage bar (free users) */}
          {subscription === 'free' && (
            <motion.div
              className="dashboard__usage"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="dashboard__usage-info">
                <span>{t('dailyRequests', { defaultValue: 'Daily AI Requests' })}</span>
                <span className="dashboard__usage-count">
                  <strong>{usageCount}</strong> / {plan.dailyLimit} {t('ui.used', { defaultValue: 'used' })}
                </span>
              </div>
              <div className="dashboard__usage-bar">
                <div
                  className="dashboard__usage-fill"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="dashboard__usage-note">
                {usageCount >= plan.dailyLimit
                  ? `🚫 ${t('ui.dailyLimitReached', { defaultValue: 'Daily limit reached' })} — `
                  : `${plan.dailyLimit - usageCount} ${t('ui.requestsRemaining', { defaultValue: 'requests remaining today' })} — `}
                <Link to="/pricing">{t('ui.upgradeForUnlimited', { defaultValue: 'Upgrade to Pro for unlimited access' })}</Link>
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

                return (
                  <motion.div
                    key={cat.id}
                    className={`dashboard__cat-card ${locked ? 'dashboard__cat-card--locked' : ''} ${isAddon ? 'dashboard__cat-card--addon' : ''}`}
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
                        <span className="dashboard__cat-lock">🔒 Pro</span>
                      )}
                      {isAddon && (
                        <span className="dashboard__cat-addon-badge">🔌 Add-on</span>
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
                      {isAddon ? (
                        <Link to="/pricing" className="btn btn-addon btn-sm">
                          {t('ui.addonBuy', { defaultValue: 'Add-on · €10' })}
                        </Link>
                      ) : locked ? (
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
