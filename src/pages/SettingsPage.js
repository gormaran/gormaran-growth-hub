import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { createPortalSession, cancelSubscription, listApiKeys, generateApiKey, revokeApiKey } from '../utils/api';
import { useTranslation } from 'react-i18next';
import './SettingsPage.css';

const TONE_OPTIONS = ['Professional', 'Friendly & Casual', 'Bold & Direct', 'Empathetic', 'Authoritative', 'Creative'];

const EMPTY_BRAND = {
  companyName: '', website: '', industry: '', targetAudience: '',
  toneOfVoice: '', usp: '', location: '', description: '',
};

const WS_EMOJIS = ['📁', '🏢', '🛒', '🎨', '📱', '💡', '🚀', '🌐', '🧪', '🏆'];

export default function SettingsPage() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
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
    if (!window.confirm(isEs ? '¿Revocar esta clave API? Las integraciones que la usen dejarán de funcionar.' : 'Revoke this API key? Any integrations using it will stop working.')) return;
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
      setInviteError(isEs ? 'Introduce una dirección de email válida.' : 'Enter a valid email address.');
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
      setInviteSuccess(isEs ? `Invitación enviada a ${email}` : `Invite sent to ${email}`);
      setTimeout(() => setInviteSuccess(''), 4000);
    } catch (err) {
      setInviteError(err.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(memberId) {
    if (!window.confirm(isEs ? '¿Eliminar este miembro del equipo?' : 'Remove this team member?')) return;
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
    if (!window.confirm(isEs ? '¿Eliminar este workspace? Su perfil de marca también se eliminará.' : 'Delete this workspace? Its brand profile will also be removed.')) return;
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

  const usageDisplay = plan.allAccess || plan.unlimitedUsage
    ? (isEs ? 'Ilimitado' : 'Unlimited')
    : `${usageCount} / ${isEs ? 'mes' : 'month'}`;

  return (
    <div className="page">
      <div className="container-sm">
        <div className="settings">
          <motion.div
            className="settings__header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="settings__title">{isEs ? 'Ajustes de cuenta' : 'Account Settings'}</h1>
            <p>{isEs ? 'Gestiona tu perfil, suscripción y preferencias de cuenta.' : 'Manage your profile, subscription, and account preferences.'}</p>
          </motion.div>

          {/* Profile section */}
          <motion.div
            className="settings__card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="settings__card-title">👤 {isEs ? 'Perfil' : 'Profile'}</h2>
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
                    {copied ? (isEs ? '✅ Copiado' : '✅ Copied') : (isEs ? '📋 Copiar' : '📋 Copy')}
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
            <h2 className="settings__card-title">💳 {isEs ? 'Suscripción' : 'Subscription'}</h2>
            <div className="settings__plan">
              <div className="settings__plan-info">
                <div className="settings__plan-row">
                  <span className="settings__plan-label">{isEs ? 'Plan actual' : 'Current Plan'}</span>
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
                  <span className="settings__plan-label">{isEs ? 'Solicitudes IA' : 'AI Requests'}</span>
                  <span className="settings__plan-value">{usageDisplay}</span>
                </div>
                <div className="settings__plan-row">
                  <span className="settings__plan-label">{isEs ? 'Categorías activas' : 'Categories Unlocked'}</span>
                  <span className="settings__plan-value">
                    {plan.allAccess ? (isEs ? 'Todas' : 'All') : (plan.categories?.length ?? 0)} / 7
                  </span>
                </div>
              </div>

              <div className="settings__plan-actions">
                {subscription === 'free' ? (
                  <a href="/pricing" className="btn btn-primary">
                    ⭐ {isEs ? 'Mejorar plan' : 'Upgrade plan'}
                  </a>
                ) : (
                  <>
                    {cancelledUntil ? (
                      <div className="settings__cancel-confirm">
                        <span className="settings__cancel-confirm-icon">✅</span>
                        <p>{isEs ? <>Tu suscripción permanecerá activa hasta el <strong>{cancelledUntil}</strong>. No se realizará ningún cargo más.</> : <>Your subscription will remain active until <strong>{cancelledUntil}</strong>. You won't be charged again.</>}</p>
                      </div>
                    ) : cancelConfirm ? (
                      <div className="settings__cancel-confirm">
                        <span className="settings__cancel-confirm-icon">⚠️</span>
                        <p>{isEs ? 'Confirma la cancelación. Seguirás teniendo acceso hasta el final del período de facturación.' : 'Are you sure? You\'ll keep access until the end of your billing period.'}</p>
                        <div className="settings__cancel-confirm-btns">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={handleCancelSubscription}
                            disabled={cancellingPlan}
                          >
                            {cancellingPlan
                              ? <><span className="spinner" /> {isEs ? 'Cancelando...' : 'Cancelling...'}</>
                              : (isEs ? 'Sí, cancelar' : 'Yes, cancel')}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setCancelConfirm(false)}
                          >
                            {isEs ? 'Mantener mi plan' : 'Keep my plan'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="settings__plan-btns">
                        <a href="/pricing" className="btn btn-primary btn-sm">
                          ⬆️ {isEs ? 'Mejorar plan' : 'Upgrade Plan'}
                        </a>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={handleManageSubscription}
                          disabled={loadingPortal}
                        >
                          {loadingPortal
                            ? <><span className="spinner" /> {isEs ? 'Cargando...' : 'Loading...'}</>
                            : (isEs ? '🧾 Facturas y pagos' : '🧾 Billing & Invoices')}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm settings__cancel-btn"
                          onClick={() => setCancelConfirm(true)}
                        >
                          {isEs ? 'Cancelar suscripción' : 'Cancel subscription'}
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
              🏢 {isEs ? 'Perfil de Marca' : 'Brand Profile'}
              <span className="settings__ws-tag">{currentWorkspace.emoji} {currentWorkspace.name}</span>
            </h2>
            <p className="settings__brand-hint">
              {isEs
                ? 'Rellena los datos de tu marca una vez — se autocompletarán en todas las herramientas de IA. Cada workspace tiene su propio Perfil de Marca independiente.'
                : 'Fill in your brand details once — they\'ll auto-fill in every AI tool so you never have to type them again. Each workspace has its own independent Brand Profile.'}
            </p>
            {loadingWorkspaces ? (
              <div className="settings__brand-loading">{isEs ? 'Cargando…' : 'Loading…'}</div>
            ) : (
              <form onSubmit={handleSaveBrandProfile} className="settings__brand-form">
                <div className="settings__brand-grid">
                  <div className="form-group">
                    <label className="form-label">{isEs ? 'Nombre empresa / marca' : 'Company / Brand Name'}</label>
                    <input className="form-input" value={brandProfile.companyName}
                      onChange={e => setBrandProfile(p => ({ ...p, companyName: e.target.value }))}
                      placeholder={isEs ? 'ej. Acme Corp' : 'e.g. Acme Corp'} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input className="form-input" value={brandProfile.website}
                      onChange={e => setBrandProfile(p => ({ ...p, website: e.target.value }))}
                      placeholder="https://yoursite.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isEs ? 'Industria / Nicho' : 'Industry / Niche'}</label>
                    <input className="form-input" value={brandProfile.industry}
                      onChange={e => setBrandProfile(p => ({ ...p, industry: e.target.value }))}
                      placeholder={isEs ? 'ej. SaaS, E-commerce, Consultoría' : 'e.g. SaaS, E-commerce, Consulting'} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isEs ? 'Ubicación / Mercado' : 'Location / Market'}</label>
                    <input className="form-input" value={brandProfile.location}
                      onChange={e => setBrandProfile(p => ({ ...p, location: e.target.value }))}
                      placeholder={isEs ? 'ej. España, Latinoamérica, Global' : 'e.g. Spain, Latin America, Global'} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isEs ? 'Público objetivo' : 'Target Audience'}</label>
                    <input className="form-input" value={brandProfile.targetAudience}
                      onChange={e => setBrandProfile(p => ({ ...p, targetAudience: e.target.value }))}
                      placeholder={isEs ? 'ej. Propietarios de pymes, Directores de marketing' : 'e.g. Small business owners, Marketing managers'} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isEs ? 'Tono de comunicación' : 'Tone of Voice'}</label>
                    <select className="form-select" value={brandProfile.toneOfVoice}
                      onChange={e => setBrandProfile(p => ({ ...p, toneOfVoice: e.target.value }))}>
                      <option value="">{isEs ? 'Seleccionar tono…' : 'Select tone…'}</option>
                      {TONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group settings__brand-full">
                    <label className="form-label">{isEs ? 'Diferenciador principal / USP' : 'Main Differentiator / USP'}</label>
                    <input className="form-input" value={brandProfile.usp}
                      onChange={e => setBrandProfile(p => ({ ...p, usp: e.target.value }))}
                      placeholder={isEs ? 'ej. La herramienta de facturación más rápida para freelancers en España' : 'e.g. The fastest invoicing tool for freelancers in Spain'} />
                  </div>
                  <div className="form-group settings__brand-full">
                    <label className="form-label">{isEs ? 'Descripción de marca' : 'Brand Description'} <span style={{color:'var(--text-muted)',fontWeight:400}}>({isEs ? 'opcional' : 'optional'})</span></label>
                    <textarea className="form-textarea" rows={3} value={brandProfile.description}
                      onChange={e => setBrandProfile(p => ({ ...p, description: e.target.value }))}
                      placeholder={isEs ? 'Descripción breve de lo que haces y para quién…' : 'Short description of what you do and for whom…'} />
                  </div>
                </div>
                {plan.apiAccess && (
                  <div className="settings__brand-full settings__whitelabel">
                    <label className="settings__whitelabel-label">
                      <div>
                        <strong>{isEs ? 'Modo white-label' : 'White-label mode'}</strong>
                        <p>{isEs ? 'Oculta la marca Gormaran en los resultados — tus clientes solo ven tu marca.' : 'Hide all Gormaran branding in tool outputs — your clients only see your brand.'}</p>
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
                    {savingBrand ? '…' : brandSaved ? (isEs ? '✅ ¡Guardado!' : '✅ Saved!') : (isEs ? '💾 Guardar Perfil de Marca' : '💾 Save Brand Profile')}
                  </button>
                  {brandSaved && <span className="settings__brand-saved">{isEs ? 'Guardado — todas las herramientas usarán tu marca automáticamente.' : 'Saved — all tools will now auto-fill your brand info.'}</span>}
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
              {isEs
                ? 'Cada workspace tiene su propio Perfil de Marca e historial — ideal para gestionar múltiples clientes o proyectos.'
                : 'Each workspace has its own Brand Profile and history — perfect for managing multiple clients or projects.'}
              {(subscription === 'free') && (
                <> <a href="/pricing" className="settings__upgrade-link">{isEs ? 'Mejora a Grow para hasta 3 workspaces, o a Evolution para ilimitados.' : 'Upgrade to Grow for up to 3 workspaces, or Evolution for unlimited.'}</a></>
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
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateWorkspace(ws.id)}>{isEs ? 'Guardar' : 'Save'}</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingWsId(null)}>{isEs ? 'Cancelar' : 'Cancel'}</button>
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
                              title={isEs ? 'Editar' : 'Edit'}
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
                    placeholder={isEs ? 'Nombre del workspace…' : 'New workspace name…'}
                    maxLength={40}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={creatingWs || !newWsName.trim()}>
                    {creatingWs ? '…' : (isEs ? '＋ Crear' : '＋ Create')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings__ws-limit">
                <span>🔒 {isEs ? 'Límite de workspaces alcanzado para tu plan.' : 'Workspace limit reached for your plan.'}</span>
                <a href="/pricing" className="btn btn-primary btn-sm">{isEs ? 'Mejorar' : 'Upgrade'}</a>
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
              👥 {isEs ? 'Gestión de Equipo' : 'Team Management'}
              <span className="settings__ws-tag">Grow+</span>
            </h2>
            <p className="settings__brand-hint">
              {isEs
                ? 'Invita colaboradores a tus workspaces. Recibirán un email con instrucciones de acceso.'
                : 'Invite collaborators to your workspaces. They\'ll receive an email with access instructions.'}
            </p>

            {!plan.teamAccess ? (
              <div className="settings__locked-cta">
                <span className="settings__locked-icon">🔒</span>
                <div>
                  <strong>{isEs ? 'Disponible desde el plan Grow' : 'Available from the Grow plan'}</strong>
                  <p>{isEs ? 'Gestiona tu equipo y colabora con otros usuarios en tus workspaces.' : 'Manage your team and collaborate with other users in your workspaces.'}</p>
                </div>
                <a href="/pricing" className="btn btn-primary btn-sm">{isEs ? 'Ver planes →' : 'See plans →'}</a>
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
                          {isEs ? 'Eliminar' : 'Remove'}
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
                    {inviting ? '…' : (isEs ? '✉️ Invitar' : '✉️ Invite')}
                  </button>
                </form>

                <p className="settings__brand-hint" style={{ marginTop: 0 }}>
                  <strong>SSO:</strong> {isEs
                    ? <>Google sign-in activo en todos los planes. SAML/Okta disponible bajo petición — <a href="mailto:hola@gormaran.io" className="settings__upgrade-link">contáctanos</a>.</>
                    : <>Google sign-in active on all plans. SAML/Okta available on request — <a href="mailto:hola@gormaran.io" className="settings__upgrade-link">contact us</a>.</>}
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
              {isEs
                ? 'Conecta Gormaran con tus propias apps, flujos de n8n o integraciones externas usando tu clave API.'
                : 'Connect Gormaran to your own apps, n8n flows or external integrations using your API key.'}
            </p>

            {!plan.apiAccess ? (
              <div className="settings__locked-cta">
                <span className="settings__locked-icon">🔒</span>
                <div>
                  <strong>{isEs ? 'Disponible en el plan Evolution' : 'Available on the Evolution plan'}</strong>
                  <p>{isEs ? 'Acceso REST + streaming SSE. Compatible con n8n, Make, Zapier y cualquier HTTP client.' : 'REST access + SSE streaming. Compatible with n8n, Make, Zapier and any HTTP client.'}</p>
                </div>
                <a href="/pricing" className="btn btn-primary btn-sm">{isEs ? 'Ver Evolution →' : 'See Evolution →'}</a>
              </div>
            ) : (
              <>
                {keysError && <div className="alert alert-error">{keysError}</div>}

                {revealedKey && (
                  <div className="settings__apikey-reveal">
                    <p className="settings__apikey-reveal-warn">⚠️ {isEs ? 'Copia esta clave ahora — no se mostrará de nuevo.' : 'Copy this key now — it won\'t be shown again.'}</p>
                    <div className="settings__apikey-reveal-row">
                      <code className="settings__apikey-code">{revealedKey.key}</code>
                      <button className="btn btn-primary btn-sm" onClick={handleCopyRevealedKey}>
                        {copiedKey ? (isEs ? '✅ Copiada' : '✅ Copied') : (isEs ? '📋 Copiar' : '📋 Copy')}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setRevealedKey(null)}>{isEs ? 'Descartar' : 'Dismiss'}</button>
                    </div>
                  </div>
                )}

                {loadingKeys ? (
                  <div className="settings__brand-loading">{isEs ? 'Cargando claves…' : 'Loading keys…'}</div>
                ) : (
                  <div className="settings__apikey-list">
                    {apiKeys.length === 0 && !revealedKey && (
                      <p className="settings__brand-hint">{isEs ? 'Sin claves API. Genera tu primera clave abajo.' : 'No API keys. Generate your first key below.'}</p>
                    )}
                    {apiKeys.map(key => (
                      <div key={key.id} className="settings__apikey-item">
                        <div className="settings__apikey-info">
                          <span className="settings__apikey-name">{key.name}</span>
                          <code className="settings__apikey-prefix">{key.prefix}</code>
                          <span className="settings__apikey-meta">
                            {isEs ? 'Creada' : 'Created'} {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : '—'}
                            {key.lastUsed ? ` · ${isEs ? 'Último uso' : 'Last used'} ${new Date(key.lastUsed).toLocaleDateString()}` : ''}
                          </span>
                        </div>
                        <button className="btn btn-ghost btn-sm settings__apikey-revoke" onClick={() => handleRevokeKey(key.id)}>
                          {isEs ? 'Revocar' : 'Revoke'}
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
                      placeholder={isEs ? 'Nombre de la clave (ej: n8n, dashboard cliente)' : 'Key name (e.g. n8n, client dashboard)'}
                      maxLength={50}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={generatingKey || !newKeyName.trim()}>
                      {generatingKey ? '…' : (isEs ? '＋ Generar clave' : '＋ Generate key')}
                    </button>
                  </form>
                )}
                {apiKeys.length >= 5 && (
                  <p className="settings__brand-hint">{isEs ? 'Límite de 5 claves alcanzado. Revoca una para crear otra.' : 'Limit of 5 keys reached. Revoke one to create another.'}</p>
                )}

                <div className="settings__apikey-docs">
                  <strong>Endpoint:</strong>{' '}
                  <code>{process.env.REACT_APP_API_URL || 'https://gormaran-growth-hub.onrender.com'}/api/v1/generate</code>
                  <br />
                  <strong>{isEs ? 'Listar herramientas:' : 'List tools:'}</strong>{' '}
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
              🛡️ {isEs ? 'SLA & Soporte dedicado' : 'SLA & Dedicated Support'}
              <span className="settings__ws-tag settings__ws-tag--evolution">Evolution</span>
            </h2>

            {!plan.apiAccess ? (
              <div className="settings__locked-cta">
                <span className="settings__locked-icon">🔒</span>
                <div>
                  <strong>{isEs ? 'Disponible en el plan Evolution' : 'Available on the Evolution plan'}</strong>
                  <p>{isEs ? '99.9% uptime garantizado, account manager dedicado y onboarding personalizado.' : '99.9% uptime guaranteed, dedicated account manager and personalised onboarding.'}</p>
                </div>
                <a href="/pricing" className="btn btn-primary btn-sm">{isEs ? 'Ver Evolution →' : 'See Evolution →'}</a>
              </div>
            ) : (
              <div className="settings__sla-grid">
                <div className="settings__sla-item">
                  <span className="settings__sla-icon">⚡</span>
                  <div>
                    <strong>SLA 99.9% Uptime</strong>
                    <p>{isEs ? 'Disponibilidad garantizada con notificaciones automáticas de incidencias.' : 'Guaranteed availability with automatic incident notifications.'}</p>
                  </div>
                </div>
                <div className="settings__sla-item">
                  <span className="settings__sla-icon">💬</span>
                  <div>
                    <strong>{isEs ? 'Account Manager dedicado' : 'Dedicated Account Manager'}</strong>
                    <p>{isEs ? 'Canal directo por Slack o email. Respuesta en ≤4 horas laborables.' : 'Direct channel via Slack or email. Response within ≤4 business hours.'}</p>
                  </div>
                </div>
                <div className="settings__sla-item">
                  <span className="settings__sla-icon">🚀</span>
                  <div>
                    <strong>{isEs ? 'Onboarding personalizado' : 'Personalised Onboarding'}</strong>
                    <p>{isEs ? 'Videollamada de 1h para configurar tu equipo, workspaces e integraciones.' : '1-hour video call to set up your team, workspaces and integrations.'}</p>
                  </div>
                </div>
                <div className="settings__sla-item">
                  <span className="settings__sla-icon">📋</span>
                  <div>
                    <strong>{isEs ? 'Contacto Evolution' : 'Evolution Contact'}</strong>
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
            <h2 className="settings__card-title">⚙️ {isEs ? 'Acciones de cuenta' : 'Account Actions'}</h2>
            <div className="settings__actions">
              <div className="settings__action-row">
                <div>
                  <strong>{isEs ? 'Actualizar estado de suscripción' : 'Refresh Subscription Status'}</strong>
                  <p>{isEs ? 'Sincroniza tu estado de suscripción con nuestros servidores.' : 'Sync your subscription status with our servers.'}</p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => refreshUserProfile()}
                >
                  🔄 {isEs ? 'Actualizar' : 'Refresh'}
                </button>
              </div>
              <div className="settings__divider" />
              <div className="settings__action-row">
                <div>
                  <strong>{isEs ? 'Cerrar sesión' : 'Sign Out'}</strong>
                  <p>{isEs ? 'Cierra sesión en tu cuenta de Gormaran en este dispositivo.' : 'Sign out of your Gormaran account on this device.'}</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={logout}>
                  🚪 {isEs ? 'Cerrar sesión' : 'Sign Out'}
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
                <a href="#">{isEs ? 'Política de Privacidad' : 'Privacy Policy'}</a>
                <span>·</span>
                <a href="#">{isEs ? 'Términos de Servicio' : 'Terms of Service'}</a>
                <span>·</span>
                <a href="#">{isEs ? 'Soporte' : 'Support'}</a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
