import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { streamAIResponse } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase/config';
import './InstagramAuditSection.css';

/* Follower midpoints for ROI calculation */
const FOLLOWER_MIDPOINTS = { 0: 500, 1: 3000, 2: 12500, 3: 60000, 4: 150000 };

/* ── SVG Sparkline Chart ─────────────────────────────────────────── */
function FollowerChart({ months, counts, t }) {
  const W = 320, H = 90;
  const PAD = { top: 12, right: 8, bottom: 24, left: 8 };
  const vals = counts.map((v, i) => ({ v: Number(v), i })).filter((x) => counts[x.i] !== '');

  if (vals.length < 2) return null;

  const numbers = vals.map((x) => x.v);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const range = max - min || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const pts = vals.map((x) => ({
    x: PAD.left + (x.i / (months.length - 1)) * innerW,
    y: PAD.top + (1 - (x.v - min) / range) * innerH,
    v: x.v,
    i: x.i,
  }));

  /* Smooth cubic bezier */
  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let k = 1; k < pts.length; k++) {
    const prev = pts[k - 1];
    const curr = pts[k];
    const cp = (curr.x - prev.x) / 2;
    linePath += ` C ${prev.x + cp} ${prev.y}, ${curr.x - cp} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H - PAD.bottom} L ${pts[0].x} ${H - PAD.bottom} Z`;

  const pct = pts[0].v > 0 ? Math.round(((pts[pts.length - 1].v - pts[0].v) / pts[0].v) * 100) : 0;

  return (
    <div className="ig-chart">
      <div className="ig-chart__meta">
        <span className="ig-chart__label">{t('ig.chart.growth', { defaultValue: 'Follower growth' })}</span>
        <span className={`ig-chart__pct ${pct >= 0 ? 'pos' : 'neg'}`}>
          {pct >= 0 ? '+' : ''}{pct}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="ig-chart__svg" aria-hidden="true">
        <defs>
          <linearGradient id="igAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e1306c" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#833ab4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="igLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e1306c" />
            <stop offset="100%" stopColor="#833ab4" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#igAreaGrad)" />
        <path d={linePath} fill="none" stroke="url(#igLineGrad)" strokeWidth="2.5" strokeLinecap="round" />
        {pts.map((p) => (
          <g key={p.i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#e1306c" />
            <text x={p.x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="8" fill="var(--text-muted)">
              {months[p.i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── ROI Card ────────────────────────────────────────────────────── */
function RoiCard({ followersIdx, t }) {
  const [avgValue, setAvgValue] = useState('');
  const [convRate, setConvRate] = useState('');

  const followers = FOLLOWER_MIDPOINTS[followersIdx] ?? 0;
  const val = parseFloat(avgValue) || 0;
  const rate = parseFloat(convRate) || 0;
  const current = val && rate ? Math.round(followers * (rate / 100) * val) : null;
  const projected = current !== null ? Math.round(current * 1.35) : null;
  const gain = projected !== null ? projected - current : null;

  return (
    <div className="ig-roi-card">
      <p className="ig-roi-card__subtitle">
        {t('ig.roi.subtitle', { defaultValue: 'Estimate your revenue potential after optimising your profile.' })}
      </p>
      <div className="ig-audit__row">
        <div className="ig-audit__field">
          <label className="ig-audit__label">
            {t('ig.roi.avgValue.label', { defaultValue: 'Avg. revenue / client (€)' })}
          </label>
          <input
            className="ig-audit__input ig-audit__input--sm"
            type="number"
            min="0"
            placeholder={t('ig.roi.avgValue.placeholder', { defaultValue: 'e.g. 500' })}
            value={avgValue}
            onChange={(e) => setAvgValue(e.target.value)}
          />
        </div>
        <div className="ig-audit__field">
          <label className="ig-audit__label">
            {t('ig.roi.convRate.label', { defaultValue: 'Conversion rate (%)' })}
          </label>
          <input
            className="ig-audit__input ig-audit__input--sm"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder={t('ig.roi.convRate.placeholder', { defaultValue: 'e.g. 0.5' })}
            value={convRate}
            onChange={(e) => setConvRate(e.target.value)}
          />
        </div>
      </div>
      {current !== null && (
        <div className="ig-roi-results">
          <div className="ig-roi-row">
            <span className="ig-roi-row__label">{t('ig.roi.current', { defaultValue: 'Current monthly revenue' })}</span>
            <span className="ig-roi-val ig-roi-val--neutral">€{current.toLocaleString()}</span>
          </div>
          <div className="ig-roi-row">
            <span className="ig-roi-row__label">{t('ig.roi.projected', { defaultValue: 'After optimisation (+35%)' })}</span>
            <span className="ig-roi-val ig-roi-val--pos">€{projected.toLocaleString()}</span>
          </div>
          <div className="ig-roi-row ig-roi-row--gain">
            <span className="ig-roi-row__label">{t('ig.roi.gain', { defaultValue: 'Potential gain' })}</span>
            <span className="ig-roi-val ig-roi-val--gain">+€{gain.toLocaleString()}</span>
          </div>
          <p className="ig-roi-note">
            {t('ig.roi.note', { defaultValue: '*Estimate based on an avg. 35% engagement improvement after profile optimisation.' })}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Collapsible ─────────────────────────────────────────────────── */
function Collapsible({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ig-audit__collapsible">
      <button type="button" className="ig-audit__collapse-btn" onClick={() => setOpen((o) => !o)}>
        <span>{label}</span>
        <span className={`ig-audit__collapse-arrow ${open ? 'open' : ''}`}>›</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            className="ig-audit__collapse-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function InstagramAuditSection() {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();

  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [niche, setNiche] = useState('');
  const [goal, setGoal] = useState('');
  const [contentType, setContentType] = useState('');
  const [followersIdx, setFollowersIdx] = useState('');
  const [histCounts, setHistCounts] = useState(['', '', '', '']);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const outputRef = useRef(null);

  const MONTHS_AGO = ['-3m', '-2m', '-1m', t('ig.history.now', { defaultValue: 'Now' })];

  const GOALS = [
    t('ig.goal.0', { defaultValue: 'Sell products or services' }),
    t('ig.goal.1', { defaultValue: 'Grow my audience' }),
    t('ig.goal.2', { defaultValue: 'Generate leads' }),
    t('ig.goal.3', { defaultValue: 'Build personal authority' }),
    t('ig.goal.4', { defaultValue: 'Drive traffic to my website' }),
  ];

  const CONTENT_TYPES = [
    t('ig.contentType.0', { defaultValue: 'Tips & Education' }),
    t('ig.contentType.1', { defaultValue: 'Personal Brand' }),
    t('ig.contentType.2', { defaultValue: 'Products / Services' }),
    t('ig.contentType.3', { defaultValue: 'Lifestyle' }),
    t('ig.contentType.4', { defaultValue: 'Mix of everything' }),
  ];

  const FOLLOWERS = [
    t('ig.followers.0', { defaultValue: '0 – 1,000' }),
    t('ig.followers.1', { defaultValue: '1,000 – 5,000' }),
    t('ig.followers.2', { defaultValue: '5,000 – 20,000' }),
    t('ig.followers.3', { defaultValue: '20,000 – 100,000' }),
    t('ig.followers.4', { defaultValue: '100,000+' }),
  ];

  const CHECKLIST = [
    t('ig.checklist.0', { defaultValue: 'Does it clearly explain who you help?' }),
    t('ig.checklist.1', { defaultValue: 'Does it state the problem you solve?' }),
    t('ig.checklist.2', { defaultValue: 'Does it include a concrete value proposition?' }),
    t('ig.checklist.3', { defaultValue: 'Does it have a clear CTA? (Book, Download, Message…)' }),
    t('ig.checklist.4', { defaultValue: 'Does the link lead to a strategic page?' }),
  ];

  function setHistCount(i, val) {
    setHistCounts((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!bio.trim() || !goal) {
      setError(t('ig.error.required', { defaultValue: 'Please fill in the required fields: bio and main goal.' }));
      return;
    }

    setError('');
    setOutput('');
    setDone(false);
    setLoading(true);

    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);

    /* Anonymous sign-in if not logged in */
    let user = currentUser;
    if (!user) {
      try {
        const cred = await signInAnonymously(auth);
        user = cred.user;
      } catch (anonErr) {
        console.error('[Anonymous auth]', anonErr);
        setError(t('ig.error.anon', { defaultValue: 'Could not start session. Please try registering for free to use this tool.' }));
        setLoading(false);
        return;
      }
    }

    const followersLabel = followersIdx !== '' ? FOLLOWERS[Number(followersIdx)] : '';

    await streamAIResponse({
      categoryId: 'marketing',
      toolId: 'instagram-audit',
      inputs: {
        bio,
        username: [username ? `@${username}` : '', niche].filter(Boolean).join(' — ') || '(not provided)',
        goal,
        content_type: contentType,
        followers: followersLabel,
        _language: i18n.language,
      },
      onChunk: (text) => setOutput((prev) => prev + text),
      onDone: () => { setLoading(false); setDone(true); },
      onError: (msg) => { setError(msg); setLoading(false); },
    });
  }

  function handleClear() {
    setBio('');
    setUsername('');
    setNiche('');
    setGoal('');
    setContentType('');
    setFollowersIdx('');
    setHistCounts(['', '', '', '']);
    setOutput('');
    setError('');
    setDone(false);
  }

  return (
    <section className="ig-audit">
      <div className="ig-audit__inner">

        {/* Header */}
        <motion.div
          className="ig-audit__header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="ig-audit__badge">{t('ig.badge', { defaultValue: '📸 5-min audit' })}</span>
          <h2 className="ig-audit__title">
            {t('ig.title', { defaultValue: 'Instagram Express' })}{' '}
            <span className="ig-audit__title--gradient">
              {t('ig.titleHighlight', { defaultValue: 'Audit' })}
            </span>
          </h2>
          <p className="ig-audit__subtitle">
            {t('ig.subtitle', { defaultValue: 'Analyse your profile, detect immediate improvements, and get the 3 actions you can implement today.' })}
          </p>
        </motion.div>

        <div className="ig-audit__body">

          {/* ── Left: checklist + form ── */}
          <motion.div
            className="ig-audit__left"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Quick checklist */}
            <div className="ig-audit__checklist">
              <p className="ig-audit__checklist-title">
                {t('ig.checklist.title', { defaultValue: 'Quick checklist' })}
              </p>
              {CHECKLIST.map((item, i) => (
                <div key={i} className="ig-audit__check-item">
                  <span className="ig-audit__check-dot" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Form */}
            <form className="ig-audit__form" onSubmit={handleGenerate}>

              {/* Bio */}
              <div className="ig-audit__field">
                <label className="ig-audit__label">
                  {t('ig.bio.label', { defaultValue: 'Your current bio' })} <span className="ig-audit__required">*</span>
                </label>
                <textarea
                  className="ig-audit__textarea"
                  rows={4}
                  placeholder={t('ig.bio.placeholder', { defaultValue: 'Paste your Instagram bio here...' })}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                />
              </div>

              {/* Username */}
              <div className="ig-audit__field">
                <label className="ig-audit__label">
                  {t('ig.username.label', { defaultValue: 'Instagram username' })}
                </label>
                <div className="ig-audit__input-wrap">
                  <span className="ig-audit__at">@</span>
                  <input
                    className="ig-audit__input ig-audit__input--at"
                    type="text"
                    placeholder={t('ig.username.placeholder', { defaultValue: 'yourusername' })}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/^@+/, ''))}
                  />
                </div>
                {username ? (
                  <a
                    href={`https://www.instagram.com/${username}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ig-audit__username-preview"
                  >
                    📸 instagram.com/{username} ↗
                  </a>
                ) : (
                  <p className="ig-audit__hint">
                    {t('ig.username.hint', { defaultValue: 'Type your username to verify your profile link.' })}
                  </p>
                )}
              </div>

              {/* Niche */}
              <div className="ig-audit__field">
                <label className="ig-audit__label">
                  {t('ig.niche.label', { defaultValue: 'Niche / account type' })}
                </label>
                <input
                  className="ig-audit__input"
                  type="text"
                  placeholder={t('ig.niche.placeholder', { defaultValue: 'e.g. fitness coach, marketing agency...' })}
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>

              {/* Goal + Content Type */}
              <div className="ig-audit__row">
                <div className="ig-audit__field">
                  <label className="ig-audit__label">
                    {t('ig.goal.label', { defaultValue: 'Main goal' })} <span className="ig-audit__required">*</span>
                  </label>
                  <select
                    className="ig-audit__select"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    required
                  >
                    <option value="">{t('ig.goal.placeholder', { defaultValue: 'Select...' })}</option>
                    {GOALS.map((g, i) => (
                      <option key={i} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="ig-audit__field">
                  <label className="ig-audit__label">
                    {t('ig.contentType.label', { defaultValue: 'Content type' })}
                  </label>
                  <select
                    className="ig-audit__select"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                  >
                    <option value="">{t('ig.goal.placeholder', { defaultValue: 'Select...' })}</option>
                    {CONTENT_TYPES.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Followers */}
              <div className="ig-audit__field ig-audit__field--half">
                <label className="ig-audit__label">
                  {t('ig.followers.label', { defaultValue: 'Current followers' })}
                </label>
                <select
                  className="ig-audit__select"
                  value={followersIdx}
                  onChange={(e) => setFollowersIdx(e.target.value)}
                >
                  <option value="">{t('ig.goal.placeholder', { defaultValue: 'Select...' })}</option>
                  {FOLLOWERS.map((f, i) => (
                    <option key={i} value={i}>{f}</option>
                  ))}
                </select>
                <p className="ig-audit__hint">
                  💡 {t('ig.followers.hint', { defaultValue: 'Visible on your profile page — no business account needed.' })}
                </p>
              </div>

              {/* Follower history (collapsible) */}
              <Collapsible label={t('ig.history.title', { defaultValue: '📈 Add follower history (last 4 months)' })}>
                <p className="ig-audit__collapsible-subtitle">
                  {t('ig.history.subtitle', { defaultValue: 'Fill in your follower count each month to see a growth chart.' })}
                </p>
                <div className="ig-audit__history-grid">
                  {MONTHS_AGO.map((m, i) => (
                    <div key={i} className="ig-audit__field">
                      <label className="ig-audit__label">{m}</label>
                      <input
                        className="ig-audit__input ig-audit__input--sm"
                        type="number"
                        min="0"
                        placeholder={t('ig.history.count', { defaultValue: '#' })}
                        value={histCounts[i]}
                        onChange={(e) => setHistCount(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <FollowerChart months={MONTHS_AGO} counts={histCounts} t={t} />
              </Collapsible>

              {/* ROI estimator (collapsible, only when followers selected) */}
              {followersIdx !== '' && (
                <Collapsible label={t('ig.roi.title', { defaultValue: '💰 ROI Estimator' })}>
                  <RoiCard followersIdx={Number(followersIdx)} t={t} />
                </Collapsible>
              )}

              {error && <p className="ig-audit__error">⚠️ {error}</p>}

              <div className="ig-audit__actions">
                <button type="submit" className="ig-audit__cta-btn" disabled={loading}>
                  {loading ? (
                    <><span className="ig-audit__spinner" /> {t('ig.btn.generating', { defaultValue: 'Analysing...' })}</>
                  ) : (
                    t('ig.btn.generate', { defaultValue: '📊 Analyse my profile' })
                  )}
                </button>
                {(output || bio) && (
                  <button type="button" className="ig-audit__clear-btn" onClick={handleClear}>
                    {t('ig.btn.clear', { defaultValue: 'Clear' })}
                  </button>
                )}
              </div>
            </form>
          </motion.div>

          {/* ── Right: output or example ── */}
          <motion.div
            className="ig-audit__right"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            ref={outputRef}
          >
            <AnimatePresence mode="wait">
              {output || loading ? (
                <motion.div
                  key="output"
                  className="ig-audit__output"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {loading && !output && (
                    <div className="ig-audit__generating">
                      <span className="ig-audit__dot" />
                      <span className="ig-audit__dot" style={{ animationDelay: '0.2s' }} />
                      <span className="ig-audit__dot" style={{ animationDelay: '0.4s' }} />
                      <span>{t('ig.btn.generating', { defaultValue: 'Analysing your profile...' })}</span>
                    </div>
                  )}
                  <div className="ig-audit__markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                  </div>
                  {loading && output && <span className="ig-audit__cursor">▋</span>}

                  {/* Follow CTA — shown after audit completes */}
                  {done && (
                    <motion.div
                      className="ig-audit__follow-cta"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className="ig-audit__follow-title">
                        {t('ig.follow.title', { defaultValue: '💡 Want more growth tips?' })}
                      </p>
                      <p className="ig-audit__follow-text">
                        {t('ig.follow.text', { defaultValue: 'Follow @gormaran_marketing on Instagram for weekly strategies, templates and AI growth hacks.' })}
                      </p>
                      <a
                        href="https://www.instagram.com/gormaran_marketing/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ig-audit__follow-btn"
                      >
                        {t('ig.follow.cta', { defaultValue: '📲 Follow @gormaran_marketing' })}
                      </a>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  className="ig-audit__placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="ig-audit__example">
                    <p className="ig-audit__example-label">
                      {t('ig.placeholder.example.label', { defaultValue: 'Example of an effective bio' })}
                    </p>
                    <div className="ig-audit__example-bio">
                      <p>I help <strong>digital entrepreneurs</strong> get their <strong>first 10K followers</strong></p>
                      <p>with a content strategy — no ads needed.</p>
                      <p className="ig-audit__example-cta">↓ {t('ig.placeholder.example.cta', { defaultValue: 'Book your free session' })}</p>
                    </div>
                    <div className="ig-audit__example-actions">
                      <p className="ig-audit__example-label" style={{ marginTop: '1.25rem' }}>
                        {t('ig.placeholder.actions.label', { defaultValue: 'Key actions to improve' })}
                      </p>
                      {[
                        t('ig.placeholder.action.0', { defaultValue: 'Optimise name with keyword' }),
                        t('ig.placeholder.action.1', { defaultValue: 'Pin authority post' }),
                        t('ig.placeholder.action.2', { defaultValue: 'Restructure highlights' }),
                        t('ig.placeholder.action.3', { defaultValue: 'Use strong hooks in Reels' }),
                        t('ig.placeholder.action.4', { defaultValue: 'Replace generic CTAs with actionable ones' }),
                      ].map((action, i) => (
                        <div key={i} className="ig-audit__action-row">
                          <span className="ig-audit__action-num">{i + 1}</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="ig-audit__placeholder-hint">
                    {t('ig.placeholder.hint', { defaultValue: 'Fill in the form to get your personalised audit →' })}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
