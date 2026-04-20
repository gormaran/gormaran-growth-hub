import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  {
    id: 'role',
    question: '¿Cómo describes mejor tu situación?',
    subtitle: 'Personalizamos las herramientas según tu contexto',
    options: [
      { id: 'agency_small', emoji: '🚀', label: 'Llevo una agencia', sub: 'Equipo de marketing de 5 a 20 personas' },
      { id: 'consultant',   emoji: '💼', label: 'Soy consultor/a independiente', sub: 'Gestiono varios clientes yo solo/a' },
      { id: 'ecommerce',    emoji: '🛍️', label: 'Tengo un e-commerce', sub: 'Marketing interno para mi tienda online' },
      { id: 'saas_b2b',     emoji: '⚙️', label: 'Tengo un SaaS B2B', sub: 'Hago mi propio go-to-market' },
    ],
  },
  {
    id: 'goal',
    question: '¿Cuál es tu mayor reto ahora mismo?',
    subtitle: 'Empezamos por lo que más te duele',
    byRole: {
      agency_small: [
        { id: 'reports',   emoji: '📊', label: 'Automatizar informes de clientes', sub: 'Liberar 40+ horas al mes' },
        { id: 'content',   emoji: '✍️', label: 'Crear contenido más rápido', sub: 'Copys, posts y estrategias en minutos' },
        { id: 'clients',   emoji: '🤝', label: 'Ganar nuevos clientes', sub: 'Propuestas y presentaciones que convierten' },
      ],
      consultant: [
        { id: 'capacity',  emoji: '⚡', label: 'Multiplicar mi capacidad', sub: 'Hacer el trabajo de 3 sin contratar' },
        { id: 'content',   emoji: '✍️', label: 'Crear contenido de autoridad', sub: 'LinkedIn, blog y email para captar leads' },
        { id: 'proposals', emoji: '📄', label: 'Cerrar más propuestas', sub: 'Textos de venta y pitch más efectivos' },
      ],
      ecommerce: [
        { id: 'roas',      emoji: '📈', label: 'Mejorar mi ROAS', sub: 'Segmentación y copy de anuncios con IA' },
        { id: 'content',   emoji: '🖼️', label: 'Crear contenido de producto', sub: 'Descripciones, posts y emails en masa' },
        { id: 'seo',       emoji: '🔍', label: 'Posicionar en buscadores', sub: 'SEO y blog para tráfico orgánico' },
      ],
      saas_b2b: [
        { id: 'gtm',       emoji: '🎯', label: 'Acelerar el go-to-market', sub: 'Copy, casos de uso y mensajes de venta' },
        { id: 'content',   emoji: '✍️', label: 'Crear contenido técnico y de marca', sub: 'Blog, SEO y LinkedIn para SaaS' },
        { id: 'leads',     emoji: '🤝', label: 'Generar más leads calificados', sub: 'Outreach, email y landing pages' },
      ],
    },
  },
];

export default function OnboardingModal({ onComplete }) {
  const { currentUser, refreshUserProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const options = current.byRole
    ? current.byRole[selected.role] || []
    : current.options;

  async function handleSelect(optionId) {
    const next = { ...selected, [current.id]: optionId };
    setSelected(next);

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }

    // Last step — save to Firebase
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        persona: next.role,
        personaGoal: next.goal,
        onboardingCompleted: true,
      });
      await refreshUserProfile(currentUser.uid);
      onComplete(next);
    } catch (e) {
      console.error('Onboarding save error:', e);
      onComplete(next);
    }
    setSaving(false);
  }

  return (
    <div className="ob-overlay">
      <motion.div
        className="ob-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="ob-logo">
          <span className="ob-logo-mark">G</span>
          <span className="ob-logo-name">Gormaran</span>
        </div>

        {/* Progress */}
        <div className="ob-progress">
          {STEPS.map((_, i) => (
            <div key={i} className={`ob-dot ${i <= step ? 'ob-dot--active' : ''}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="ob-question">{current.question}</h2>
            <p className="ob-subtitle">{current.subtitle}</p>

            <div className="ob-options">
              {options.map(opt => (
                <button
                  key={opt.id}
                  className="ob-option"
                  onClick={() => handleSelect(opt.id)}
                  disabled={saving}
                >
                  <span className="ob-option-emoji">{opt.emoji}</span>
                  <div className="ob-option-text">
                    <span className="ob-option-label">{opt.label}</span>
                    <span className="ob-option-sub">{opt.sub}</span>
                  </div>
                  <span className="ob-option-arrow">→</span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {saving && <p className="ob-saving">Preparando tu dashboard…</p>}
      </motion.div>

      <style>{`
        .ob-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .ob-modal {
          background: #0f0f1a;
          border: 1px solid rgba(124,58,237,0.3);
          border-radius: 24px;
          padding: 40px 36px 36px;
          max-width: 480px; width: 100%;
          box-shadow: 0 0 80px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6);
        }
        .ob-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
        .ob-logo-mark {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 16px; color: white;
        }
        .ob-logo-name { font-weight: 700; font-size: 1rem; color: #f8fafc; }
        .ob-progress { display: flex; gap: 6px; margin-bottom: 32px; }
        .ob-dot {
          height: 3px; flex: 1; border-radius: 2px;
          background: rgba(255,255,255,0.1);
          transition: background 0.3s;
        }
        .ob-dot--active { background: linear-gradient(90deg, #7c3aed, #06b6d4); }
        .ob-question {
          font-size: 1.35rem; font-weight: 700; color: #f8fafc;
          margin: 0 0 8px; line-height: 1.3;
        }
        .ob-subtitle {
          font-size: 0.88rem; color: #94a3b8; margin: 0 0 28px;
        }
        .ob-options { display: flex; flex-direction: column; gap: 10px; }
        .ob-option {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          cursor: pointer; text-align: left;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
          width: 100%;
        }
        .ob-option:hover:not(:disabled) {
          border-color: rgba(124,58,237,0.5);
          background: rgba(124,58,237,0.08);
          transform: translateX(3px);
        }
        .ob-option:disabled { opacity: 0.5; cursor: default; }
        .ob-option-emoji { font-size: 1.5rem; flex-shrink: 0; }
        .ob-option-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .ob-option-label { font-size: 0.95rem; font-weight: 600; color: #f8fafc; }
        .ob-option-sub { font-size: 0.8rem; color: #94a3b8; }
        .ob-option-arrow { color: #7c3aed; font-size: 1.1rem; flex-shrink: 0; }
        .ob-saving { text-align: center; color: #a78bfa; font-size: 0.85rem; margin-top: 20px; }
      `}</style>
    </div>
  );
}
