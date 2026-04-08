import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pushEvent } from '../utils/analytics';
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
  const { currentUser, refreshUserProfile, userProfile } = useAuth();
  const { subscription, isCategoryLocked, isInTrial, trialDaysRemaining } = useSubscription();
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
  const isNewUser = (userProfile?.usageCount ?? 0) === 0;

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

          {/* Welcome onboarding banner - only for new users */}
          {isNewUser && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                border: '1px solid #0f3460',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '16px', color: '#ffffff' }}>
                  👋 Welcome! Not sure where to start?
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
                  Most users start with the <strong style={{ color: '#ffffff' }}>Proposal Generator</strong> — it saves 2+ hours on your first use.
                </p>
              </div>
              <Link
                to="/category/strategy"
                className="btn btn-primary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
              >
                Try it now →
              </Link>
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
              initial={{ opacity: 0