import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { pushEvent } from '../utils/analytics';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { CATEGORIES } from '../data/categories';
import { useTranslation } from 'react-i18next';
import InstagramAuditSection from '../components/InstagramAuditSection';
import OnboardingModal from '../components/OnboardingModal';
import './Dashboard.css';

const CATEGORY_MIN_TIER = {
  strategy:  'Grow',
  ecommerce: 'Grow',
  agency:    'Grow',
  creative:  'Grow',
  startup:   'Evolution',
  finance:   'Evolution',
};

const GOALS = [
  { id: 'clients',  label: '🤝 Get Clients',     cats: ['strategy', 'agency'] },
  { id: 'content',  label: '✍️ Create Content',   cats: ['content', 'marketing', 'creative'] },
  { id: 'digital',  label: '📈 Grow Digital',     cats: ['digital', 'ecommerce'] },
];

const QUICK_WINS_BY_PERSONA = {
  agency_small: [
    {
      icon: '📄', label: 'Propuesta de cliente', hint: 'cierra el contrato hoy',
      cat: 'agency', toolId: 'client-proposal',
      inputs: { agency_name: 'Tu agencia', client_name: 'Nuevo cliente', service: 'Estrategia digital + Contenido', client_goal: 'Generar leads y aumentar ventas online', budget: '€2.000/mes', duration: 'Contrato trimestral' },
    },
    {
      icon: '📊', label: 'Informe de resultados', hint: 'para tu cliente en 3 min',
      cat: 'agency', toolId: 'campaign-report',
      inputs: { client_name: 'Cliente mensual', period: 'Marzo 2025', channels: 'Meta Ads + Google Ads', highlights: 'ROAS 4.2x, 38% más leads vs mes anterior' },
    },
    {
      icon: '✍️', label: 'Captions para cliente', hint: '1 semana de contenido',
      cat: 'marketing', toolId: 'social-media-captions',
      inputs: { topic: 'Lanzamiento de producto del cliente', brand_voice: 'Profesional y cercano', platforms: 'Instagram, LinkedIn', goal: 'Engagement y alcance' },
    },
    {
      icon: '🔬', label: 'Análisis de competidores', hint: 'para el pitch',
      cat: 'strategy', toolId: 'competitor-research',
      inputs: { business_name: 'Prospecto de agencia', your_product: 'Servicio de marketing digital', location: 'España', target_customer: 'Directores de marketing B2B' },
    },
  ],
  consultant: [
    {
      icon: '📄', label: 'Propuesta de consultoría', hint: 'lista en 2 minutos',
      cat: 'agency', toolId: 'client-proposal',
      inputs: { agency_name: 'Tu consultoría', client_name: 'Nuevo cliente', service: 'Auditoría y estrategia de marketing digital', client_goal: 'Optimizar presencia online y generar leads', budget: '€1.500 proyecto', duration: 'Proyecto puntual + retainer opcional' },
    },
    {
      icon: '✍️', label: 'Post LinkedIn autoridad', hint: 'capta leads orgánicos',
      cat: 'content', toolId: 'blog-post',
      inputs: { topic: 'Los 3 errores que cometen las pymes al hacer marketing digital', keyword: 'marketing digital pymes', audience: 'Directores y fundadores', word_count: '800 palabras', tone: 'Experto y directo' },
    },
    {
      icon: '📧', label: 'Secuencia de email nurturing', hint: 'convierte leads fríos',
      cat: 'marketing', toolId: 'email-sequence',
      inputs: { business: 'Tu consultoría', product: 'Servicio de consultoría de marketing', audience: 'Leads que descargaron tu guía gratuita', goal: 'Agendar llamada de descubrimiento', emails: '4 emails' },
    },
    {
      icon: '🔬', label: 'Análisis de competidores', hint: 'para el pitch de cliente',
      cat: 'strategy', toolId: 'competitor-research',
      inputs: { business_name: 'Cliente potencial', your_product: 'Producto o servicio del cliente', location: 'España', target_customer: 'Cliente ideal del cliente' },
    },
  ],
  ecommerce: [
    {
      icon: '📊', label: 'Campaña Meta Ads', hint: 'mejor ROAS desde el día 1',
      cat: 'marketing', toolId: 'meta-ads-campaign',
      inputs: { business_name: 'Tu tienda online', product: 'Producto estrella de tu catálogo', target_audience: 'Compradores interesados en tu categoría', budget: '€500/mes', objective: 'Conversiones y ventas' },
    },
    {
      icon: '🔑', label: 'Keywords SEO', hint: 'tráfico orgánico gratis',
      cat: 'marketing', toolId: 'seo-keyword-research',
      inputs: { business: 'Tu e-commerce', niche: 'Tu categoría de producto', location: 'España', goal: 'Posicionar fichas de producto y blog' },
    },
    {
      icon: '📝', label: 'Descripciones de producto', hint: 'que sí convierten',
      cat: 'content', toolId: 'blog-post',
      inputs: { topic: 'Descripción optimizada para tu producto estrella', keyword: 'nombre producto + categoría', audience: 'Compradores potenciales', word_count: '400 palabras', tone: 'Persuasivo y claro' },
    },
    {
      icon: '📧', label: 'Email de recuperación carrito', hint: 'recupera ventas perdidas',
      cat: 'marketing', toolId: 'email-sequence',
      inputs: { business: 'Tu tienda online', product: 'Productos en carrito abandonado', audience: 'Clientes que no completaron la compra', goal: 'Recuperar ventas', emails: '3 emails (1h, 24h, 72h)' },
    },
  ],
  saas_b2b: [
    {
      icon: '🎯', label: 'Mensajes de venta B2B', hint: 'tu propuesta de valor clara',
      cat: 'strategy', toolId: 'business-plan',
      inputs: { business_name: 'Tu SaaS', industry: 'Software B2B', stage: 'Growth', goal: 'Definir messaging y go-to-market para Q2' },
    },
    {
      icon: '📧', label: 'Secuencia outreach frío', hint: 'abre puertas con ICP',
      cat: 'marketing', toolId: 'email-sequence',
      inputs: { business: 'Tu SaaS B2B', product: 'Tu producto', audience: 'Head of Marketing en empresas 50-200 empleados', goal: 'Agendar demo', emails: '5 emails (día 1, 3, 7, 14, 21)' },
    },
    {
      icon: '📝', label: 'Artículo SEO técnico', hint: 'posiciona para tu ICP',
      cat: 'content', toolId: 'blog-post',
      inputs: { topic: 'Cómo automatizar [tu caso de uso] para equipos de marketing', keyword: 'automatización marketing B2B', audience: 'Marketing managers en SaaS y tech', word_count: '1.500 palabras', tone: 'Técnico y orientado a resultados' },
    },
    {
      icon: '🔬', label: 'Análisis de competidores SaaS', hint: 'diferénciate en el pitch',
      cat: 'strategy', toolId: 'competitor-research',
      inputs: { business_name: 'Tu SaaS', your_product: 'Tu solución B2B', location: 'España/Europa', target_customer: 'Marketing teams en empresas tecnológicas' },
    },
  ],
};

const QUICK_WINS_DEFAULT = [
  { icon: '📄', label: 'Client Proposal', hint: 'for a design agency', cat: 'agency', toolId: 'client-proposal', inputs: { agency_name: 'Studio Nova', client_name: 'GreenLeaf Organic Co.', service: 'Brand Identity + Website Redesign', client_goal: 'Modernize brand and increase online conversions by 40%', budget: '$8,000 project', duration: 'Project-based' } },
  { icon: '📱', label: 'Social Captions', hint: 'for a fitness brand', cat: 'marketing', toolId: 'social-media-captions', inputs: { topic: 'Spring fitness challenge', brand_voice: 'Inspiring', platforms: 'Instagram', goal: 'Engagement' } },
  { icon: '🔬', label: 'Competitor Research', hint: 'for Airbnb', cat: 'strategy', toolId: 'competitor-research', inputs: { business_name: 'Airbnb', your_product: 'Short-term rental marketplace', location: 'Global', target_customer: 'Travelers' } },
  { icon: '📝', label: 'Blog Post', hint: 'about email marketing', cat: 'content', toolId: 'blog-post', inputs: { topic: '10 Email Marketing Strategies That Actually Convert', keyword: 'email marketing strategies', audience: 'small business owners', word_count: '1,500 words', tone: 'Educational' } },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Dashboard() {
  const { currentUser, refreshUserProfile, userProfile } = useAuth();
  const { subscription, isCategoryLocked, isInTrial, usageCount, FREE_MONTHLY_LIMIT } = useSubscription();
  const { brandProfile } = useWorkspace();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeGoal, setActiveGoal] = useState(null);
  const [dropdownRect, setDropdownRect] = useState(null);
  const magicBarRef = useRef(null);

  const updateDropdownRect = useCallback(() => {
    if (magicBarRef.current) {
      const r = magicBarRef.current.getBoundingClientRect();
      setDropdownRect({ top: r.bottom + window.scrollY + 6, left: r.left, width: r.width });
    }
  }, []);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const paymentStatus = searchParams.get('payment');
  const PLAN_PRICES = { pro: 99, enterprise: 499 };

  const showOnboarding = userProfile && !userProfile.onboardingCompleted;
  const persona = userProfile?.persona;
  const quickWins = QUICK_WINS_BY_PERSONA[persona] || QUICK_WINS_DEFAULT;

  useEffect(() => {
    if (paymentStatus === 'success' && currentUser) {
      pushEvent('Suscribe', {
        value: PLAN_PRICES[subscription] ?? 0,
        currency: 'EUR',
      });
      const timer = setTimeout(() => refreshUserProfile(currentUser.uid), 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const inTrial = false;
  const usagePct = subscription === 'free' ? Math.min(100, Math.round((usageCount / FREE_MONTHLY_LIMIT) * 100)) : 100;
  const brandIncomplete = !brandProfile?.companyName;

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    for (const cat of CATEGORIES) {
      for (const tool of cat.tools) {
        if (
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q)
        ) {
          results.push({ tool, cat });
          if (results.length >= 8) return results;
        }
      }
    }
    return results;
  }, [search]);

  const PERSONA_ORDER = {
    agency_small: ['agency', 'strategy', 'marketing', 'content', 'creative', 'digital', 'ecommerce', 'startup', 'finance'],
    consultant:   ['agency', 'content', 'marketing', 'strategy', 'digital', 'creative', 'startup', 'finance', 'ecommerce'],
    ecommerce:    ['marketing', 'ecommerce', 'content', 'digital', 'strategy', 'creative', 'agency', 'startup', 'finance'],
    saas_b2b:     ['strategy', 'marketing', 'content', 'digital', 'startup', 'agency', 'creative', 'finance', 'ecommerce'],
  };
  const PERSONA_TOP = {
    agency_small: ['agency', 'strategy', 'marketing'],
    consultant:   ['agency', 'content', 'marketing'],
    ecommerce:    ['marketing', 'ecommerce', 'content'],
    saas_b2b:     ['strategy', 'marketing', 'content'],
  };
  const topCats = PERSONA_TOP[persona] || [];

  const visibleCategories = useMemo(() => {
    const nonAddon = CATEGORIES.filter(c => !c.isAddon);
    const addon    = CATEGORIES.filter(c => c.isAddon);
    let ordered = nonAddon;
    if (persona && PERSONA_ORDER[persona]) {
      const order = PERSONA_ORDER[persona];
      ordered = [...nonAddon].sort((a, b) => {
        const ai = order.indexOf(a.id); const bi = order.indexOf(b.id);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
    }
    const base = [...ordered, ...addon];
    if (!activeGoal) return base;
    const goal = GOALS.find(g => g.id === activeGoal);
    return goal ? base.filter(c => goal.cats.includes(c.id)) : base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGoal, persona]);

  function handleQuickWin(win) {
    sessionStorage.setItem('gormaran_rerun', JSON.stringify({ toolId: win.toolId, inputs: win.inputs }));
    navigate(`/category/${win.cat}`);
  }

  function handleSearchToolClick(catId, toolId) {
    sessionStorage.setItem('gormaran_select_tool', toolId);
    navigate(`/category/${catId}`);
  }

  return (
    <div className="page">
      {showOnboarding && (
        <OnboardingModal onComplete={() => refreshUserProfile(currentUser.uid)} />
      )}
      <div className="container">
        <div className="dashboard">

          {/* Payment success banner */}
          {paymentStatus === 'success' && (
            <motion.div
              className="alert alert-success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              🎉 {t('dashboard.paymentSuccess', { plan: subscription.charAt(0).toUpperCase() + subscription.slice(1), defaultValue: `Payment successful! Welcome to ${subscription.charAt(0).toUpperCase() + subscription.slice(1)}!` })}
            </motion.div>
          )}

          {/* Onboarding banner — solo visible hasta completar perfil + onboarding */}
          {!userProfile?.onboardingCompleted && brandIncomplete ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="dashboard__onboarding-banner dashboard__onboarding-banner--brand"
            >
              <div>
                <p className="dashboard__onboarding-title">🏢 Set up your Brand Profile first</p>
                <p className="dashboard__onboarding-sub">
                  Fill in your business details once and every tool will auto-fill for you — no more typing the same info over and over.
                </p>
              </div>
              <Link to="/settings" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                Set up now →
              </Link>
            </motion.div>
          ) : !userProfile?.onboardingCompleted ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="dashboard__onboarding-banner dashboard__onboarding-banner--tool"
            >
              <div>
                <p className="dashboard__onboarding-title">👋 Ready to go, {currentUser?.displayName?.split(' ')[0] || 'there'}!</p>
                <p className="dashboard__onboarding-sub">
                  Your Brand Profile is set. Most users start with the <strong>Proposal Generator</strong> — it saves 2+ hours on your first use.
                </p>
              </div>
              <Link to="/category/strategy" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                Try it now →
              </Link>
            </motion.div>
          ) : null}

          {/* Magic Bar */}
          <div className="dashboard__magic-bar" ref={magicBarRef}>
            <div className="dashboard__magic-input-wrap">
              <span className="dashboard__magic-icon">🔍</span>
              <input
                className="dashboard__magic-input"
                type="text"
                placeholder="Search tools — e.g. keyword, proposal, ads..."
                value={search}
                onChange={e => { setSearch(e.target.value); updateDropdownRect(); }}
                onFocus={updateDropdownRect}
              />
              {search && (
                <button className="dashboard__magic-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
          </div>

          {/* Magic Bar dropdown — rendered in body via Portal to avoid z-index stacking issues */}
          {search.trim() && dropdownRect && createPortal(
            <div
              className="dashboard__magic-portal"
              style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
            >
              {searchResults.length > 0
                ? searchResults.map(({ tool, cat }) => (
                    <button
                      key={tool.id}
                      className="dashboard__magic-result"
                      onClick={() => { setSearch(''); handleSearchToolClick(cat.id, tool.id); }}
                    >
                      <span className="dashboard__magic-result-icon">{tool.icon}</span>
                      <span className="dashboard__magic-result-name">{tool.name}</span>
                      <span className="dashboard__magic-result-cat">{cat.icon} {cat.name}</span>
                    </button>
                  ))
                : <div className="dashboard__magic-empty">No tools found for "{search}"</div>
              }
            </div>,
            document.body
          )}

          {/* Quick Wins */}
          <section className="dashboard__quick-wins">
            <h2 className="dashboard__section-title"><span>⚡</span> Try these now</h2>
            <div className="dashboard__quick-wins-grid">
              {quickWins.map((win) => (
                <button
                  key={win.toolId}
                  className="dashboard__qw-card"
                  onClick={() => handleQuickWin(win)}
                >
                  <span className="dashboard__qw-icon">{win.icon}</span>
                  <div className="dashboard__qw-body">
                    <span className="dashboard__qw-label">{win.label}</span>
                    <span className="dashboard__qw-hint">{win.hint}</span>
                  </div>
                  <span className="dashboard__qw-arrow">→</span>
                </button>
              ))}
            </div>
          </section>

          {/* Header */}
          <motion.div
            className="dashboard__header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="dashboard__greeting">
                {t('dashboard.greeting', { name: currentUser?.displayName?.split(' ')[0] || t('dashboard.guestName', { defaultValue: 'friend' }) })}
              </h1>
              <p className="dashboard__subtitle">{t('dashboard.subtitle')}</p>
            </div>

            <div className="dashboard__header-right">
              <div className="dashboard__plan-badge">
                <span className={`badge ${subscription === 'free' ? 'badge-free' : 'badge-pro'}`}>
                  {subscription === 'free' && inTrial
                    ? `🎁 ${t('ui.freeTrialBadge', { defaultValue: 'Free Trial' })} · 24h`
                    : subscription === 'free'
                    ? t('ui.freePlan', { defaultValue: 'Free Plan' })
                    : subscription === 'grow'
                    ? `⭐ ${t('ui.growPlan', { defaultValue: 'Grow Plan' })}`
                    : subscription === 'scale'
                    ? `💎 ${t('ui.scalePlan', { defaultValue: 'Scale Plan' })}`
                    : subscription === 'evolution'
                    ? `🚀 ${t('ui.evolutionPlan', { defaultValue: 'Evolution Plan' })}`
                    : `✅ ${subscription}`}
                </span>
              </div>
              {subscription === 'free' && (
                <Link to="/pricing" className="btn btn-primary btn-sm">
                  {t('ui.upgrade', { defaultValue: 'Pro →' })}
                </Link>
              )}
            </div>
          </motion.div>

          {/* Free plan usage quota */}
          {subscription === 'free' && (
            <motion.div
              className={`dashboard__usage${usageCount >= FREE_MONTHLY_LIMIT ? ' dashboard__usage--limit' : usageCount >= 7 ? ' dashboard__usage--warning' : ''}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {usageCount >= FREE_MONTHLY_LIMIT ? (
                /* Hard limit hit — full upgrade CTA */
                <div className="dashboard__usage-upgrade">
                  <div className="dashboard__usage-upgrade-text">
                    <span className="dashboard__usage-upgrade-title">🚫 {t('dashboard.limitReached', { defaultValue: 'Límite mensual alcanzado' })}</span>
                    <span className="dashboard__usage-upgrade-sub">{t('dashboard.limitNote', { defaultValue: 'Has usado las 10 automatizaciones gratuitas de este mes.' })}</span>
                  </div>
                  <Link to="/pricing" className="btn btn-primary btn-sm">
                    {t('dashboard.upgradePro', { defaultValue: 'Ir a Pro — sin límites →' })}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="dashboard__usage-info">
                    <span>
                      {usageCount >= 7
                        ? <><strong style={{ color: '#fbbf24' }}>⚠️ {FREE_MONTHLY_LIMIT - usageCount} {t('dashboard.left', { defaultValue: 'automatizaciones restantes' })}</strong></>
                        : t('dashboard.freeUsage', { defaultValue: 'Plan gratuito — uso mensual' })
                      }
                    </span>
                    <span className="dashboard__usage-count">
                      <strong>{usageCount}</strong> / {FREE_MONTHLY_LIMIT}
                    </span>
                  </div>
                  <div className="dashboard__usage-bar">
                    <div className="dashboard__usage-fill" style={{ width: `${usagePct}%` }} />
                  </div>
                  <p className="dashboard__usage-note">
                    {t('dashboard.freeNote', { defaultValue: 'Pásate a Pro para automatizaciones ilimitadas. ' })}
                    <Link to="/pricing">{t('ui.seePlans', { defaultValue: 'Ver planes' })} →</Link>
                  </p>
                </>
              )}
            </motion.div>
          )}

          {/* Category Grid */}
          <section className="dashboard__categories">
            <div className="dashboard__section-header">
              <h2 className="dashboard__section-title">
                <span>🚀</span> {t('ui.aiToolCategories', { defaultValue: 'AI Tool Categories' })}
              </h2>
              <div className="dashboard__goal-filters">
                {GOALS.map(goal => (
                  <button
                    key={goal.id}
                    className={`dashboard__goal-btn${activeGoal === goal.id ? ' dashboard__goal-btn--active' : ''}`}
                    onClick={() => setActiveGoal(prev => prev === goal.id ? null : goal.id)}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>

            <motion.div
              className="dashboard__grid"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {visibleCategories.map((cat) => {
                const locked = isCategoryLocked(cat.id);
                const catName = t(`cat.${cat.id}.name`, { defaultValue: cat.name });
                const catDesc = t(`cat.${cat.id}.desc`, { defaultValue: cat.description });

                if (cat.isAddon) {
                  return (
                    <motion.div
                      key={cat.id}
                      className="dashboard__addon-card"
                      variants={fadeUp}
                    >
                      <div className="dashboard__addon-left">
                        <span className="badge badge-primary dashboard__addon-badge">
                          {t('pricing.addon.badge', { defaultValue: '⚡ Add-on' })}
                        </span>
                        <h3 className="dashboard__addon-title">{catName}</h3>
                        <p className="dashboard__addon-desc">{catDesc}</p>
                        <ul className="dashboard__addon-features">
                          {[0, 1, 2, 3].map((i) => (
                            <li key={i}>✅ {t(`pricing.addon.feature.${i}`)}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="dashboard__addon-right">
                        <div className="dashboard__addon-price">
                          <span className="dashboard__addon-amount">
                            {t('pricing.addon.price', { defaultValue: '€10' })}
                          </span>
                          <span className="dashboard__addon-period">
                            {t('pricing.addon.period', { defaultValue: '/ 10 workflows' })}
                          </span>
                        </div>
                        <p className="dashboard__addon-renew">
                          {t('pricing.addon.renew', { defaultValue: 'No expiry · Works with any plan · Buy more when you need' })}
                        </p>
                        {subscription === 'admin' ? (
                          <Link to={`/category/${cat.id}`} className="btn btn-primary">
                            {t('ui.open', { defaultValue: 'Open →' })}
                          </Link>
                        ) : (
                          <Link to="/pricing" className="btn btn-primary">
                            {t('pricing.addon.cta', { defaultValue: 'Get Add-on →' })}
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                const isTop = topCats.includes(cat.id);
                return (
                  <motion.div
                    key={cat.id}
                    className={`dashboard__cat-card ${locked ? 'dashboard__cat-card--locked' : ''} ${isTop ? 'dashboard__cat-card--top' : ''}`}
                    variants={fadeUp}
                    whileHover={{ y: -6, scale: 1.01 }}
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
                      {isTop && !locked && (
                        <span className="dashboard__cat-recommended">⭐ Para ti</span>
                      )}
                      {locked && (
                        <span className="dashboard__cat-lock">🔒 {CATEGORY_MIN_TIER[cat.id] || 'Grow'}</span>
                      )}
                    </div>
                    <h3 className="dashboard__cat-name">{catName}</h3>
                    <p className="dashboard__cat-desc">{catDesc}</p>
                    <div className="dashboard__cat-tools">
                      {cat.tools.filter((tool) => !tool.hidden).map((tool) => (
                        <span key={tool.id} className="dashboard__tool-chip">
                          {tool.icon} {t(`tool.${tool.id}.name`, { defaultValue: tool.name })}
                        </span>
                      ))}
                    </div>
                    <div className="dashboard__cat-footer">
                      <span className="dashboard__cat-count">
                        {cat.tools.length} {t('ui.tools', { defaultValue: 'tools' })}
                      </span>
                      {locked ? (
                        <Link to="/pricing" className="btn btn-secondary btn-sm">
                          {t('ui.upgrade', { defaultValue: 'Upgrade' })}
                        </Link>
                      ) : (
                        <Link to={`/category/${cat.id}`} className="btn btn-primary btn-sm">
                          {t('ui.open', { defaultValue: 'Open →' })}
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>

        </div>
      </div>

      <InstagramAuditSection />

      <div className="container">
        <div className="dashboard">
          <motion.div
            className="dashboard__tip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="dashboard__tip-icon">💡</span>
            <p>
              <strong>Pro tip:</strong> Each tool has custom-engineered AI prompts. Fill in all fields for the most precise, actionable output.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}