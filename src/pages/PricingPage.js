import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { createCheckoutSession, validatePromoCode } from '../utils/api';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../utils/seo';
import './PricingPage.css';

const GROW = {
  id: 'grow',
  monthlyPrice: 19,
  annualMonthly: 15,
  monthlyPriceId: process.env.REACT_APP_STRIPE_GROW_PRICE_ID,
  annualPriceId:  process.env.REACT_APP_STRIPE_GROW_ANNUAL_PRICE_ID,
};

const SCALE = {
  id: 'scale',
  monthlyPrice: 49,
  annualMonthly: 39,
  monthlyPriceId: process.env.REACT_APP_STRIPE_SCALE_PRICE_ID,
  annualPriceId:  process.env.REACT_APP_STRIPE_SCALE_ANNUAL_PRICE_ID,
};

const EVOLUTION = {
  id: 'evolution',
  monthlyPrice: 129,
  annualMonthly: 103,
  monthlyPriceId: process.env.REACT_APP_STRIPE_EVOLUTION_PRICE_ID,
  annualPriceId:  process.env.REACT_APP_STRIPE_EVOLUTION_ANNUAL_PRICE_ID,
};

const FREE_FEATURES = [
  { es: '10 generaciones IA al mes', en: '10 AI generations per month' },
  { es: 'Herramientas: Marketing + Contenido', en: 'Tools: Marketing + Content' },
  { es: '1 workspace con perfil de marca', en: '1 workspace with brand profile' },
  { es: 'Streaming IA en tiempo real', en: 'Real-time AI streaming' },
  { es: 'Add-on n8n disponible (€10/10 flujos)', en: 'n8n add-on available (€10/10 flows)' },
];

const GROW_FEATURES = [
  { es: 'Generaciones IA ilimitadas', en: 'Unlimited AI generations', highlight: true },
  { es: 'Herramientas: Marketing + Contenido + Digital', en: 'Tools: Marketing + Content + Digital' },
  { es: '3 workspaces con perfil de marca', en: '3 workspaces with brand profile' },
  { es: 'Streaming IA en tiempo real', en: 'Real-time AI streaming' },
  { es: 'Templates optimizados por nicho', en: 'Niche-optimized templates' },
  { es: 'Gestión de equipo (colaboradores)', en: 'Team management (collaborators)' },
  { es: 'Soporte por email prioritario', en: 'Priority email support' },
  { es: 'Add-on n8n disponible (€10/10 flujos)', en: 'n8n add-on available (€10/10 flows)' },
];

const SCALE_FEATURES = [
  { es: 'Todo lo del plan Grow', en: 'Everything in Grow', highlight: true },
  { es: '+ Estrategia, Agencia, Ecommerce, Creatividad', en: '+ Strategy, Agency, Ecommerce, Creative' },
  { es: '5 workspaces con perfil de marca', en: '5 workspaces with brand profile' },
  { es: 'Historial de resultados', en: 'Output history' },
  { es: 'Soporte dedicado por email', en: 'Dedicated email support' },
  { es: 'Add-on n8n disponible (€10/10 flujos)', en: 'n8n add-on available (€10/10 flows)' },
];

const EVOLUTION_FEATURES = [
  { es: 'Todo lo del plan Scale', en: 'Everything in Scale', highlight: true },
  { es: 'White-label — tu marca, sin Gormaran', en: 'White-label — your brand, no Gormaran' },
  { es: 'Acceso API con streaming (REST + SSE)', en: 'API access with streaming (REST + SSE)' },
  { es: 'Workspaces ilimitados (multi-cliente)', en: 'Unlimited workspaces (multi-client)' },
  { es: 'SLA 99.9% uptime garantizado', en: '99.9% uptime SLA guaranteed' },
  { es: 'Account manager dedicado', en: 'Dedicated account manager' },
  { es: 'Onboarding personalizado (videollamada)', en: 'Personalised onboarding (video call)' },
];

const ROI_EXAMPLES = [
  { role: '🚀 Agencia (5-20 personas)', roleEn: '🚀 Agency (5–20 people)', hours: 40, rate: 35 },
  { role: '💼 Consultor independiente', roleEn: '💼 Independent consultant',  hours: 25, rate: 50 },
  { role: '🛍️ E-commerce',             roleEn: '🛍️ E-commerce',             hours: 20, rate: 30 },
  { role: '⚙️ SaaS B2B',               roleEn: '⚙️ B2B SaaS',               hours: 30, rate: 60 },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export default function PricingPage() {
  const { currentUser } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [searchParams] = useSearchParams();

  useSEO({
    title: 'Gormaran.io | Pricing — AI Marketing Credits & Plans',
    description: 'Start with 50 free credits. Upgrade to Grow, Scale or Evolution for more credits on Text, Design, Video, Audio and AI Agents.',
    canonical: 'https://gormaran.io/pricing',
  });
  const [billingPeriod, setBillingPeriod] = useState('annual');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoState, setPromoState] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [activeRoi, setActiveRoi] = useState(0);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/health`).catch(() => {});
  }, []);

  useEffect(() => {
    const param = searchParams.get('promo');
    if (param) setPromoCode(param.toUpperCase());
  }, [searchParams]);

  async function handleApplyPromo() {
    const trimmed = promoCode.trim().toUpperCase();
    if (!trimmed) return;
    setPromoError('');
    setPromoState(null);
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(trimmed);
      setPromoState(result);
    } catch (err) {
      setPromoError(err.message || (isEs ? 'Código inválido o caducado' : 'Invalid or expired code'));
    }
    setPromoLoading(false);
  }

  async function handlePlanSelect(plan, priceObj) {
    if (!currentUser) { navigate('/auth?mode=register'); return; }
    const priceId = billingPeriod === 'annual' ? priceObj.annualPriceId : priceObj.monthlyPriceId;
    if (!priceId || priceId === 'undefined') {
      setError(isEs
        ? 'El sistema de pago aún no está configurado. Contacta con hola@gormaran.io'
        : 'Payment system not configured yet. Contact hola@gormaran.io');
      return;
    }
    setError('');
    setLoadingPlan(plan);
    try {
      const { url } = await createCheckoutSession(priceId, 'subscription', promoState?.promoId || null);
      window.location.href = url;
    } catch (err) {
      setError(err.message || (isEs ? 'Error al iniciar el pago.' : 'Failed to start checkout.'));
    }
    setLoadingPlan(null);
  }

  async function handleAddonSelect() {
    if (!currentUser) { navigate('/auth?mode=register'); return; }
    const addonPriceId = process.env.REACT_APP_STRIPE_N8N_ADDON_PRICE_ID;
    if (!addonPriceId || addonPriceId === 'undefined') {
      setError(isEs ? 'Add-on no disponible. Contacta hola@gormaran.io' : 'Add-on not configured. Contact hola@gormaran.io');
      return;
    }
    setLoadingPlan('addon');
    try {
      const { url } = await createCheckoutSession(addonPriceId, 'payment', promoState?.promoId || null);
      window.location.href = url;
    } catch (err) {
      setError(err.message || (isEs ? 'Error al iniciar el pago.' : 'Failed to start checkout.'));
    }
    setLoadingPlan(null);
  }

  const growPrice = billingPeriod === 'annual' ? GROW.annualMonthly : GROW.monthlyPrice;
  const scalePrice = billingPeriod === 'annual' ? SCALE.annualMonthly : SCALE.monthlyPrice;
  const evoPrice = billingPeriod === 'annual' ? EVOLUTION.annualMonthly : EVOLUTION.monthlyPrice;
  const roiEx = ROI_EXAMPLES[activeRoi];
  const roiValue = roiEx.hours * roiEx.rate;

  const isCurrent = (planId) => subscription === planId;
  const planCta = (planId, priceObj, priceDisplay, label) => {
    if (isCurrent(planId)) {
      return (
        <button className="btn btn-secondary pricing2__plan-cta pricing2__plan-cta--current" disabled>
          {isEs ? '✅ Plan actual' : '✅ Current plan'}
        </button>
      );
    }
    return (
      <button
        className={`btn ${planId === 'grow' ? 'btn-primary' : planId === 'scale' ? 'btn-scale' : 'btn-evolution'} pricing2__plan-cta`}
        onClick={() => handlePlanSelect(planId, priceObj)}
        disabled={loadingPlan === planId}
      >
        {loadingPlan === planId ? (isEs ? 'Procesando...' : 'Processing...') : label}
      </button>
    );
  };

  return (
    <div className="page">
      <div className="pricing2">

        {/* ── HERO ── */}
        <motion.div
          className="pricing2__hero container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <span className="badge badge-primary">
            {isEs ? '💸 Precios Simples' : '💸 Simple Pricing'}
          </span>
          <h1 className="pricing2__title">
            {isEs
              ? <>Tu tiempo vale más que <span className="gradient-text">€{growPrice}/mes</span></>
              : <>Your time is worth more than <span className="gradient-text">€{growPrice}/mo</span></>
            }
          </h1>
          <p className="pricing2__subtitle">
            {isEs
              ? 'Automatiza tu marketing con IA. Sin límites. Sin contratos. Con resultados reales.'
              : 'Automate your marketing with AI. No limits. No contracts. Real results.'}
          </p>
        </motion.div>

        {/* ── BILLING TOGGLE ── */}
        <div className="container">
          <div className="pricing2__toggle">
            <button
              className={`pricing2__toggle-btn${billingPeriod === 'monthly' ? ' pricing2__toggle-btn--active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              {isEs ? 'Mensual' : 'Monthly'}
            </button>
            <button
              className={`pricing2__toggle-btn${billingPeriod === 'annual' ? ' pricing2__toggle-btn--active' : ''}`}
              onClick={() => setBillingPeriod('annual')}
            >
              {isEs ? 'Anual' : 'Annual'}
              <span className="pricing2__save-badge">{isEs ? 'Ahorra 20%' : 'Save 20%'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="container">
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>⚠️ {error}</div>
          </div>
        )}

        {/* ── PROMO CODE ── */}
        <div className="container">
          <div className="pricing2__promo">
            <input
              className="pricing2__promo-input"
              type="text"
              placeholder={isEs ? 'Código de descuento' : 'Discount code'}
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoState(null); setPromoError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
              disabled={promoLoading}
            />
            <button
              className="btn btn-secondary pricing2__promo-btn"
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
            >
              {promoLoading ? '...' : (isEs ? 'Aplicar' : 'Apply')}
            </button>
            {promoState && (
              <span className="pricing2__promo-ok">✅ {promoState.name} — {promoState.discountLabel}</span>
            )}
            {promoError && <span className="pricing2__promo-err">⚠️ {promoError}</span>}
          </div>
        </div>

        {/* ── PLANS ── */}
        <div className="container">
          <motion.div
            className="pricing2__plans pricing2__plans--4col"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* FREE */}
            <motion.div className="pricing2__plan pricing2__plan--free" variants={fadeUp}>
              <div className="pricing2__plan-header">
                <h2 className="pricing2__plan-name">Free</h2>
                <p className="pricing2__plan-desc">
                  {isEs ? 'Explora todas las herramientas sin tarjeta' : 'Explore all tools, no credit card'}
                </p>
              </div>
              <div className="pricing2__plan-price">
                <span className="pricing2__plan-amount">€0</span>
                <span className="pricing2__plan-period">{isEs ? 'para siempre' : 'forever'}</span>
              </div>
              <Link
                to="/auth?mode=register"
                className={`btn btn-secondary pricing2__plan-cta${isCurrent('free') ? ' pricing2__plan-cta--current' : ''}`}
              >
                {isCurrent('free') ? (isEs ? '✅ Plan actual' : '✅ Current plan') : (isEs ? 'Empezar gratis' : 'Start free')}
              </Link>
              <ul className="pricing2__features">
                {FREE_FEATURES.map((f) => (
                  <li key={f.es} className="pricing2__feature">
                    <span className="pricing2__feature-check">✓</span>
                    <span>{isEs ? f.es : f.en}</span>
                  </li>
                ))}
                <li className="pricing2__feature pricing2__feature--locked">
                  <span className="pricing2__feature-lock">✗</span>
                  <span>{isEs ? 'Automatizaciones ilimitadas' : 'Unlimited automations'}</span>
                </li>
              </ul>
            </motion.div>

            {/* GROW */}
            <motion.div className="pricing2__plan pricing2__plan--grow" variants={fadeUp}>
              <div className="pricing2__plan-glow" />
              <div className="pricing2__plan-badge-top">
                {isEs ? '⭐ Más Popular' : '⭐ Most Popular'}
              </div>
              <div className="pricing2__plan-header">
                <h2 className="pricing2__plan-name">Grow</h2>
                <p className="pricing2__plan-desc">
                  {isEs
                    ? 'Para profesionales y agencias que no pueden permitirse límites'
                    : 'For professionals & agencies who can\'t afford limits'}
                </p>
              </div>
              <div className="pricing2__plan-price">
                <span className="pricing2__plan-amount">€{growPrice}</span>
                <span className="pricing2__plan-period">/mes</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="pricing2__plan-annual-note">
                  {isEs ? `€${GROW.monthlyPrice * 12 * 0.8}/año — ahorras €${GROW.monthlyPrice * 12 - Math.round(GROW.monthlyPrice * 12 * 0.8)}` : `€${Math.round(GROW.monthlyPrice * 12 * 0.8)}/year — save €${GROW.monthlyPrice * 12 - Math.round(GROW.monthlyPrice * 12 * 0.8)}`}
                </p>
              )}
              {planCta('grow', GROW, growPrice, isEs ? 'Empezar Grow →' : 'Start Grow →')}
              <p className="pricing2__guarantee">
                🔒 {isEs ? 'Garantía 7 días · Sin permanencia · Cancela cuando quieras' : '7-day money-back · No lock-in · Cancel anytime'}
              </p>
              <ul className="pricing2__features">
                {GROW_FEATURES.map((f) => (
                  <li key={f.es} className={`pricing2__feature${f.highlight ? ' pricing2__feature--highlight' : ''}`}>
                    <span className="pricing2__feature-check">✓</span>
                    <span>{isEs ? f.es : f.en}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* SCALE */}
            <motion.div className="pricing2__plan pricing2__plan--scale" variants={fadeUp}>
              <div className="pricing2__plan-header">
                <h2 className="pricing2__plan-name">Scale</h2>
                <p className="pricing2__plan-desc">
                  {isEs
                    ? 'Para equipos y agencias que escalan con múltiples clientes'
                    : 'For teams & agencies scaling across multiple clients'}
                </p>
              </div>
              <div className="pricing2__plan-price">
                <span className="pricing2__plan-amount">€{scalePrice}</span>
                <span className="pricing2__plan-period">/mes</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="pricing2__plan-annual-note">
                  {isEs ? `€${Math.round(SCALE.monthlyPrice * 12 * 0.8)}/año — ahorras €${SCALE.monthlyPrice * 12 - Math.round(SCALE.monthlyPrice * 12 * 0.8)}` : `€${Math.round(SCALE.monthlyPrice * 12 * 0.8)}/year — save €${SCALE.monthlyPrice * 12 - Math.round(SCALE.monthlyPrice * 12 * 0.8)}`}
                </p>
              )}
              {planCta('scale', SCALE, scalePrice, isEs ? 'Empezar Scale →' : 'Start Scale →')}
              <p className="pricing2__guarantee">
                🔒 {isEs ? 'Garantía 7 días · Sin permanencia · Cancela cuando quieras' : '7-day money-back · No lock-in · Cancel anytime'}
              </p>
              <ul className="pricing2__features">
                {SCALE_FEATURES.map((f) => (
                  <li key={f.es} className={`pricing2__feature${f.highlight ? ' pricing2__feature--highlight' : ''}`}>
                    <span className="pricing2__feature-check">✓</span>
                    <span>{isEs ? f.es : f.en}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* EVOLUTION */}
            <motion.div className="pricing2__plan pricing2__plan--evolution" variants={fadeUp}>
              <div className="pricing2__plan-badge-top pricing2__plan-badge-top--evolution">
                {isEs ? '🚀 Full Power' : '🚀 Full Power'}
              </div>
              <div className="pricing2__plan-header">
                <h2 className="pricing2__plan-name">Evolution</h2>
                <p className="pricing2__plan-desc">
                  {isEs
                    ? 'Para agencias que revenden y equipos que necesitan API y white-label'
                    : 'For agencies that resell and teams needing API & white-label'}
                </p>
              </div>
              <div className="pricing2__plan-price">
                <span className="pricing2__plan-amount">€{evoPrice}</span>
                <span className="pricing2__plan-period">/mes</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="pricing2__plan-annual-note">
                  {isEs ? `€${Math.round(EVOLUTION.monthlyPrice * 12 * 0.8)}/año — ahorras €${EVOLUTION.monthlyPrice * 12 - Math.round(EVOLUTION.monthlyPrice * 12 * 0.8)}` : `€${Math.round(EVOLUTION.monthlyPrice * 12 * 0.8)}/year — save €${EVOLUTION.monthlyPrice * 12 - Math.round(EVOLUTION.monthlyPrice * 12 * 0.8)}`}
                </p>
              )}
              {planCta('evolution', EVOLUTION, evoPrice, isEs ? 'Contratar Evolution →' : 'Get Evolution →')}
              <p className="pricing2__guarantee">
                🔒 {isEs ? 'Sin permanencia · Cancela cuando quieras · SLA incluido' : 'No lock-in · Cancel anytime · SLA included'}
              </p>
              <ul className="pricing2__features">
                {EVOLUTION_FEATURES.map((f) => (
                  <li key={f.es} className={`pricing2__feature${f.highlight ? ' pricing2__feature--highlight' : ''}`}>
                    <span className="pricing2__feature-check">✓</span>
                    <span>{isEs ? f.es : f.en}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>

        {/* ── COMPARISON TABLE ── */}
        <div className="container">
          <motion.div
            className="pricing2__comparison"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="pricing2__section-title">
              {isEs ? 'Comparativa de planes' : 'Plan comparison'}
            </h2>
            <div className="pricing2__table-wrap">
              <table className="pricing2__table">
                <thead>
                  <tr>
                    <th></th>
                    <th className="pricing2__th--free">Free</th>
                    <th className="pricing2__th--grow">Grow</th>
                    <th className="pricing2__th--scale">Scale</th>
                    <th className="pricing2__th--evolution">Evolution</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: isEs ? 'Generaciones IA / mes' : 'AI generations / month',
                      free: '10',
                      grow: isEs ? 'Ilimitadas ∞' : 'Unlimited ∞',
                      scale: isEs ? 'Ilimitadas ∞' : 'Unlimited ∞',
                      evo: isEs ? 'Ilimitadas ∞' : 'Unlimited ∞',
                    },
                    {
                      label: isEs ? 'Categorías de herramientas' : 'Tool categories',
                      free: isEs ? 'Marketing + Contenido' : 'Marketing + Content',
                      grow: isEs ? '+ Digital' : '+ Digital',
                      scale: isEs ? '+ Estrategia, Ecommerce, Agencia, Creatividad' : '+ Strategy, Ecommerce, Agency, Creative',
                      evo: isEs ? 'Todas (30+ herramientas)' : 'All (30+ tools)',
                    },
                    {
                      label: isEs ? 'Automatizaciones n8n (Add-on)' : 'n8n Automations (Add-on)',
                      free: isEs ? '€10 / 10 flujos' : '€10 / 10 flows',
                      grow: isEs ? '€10 / 10 flujos' : '€10 / 10 flows',
                      scale: isEs ? '€10 / 10 flujos' : '€10 / 10 flows',
                      evo: isEs ? '€10 / 10 flujos' : '€10 / 10 flows',
                    },
                    { label: isEs ? 'Workspaces' : 'Workspaces', free: '1', grow: '3', scale: '5', evo: isEs ? 'Ilimitados' : 'Unlimited' },
                    { label: isEs ? 'Gestión de equipo' : 'Team management', free: '❌', grow: '✅', scale: '✅', evo: '✅' },
                    { label: isEs ? 'Streaming IA' : 'AI streaming', free: '✅', grow: '✅', scale: '✅', evo: '✅' },
                    { label: isEs ? 'White-label' : 'White-label', free: '❌', grow: '❌', scale: '❌', evo: '✅' },
                    { label: isEs ? 'Acceso API' : 'API access', free: '❌', grow: '❌', scale: '❌', evo: '✅' },
                    { label: isEs ? 'SLA uptime' : 'Uptime SLA', free: '❌', grow: '❌', scale: '❌', evo: '99.9%' },
                    { label: isEs ? 'Soporte' : 'Support', free: 'Email', grow: isEs ? 'Prioritario' : 'Priority', scale: isEs ? 'Prioritario' : 'Priority', evo: isEs ? 'Dedicado' : 'Dedicated' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td>{row.label}</td>
                      <td className="pricing2__td--free">{row.free}</td>
                      <td className="pricing2__td--grow">{row.grow}</td>
                      <td className="pricing2__td--scale">{row.scale}</td>
                      <td className="pricing2__td--evolution">{row.evo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* ── FAQ ── */}
        <div className="container pricing2__faq">
          <h2 className="pricing2__section-title">
            {isEs ? 'Preguntas frecuentes' : 'Frequently asked questions'}
          </h2>
          <div className="pricing2__faq-grid">
            {[
              {
                q: isEs ? '¿Qué es una "automatización"?' : 'What counts as an "automation"?',
                a: isEs ? 'Cada vez que usas una herramienta de IA para generar un resultado cuenta como 1 automatización. El plan Free incluye 10 al mes.' : 'Each time you use an AI tool to generate an output counts as 1 automation. Free includes 10/month.',
              },
              {
                q: isEs ? '¿Puedo cancelar cuando quiera?' : 'Can I cancel anytime?',
                a: isEs ? 'Sí. Cancela desde tu perfil en cualquier momento. Sin penalizaciones, sin preguntas. Tu plan baja a Free automáticamente.' : 'Yes. Cancel from your profile anytime. No penalties, no questions. Drops to Free automatically.',
              },
              {
                q: isEs ? '¿Hay garantía de devolución?' : 'Is there a money-back guarantee?',
                a: isEs ? '7 días de garantía total en todos los planes de pago. Si no estás satisfecho, te devolvemos el 100% sin preguntas.' : '7-day full money-back on all paid plans. Not happy? We refund 100%, no questions asked.',
              },
              {
                q: isEs ? '¿Cuál es la diferencia entre Grow, Scale y Evolution?' : 'What is the difference between Grow, Scale and Evolution?',
                a: isEs
                  ? 'Grow incluye uso ilimitado, 3 workspaces y gestión de equipo. Scale añade 5 workspaces e integraciones avanzadas. Evolution desbloquea white-label, acceso API, workspaces ilimitados y SLA 99.9%.'
                  : 'Grow includes unlimited use, 3 workspaces and team management. Scale adds 5 workspaces and advanced integrations. Evolution unlocks white-label, API access, unlimited workspaces and 99.9% SLA.',
              },
              {
                q: isEs ? '¿Necesito tarjeta de crédito para el plan Free?' : 'Do I need a credit card for Free?',
                a: isEs ? 'No. El plan Free es 100% gratuito, sin tarjeta de crédito. Solo un email para registrarte.' : 'No. Free is 100% free, no credit card. Just an email to sign up.',
              },
            ].map((item, i) => (
              <div key={i} className="pricing2__faq-item">
                <h4>{item.q}</h4>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ROI CALCULATOR ── */}
        <div className="container">
          <motion.div
            className="pricing2__roi"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="pricing2__roi-title">
              {isEs ? '¿Cuánto vale tu tiempo?' : 'What is your time worth?'}
            </h2>
            <p className="pricing2__roi-sub">
              {isEs
                ? `Gormaran ahorra 20-40 horas al mes. Eso es mucho más que €${growPrice}.`
                : `Gormaran saves 20-40 hours/month. That's worth far more than €${growPrice}.`}
            </p>
            <div className="pricing2__roi-tabs">
              {ROI_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className={`pricing2__roi-tab${activeRoi === i ? ' pricing2__roi-tab--active' : ''}`}
                  onClick={() => setActiveRoi(i)}
                >
                  {isEs ? ex.role : ex.roleEn}
                </button>
              ))}
            </div>
            <div className="pricing2__roi-result">
              <div className="pricing2__roi-math">
                <div className="pricing2__roi-item">
                  <span className="pricing2__roi-num">{roiEx.hours}h</span>
                  <span className="pricing2__roi-label">{isEs ? 'ahorro/mes' : 'saved/month'}</span>
                </div>
                <span className="pricing2__roi-op">×</span>
                <div className="pricing2__roi-item">
                  <span className="pricing2__roi-num">€{roiEx.rate}</span>
                  <span className="pricing2__roi-label">{isEs ? 'tu hora' : 'your hour'}</span>
                </div>
                <span className="pricing2__roi-op">=</span>
                <div className="pricing2__roi-item pricing2__roi-item--total">
                  <span className="pricing2__roi-num pricing2__roi-num--big">€{roiValue}</span>
                  <span className="pricing2__roi-label">{isEs ? 'valor/mes' : 'value/month'}</span>
                </div>
              </div>
              <div className="pricing2__roi-verdict">
                {isEs
                  ? <>Pagas <strong>€{growPrice}/mes</strong>. Recuperas <strong>€{roiValue - growPrice}+</strong> en valor.</>
                  : <>You pay <strong>€{growPrice}/mo</strong>. You get back <strong>€{roiValue - growPrice}+</strong> in value.</>}
              </div>
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                {isEs ? `Empezar Grow por €${growPrice}/mes →` : `Start Grow for €${growPrice}/mo →`}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ── N8N ADDON ── */}
        <div className="container">
          <motion.div
            className="pricing2__addon"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="pricing2__addon-left">
              <span className="badge badge-primary">⚡ Add-on</span>
              <h3 className="pricing2__addon-title">
                {t('pricing.addon.title', { defaultValue: 'n8n Automation' })}
              </h3>
              <p className="pricing2__addon-desc">
                {isEs
                  ? 'Conecta Gormaran con tus flujos de trabajo. Disponible para cualquier plan.'
                  : 'Connect Gormaran to your workflows. Available for any plan.'}
              </p>
              <ul className="pricing2__addon-features">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i}>✅ {t(`pricing.addon.feature.${i}`)}</li>
                ))}
              </ul>
            </div>
            <div className="pricing2__addon-right">
              <div className="pricing2__addon-price">
                <span className="pricing2__addon-amount">{t('pricing.addon.price', { defaultValue: '€10' })}</span>
                <span className="pricing2__addon-period">{t('pricing.addon.period', { defaultValue: '/ 10 workflows' })}</span>
              </div>
              <p className="pricing2__addon-renew">
                {isEs ? 'Sin caducidad · Válido para cualquier plan · Compra más cuando quieras' : 'No expiry · Works with any plan · Buy more when you need'}
              </p>
              <button
                className="btn btn-primary pricing2__addon-cta"
                onClick={handleAddonSelect}
                disabled={loadingPlan === 'addon'}
              >
                {loadingPlan === 'addon' ? '...' : (isEs ? 'Añadir Add-on →' : 'Get Add-on →')}
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── BOTTOM CTA ── */}
        <div className="container pricing2__bottom-cta">
          <motion.div
            className="pricing2__cta-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="pricing2__cta-proof">
              {['A','B','C','D','E'].map((l) => (
                <div key={l} className="pricing2__cta-avatar">{l}</div>
              ))}
              <span>{isEs ? '370+ marketers ya lo usan' : '370+ marketers already using it'}</span>
            </div>
            <h2>
              {isEs
                ? <>¿Listo para trabajar <span className="gradient-text">sin límites?</span></>
                : <>Ready to work <span className="gradient-text">without limits?</span></>}
            </h2>
            <p>
              {isEs
                ? 'Prueba Grow gratis 7 días. Si no te convence, te devolvemos el dinero.'
                : 'Try Grow free for 7 days. Not convinced? Full refund.'}
            </p>
            <div className="pricing2__cta-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => handlePlanSelect('grow', GROW, growPrice)}
                disabled={loadingPlan === 'grow'}
              >
                {loadingPlan === 'grow' ? '...' : (isEs ? `Empezar Grow — €${growPrice}/mes →` : `Start Grow — €${growPrice}/mo →`)}
              </button>
              <Link to="/auth?mode=register" className="btn btn-secondary">
                {isEs ? 'O empieza gratis' : 'Or start free'}
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
