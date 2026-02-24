import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamAIResponse } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Link } from 'react-router-dom';
import './InstagramAuditSection.css';

const GOALS = [
  'Sell products or services',
  'Grow my audience',
  'Generate leads',
  'Build personal authority',
  'Drive traffic to my website',
];

const CONTENT_TYPES = [
  'Tips & Education',
  'Personal Brand',
  'Products / Services',
  'Lifestyle',
  'Mix of everything',
];

const FOLLOWERS = [
  '0 – 1,000',
  '1,000 – 5,000',
  '5,000 – 20,000',
  '20,000 – 100,000',
  '100,000+',
];

const CHECKLIST = [
  '¿Explica claramente a quién ayudas?',
  '¿Dice qué problema solucionas?',
  '¿Incluye una propuesta de valor concreta?',
  '¿Tiene un CTA claro? (Reserva, Descarga, Escríbeme…)',
  '¿El link lleva a una página estratégica?',
];

export default function InstagramAuditSection() {
  const { currentUser } = useAuth();
  const { isAtLimit } = useSubscription();
  const [bio, setBio] = useState('');
  const [niche, setNiche] = useState('');
  const [goal, setGoal] = useState('');
  const [contentType, setContentType] = useState('');
  const [followers, setFollowers] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const outputRef = useRef(null);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!currentUser) return;
    if (isAtLimit()) {
      setError('Has alcanzado el límite diario de peticiones. Actualiza a Pro para acceso ilimitado.');
      return;
    }
    if (!bio.trim() || !niche.trim() || !goal) {
      setError('Rellena los campos obligatorios: bio, nicho y objetivo principal.');
      return;
    }

    setError('');
    setOutput('');
    setLoading(true);

    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);

    await streamAIResponse({
      categoryId: 'marketing',
      toolId: 'instagram-audit',
      inputs: { bio, username: niche, goal, content_type: contentType, followers },
      onChunk: (text) => setOutput((prev) => prev + text),
      onDone: () => setLoading(false),
      onError: (msg) => { setError(msg); setLoading(false); },
    });
  }

  function handleClear() {
    setBio('');
    setNiche('');
    setGoal('');
    setContentType('');
    setFollowers('');
    setOutput('');
    setError('');
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
          <span className="ig-audit__badge">📸 5 minutos</span>
          <h2 className="ig-audit__title">
            Auditoría Exprés de <span className="ig-audit__title--gradient">Instagram</span>
          </h2>
          <p className="ig-audit__subtitle">
            Analiza tu perfil, detecta mejoras inmediatas y obtén las 3 acciones que puedes implementar hoy mismo.
          </p>
        </motion.div>

        <div className="ig-audit__body">
          {/* Left: checklist + form */}
          <motion.div
            className="ig-audit__left"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Checklist preview */}
            <div className="ig-audit__checklist">
              <p className="ig-audit__checklist-title">Checklist rápido</p>
              {CHECKLIST.map((item, i) => (
                <div key={i} className="ig-audit__check-item">
                  <span className="ig-audit__check-dot" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Form */}
            <form className="ig-audit__form" onSubmit={handleGenerate}>
              <div className="ig-audit__field">
                <label className="ig-audit__label">
                  Tu bio actual <span className="ig-audit__required">*</span>
                </label>
                <textarea
                  className="ig-audit__textarea"
                  rows={4}
                  placeholder="Pega aquí tu bio de Instagram..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                />
              </div>

              <div className="ig-audit__field">
                <label className="ig-audit__label">
                  Nicho / tipo de cuenta <span className="ig-audit__required">*</span>
                </label>
                <input
                  className="ig-audit__input"
                  type="text"
                  placeholder="ej. coach de fitness, agencia de marketing..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  required
                />
              </div>

              <div className="ig-audit__row">
                <div className="ig-audit__field">
                  <label className="ig-audit__label">
                    Objetivo principal <span className="ig-audit__required">*</span>
                  </label>
                  <select
                    className="ig-audit__select"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    required
                  >
                    <option value="">Selecciona...</option>
                    {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="ig-audit__field">
                  <label className="ig-audit__label">Tipo de contenido</label>
                  <select
                    className="ig-audit__select"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                  >
                    <option value="">Selecciona...</option>
                    {CONTENT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="ig-audit__field ig-audit__field--half">
                <label className="ig-audit__label">Seguidores actuales</label>
                <select
                  className="ig-audit__select"
                  value={followers}
                  onChange={(e) => setFollowers(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {FOLLOWERS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {error && <p className="ig-audit__error">⚠️ {error}</p>}

              {!currentUser ? (
                <Link to="/auth?mode=register" className="ig-audit__cta-btn">
                  Regístrate gratis para analizar tu perfil →
                </Link>
              ) : (
                <div className="ig-audit__actions">
                  <button
                    type="submit"
                    className="ig-audit__cta-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="ig-audit__spinner" /> Analizando...</>
                    ) : (
                      '📊 Analizar mi perfil'
                    )}
                  </button>
                  {(output || bio) && (
                    <button type="button" className="ig-audit__clear-btn" onClick={handleClear}>
                      Limpiar
                    </button>
                  )}
                </div>
              )}
            </form>
          </motion.div>

          {/* Right: output or example */}
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
                      <span>Analizando tu perfil...</span>
                    </div>
                  )}
                  <div className="ig-audit__markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                  </div>
                  {loading && output && (
                    <span className="ig-audit__cursor">▋</span>
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
                    <p className="ig-audit__example-label">Ejemplo de bio eficaz</p>
                    <div className="ig-audit__example-bio">
                      <p>Ayudo a <strong>emprendedores digitales</strong> a conseguir <strong>sus primeros 10K seguidores</strong></p>
                      <p>con estrategia de contenido sin publicidad</p>
                      <p className="ig-audit__example-cta">↓ Reserva tu sesión gratuita</p>
                    </div>
                    <div className="ig-audit__example-actions">
                      <p className="ig-audit__example-label" style={{ marginTop: '1.25rem' }}>Resumen de acciones clave</p>
                      {[
                        'Optimizar el nombre con keyword',
                        'Fijar post de autoridad',
                        'Reestructurar destacados',
                        'Usar hooks fuertes en Reels',
                        'Cambiar CTAs genéricos por accionables',
                      ].map((action, i) => (
                        <div key={i} className="ig-audit__action-row">
                          <span className="ig-audit__action-num">{i + 1}</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="ig-audit__placeholder-hint">
                    Rellena el formulario y obtén tu auditoría personalizada →
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
