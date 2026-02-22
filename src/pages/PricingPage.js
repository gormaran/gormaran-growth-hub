import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { createCheckoutSession } from '../utils/api';
import './PricingPage.css';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0 },
    badge: null,
    description: 'Get started and explore the platform',
    features: [
      '5 AI requests per day',
      'Marketing & Growth tools',
      'Content Creation tools',
      'Real-time Claude AI streaming',
      'Email support',
    ],
    locked: [
      'Business Strategy tools',
      'Digital Marketing tools',
      'E-commerce Growth tools',
      'Agency tools',
      'Startup Launchpad tools',
    ],
    cta: 'Get Started Free',
    ctaLink: '/auth?mode=register',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 29 },
    badge: '⭐ Most Popular',
    description: 'Everything you need to grow faster',
    priceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID,
    features: [
      'Unlimited AI requests',
      'All 7 AI categories unlocked',
      '35+ specialized tools',
      'Real-time Claude AI streaming',
      'Structured markdown outputs',
      'Copy & export results',
      'Priority support',
    ],
    locked: [],
    cta: 'Start Pro Plan',
    highlight: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: { monthly: 79 },
    badge: '💎 Enterprise',
    description: 'For teams and agencies at scale',
    priceId: process.env.REACT_APP_STRIPE_BUSINESS_PRICE_ID,
    features: [
      'Everything in Pro',
      'Team workspace (up to 10 seats)',
      'Custom AI prompt training',
      'Advanced analytics dashboard',
      'Dedicated account manager',
      'SLA & uptime guarantee',
      'White-label options',
    ],
    locked: [],
    cta: 'Start Business Plan',
    highlight: false,
  },
];

const COMPARISON = [
  { feature: 'Daily AI Requests', free: '5/day', pro: 'Unlimited', business: 'Unlimited' },
  { feature: 'Marketing & Growth', free: '✅', pro: '✅', business: '✅' },
  { feature: 'Content Creation', free: '✅', pro: '✅', business: '✅' },
  { feature: 'Business Strategy', free: '❌', pro: '✅', business: '✅' },
  { feature: 'Digital Marketing Tools', free: '❌', pro: '✅', business: '✅' },
  { feature: 'E-commerce Growth', free: '❌', pro: '✅', business: '✅' },
  { feature: 'Agency Tools', free: '❌', pro: '✅', business: '✅' },
  { feature: 'Startup Launchpad', free: '❌', pro: '✅', business: '✅' },
  { feature: 'Team Seats', free: '1', pro: '1', business: '10' },
  { feature: 'Support', free: 'Email', pro: 'Priority', business: 'Dedicated' },
];

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
    if (!currentUser && plan.id !== 'free') return 'Sign Up to Start';
    if (subscription === plan.id) return '✅ Current Plan';
    if (plan.id === 'free' && subscription !== 'free') return 'Downgrade';
    return plan.cta;
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
          <span className="badge badge-primary">Simple, Transparent Pricing</span>
          <h1 className="pricing__title">
            Choose Your <span className="gradient-text">Growth Plan</span>
          </h1>
          <p className="pricing__subtitle">
            Start free. Upgrade when you're ready. No contracts, cancel anytime.
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
            {PLANS.map((plan) => (
              <motion.div
                key={plan.id}
                className={`pricing__plan ${plan.highlight ? 'pricing__plan--highlight' : ''} ${subscription === plan.id ? 'pricing__plan--current' : ''}`}
                variants={fadeUp}
                whileHover={{ y: plan.highlight ? -8 : -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {plan.highlight && (
                  <div className="pricing__plan-glow" />
                )}

                {plan.badge && (
                  <div className="pricing__plan-badge">{plan.badge}</div>
                )}

                {subscription === plan.id && (
                  <div className="pricing__plan-badge pricing__plan-badge--current">
                    ✅ Current Plan
                  </div>
                )}

                <div className="pricing__plan-header">
                  <h2 className="pricing__plan-name">{plan.name}</h2>
                  <p className="pricing__plan-desc">{plan.description}</p>
                </div>

                <div className="pricing__plan-price">
                  <span className="pricing__plan-amount">
                    ${plan.price.monthly}
                  </span>
                  <div className="pricing__plan-period">
                    {plan.price.monthly === 0 ? 'forever free' : '/month'}
                  </div>
                </div>

                <button
                  className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'} pricing__plan-cta`}
                  onClick={() => handlePlanSelect(plan)}
                  disabled={subscription === plan.id || loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? (
                    <><span className="spinner" /> Processing...</>
                  ) : (
                    getPlanCta(plan)
                  )}
                </button>

                <div className="pricing__features">
                  {plan.features.map((f) => (
                    <div key={f} className="pricing__feature pricing__feature--included">
                      <span className="pricing__feature-icon">✅</span>
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.locked.map((f) => (
                    <div key={f} className="pricing__feature pricing__feature--locked">
                      <span className="pricing__feature-icon">🔒</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
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
            <h2 className="pricing__comparison-title">Full Feature Comparison</h2>
            <div className="pricing__table-wrap">
              <table className="pricing__table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Free</th>
                    <th className="pricing__th--highlight">Pro</th>
                    <th>Business</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      <td>{row.free}</td>
                      <td className="pricing__td--highlight">{row.pro}</td>
                      <td>{row.business}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* FAQ */}
        <div className="container pricing__faq">
          <h2 className="pricing__comparison-title">Frequently Asked Questions</h2>
          <div className="pricing__faq-grid">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, absolutely. Cancel anytime from your account settings. No cancellation fees, no questions asked.' },
              { q: 'What is the daily limit on the Free plan?', a: 'Free users get 5 AI requests per day, reset at midnight UTC. Upgrade to Pro for unlimited access.' },
              { q: 'How does AI streaming work?', a: 'Results stream in real-time using Claude AI. You see the output generate word-by-word — no waiting for the full response.' },
              { q: 'Is my data secure?', a: 'Your inputs are sent to the backend server over HTTPS. We never store your AI prompts or outputs. API keys are never exposed to the browser.' },
              { q: 'Can I upgrade later?', a: 'Yes! Start on the Free plan and upgrade anytime. Your previous outputs are not affected.' },
              { q: 'Do you offer refunds?', a: 'Yes, we offer a 7-day money-back guarantee on all paid plans. Contact support for a full refund.' },
            ].map(({ q, a }) => (
              <div key={q} className="pricing__faq-item">
                <h4>{q}</h4>
                <p>{a}</p>
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
            <h2>Ready to <span className="gradient-text">Get Started?</span></h2>
            <p>Join thousands of marketers, founders, and agencies growing with AI.</p>
            <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
              Start Free Today →
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
