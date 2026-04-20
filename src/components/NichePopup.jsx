import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NichePopup.css';

const NICHES = [
  {
    icon: '💼',
    es: 'Freelancer / Consultor',
    en: 'Freelancer / Consultant',
    value: 'freelancer',
    descEs: 'Marketing independiente, copywriting, gestión de redes',
    descEn: 'Independent marketing, copywriting, social media management',
  },
  {
    icon: '🏢',
    es: 'Agencia de Marketing',
    en: 'Marketing Agency',
    value: 'agency',
    descEs: 'Equipos que gestionan múltiples clientes',
    descEn: 'Teams managing multiple clients',
  },
  {
    icon: '🛍️',
    es: 'E-commerce',
    en: 'E-commerce',
    value: 'ecommerce',
    descEs: 'Tiendas online que necesitan contenido y campañas',
    descEn: 'Online stores needing content and campaigns',
  },
  {
    icon: '🚀',
    es: 'SaaS / Startup',
    en: 'SaaS / Startup',
    value: 'saas_startup',
    descEs: 'Empresas tech en crecimiento con equipo de marketing',
    descEn: 'Growing tech companies with marketing teams',
  },
  {
    icon: '🏛️',
    es: 'Corporación',
    en: 'Corporation',
    value: 'corporation',
    descEs: 'Grandes empresas con necesidades de API y white-label',
    descEn: 'Large companies needing API access and white-label',
  },
];

const SESSION_KEY = 'gormaran_niche_popup_seen';
const PERSONA_KEY = 'gormaran_pending_persona';

export default function NichePopup() {
  const [visible, setVisible] = useState(false);
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  }

  function handleSelect(value) {
    localStorage.setItem(PERSONA_KEY, value);
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
    navigate('/auth?mode=register');
  }

  if (!visible) return null;

  return (
    <div className="niche-popup__overlay" onClick={dismiss}>
      <div className="niche-popup" onClick={(e) => e.stopPropagation()}>
        <button className="niche-popup__close" onClick={dismiss} aria-label="Close">×</button>
        <div className="niche-popup__header">
          <span className="niche-popup__emoji">👋</span>
          <h2 className="niche-popup__title">
            {isEs ? '¿Cuál es tu perfil?' : 'What describes you best?'}
          </h2>
          <p className="niche-popup__subtitle">
            {isEs
              ? 'Personaliza tu experiencia en Gormaran según tu tipo de negocio.'
              : 'We\'ll tailor your Gormaran experience to your business type.'}
          </p>
        </div>
        <div className="niche-popup__options">
          {NICHES.map((niche) => (
            <button
              key={niche.value}
              className="niche-popup__option"
              onClick={() => handleSelect(niche.value)}
            >
              <span className="niche-popup__option-icon">{niche.icon}</span>
              <div className="niche-popup__option-text">
                <span className="niche-popup__option-name">{isEs ? niche.es : niche.en}</span>
                <span className="niche-popup__option-desc">{isEs ? niche.descEs : niche.descEn}</span>
              </div>
              <span className="niche-popup__option-arrow">→</span>
            </button>
          ))}
        </div>
        <p className="niche-popup__skip" onClick={dismiss}>
          {isEs ? 'Omitir por ahora' : 'Skip for now'}
        </p>
      </div>
    </div>
  );
}
