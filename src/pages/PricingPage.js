import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { createCheckoutSession } from '../utils/api';
import { useTranslation } from 'react-i18next';
import './PricingPage.css';

// Plan metadata — only non-translatable values here
const PLAN_META = [
  { id: 'free',     price: 0,  featureCount: 5, lockedCount: 5, hasBadge: false, highlight: false, priceId: null },
  { id: 'pro',      price: 29, featureCount: 7, lockedCount: 0, hasBadge: true,  highlight: true,  priceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID },
  { id: 'business', price: 79, featureCount: 7, lockedCount: 0, hasBadge: true,  highlight: false, priceId: process.env.REACT_APP_STRIPE_BUSINESS_PRICE_ID },
];

// Comparison row value keys (text values that need translation use a key, icons/numbers stay as-is)
const COMPARISON_ROWS = [
  { idx: 0, free: '3/day', pro: 'unlimited', business: 'unlimited' },
  { idx: 1, free: '✅', pro: '✅', business: '✅' },
  { idx: 2, free: '✅', pro: '✅', business: '✅' },
  { idx: 3, free: '❌', pro: '✅', business: '✅' },
  { idx: 4, free: '❌', pro: '✅', business: '✅' },
  { idx: 5, free: '❌', pro: '❌', business: '✅' },
  { idx: 6, free: '❌', pro: '❌', business: '✅' },
  { idx: 7, free: '❌', pro: '❌', business: '✅' },
  { idx: 8, free: '1', pro: '1', business: '10' },
  { idx: 9, free: 'email', pro: 'priority', business: 'dedicated' },
];

const FAQ_COUNT = 6;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function PricingPage() {
  const { currentUser } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');

  async function handlePlanSelect(plan) {
    if (plan.id === 'free') {
      navigate('/auth?mode=register');
      return;
    }

    if (!currentUser) {
      navigate('/auth?mode=register');
      return;
    }

    if (!plan.priceId || plan.priceId === 'undefined') {
      setError('Payment system is not configured yet. Please add Stripe price IDs to your environment variables.');
      return;
    }

    setError('');
    setLoadingPlan(plan.id);
    try {
      const { url } = await createCheckoutSession(plan.priceId);
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Failed to start checkout. Please try again.');
    }
    setLoadingPlan(null);
  }

  function getPlanCta(plan) {
    if (!currentUser && plan.id !== 'free') return t('pricing.signUpToStart', { defaultValue: 'Sign Up to Start' });
    if (subscription === plan.id) return t('pricing.currentPlan', { defaultValue: '✅ Current Plan' });
    if (plan.id === 'free' && subscription !== 'free') return t('pricing.downgrade', { defaultValue: 'Downgrade' });
    return t(`pricing.plan.${plan.id}.cta`);
  }

  function translateVal(val) {
    if (val === 'unlimited') return t('pricing.comparison.unlimited', { defaultValue: 'Unlimited' });
    if (val === 'email')     return t('pricing.comparison.email',     { defaultValue: 'Email' });
    if (val === 'priority')  return t('pricing.comparison.priority',  { defaultValue: 'Priority' });
    if (val === 'dedicated') return t('pricing.comparison.dedicated', { defaultValue: 'Dedicated' });
    return val;
  }

  return (
    <div className="page">
      <div className="pricing">
        {/* Hero */}
        <motion.div
          className="pricing__hero container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge badge-primary">
            {t('pricing.hero.badge', { defaultValue: 'Simple, Transparent Pricing' })}
          </span>
          <h1 className="pricing__title">
            {t('pricing.hero.titlePre', { defaultValue: 'Choose Your' })}{' '}
            <span className="gradient-text">{t('pricing.hero.titleHighlight', { defaultValue: 'Growth Plan' })}</span>
          </h1>
          <p className="pricing__subtitle">
            {t('pricing.hero.subtitle', { defaultValue: "Start free. Upgrade when you're ready. No contracts, cancel anytime." })}
          </p>
        </motion.div>

        {error && (
          <div className="container">
            <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="container">
          <motion.div
            className="pricing__plans"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {PLAN_META.map((plan) => {
              const features = Array.from({ length: plan.featureCount }, (_, i) =>
                t(`pricing.plan.${plan.id}.feature.${i}`)
              );
              const locked = Array.from({ length: plan.lockedCount }, (_, i) =>
                t(`pricing.plan.${plan.id}.locked.${i}`)
              );

              return (
                <motion.div
                  key={plan.id}
                  className={`pricing__plan ${plan.highlight ? 'pricing__plan--highlight' : ''} ${subscription === plan.id ? 'pricing__plan--current' : ''}`}
                  variants={fadeUp}
                  whileHover={{ y: plan.highlight ? -8 : -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {plan.highlight && <div className="pricing__plan-glow" />}

                  {plan.hasBadge && subscription !== plan.id && (
                    <div className="pricing__plan-badge">
                      {t(`pricing.plan.${plan.id}.badge`)}
                    </div>
                  )}

                  {subscription === plan.id && (
                    <div className="pricing__plan-badge pricing__plan-badge--current">
                      {t('pricing.currentPlan', { defaultValue: '✅ Current Plan' })}
                    </div>
                  )}

                  <div className="pricing__plan-header">
                    <h2 className="pricing__plan-name">{t(`pricing.plan.${plan.id}.name`)}</h2>
                    <p className="pricing__plan-desc">{t(`pricing.plan.${plan.id}.desc`)}</p>
                  </div>

                  <div className="pricing__plan-price">
                    <span className="pricing__plan-amount">€{plan.price}</span>
                    <div className="pricing__plan-period">
                      {plan.price === 0
                        ? t('pricing.forever', { defaultValue: 'forever free' })
                        : t('pricing.month', { defaultValue: '/month' })}
                    </div>
                  </div>

                  <button
                    className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'} pricing__plan-cta`}
                    onClick={() => handlePlanSelect(plan)}
                    disabled={subscription === plan.id || loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id ? (
                      <><span className="spinner" /> {t('pricing.processing', { defaultValue: 'Processing...' })}</>
                    ) : (
                      getPlanCta(plan)
                    )}
                  </button>

                  <div className="pricing__features">
                    {features.map((f) => (
                      <div key={f} className="pricing__feature pricing__feature--included">
                        <span className="pricing__feature-icon">✅</span>
                        <span>{f}</span>
                      </div>
                    ))}
                    {locked.map((f) => (
                      <div key={f} className="pricing__feature pricing__feature--locked">
                        <span className="pricing__feature-icon">🔒</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Comparison table */}
        <div className="container">
          <motion.div
            className="pricing__comparison"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="pricing__comparison-title">
              {t('pricing.comparison.title', { defaultValue: 'Full Feature Comparison' })}
            </h2>
            <div className="pricing__table-wrap">
              <table className="pricing__table">
                <thead>
                  <tr>
                    <th>{t('pricing.comparison.featureCol', { defaultValue: 'Feature' })}</th>
                    <th>{t('pricing.plan.free.name', { defaultValue: 'Free' })}</th>
                    <th className="pricing__th--highlight">Pro</th>
                    <th>{t('pricing.plan.business.name', { defaultValue: 'Business' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.idx}>
                      <td>{t(`pricing.comparison.row.${row.idx}`)}</td>
                      <td>{translateVal(row.free)}</td>
                      <td className="pricing__td--highlight">{translateVal(row.pro)}</td>
                      <td>{translateVal(row.business)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* FAQ */}
        <div className="container pricing__faq">
          <h2 className="pricing__comparison-title">
            {t('pricing.faq.title', { defaultValue: 'Frequently Asked Questions' })}
          </h2>
          <div className="pricing__faq-grid">
            {Array.from({ length: FAQ_COUNT }, (_, i) => (
              <div key={i} className="pricing__faq-item">
                <h4>{t(`pricing.faq.${i}.q`)}</h4>
                <p>{t(`pricing.faq.${i}.a`)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="container pricing__bottom-cta">
          <motion.div
            className="pricing__cta-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>
              {t('pricing.cta.titlePre', { defaultValue: 'Ready to' })}{' '}
              <span className="gradient-text">{t('pricing.cta.titleHighlight', { defaultValue: 'Get Started?' })}</span>
            </h2>
            <p>{t('pricing.cta.subtitle', { defaultValue: 'Join thousands of marketers, founders, and agencies growing with AI.' })}</p>
            <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
              {t('pricing.cta.btn', { defaultValue: 'Start Free Today →' })}
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
