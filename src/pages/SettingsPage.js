import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { createPortalSession } from '../utils/api';
import './SettingsPage.css';

export default function SettingsPage() {
  const { currentUser, logout, refreshUserProfile } = useAuth();
  const { subscription, usageCount, PLANS } = useSubscription();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleManageSubscription() {
    if (subscription === 'free') return;
    setPortalError('');
    setLoadingPortal(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      setPortalError(err.message || 'Failed to open billing portal. Please try again.');
    }
    setLoadingPortal(false);
  }

  async function handleCopyUid() {
    await navigator.clipboard.writeText(currentUser?.uid || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const plan = PLANS[subscription] || PLANS.free;
  const usageDisplay = plan.dailyLimit === Infinity ? 'Unlimited' : `${usageCount} / ${plan.dailyLimit} today`;

  return (
    <div className="page">
      <div className="container-sm">
        <div className="settings">
          <motion.div
            className="settings__header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="settings__title">Account Settings</h1>
            <p>Manage your profile, subscription, and account preferences.</p>
          </motion.div>

          {/* Profile section */}
          <motion.div
            className="settings__card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="settings__card-title">👤 Profile</h2>
            <div className="settings__profile">
              <div className="settings__avatar">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} />
                ) : (
                  <span>{(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}</span>
                )}
              </div>
              <div className="settings__profile-info">
                <h3>{currentUser?.displayName || 'No display name'}</h3>
                <p>{currentUser?.email}</p>
                <div className="settings__uid">
                  <span>UID: {currentUser?.uid?.slice(0, 16)}...</span>
                  <button className="btn btn-ghost btn-sm" onClick={handleCopyUid}>
                    {copied ? '✅ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subscription section */}
          <motion.div
            className="settings__card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="settings__card-title">💳 Subscription</h2>
            <div className="settings__plan">
              <div className="settings__plan-info">
                <div className="settings__plan-row">
                  <span className="settings__plan-label">Current Plan</span>
                  <span className={`badge ${subscription === 'free' ? 'badge-free' : 'badge-pro'}`}>
                    {subscription === 'free' ? 'Free' : subscription === 'pro' ? '⭐ Pro' : '💎 Business'}
                  </span>
                </div>
                <div className="settings__plan-row">
                  <span className="settings__plan-label">AI Requests</span>
                  <span className="settings__plan-value">{usageDisplay}</span>
                </div>
                <div className="settings__plan-row">
                  <span className="settings__plan-label">Categories Unlocked</span>
                  <span className="settings__plan-value">
                    {plan.categories.length} / 7
                  </span>
                </div>
              </div>

              <div className="settings__plan-actions">
                {subscription === 'free' ? (
                  <a href="/pricing" className="btn btn-primary">
                    ⭐ Upgrade to Pro
                  </a>
                ) : (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={handleManageSubscription}
                      disabled={loadingPortal}
                    >
                      {loadingPortal ? (
                        <><span className="spinner" /> Loading...</>
                      ) : (
                        '⚙️ Manage Subscription'
                      )}
                    </button>
                    <p className="settings__portal-note">
                      Manage billing, change plan, or cancel via Stripe's secure portal.
                    </p>
                  </>
                )}
                {portalError && <div className="alert alert-error">{portalError}</div>}
              </div>
            </div>
          </motion.div>

          {/* Account actions */}
          <motion.div
            className="settings__card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="settings__card-title">⚙️ Account Actions</h2>
            <div className="settings__actions">
              <div className="settings__action-row">
                <div>
                  <strong>Refresh Subscription Status</strong>
                  <p>Sync your subscription status with our servers.</p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => refreshUserProfile()}
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="settings__divider" />
              <div className="settings__action-row">
                <div>
                  <strong>Sign Out</strong>
                  <p>Sign out of your Gormaran account on this device.</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={logout}>
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </motion.div>

          {/* About section */}
          <motion.div
            className="settings__card settings__card--transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="settings__about">
              <span>⚡ <strong className="gradient-text">Gormaran AI Growth Hub</strong></span>
              <span>Version 1.0.0</span>
              <span>Powered by Claude AI by Anthropic</span>
              <div className="settings__about-links">
                <a href="#">Privacy Policy</a>
                <span>·</span>
                <a href="#">Terms of Service</a>
                <span>·</span>
                <a href="#">Support</a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
