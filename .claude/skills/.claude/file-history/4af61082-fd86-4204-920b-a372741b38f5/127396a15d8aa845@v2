import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import './LandingPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://gormaran-growth-hub.onrender.com';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

const DASH_METRICS = [
  { labelKey: 'landing.dash.metric.visits',      raw: 24567,  prefix: '',  change: '+12.5%', icon: '👁' },
  { labelKey: 'landing.dash.metric.conversions', raw: 1234,   prefix: '',  change: '+28.3%', icon: '📈' },
  { labelKey: 'landing.dash.metric.revenue',     raw: 45890,  prefix: '€', change: '+34.2%', icon: '💶' },
  { labelKey: 'landing.dash.metric.followers',   raw: 18456,  prefix: '',  change: '+8.7%',  icon: '👥' },
];

const DASH_SUGGESTIONS = [
  { titleKey: 'landing.dash.sug1.title', descKey: 'landing.dash.sug1.desc', priorityKey: 'landing.dash.priority.high',   cls: 'high' },
  { titleKey: 'landing.dash.sug2.title', descKey: 'landing.dash.sug2.desc', priorityKey: 'landing.dash.priority.medium', cls: 'medium' },
  { titleKey: 'landing.dash.sug3.title', descKey: 'landing.dash.sug3.desc', priorityKey: 'landing.dash.priority.medium', cls: 'medium' },
];

const DASH_QUICK_ACTIONS = [
  { labelKey: 'landing.dash.qa.content', primary: true },
  { labelKey: 'landing.dash.qa.seo' },
  { labelKey: 'landing.dash.qa.funnel' },
];

const PROVIDERS = [
  { key: 'google_analytics', label: 'Google Analytics', icon: '📊', color: '#E37400', metricsKey: 'landing.dash.ga.metrics' },
  { key: 'instagram',        label: 'Instagram',        icon: '📸', color: '#E1306C', metricsKey: 'landing.dash.ig.metrics' },
  { key: 'linkedin',         label: 'LinkedIn',         icon: '💼', color: '#0A66C2', metricsKey: 'landing.dash.li.metrics' },
];

const BAR_HEIGHTS = [60, 75, 55, 90, 70, 85, 65];

function useCountUp(target, inView) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let frame;
    const start = performance.now();
    const duration = 1400;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);
  return count;
}

function MetricCard({ metric, inView }) {
  const { t } = useTranslation();
  const count = useCountUp(metric.raw, inView);
  const formatted = metric.prefix + count.toLocaleString('en-US');
  return (
    <div className="landing__smartdash-metric">
      <div className="landing__smartdash-metric-top">
        <span className="landing__smartdash-metric-label">{t(metric.labelKey)}</span>
        <span className="landing__smartdash-metric-icon">{metric.icon}</span>
      </div>
      <div className="landing__smartdash-metric-value">{formatted}</div>
      <div className="landing__smartdash-metric-change">↑ {metric.change} {t('landing.dash.vsPrev')}</div>
    </div>
  );
}

export default function RealTimeDataPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { subscription } = useSubscription();

  const hasPaidPlan      = currentUser && ['grow', 'scale', 'evolution', 'admin'].includes(subscription);
  const hasExecuteAccess = currentUser && ['scale', 'evolution', 'admin'].includes(subscription);

  // Connection state: null = checking, false = not connected, true = connected
  const [connections, setConnections] = useState({
    google_analytics: null,
    instagram: null,
    linkedin: null,
  });
  const [connecting, setConnecting] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);

  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  // Check connection status for all providers
  const checkStatus = useCallback(async () => {
    if (!currentUser) {
      setConnections({ google_analytics: false, instagram: false, linkedin: false });
      return;
    }
    const token = await currentUser.getIdToken();
    PROVIDERS.forEach(async ({ key }) => {
      try {
        const res = await fetch(`${API_URL}/api/oauth/${key}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setConnections(prev => ({ ...prev, [key]: data.connected }));
      } catch {
        setConnections(prev => ({ ...prev, [key]: false }));
      }
    });
  }, [currentUser]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  // Listen for postMessage from OAuth popup
  useEffect(() => {
    const handler = async (event) => {
      if (event.data?.type !== 'oauth_result') return;
      setConnecting(null);
      if (event.data.success) {
        // If backend returned a custom token, the user was a guest → sign them in now
        if (event.data.customToken) {
          try {
            await signInWithCustomToken(auth, event.data.customToken);
          } catch (e) {
            console.error('Auto sign-in failed:', e);
          }
        }
        checkStatus();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [checkStatus]);

  async function handleConnect(key) {
    setConnecting(key);
    try {
      // Build URL: attach Firebase token if logged in, so backend skips auto-create
      let url = `${API_URL}/api/oauth/${key}/connect`;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        url += `?token=${encodeURIComponent(token)}`;
      }
      const popup = window.open(url, `oauth_${key}`, 'width=620,height=720,scrollbars=yes,resizable=yes');
      if (!popup) {
        alert('Please allow popups for this site to connect your account.');
        setConnecting(null);
      }
    } catch (e) {
      console.error('Connect failed:', e);
      setConnecting(null);
    }
  }

  async function handleDisconnect(key) {
    if (!currentUser) return;
    setDisconnecting(key);
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${API_URL}/api/oauth/${key}/disconnect`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnections(prev => ({ ...prev, [key]: false }));
    } catch (e) {
      console.error('Disconnect failed:', e);
    } finally {
      setDisconnecting(null);
    }
  }

  const anyConnected = Object.values(connections).some(v => v === true);

  return (
    <div ref={ref} className="landing__smartdash section" style={{ minHeight: '80vh', paddingTop: '4rem', position: 'relative' }}>

      {/* ── Coming Soon Overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 50,
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        background: 'rgba(9,9,15,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'inherit',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '2.5rem 3rem',
            textAlign: 'center',
            maxWidth: '400px',
            boxShadow: '0 0 60px rgba(99,102,241,0.2)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Still in the lab.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Our team is building something powerful here. When it drops, you'll be the first to know. 👀
          </p>
          <span style={{
            display: 'inline-block',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '20px',
            color: 'var(--color-primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: '0.35rem 1rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Coming soon
          </span>
        </motion.div>
      </div>
      <div className="container">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          style={{ textAlign: 'center', marginBottom: '2.5rem', paddingTop: '64px' }}
        >
          <motion.h1 className="section-title" variants={fadeUp} transition={{ duration: 0.35 }}>
            {t('landing.dash.title1')}
            <br />
            <span className="gradient-text">{t('landing.dash.title2')}</span>
          </motion.h1>
          <motion.p className="landing__smartdash-subtitle" variants={fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
            {t('landing.dash.subtitle')}
          </motion.p>
        </motion.div>

        {/* Gradient-border wrapper */}
        <div className="landing__smartdash-frame">
          <div className="landing__smartdash-frame-inner">

            {/* ── Connection banner ── */}
            <div className="landing__smartdash-demo-banner rtd__banner-v2">
              {/* Top row: status badge + CTA */}
              <div className="rtd__banner-top">
                <div className="rtd__banner-status">
                  {anyConnected ? (
                    <span className="landing__smartdash-demo-badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                      ✓ {t('landing.dash.connected')}
                    </span>
                  ) : (
                    <span className="landing__smartdash-demo-badge">✦ {t('landing.dash.demoBadge')}</span>
                  )}
                  <span className="landing__smartdash-demo-notice">
                    {anyConnected ? t('landing.dash.connectedNotice') : t('landing.dash.demoNotice')}
                  </span>
                </div>
                {!currentUser && (
                  <Link to="/auth?mode=register" className="rtd__guest-btn">{t('landing.dash.signInBtn')}</Link>
                )}
              </div>

              {/* Provider cards row */}
              <div className="rtd__provider-cards">
                {PROVIDERS.map(({ key, label, icon, color, metricsKey }) => {
                  const status = connections[key];
                  const isConnecting    = connecting === key;
                  const isDisconnecting = disconnecting === key;

                  return (
                    <div key={key} className="rtd__provider-card" style={{ '--src-color': color }}>
                      <div className="rtd__provider-card-header">
                        <span className="rtd__provider-card-icon">{icon}</span>
                        <span className="rtd__provider-card-name" style={{ color }}>{label}</span>
                        {status === true && <span className="rtd__provider-dot" />}
                      </div>
                      <p className="rtd__provider-card-metrics">{t(metricsKey)}</p>

                      {status === true ? (
                        <button
                          className="rtd__provider-action-btn rtd__provider-action-btn--connected"
                          onClick={() => handleDisconnect(key)}
                          disabled={isDisconnecting}
                        >
                          {isDisconnecting ? '…' : `✓ ${t('landing.dash.connected')} · ×`}
                        </button>
                      ) : (
                        <button
                          className="rtd__provider-action-btn"
                          style={{ '--src-color': color }}
                          onClick={() => handleConnect(key)}
                          disabled={isConnecting || (!currentUser && status === null)}
                        >
                          {isConnecting ? t('landing.dash.connecting') : (!currentUser || status !== null) ? `${t('landing.dash.connect')} →` : '…'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Dashboard grid ── */}
            <motion.div
              className="landing__smartdash-grid"
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              variants={stagger}
            >
              {/* Left: metrics + chart */}
              <div className="landing__smartdash-left">
                <div className="landing__smartdash-metrics">
                  {DASH_METRICS.map((m) => (
                    <motion.div key={m.labelKey} variants={fadeUp}>
                      <MetricCard metric={m} inView={inView} />
                    </motion.div>
                  ))}
                </div>

                <motion.div className="landing__smartdash-chart" variants={fadeUp}>
                  <div className="landing__smartdash-chart-header">
                    <strong>{t('landing.dash.chart.title')}</strong>
                  </div>
                  <div className="landing__smartdash-chart-bars">
                    {BAR_HEIGHTS.map((h, i) => (
                      <motion.div
                        key={i}
                        className="landing__smartdash-bar"
                        style={{ height: `${h}%` }}
                        initial={{ scaleY: 0 }}
                        animate={inView ? { scaleY: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.4 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right: AI suggestions + quick actions */}
              <div className="landing__smartdash-right">
                <motion.div className="landing__smartdash-ai" variants={fadeUp}>
                  <div className="landing__smartdash-ai-header">
                    <span className="landing__smartdash-ai-icon">🤖</span>
                    <div>
                      <strong>{t('landing.dash.ai.title')}</strong>
                      <p>{t('landing.dash.ai.subtitle')}</p>
                    </div>
                  </div>

                  {DASH_SUGGESTIONS.map((sug, i) => {
                    const locked = !hasPaidPlan && i > 0;
                    return (
                      <div key={i} className={`landing__smartdash-sug${locked ? ' landing__smartdash-sug--locked' : ''}`}>
                        {locked && (
                          <div className="landing__smartdash-sug-overlay">
                            <span>🔒</span>
                            <Link to="/auth?mode=register">{t('landing.dash.unlock')}</Link>
                          </div>
                        )}
                        <div className="landing__smartdash-sug-top">
                          <span className="landing__smartdash-sug-title">{t(sug.titleKey)}</span>
                          <span className={`landing__smartdash-priority landing__smartdash-priority--${sug.cls}`}>
                            {t(sug.priorityKey)}
                          </span>
                        </div>
                        <p className="landing__smartdash-sug-desc">{t(sug.descKey)}</p>
                        <button className="landing__smartdash-sug-btn" disabled={locked}>
                          ✨ {t('landing.dash.apply')}
                        </button>
                      </div>
                    );
                  })}
                </motion.div>

                <motion.div className="landing__smartdash-qa" variants={fadeUp}>
                  <strong className="landing__smartdash-qa-title">{t('landing.dash.qa.title')}</strong>
                  {DASH_QUICK_ACTIONS.map((qa, i) => {
                    const locked = !hasExecuteAccess;
                    return (
                      <Link
                        key={i}
                        to={currentUser ? '/dashboard' : '/auth?mode=register'}
                        className={`landing__smartdash-qa-btn${qa.primary ? ' primary' : ''}${locked ? ' locked' : ''}`}
                      >
                        {t(qa.labelKey)}
                        {locked && <span className="landing__smartdash-qa-badge">Scale+</span>}
                      </Link>
                    );
                  })}
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
