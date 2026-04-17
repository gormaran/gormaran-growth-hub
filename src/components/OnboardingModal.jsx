import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  {
    id: 'role',
    question: '¿Cómo describes mejor tu situación?',
    subtitle: 'Te mostramos las herramientas más relevantes para ti',
    options: [
      { id: 'freelancer', emoji: '💼', label: 'Soy freelancer', sub: 'Gestiono proyectos para clientes' },
      { id: 'agency',     emoji: '🚀', label: 'Llevo una agencia', sub: 'Equipo de marketing o diseño' },
      { id: 'business',   emoji: '🏪', label: 'Tengo mi negocio', sub: 'Marca propia o tienda' },
    ],
  },
  {
    id: 'goal',
    question: '¿Cuál es tu prioridad ahora mismo?',
    subtitle: 'Empezamos por lo que más te importa',
    byRole: {
      freelancer: [
        { id: 'clients',  emoji: '🤝', label: 'Conseguir más clientes', sub: 'Propuestas, pitch y captación' },
        { id: 'content',  emoji: '✍️', label: 'Crear contenido rápido', sub: 'Para redes, web y blog' },
        { id: 'digital',  emoji: '📈', label: 'Crecer en redes sociales', sub: 'SEO, ads y social media' },
      ],
      agency: [
        { id: 'clients',  emoji: '🤝', label: 'Ganar nuevos clientes', sub: 'Propuestas y presentaciones' },
        { id: 'delivery', emoji: '⚡', label: 'Acelerar entregables', sub: 'Contenido y estrategia más rápido' },
        { id: 'digital',  emoji: '📊', label: 'Resultados para clientes', sub: 'Campañas y analítica' },
      ],
      business: [
        { id: 'customers', emoji: '🛒', label: 'Atraer más clientes', sub: 'SEO, ads y visibilidad' },
        { id: 'content',   emoji: '✍️', label: 'Crear contenido de marca', sub: 'Redes, blog y email' },
        { id: 'strategy',  emoji: '🎯', label: 'Definir mi estrategia', sub: 'Posicionamiento y crecimiento' },
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
        personaGoal: next.goal || next.delivery || next.customers || next.strategy,
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
