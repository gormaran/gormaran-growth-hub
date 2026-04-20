import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { createCheckoutSession, validatePromoCode } from '../utils/api';
import { useTranslation } from 'react-i18next';
import './PricingPage.css';

const PRO = {
  id: 'pro',
  monthlyPrice: 99,
  annualMonthly: 79,
  annualTotal: 948,
  monthlyPriceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID,
  annualPriceId:  process.env.REACT_APP_STRIPE_PRO_ANNUAL_PRICE_ID,
};

const FREE_FEATURES = [
  { text: '10 automatizaciones al mes', en: '10 automations per month' },
  { text: 'Todas las herramientas de IA (30+)', en: 'All AI tools (30+)' },
  { text: '1 workspace con perfil de marca', en: '1 workspace with brand profile' },
  { text: 'Streaming IA en tiempo real', en: 'Real-time AI streaming' },
];

const PRO_FEATURES = [
  { text: 'Automatizaciones ilimitadas', en: 'Unlimited automations', highlight: true },
  { text: 'Todas las herramientas de IA (30+)', en: 'All AI tools (30+)' },
  { text: '1 workspace con perfil de marca', en: '1 workspace with brand profile' },
  { text: 'Streaming IA en tiempo real', en: 'Real-time AI streaming' },
  { text: 'Resultados optimizados por nicho', en: 'Niche-optimized outputs' },
  { text: 'Historial de resultados', en: 'Output history' },
  { text: 'Soporte por email prioritario', en: 'Priority email support' },
];

const ROI_EXAMPLES = [
  { role: '🚀 Agencia (5-20 personas)', hours: 40, rate: 35, label: 'agencias' },
  { role: '💼 Consultor independiente',  hours: 25, rate: 50, label: 'consultores' },
  { role: '🛍️ E-commerce',              hours: 20, rate: 30, label: 'e-commerce' },
  { role: '⚙️ SaaS B2B',                hours: 30, rate: 60, label: 'saas' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function PricingPage() {
  const { currentUser } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [searchParams] = useSearchParams();
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
      setPromoError(err.message || t('pricing.promo.invalid', { defaultValue: 'Invalid or expired code' }));
    }
    setPromoLoading(false);
  }

  async function handleProSelect() {
    if (!currentUser) {
      navigate('/auth?mode=register');
      return;
    }
    const priceId = billingPeriod === 'annual' ? PRO.annualPriceId : PRO.monthlyPriceId;
    if (!priceId || priceId === 'undefined') {
      setError(isEs
        ? 'El sistema de pago aún no está configurado. Contacta con hola@gormaran.io'
        : 'Payment system not configured yet. Contact hola@gormaran.io');
      return;
    }
    setError('');
    setLoadingPlan('pro');
    try {
      const { url } = await createCheckoutSession(priceId, 'subscription', promoState?.promoId || null);
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Failed to start checkout.');
    }
    setLoadingPlan(null);
  }

  async function handleAddonSelect() {
    if (!currentUser) { navigate('/auth?mode=register'); return; }
    const addonPriceId = process.env.REACT_APP_STRIPE_N8N_ADDON_PRICE_ID;
    if (!addonPriceId || addonPriceId === 'undefined') {
      setError('N8n add-on not configured. Contact hola@gormaran.io'); return;
    }
    setLoadingPlan('addon');
    try {
      const { url } = await createCheckoutSession(addonPriceId, 'payment', promoState?.promoId || null);
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Failed to start checkout.');
    }
    setLoadingPlan(null);
  }

  const displayPrice = billingPeriod === 'annual' ? PRO.annualMonthly : PRO.monthlyPrice;
  const roiEx = ROI_EXAMPLES[activeRoi];
  const roiValue = roiEx.hours * roiEx.rate;

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
              ? <>Tu tiempo vale más que <span className="gradient-text">€{displayPrice}/mes</span></>
              : <>Your time is worth more than <span className="gradient-text">€{displayPrice}/mo</span></>
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
            className="pricing2__plans"
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
                className={`btn btn-secondary pricing2__plan-cta${subscription === 'free' ? ' pricing2__plan-cta--current' : ''}`}
              >
                {subscription === 'free' ? (isEs ? '✅ Plan actual' : '✅ Current plan') : (isEs ? 'Empezar gratis' : 'Start free')}
              </Link>
              <ul className="pricing2__features">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className="pricing2__feature">
                    <span className="pricing2__feature-check">✓</span>
                    <span>{isEs ? f.text : f.en}</span>
                  </li>
                ))}
                <li className="pricing2__feature pricing2__feature--locked">
                  <span className="pricing2__feature-lock">✗</span>
                  <span>{isEs ? 'Automatizaciones ilimitadas' : 'Unlimited automations'}</span>
                </li>
              </ul>
            </motion.div>

            {/* PRO */}
            <motion.div className="pricing2__plan pricing2__plan--pro" variants={fadeUp}>
              <div className="pricing2__plan-glow" />
              <div className="pricing2__plan-badge-top">
                {isEs ? '⭐ Más Popular' : '⭐ Most Popular'}
              </div>
              <div className="pricing2__plan-header">
                <h2 className="pricing2__plan-name">Pro</h2>
                <p className="pricing2__plan-desc">
                  {isEs
                    ? 'Para agencias y consultores que no pueden permitirse límites'
                    : 'For agencies & consultants who can\'t afford limits'}
                </p>
              </div>
              <div className="pricing2__plan-price">
                <span className="pricing2__plan-amount">€{displayPrice}</span>
                <span className="pricing2__plan-period">/mes</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="pricing2__plan-annual-note">
                  €{PRO.annualTotal} {isEs ? 'al año — ahorras' : 'per year — you save'} €{PRO.monthlyPrice * 12 - PRO.annualTotal}
                </p>
              )}
              <button
                className={`btn btn-primary pricing2__plan-cta${subscription === 'pro' ? ' pricing2__plan-cta--current' : ''}`}
                onClick={handleProSelect}
                disabled={subscription === 'pro' || loadingPlan === 'pro'}
              >
                {subscription === 'pro'
                  ? (isEs ? '✅ Plan actual' : '✅ Current plan')
                  : loadingPlan === 'pro'
                  ? (isEs ? 'Procesando...' : 'Processing...')
                  : (isEs ? `Empezar Pro →` : `Start Pro →`)}
              </button>
              <p className="pricing2__guarantee">
                🔒 {isEs ? 'Garantía 7 días · Sin permanencia · Cancela cuando quieras' : '7-day money-back · No lock-in · Cancel anytime'}
              </p>
              <ul className="pricing2__features">
                {PRO_FEATURES.map((f) => (
                  <li key={f.text} className={`pricing2__feature${f.highlight ? ' pricing2__feature--highlight' : ''}`}>
                    <span className="pricing2__feature-check">✓</span>
                    <span>{isEs ? f.text : f.en}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
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
                ? 'Gormaran ahorra 20-40 horas al mes. Eso es mucho más que €99.'
                : 'Gormaran saves 20-40 hours/month. That\'s worth far more than €99.'}
            </p>
            <div className="pricing2__roi-tabs">
              {ROI_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className={`pricing2__roi-tab${activeRoi === i ? ' pricing2__roi-tab--active' : ''}`}
                  onClick={() => setActiveRoi(i)}
                >
                  {ex.role}
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
                  <span className="pricing2__roi-num pricing2__roi-num--big">€{roiEx.hours * roiEx.rate}</span>
                  <span className="pricing2__roi-label">{isEs ? 'valor/mes' : 'value/month'}</span>
                </div>
              </div>
              <div className="pricing2__roi-verdict">
                {isEs
                  ? <>Pagas <strong>€{displayPrice}/mes</strong>. Recuperas <strong>€{roiValue - displayPrice}+</strong> en valor.</>
                  : <>You pay <strong>€{displayPrice}/mo</strong>. You get back <strong>€{roiValue - displayPrice}+</strong> in value.</>}
              </div>
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                {isEs ? `Empezar Pro por €${displayPrice}/mes →` : `Start Pro for €${displayPrice}/mo →`}
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
                {t('pricing.addon.title', { defaultValue: 'N8n Automation' })}
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
                {t('pricing.addon.renew', { defaultValue: 'No expiry · Works with any plan' })}
              </p>
              <button
                className="btn btn-primary pricing2__addon-cta"
                onClick={handleAddonSelect}
                disabled={loadingPlan === 'addon'}
              >
                {loadingPlan === 'addon' ? '...' : t('pricing.addon.cta', { defaultValue: 'Get Add-on →' })}
              </button>
            </div>
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
              {isEs ? 'Free vs Pro — qué cambia' : 'Free vs Pro — what changes'}
            </h2>
            <div className="pricing2__table-wrap">
              <table className="pricing2__table">
                <thead>
                  <tr>
                    <th></th>
                    <th className="pricing2__th--free">Free</th>
                    <th className="pricing2__th--pro">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: isEs ? 'Automatizaciones / mes' : 'Automations / month', free: '10',         pro: isEs ? 'Ilimitadas ∞' : 'Unlimited ∞' },
                    { label: isEs ? 'Herramientas de IA (30+)' : 'AI tools (30+)',    free: '✅',         pro: '✅' },
                    { label: isEs ? 'Workspace de marca' : 'Brand workspace',         free: '✅',         pro: '✅' },
                    { label: isEs ? 'Streaming IA' : 'AI streaming',                  free: '✅',         pro: '✅' },
                    { label: isEs ? 'Templates por nicho' : 'Niche templates',        free: '❌',         pro: '✅' },
                    { label: isEs ? 'Soporte prioritario' : 'Priority support',       free: isEs ? 'Email' : 'Email', pro: isEs ? 'Prioritario' : 'Priority' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td>{row.label}</td>
                      <td className="pricing2__td--free">{row.free}</td>
                      <td className="pricing2__td--pro">{row.pro}</td>
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
                a: isEs ? '7 días de garantía total en el plan Pro. Si no estás satisfecho, te devolvemos el 100% sin preguntas.' : '7-day full money-back on Pro. Not happy? We refund 100%, no questions asked.',
              },
              {
                q: isEs ? '¿Necesito tarjeta de crédito para el plan Free?' : 'Do I need a credit card for Free?',
                a: isEs ? 'No. El plan Free es 100% gratuito, sin tarjeta de crédito. Solo un email para registrarte.' : 'No. Free is 100% free, no credit card. Just an email to sign up.',
              },
              {
                q: isEs ? '¿Ofrecéis planes para agencias o equipos?' : 'Do you offer agency or team plans?',
                a: isEs ? 'Estamos trabajando en funcionalidades de equipo. Por ahora, contáctanos en hola@gormaran.io y encontramos la mejor solución para ti.' : 'We\'re building team features. For now, contact us at hola@gormaran.io and we\'ll find the best setup for you.',
              },
            ].map((item, i) => (
              <div key={i} className="pricing2__faq-item">
                <h4>{item.q}</h4>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
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
                ? 'Prueba Pro gratis 7 días. Si no te convence, te devolvemos el dinero.'
                : 'Try Pro free for 7 days. Not convinced? Full refund.'}
            </p>
            <div className="pricing2__cta-actions">
              <button className="btn btn-primary btn-lg" onClick={handleProSelect} disabled={loadingPlan === 'pro'}>
                {loadingPlan === 'pro' ? '...' : (isEs ? `Empezar Pro — €${displayPrice}/mes →` : `Start Pro — €${displayPrice}/mo →`)}
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
