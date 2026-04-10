import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { createPortalSession } from '../utils/api';
import './SettingsPage.css';

const TONE_OPTIONS = ['Professional', 'Friendly & Casual', 'Bold & Direct', 'Empathetic', 'Authoritative', 'Creative'];

const EMPTY_BRAND = {
  companyName: '', website: '', industry: '', targetAudience: '',
  toneOfVoice: '', usp: '', location: '', description: '',
};

export default function SettingsPage() {
  const { currentUser, logout, refreshUserProfile } = useAuth();
  const { subscription, usageCount, PLANS } = useSubscription();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [copied, setCopied] = useState(false);
  const [brandProfile, setBrandProfile] = useState(EMPTY_BRAND);
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid, 'settings', 'brandProfile'))
      .then(snap => { if (snap.exists()) setBrandProfile(prev => ({ ...prev, ...snap.data() })); })
      .catch(() => {})
      .finally(() => setLoadingBrand(false));
  }, [currentUser]);

  async function handleSaveBrandProfile(e) {
    e.preventDefault();
    setSavingBrand(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'brandProfile'), {
        ...brandProfile,
        updatedAt: new Date().toISOString(),
      });
      setBrandSaved(true);
      setTimeout(() => setBrandSaved(false), 3000);
    } catch (err) {
      console.error('[BrandProfile] save failed:', err);
    } finally {
      setSavingBrand(false);
    }
  }

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
  const usageDisplay = plan.allAccess ? 'Unlimited' : `${usageCount} today`;

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
                    {subscription === 'free'
                      ? 'Free'
                      : subscription === 'grow'
                      ? '⭐ Grow'
                      : subscription === 'scale'
                      ? '💎 Scale'
                      : subscription === 'evolution'
                      ? '🚀 Evolution'
                      : subscription === 'admin'
                      ? '🔑 Admin'
                      : subscription}
                  </span>
                </div>
                <div className="settings__plan-row">
                  <span className="settings__plan-label">AI Requests</span>
                  <span className="settings__plan-value">{usageDisplay}</span>
                </div>
                <div className="settings__plan-row">
                  <span className="settings__plan-label">Categories Unlocked</span>
                  <span className="settings__plan-value">
                    {plan.allAccess ? 'All' : (plan.categories?.length ?? 0)} / 7
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

          {/* Brand Profile */}
          <motion.div
            className="settings__card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <h2 className="settings__card-title">🏢 Brand Profile</h2>
            <p className="settings__brand-hint">
              Fill in your brand details once — they'll auto-fill in every AI tool so you never have to type them again.
            </p>
            {loadingBrand ? (
              <div className="settings__brand-loading">Loading…</div>
            ) : (
              <form onSubmit={handleSaveBrandProfile} className="settings__brand-form">
                <div className="settings__brand-grid">
                  <div className="form-group">
                    <label className="form-label">Company / Brand Name</label>
                    <input className="form-input" value={brandProfile.companyName}
                      onChange={e => setBrandProfile(p => ({ ...p, companyName: e.target.value }))}
                      placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input className="form-input" value={brandProfile.website}
                      onChange={e => setBrandProfile(p => ({ ...p, website: e.target.value }))}
                      placeholder="https://yoursite.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry / Niche</label>
                    <input className="form-input" value={brandProfile.industry}
                      onChange={e => setBrandProfile(p => ({ ...p, industry: e.target.value }))}
                      placeholder="e.g. SaaS, E-commerce, Consulting" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location / Market</label>
                    <input className="form-input" value={brandProfile.location}
                      onChange={e => setBrandProfile(p => ({ ...p, location: e.target.value }))}
                      placeholder="e.g. Spain, Latin America, Global" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Audience</label>
                    <input className="form-input" value={brandProfile.targetAudience}
                      onChange={e => setBrandProfile(p => ({ ...p, targetAudience: e.target.value }))}
                      placeholder="e.g. Small business owners, Marketing managers" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tone of Voice</label>
                    <select className="form-select" value={brandProfile.toneOfVoice}
                      onChange={e => setBrandProfile(p => ({ ...p, toneOfVoice: e.target.value }))}>
                      <option value="">Select tone…</option>
                      {TONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group settings__brand-full">
                    <label className="form-label">Main Differentiator / USP</label>
                    <input className="form-input" value={brandProfile.usp}
                      onChange={e => setBrandProfile(p => ({ ...p, usp: e.target.value }))}
                      placeholder="e.g. The fastest invoicing tool for freelancers in Spain" />
                  </div>
                  <div className="form-group settings__brand-full">
                    <label className="form-label">Brand Description <span style={{color:'var(--text-muted)',fontWeight:400}}>(optional)</span></label>
                    <textarea className="form-textarea" rows={3} value={brandProfile.description}
                      onChange={e => setBrandProfile(p => ({ ...p, description: e.target.value }))}
                      placeholder="Short description of what you do and for whom…" />
                  </div>
                </div>
                <div className="settings__brand-actions">
                  <button type="submit" className="btn btn-primary" disabled={savingBrand}>
                    {savingBrand ? '…' : brandSaved ? '✅ Saved!' : '💾 Save Brand Profile'}
                  </button>
                  {brandSaved && <span className="settings__brand-saved">Saved — all tools will now auto-fill your brand info.</span>}
                </div>
              </form>
            )}
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
              <span>Gormaran AI Growth Hub</span>
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
