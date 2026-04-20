import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MODULES = [
  {
    icon: '🚀',
    titleEs: 'Introducción a la IA en Marketing',
    titleEn: 'Introduction to AI in Marketing',
    descEs: 'Entiende cómo la IA está transformando el marketing digital y cómo usarla a tu favor desde el día 1.',
    descEn: 'Understand how AI is transforming digital marketing and how to use it to your advantage from day 1.',
    lessonsEs: '6 lecciones · 45 min',
    lessonsEn: '6 lessons · 45 min',
    tag: 'Principiante',
    tagEn: 'Beginner',
    tagColor: '#22c55e',
    comingSoon: false,
  },
  {
    icon: '✍️',
    titleEs: 'Copywriting con IA',
    titleEn: 'AI Copywriting',
    descEs: 'Aprende a crear copies que convierten en redes sociales, email marketing y landing pages usando Gormaran.',
    descEn: 'Learn to write high-converting copies for social media, email, and landing pages using Gormaran.',
    lessonsEs: '8 lecciones · 1h 20min',
    lessonsEn: '8 lessons · 1h 20min',
    tag: 'Intermedio',
    tagEn: 'Intermediate',
    tagColor: '#f59e0b',
    comingSoon: false,
  },
  {
    icon: '📊',
    titleEs: 'Estrategia de Contenidos con IA',
    titleEn: 'AI Content Strategy',
    descEs: 'Diseña una estrategia de contenidos completa: pilares, calendario editorial y métricas — en minutos.',
    descEn: 'Build a complete content strategy: pillars, editorial calendar and metrics — in minutes.',
    lessonsEs: '10 lecciones · 2h',
    lessonsEn: '10 lessons · 2h',
    tag: 'Intermedio',
    tagEn: 'Intermediate',
    tagColor: '#f59e0b',
    comingSoon: false,
  },
  {
    icon: '🤝',
    titleEs: 'Propuestas y Pitches que Cierran',
    titleEn: 'Proposals & Pitches That Close',
    descEs: 'Crea propuestas comerciales irresistibles y presentaciones que convierten prospectos en clientes.',
    descEn: 'Create irresistible commercial proposals and presentations that convert prospects into clients.',
    lessonsEs: '7 lecciones · 1h 10min',
    lessonsEn: '7 lessons · 1h 10min',
    tag: 'Avanzado',
    tagEn: 'Advanced',
    tagColor: '#6366f1',
    comingSoon: true,
  },
  {
    icon: '⚙️',
    titleEs: 'Automatizaciones con n8n + Gormaran',
    titleEn: 'Automations with n8n + Gormaran',
    descEs: 'Conecta Gormaran con tus flujos de trabajo y automatiza el 80% de tu producción de contenido.',
    descEn: 'Connect Gormaran to your workflows and automate 80% of your content production.',
    lessonsEs: '12 lecciones · 3h',
    lessonsEn: '12 lessons · 3h',
    tag: 'Avanzado',
    tagEn: 'Advanced',
    tagColor: '#6366f1',
    comingSoon: true,
  },
  {
    icon: '📈',
    titleEs: 'Marketing para E-commerce con IA',
    titleEn: 'E-commerce Marketing with AI',
    descEs: 'Desde descripciones de producto hasta campañas de email: todo lo que necesitas para escalar tu tienda.',
    descEn: 'From product descriptions to email campaigns: everything you need to scale your store.',
    lessonsEs: '9 lecciones · 1h 45min',
    lessonsEn: '9 lessons · 1h 45min',
    tag: 'Intermedio',
    tagEn: 'Intermediate',
    tagColor: '#f59e0b',
    comingSoon: true,
  },
];

export default function AcademyPage() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');

  return (
    <div className="page academy-page">
      <div className="academy-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            style={{ textAlign: 'center', padding: '5rem 0 3rem' }}
          >
            <span className="badge badge-primary">🎓 Gormaran Academy</span>
            <h1 style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              {isEs
                ? <>Aprende a usar la IA<br /><span className="gradient-text">como un profesional</span></>
                : <>Learn to use AI<br /><span className="gradient-text">like a professional</span></>}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '560px', margin: '0 auto 2rem' }}>
              {isEs
                ? 'Cursos prácticos, cortos y orientados a resultados. Sin teoría innecesaria. Solo lo que te ayuda a crecer.'
                : 'Practical, short, results-oriented courses. No unnecessary theory. Just what helps you grow.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>✅</span> {isEs ? '6 módulos disponibles' : '6 modules available'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>✅</span> {isEs ? 'Acceso gratuito con cuenta Free' : 'Free access with Free account'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>✅</span> {isEs ? 'Certificado de finalización' : 'Completion certificate'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '6rem' }}>
        <div className="academy-grid">
          {MODULES.map((mod, i) => (
            <motion.div
              key={i}
              className="academy-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            >
              <div className="academy-card__icon">{mod.icon}</div>
              <span
                className="academy-card__tag"
                style={{ background: mod.tagColor + '22', color: mod.tagColor, border: `1px solid ${mod.tagColor}44` }}
              >
                {isEs ? mod.tag : mod.tagEn}
              </span>
              <h3 className="academy-card__title">{isEs ? mod.titleEs : mod.titleEn}</h3>
              <p className="academy-card__desc">{isEs ? mod.descEs : mod.descEn}</p>
              <div className="academy-card__meta">{isEs ? mod.lessonsEs : mod.lessonsEn}</div>
              {mod.comingSoon ? (
                <div className="academy-card__soon">
                  {isEs ? '⏳ Próximamente' : '⏳ Coming soon'}
                </div>
              ) : (
                <Link to="/auth?mode=register" className="btn btn-primary" style={{ marginTop: 'auto', textAlign: 'center' }}>
                  {isEs ? 'Empezar módulo →' : 'Start module →'}
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          style={{ textAlign: 'center', marginTop: '4rem', padding: '3rem', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 style={{ marginBottom: '0.75rem' }}>
            {isEs ? '¿Quieres acceso completo?' : 'Want full access?'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {isEs
              ? 'El plan Grow incluye acceso a todos los módulos + herramientas IA ilimitadas.'
              : 'The Grow plan includes access to all modules + unlimited AI tools.'}
          </p>
          <Link to="/pricing" className="btn btn-primary btn-lg">
            {isEs ? 'Ver planes →' : 'See plans →'}
          </Link>
        </motion.div>
      </div>

      <style>{`
        .academy-page { min-height: 100vh; }
        .academy-hero { background: var(--gradient-hero, var(--bg-surface-2)); }
        .academy-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
        }
        .academy-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .academy-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
        .academy-card__icon { font-size: 2rem; }
        .academy-card__tag {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          width: fit-content;
        }
        .academy-card__title { font-size: 1.05rem; font-weight: 700; margin: 0; }
        .academy-card__desc { font-size: 0.88rem; color: var(--text-secondary); flex: 1; }
        .academy-card__meta { font-size: 0.8rem; color: var(--text-muted); }
        .academy-card__soon {
          font-size: 0.85rem;
          color: var(--text-muted);
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          text-align: center;
          margin-top: auto;
        }
        @media (max-width: 900px) { .academy-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .academy-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
