import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { createCheckoutSession } from '../utils/api';
import { useTranslation } from 'react-i18next';
import './PricingPage.css';

// Plan metadata — only non-translatable values here
const PLAN_META = [
  { id: 'free',      price: 0,   featureCount: 5, lockedCount: 4, hasBadge: false, highlight: false, priceId: null },
  { id: 'grow',      price: 19,  featureCount: 8, lockedCount: 0, hasBadge: true,  highlight: true,  priceId: process.env.REACT_APP_STRIPE_GROW_PRICE_ID },
  { id: 'scale',     price: 49,  featureCount: 7, lockedCount: 0, hasBadge: true,  highlight: false, priceId: process.env.REACT_APP_STRIPE_SCALE_PRICE_ID },
  { id: 'evolution', price: 129,  featureCount: 8, lockedCount: 0, hasBadge: true,  highlight: false, priceId: process.env.REACT_APP_STRIPE_EVOLUTION_PRICE_ID },
];

// Comparison table — 4 columns: free, grow, scale, evolution
const COMPARISON_ROWS = [
  { idx: 0,  free: 'trial',    grow: 'unlimited', scale: 'unlimited', evolution: 'unlimited' },
  { idx: 1,  free: '⚠️',      grow: '✅',        scale: '✅',        evolution: '✅' },
  { idx: 2,  free: '❌',       grow: '✅',        scale: '✅',        evolution: '✅' },
  { idx: 3,  free: '❌',       grow: '✅',        scale: '✅',        evolution: '✅' },
  { idx: 4,  free: '❌',       grow: 'partial',   scale: 'partial',   evolution: '✅' },
  { idx: 5,  free: '❌',       grow: '❌',        scale: '✅',        evolution: '✅' },
  { idx: 6,  free: '❌',       grow: '❌',        scale: '✅',        evolution: '✅' },
  { idx: 7,  free: '❌',       grow: '❌',        scale: '✅',        evolution: '✅' },
  { idx: 8,  free: '❌',       grow: '❌',        scale: '❌',        evolution: '✅' },
  { idx: 9,  free: '❌',       grow: '❌',        scale: '❌',        evolution: '✅' },
  { idx: 10, free: 'email',    grow: 'priority',  scale: 'priority',  evolution: 'dedicated' },
  { idx: 11, free: 'addon',    grow: 'addon',     scale: 'addon',     evolution: 'addon' },
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

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/health`).catch(() => {});
  }, []);

  async function handleAddonSelect() {
    if (!currentUser) {
      navigate('/auth?mode=register');
      return;
    }
    const addonPriceId = process.env.REACT_APP_STRIPE_N8N_ADDON_PRICE_ID;
    if (!addonPriceId || addonPriceId === 'undefined') {
      setError('N8n add-on payment is not configured yet. Please add REACT_APP_STRIPE_N8N_ADDON_PRICE_ID to your environment variables.');
      return;
    }
    setError('');
    setLoadingPlan('addon');
    try {
      const { url } = await createCheckoutSession(addonPriceId, 'payment');
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Failed to start checkout. Please try again.');
    }
    setLoadingPlan(null);
  }

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
    if (val === 'trial')     return t('pricing.comparison.trial',     { defaultValue: '14-day trial' });
    if (val === 'partial')   return t('pricing.comparison.partial',   { defaultValue: '1 tool' });
    if (val === 'email')     return t('pricing.comparison.email',     { defaultValue: 'Email' });
    if (val === 'priority')  return t('pricing.comparison.priority',  { defaultValue: 'Priority' });
    if (val === 'dedicated') return t('pricing.comparison.dedicated', { defaultValue: 'Dedicated' });
    if (val === 'addon')     return t('pricing.comparison.addon',     { defaultValue: '➕ Add-on' });
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
            className="pricing__plans pricing__plans--4"
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
                  className={`pricing__plan pricing__plan--${plan.id} ${subscription === plan.id ? 'pricing__plan--current' : ''}`}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <div className="pricing__plan-glow" />

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
                    className={`btn btn-secondary pricing__plan-cta`}
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

        {/* N8n Add-on */}
        <div className="container">
          <motion.div
            className="pricing__addon"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="pricing__addon-left">
              <span className="badge badge-primary pricing__addon-badge">
                {t('pricing.addon.badge', { defaultValue: '⚡ Add-on' })}
              </span>
              <h3 className="pricing__addon-title">
                {t('pricing.addon.title', { defaultValue: 'N8n Automation' })}
              </h3>
              <p className="pricing__addon-desc">
                {t('pricing.addon.desc', { defaultValue: 'Design powerful no-code automations using n8n — available for any plan.' })}
              </p>
              <ul className="pricing__addon-features">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i}>✅ {t(`pricing.addon.feature.${i}`)}</li>
                ))}
              </ul>
            </div>

            <div className="pricing__addon-right">
              <div className="pricing__addon-price">
                <span className="pricing__addon-amount">
                  {t('pricing.addon.price', { defaultValue: '€10' })}
                </span>
                <span className="pricing__addon-period">
                  {t('pricing.addon.period', { defaultValue: '/ 10 workflows' })}
                </span>
              </div>
              <p className="pricing__addon-renew">
                {t('pricing.addon.renew', { defaultValue: 'No expiry · Works with any plan · Buy more when you need' })}
              </p>
              <button
                className="btn btn-primary pricing__plan-cta"
                onClick={handleAddonSelect}
                disabled={loadingPlan === 'addon'}
              >
                {loadingPlan === 'addon' ? '...' : t('pricing.addon.cta', { defaultValue: 'Get Add-on →' })}
              </button>
            </div>
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
                    <th className="pricing__th--free">{t('pricing.plan.free.name', { defaultValue: 'Free' })}</th>
                    <th className="pricing__th--grow">{t('pricing.plan.grow.name', { defaultValue: 'Grow' })}</th>
                    <th className="pricing__th--scale">{t('pricing.plan.scale.name', { defaultValue: 'Scale' })}</th>
                    <th className="pricing__th--evolution">{t('pricing.plan.evolution.name', { defaultValue: 'Evolution' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.idx}>
                      <td>{t(`pricing.comparison.row.${row.idx}`)}</td>
                      <td className="pricing__td--free">{translateVal(row.free)}</td>
                      <td className="pricing__td--grow">{translateVal(row.grow)}</td>
                      <td className="pricing__td--scale">{translateVal(row.scale)}</td>
                      <td className="pricing__td--evolution">{translateVal(row.evolution)}</td>
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
