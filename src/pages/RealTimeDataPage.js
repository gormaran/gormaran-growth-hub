import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import './LandingPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

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

const DASH_CONNECT = [
  { key: 'ga', label: 'Google Analytics', color: '#E37400' },
  { key: 'ig', label: 'Instagram',        color: '#E1306C' },
  { key: 'li', label: 'LinkedIn',         color: '#0A66C2' },
];

const BAR_HEIGHTS = [60, 75, 55, 90, 70, 85, 65];

function useCountUp(target, inView) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let frame;
    const duration = 1400;
    const start = performance.now();
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

  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <div ref={ref} className="landing__smartdash section" style={{ minHeight: '80vh', paddingTop: '3rem' }}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
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
            {/* Demo notice banner */}
            <div className="landing__smartdash-demo-banner">
              <span className="landing__smartdash-demo-badge">✦ {t('landing.dash.demoBadge')}</span>
              <span className="landing__smartdash-demo-notice">{t('landing.dash.demoNotice')}</span>
              <div className="landing__smartdash-demo-sources">
                {DASH_CONNECT.map((src) => (
                  <Link key={src.key} to="/auth?mode=register" className="landing__smartdash-source-btn" style={{ '--src-color': src.color }}>
                    {src.label}
                  </Link>
                ))}
              </div>
            </div>

            <motion.div
              className="landing__smartdash-grid"
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              variants={stagger}
            >
              {/* ── Left: metrics + chart ── */}
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

              {/* ── Right: AI suggestions + quick actions ── */}
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
                        to="/auth?mode=register"
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
