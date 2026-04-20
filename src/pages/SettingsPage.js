import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { createPortalSession, cancelSubscription, listApiKeys, generateApiKey, revokeApiKey } from '../utils/api';
import './SettingsPage.css';

const TONE_OPTIONS = ['Professional', 'Friendly & Casual', 'Bold & Direct', 'Empathetic', 'Authoritative', 'Creative'];

const EMPTY_BRAND = {
  companyName: '', website: '', industry: '', targetAudience: '',
  toneOfVoice: '', usp: '', location: '', description: '',
};

const WS_EMOJIS = ['📁', '🏢', '🛒', '🎨', '📱', '💡', '🚀', '🌐', '🧪', '🏆'];

export default function SettingsPage() {
  const { currentUser, logout, refreshUserProfile } = useAuth();
  const { subscription, usageCount, PLANS } = useSubscription();
  const {
    workspaces, currentWorkspace, brandProfile: savedBrand, loadingWorkspaces,
    saveBrandProfile, maxWorkspaces, canCreateWorkspace,
    createWorkspace, updateWorkspace, deleteWorkspace, switchWorkspace,
  } = useWorkspace();

  const [loadingPortal, setLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [cancellingPlan, setCancellingPlan] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelledUntil, setCancelledUntil] = useState(null);
  const [copied, setCopied] = useState(false);
  const [brandProfile, setBrandProfile] = useState(EMPTY_BRAND);
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);

  // API Keys state (Enterprise)
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keysError, setKeysError] = useState('');

  // White-label state (Enterprise)
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);

  // Team management state (Enterprise)
  const [teamMembers, setTeamMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Workspace management state
  const [newWsName, setNewWsName] = useState('');
  const [newWsEmoji, setNewWsEmoji] = useState('📁');
  const [creatingWs, setCreatingWs] = useState(false);
  const [wsError, setWsError] = useState('');
  const [editingWsId, setEditingWsId] = useState(null);
  const [editWsName, setEditWsName] = useState('');
  const [editWsEmoji, setEditWsEmoji] = useState('');
  const workspacesRef = useRef(null);

  // Sync local form state from WorkspaceContext whenever it changes
  useEffect(() => {
    if (savedBrand) {
      setBrandProfile(prev => ({ ...EMPTY_BRAND, ...savedBrand }));
      setWhiteLabelEnabled(!!savedBrand.whiteLabelEnabled);
    } else {
      setBrandProfile(EMPTY_BRAND);
      setWhiteLabelEnabled(false);
    }
  }, [savedBrand]);

  // Load API keys and team for Enterprise users
  const plan = PLANS[subscription] || PLANS.free;
  useEffect(() => {
    if (!plan.apiAccess) return;
    setLoadingKeys(true);
    listApiKeys()
      .then(({ keys }) => setApiKeys(keys))
      .catch(err => setKeysError(err.message))
      .finally(() => setLoadingKeys(false));

    if (currentUser?.uid) {
      getDocs(collection(db, 'users', currentUser.uid, 'team'))
        .then(snap => setTeamMembers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
        .catch(() => {});
    }
  }, [plan.apiAccess, currentUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to workspaces section if hash is present
  useEffect(() => {
    if (window.location.hash === '#workspaces' && workspacesRef.current) {
      setTimeout(() => workspacesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, []);

  async function handleGenerateKey(e) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setKeysError('');
    setGeneratingKey(true);
    try {
      const data = await generateApiKey(newKeyName.trim());
      setRevealedKey(data);
      setApiKeys(prev => [...prev, { id: data.id, name: data.name, prefix: data.prefix, createdAt: Date.now(), lastUsed: null }]);
      setNewKeyName('');
    } catch (err) {
      setKeysError(err.message);
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleRevokeKey(keyId) {
    if (!window.confirm('Revoke this API key? Any integrations using it will stop working.')) return;
    try {
      await revokeApiKey(keyId);
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
    } catch (err) {
      setKeysError(err.message);
    }
  }

  async function handleCopyRevealedKey() {
    if (!revealedKey?.key) return;
    await navigator.clipboard.writeText(revealedKey.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  }

  async function handleToggleWhiteLabel(enabled) {
    setWhiteLabelEnabled(enabled);
    try {
      await saveBrandProfile({ ...brandProfile, whiteLabelEnabled: enabled });
    } catch (err) {
      console.error('[WhiteLabel] save failed:', err);
    }
  }

  async function handleInviteMember(e) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setInviteError('Enter a valid email address.');
      return;
    }
    setInviteError('');
    setInviteSuccess('');
    setInviting(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'team', email), {
        email,
        status: 'invited',
        invitedAt: new Date().toISOString(),
      });
      setTeamMembers(prev => {
        const existing = prev.find(m => m.id === email);
        if (existing) return prev;
        return [...prev, { id: email, email, status: 'invited', invitedAt: new Date().toISOString() }];
      });
      setInviteEmail('');
      setInviteSuccess(`Invite sent to ${email}`);
      setTimeout(() => setInviteSuccess(''), 4000);
    } catch (err) {
      setInviteError(err.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(memberId) {
    if (!window.confirm('Remove this team member?')) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'team', memberId));
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('[Team] remove failed:', err);
    }
  }

  async function handleSaveBrandProfile(e) {
    e.preventDefault();
    setSavingBrand(true);
    try {
      await saveBrandProfile(brandProfile);
      setBrandSaved(true);
      setTimeout(() => setBrandSaved(false), 3000);
    } catch (err) {
      console.error('[BrandProfile] save failed:', err);
    } finally {
      setSavingBrand(false);
    }
  }

  async function handleCreateWorkspace(e) {
    e.preventDefault();
    setWsError('');
    if (!newWsName.trim()) return;
    setCreatingWs(true);
    try {
      const ws = await createWorkspace({ name: newWsName.trim(), emoji: newWsEmoji });
      switchWorkspace(ws.id);
      setNewWsName('');
      setNewWsEmoji('📁');
    } catch (err) {
      setWsError(err.message || 'Failed to create workspace');
    } finally {
      setCreatingWs(false);
    }
  }

  async function handleUpdateWorkspace(wsId) {
    if (!editWsName.trim()) return;
    try {
      await updateWorkspace(wsId, { name: editWsName.trim(), emoji: editWsEmoji });
      setEditingWsId(null);
    } catch (err) {
      setWsError(err.message || 'Failed to update workspace');
    }
  }

  async function handleDeleteWorkspace(wsId) {
    if (!window.confirm('Delete this workspace? Its brand profile will also be removed.')) return;
    try {
      await deleteWorkspace(wsId);
    } catch (err) {
      setWsError(err.message || 'Failed to delete workspace');
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

  async function handleCancelSubscription() {
    setPortalError('');
    setCancellingPlan(true);
    try {
      const { periodEnd } = await cancelSubscription();
      setCancelledUntil(periodEnd);
      setCancelConfirm(false);
    } catch (err) {
      setPortalError(err.message || 'Failed to cancel. Please try again.');
    }
    setCancellingPlan(false);
  }

  async function handleCopyUid() {
    await navigator.clipboard.writeText(currentUser?.uid || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const usageDisplay = plan.allAccess || plan.unlimitedUsage ? 'Unlimited' : `${usageCount} / month`;

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
                  <span className={`badge ${subscription === 'free' ? 'badge-free' : subscription === 'evolution' ? 'badge-enterprise' : 'badge-pro'}`}>
                    {subscription === 'free' ? 'Free'
                      : subscription === 'grow' ? '⭐ Grow'
                      : subscription === 'scale' ? '💎 Scale'
                      : subscription === 'evolution' ? '🚀 Evolution'
                      : subscription === 'admin' ? '🔑 Admin'
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
                    {cancelledUntil ? (
                      <div className="settings__cancel-confirm">
                        <span className="settings__cancel-confirm-icon">✅</span>
                        <p>Your subscription will remain active until <strong>{cancelledUntil}</strong>. You won't be charged again.</p>
                      </div>
                    ) : cancelConfirm ? (
                      <div className="settings__cancel-confirm">
                        <span className="settings__cancel-confirm-icon">⚠️</span>
                        <p>Are you sure? You'll keep access until the end of your billing period.</p>
                        <div className="settings__cancel-confirm-btns">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={handleCancelSubscription}
                            disabled={cancellingPlan}
                          >
                            {cancellingPlan ? <><span className="spinner" /> Cancelling...</> : 'Yes, cancel'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setCancelConfirm(false)}
                          >
                            Keep my plan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="settings__plan-btns">
                        <a href="/pricing" className="btn btn-primary btn-sm">
                          ⬆️ Upgrade Plan
                        </a>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={handleManageSubscription}
                          disabled={loadingPortal}
                        >
                          {loadingPortal ? <><span className="spinner" /> Loading...</> : '🧾 Billing & Invoices'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm settings__cancel-btn"
                          onClick={() => setCancelConfirm(true)}
                        >
                          Cancel subscription
                        </button>
                      </div>
                    )}
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
            <h2 className="settings__card-title">
              🏢 Brand Profile
              <span className="settings__ws-tag">{currentWorkspace.emoji} {currentWorkspace.name}</span>
            </h2>
            <p className="settings__brand-hint">
              Fill in your brand details once — they'll auto-fill in every AI tool so you never have to type them again.
              Each workspace has its own independent Brand Profile.
            </p>
            {loadingWorkspaces ? (
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
                {plan.apiAccess && (
                  <div className="settings__brand-full settings__whitelabel">
                    <label className="settings__whitelabel-label">
                      <div>
                        <strong>White-label mode</strong>
                        <p>Hide all Gormaran branding in tool outputs — your clients only see your brand.</p>
                      </div>
                      <div
                        className={`settings__toggle${whiteLabelEnabled ? ' settings__toggle--on' : ''}`}
                        onClick={() => handleToggleWhiteLabel(!whiteLabelEnabled)}
                        role="switch"
                        aria-checked={whiteLabelEnabled}
                      >
                        <span className="settings__toggle-knob" />
                      </div>
                    </label>
                  </div>
                )}
                <div className="settings__brand-actions">
                  <button type="submit" className="btn btn-primary" disabled={savingBrand}>
                    {savingBrand ? '…' : brandSaved ? '✅ Saved!' : '💾 Save Brand Profile'}
                  </button>
                  {brandSaved && <span className="settings__brand-saved">Saved — all tools will now auto-fill your brand info.</span>}
                </div>
              </form>
            )}
          </motion.div>

          {/* Workspaces */}
          <motion.div
            id="workspaces"
            ref={workspacesRef}
            className="settings__card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.19 }}
          >
            <h2 className="settings__card-title">
              🗂️ Workspaces
              <span className="settings__ws-count">{workspaces.length} / {maxWorkspaces === Infinity ? '∞' : maxWorkspaces}</span>
            </h2>
            <p className="settings__brand-hint">
              Each workspace has its own Brand Profile and history — perfect for managing multiple clients or projects.
              {(subscription === 'free') && (
                <> <a href="/pricing" className="settings__upgrade-link">Upgrade to Pro for up to 3 workspaces, or Enterprise for unlimited.</a></>
              )}
            </p>

            {wsError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{wsError}</div>}

            {/* Workspace list */}
            <div className="settings__ws-list">
              {workspaces.map(ws => (
                <div key={ws.id} className={`settings__ws-item${ws.id === currentWorkspace.id ? ' settings__ws-item--active' : ''}`}>
                  {editingWsId === ws.id ? (
                    <div className="settings__ws-edit">
                      <div className="settings__ws-emoji-row">
                        {WS_EMOJIS.map(e => (
                          <button
                            key={e}
                            type="button"
                            className={`settings__ws-emoji-btn${editWsEmoji === e ? ' active' : ''}`}
                            onClick={() => setEditWsEmoji(e)}
                          >{e}</button>
                        ))}
                      </div>
                      <input
                        className="form-input"
                        value={editWsName}
                        onChange={e => setEditWsName(e.target.value)}
                        placeholder="Workspace name"
                        maxLength={40}
                      />
                      <div className="settings__ws-edit-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateWorkspace(ws.id)}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingWsId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className="settings__ws-select"
                        onClick={() => switchWorkspace(ws.id)}
                        title="Switch to this workspace"
                      >
                        <span className="settings__ws-icon">{ws.emoji}</span>
                        <span className="settings__ws-label">{ws.name}</span>
                        {ws.id === currentWorkspace.id && <span className="settings__ws-active-dot">●</span>}
                      </button>
                      <div className="settings__ws-actions">
                        {ws.id !== 'personal' && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => { setEditingWsId(ws.id); setEditWsName(ws.name); setEditWsEmoji(ws.emoji); }}
                            >✏️</button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteWorkspace(ws.id)}
                            >🗑</button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Create new workspace */}
            {canCreateWorkspace ? (
              <form onSubmit={handleCreateWorkspace} className="settings__ws-new">
                <div className="settings__ws-emoji-row">
                  {WS_EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      className={`settings__ws-emoji-btn${newWsEmoji === e ? ' active' : ''}`}
                      onClick={() => setNewWsEmoji(e)}
                    >{e}</button>
                  ))}
                </div>
                <div className="settings__ws-new-row">
                  <input
                    className="form-input"
                    value={newWsName}
                    onChange={e => setNewWsName(e.target.value)}
                    placeholder="New workspace name…"
                    maxLength={40}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={creatingWs || !newWsName.trim()}>
                    {creatingWs ? '…' : '＋ Create'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings__ws-limit">
                <span>🔒 Workspace limit reached for your plan.</span>
                <a href="/pricing" className="btn btn-primary btn-sm">Upgrade</a>
              </div>
            )}
          </motion.div>

          {/* Team Management — Grow+ */}
          <motion.div
            className={`settings__card${!plan.teamAccess ? ' settings__card--locked' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.195 }}
          >
            <h2 className="settings__card-title">
              👥 Team Management
              <span className="settings__ws-tag">Grow+</span>
            </h2>
            <p className="settings__brand-hint">
              Invite colaboradores a tus workspaces. Recibirán un email con instrucciones de acceso.
            </p>

            {!plan.teamAccess ? (
              <div className="settings__locked-cta">
                <span className="settings__locked-icon">🔒</span>
                <div>
                  <strong>Disponible desde el plan Grow</strong>
                  <p>Gestiona tu equipo y colabora con otros usuarios en tus workspaces.</p>
                </div>
                <a href="/pricing" className="btn btn-primary btn-sm">Ver planes →</a>
              </div>
            ) : (
              <>
                {inviteError && <div className="alert alert-error">{inviteError}</div>}
                {inviteSuccess && <div className="alert alert-success">{inviteSuccess}</div>}

                {teamMembers.length > 0 && (
                  <div className="settings__team-list">
                    {teamMembers.map(member => (
                      <div key={member.id} className="settings__team-item">
                        <div className="settings__team-info">
                          <span className="settings__team-email">{member.email}</span>
                          <span className={`badge ${member.status === 'active' ? 'badge-pro' : 'badge-free'}`}>
                            {member.status}
                          </span>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveMember(member.id)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleInviteMember} className="settings__team-invite">
                  <input
                    className="form-input"
                    type="email"
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                    placeholder="colleague@company.com"
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={inviting || !inviteEmail.trim()}>
                    {inviting ? '…' : '✉️ Invite'}
                  </button>
                </form>

                <p className="settings__brand-hint" style={{ marginTop: 0 }}>
                  <strong>SSO:</strong> Google sign-in activo en todos los planes. SAML/Okta disponible bajo petición —{' '}
                  <a href="mailto:hola@gormaran.io" className="settings__upgrade-link">contáctanos</a>.
                </p>
              </>
            )}
          </motion.div>

          {/* API Keys — Evolution only */}
          <motion.div
            className={`settings__card${!plan.apiAccess ? ' settings__card--locked' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.198 }}
          >
            <h2 className="settings__card-title">
              🔑 API Keys
              <span className="settings__ws-tag settings__ws-tag--evolution">Evolution</span>
            </h2>
            <p className="settings__brand-hint">
              Conecta Gormaran con tus propias apps, flujos de n8n o integraciones externas usando tu clave API.
            </p>

            {!plan.apiAccess ? (
              <div className="settings__locked-cta">
                <span className="settings__locked-icon">🔒</span>
                <div>
                  <strong>Disponible en el plan Evolution</strong>
                  <p>Acceso REST + streaming SSE. Compatible con n8n, Make, Zapier y cualquier HTTP client.</p>
                </div>
                <a href="/pricing" className="btn btn-primary btn-sm">Ver Evolution →</a>
              </div>
            ) : (
              <>
                {keysError && <div className="alert alert-error">{keysError}</div>}

                {revealedKey && (
                  <div className="settings__apikey-reveal">
                    <p className="settings__apikey-reveal-warn">⚠️ Copia esta clave ahora — no se mostrará de nuevo.</p>
                    <div className="settings__apikey-reveal-row">
                      <code className="settings__apikey-code">{revealedKey.key}</code>
                      <button className="btn btn-primary btn-sm" onClick={handleCopyRevealedKey}>
                        {copiedKey ? '✅ Copiada' : '📋 Copiar'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setRevealedKey(null)}>Descartar</button>
                    </div>
                  </div>
                )}

                {loadingKeys ? (
                  <div className="settings__brand-loading">Cargando claves…</div>
                ) : (
                  <div className="settings__apikey-list">
                    {apiKeys.length === 0 && !revealedKey && (
                      <p className="settings__brand-hint">Sin claves API. Genera tu primera clave abajo.</p>
                    )}
                    {apiKeys.map(key => (
                      <div key={key.id} className="settings__apikey-item">
                        <div className="settings__apikey-info">
                          <span className="settings__apikey-name">{key.name}</span>
                          <code className="settings__apikey-prefix">{key.prefix}</code>
                          <span className="settings__apikey-meta">
                            Creada {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : '—'}
                            {key.lastUsed ? ` · Último uso ${new Date(key.lastUsed).toLocaleDateString()}` : ''}
                          </span>
                        </div>
                        <button className="btn btn-ghost btn-sm settings__apikey-revoke" onClick={() => handleRevokeKey(key.id)}>
                          Revocar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {apiKeys.length < 5 && (
                  <form onSubmit={handleGenerateKey} className="settings__apikey-generate">
                    <input
                      className="form-input"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      placeholder="Nombre de la clave (ej: n8n, dashboard cliente)"
                      maxLength={50}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={generatingKey || !newKeyName.trim()}>
                      {generatingKey ? '…' : '＋ Generar clave'}
                    </button>
                  </form>
                )}
                {apiKeys.length >= 5 && (
                  <p className="settings__brand-hint">Límite de 5 claves alcanzado. Revoca una para crear otra.</p>
                )}

                <div className="settings__apikey-docs">
                  <strong>Endpoint:</strong>{' '}
                  <code>{process.env.REACT_APP_API_URL || 'https://gormaran-growth-hub.onrender.com'}/api/v1/generate</code>
                  <br />
                  <strong>Listar herramientas:</strong>{' '}
                  <code>GET /api/v1/tools</code>
                  <br />
                  <strong>Header:</strong>{' '}
                  <code>Authorization: Bearer grm_live_...</code>
                </div>
              </>
            )}
          </motion.div>

          {/* SLA / Support — Evolution only */}
          <motion.div
            className={`settings__card settings__card--enterprise-sla${!plan.apiAccess ? ' settings__card--locked' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="settings__card-title">
              🛡️ SLA & Soporte dedicado
              <span className="settings__ws-tag settings__ws-tag--evolution">Evolution</span>
            </h2>

            {!plan.apiAccess ? (
              <div className="settings__locked-cta">
                <span className="settings__locked-icon">🔒</span>
                <div>
                  <strong>Disponible en el plan Evolution</strong>
                  <p>99.9% uptime garantizado, account manager dedicado y onboarding personalizado.</p>
                </div>
                <a href="/pricing" className="btn btn-primary btn-sm">Ver Evolution →</a>
              </div>
            ) : (
              <div className="settings__sla-grid">
                <div className="settings__sla-item">
                  <span className="settings__sla-icon">⚡</span>
                  <div>
                    <strong>SLA 99.9% Uptime</strong>
                    <p>Disponibilidad garantizada con notificaciones automáticas de incidencias.</p>
                  </div>
                </div>
                <div className="settings__sla-item">
                  <span className="settings__sla-icon">💬</span>
                  <div>
                    <strong>Account Manager dedicado</strong>
                    <p>Canal directo por Slack o email. Respuesta en ≤4 horas laborables.</p>
                  </div>
                </div>
                <div className="settings__sla-item">
                  <span className="settings__sla-icon">🚀</span>
                  <div>
                    <strong>Onboarding personalizado</strong>
                    <p>Videollamada de 1h para configurar tu equipo, workspaces e integraciones.</p>
                  </div>
                </div>
                <div className="settings__sla-item">
                  <span className="settings__sla-icon">📋</span>
                  <div>
                    <strong>Contacto Enterprise</strong>
                    <p><a href="mailto:enterprise@gormaran.io" className="settings__upgrade-link">enterprise@gormaran.io</a></p>
                  </div>
                </div>
              </div>
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
