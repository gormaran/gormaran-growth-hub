import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { CATEGORIES } from '../data/categories';
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
                Good {getTimeOfDay()},{' '}
                <span className="gradient-text">
                  {currentUser?.displayName?.split(' ')[0] || 'there'} 👋
                </span>
              </h1>
              <p className="dashboard__subtitle">
                What do you want to create today? Choose a category to get started.
              </p>
            </div>

            <div className="dashboard__header-right">
              <div className="dashboard__plan-badge">
                <span className={`badge ${subscription === 'free' ? 'badge-free' : 'badge-pro'}`}>
                  {subscription === 'free' ? 'Free Plan' : subscription === 'pro' ? '⭐ Pro Plan' : '💎 Business Plan'}
                </span>
              </div>
              {subscription === 'free' && (
                <Link to="/pricing" className="btn btn-primary btn-sm">
                  Upgrade ↗
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
                <span>Daily AI Requests</span>
                <span className="dashboard__usage-count">
                  <strong>{usageCount}</strong> / {plan.dailyLimit} used
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
                  ? '🚫 Daily limit reached — '
                  : `${plan.dailyLimit - usageCount} requests remaining today — `}
                <Link to="/pricing">Upgrade to Pro for unlimited access</Link>
              </p>
            </motion.div>
          )}

          {/* Category Grid */}
          <section className="dashboard__categories">
            <h2 className="dashboard__section-title">
              <span>🚀</span> AI Tool Categories
            </h2>

            <motion.div
              className="dashboard__grid"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {CATEGORIES.map((cat) => {
                const locked = isCategoryLocked(cat.id);
                return (
                  <motion.div
                    key={cat.id}
                    className={`dashboard__cat-card ${locked ? 'dashboard__cat-card--locked' : ''}`}
                    variants={fadeUp}
                    whileHover={!locked ? { y: -6, scale: 1.01 } : {}}
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
                        <span className="dashboard__cat-lock">
                          🔒 Pro
                        </span>
                      )}
                    </div>

                    <h3 className="dashboard__cat-name">{cat.name}</h3>
                    <p className="dashboard__cat-desc">{cat.description}</p>

                    <div className="dashboard__cat-tools">
                      {cat.tools.map((tool) => (
                        <span key={tool.id} className="dashboard__tool-chip">
                          {tool.icon} {tool.name}
                        </span>
                      ))}
                    </div>

                    <div className="dashboard__cat-footer">
                      <span className="dashboard__cat-count">
                        {cat.tools.length} tools
                      </span>
                      {locked ? (
                        <Link to="/pricing" className="btn btn-secondary btn-sm">
                          Upgrade
                        </Link>
                      ) : (
                        <Link to={`/category/${cat.id}`} className="btn btn-primary btn-sm">
                          Open →
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>

          {/* Quick tip */}
          <motion.div
            className="dashboard__tip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="dashboard__tip-icon">💡</span>
            <p>
              <strong>Pro tip:</strong> Each tool has custom-engineered AI prompts. Fill in all fields for the most precise, actionable output from Claude AI.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
