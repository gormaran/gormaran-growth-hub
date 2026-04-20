import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const STORIES = [
  {
    avatar: '👩‍💼',
    name: 'Laura M.',
    roleEs: 'Consultora de Marketing Digital · Madrid',
    roleEn: 'Digital Marketing Consultant · Madrid',
    planTag: 'Grow',
    planColor: '#6366f1',
    quoteEs: 'Antes tardaba 3 horas en preparar una propuesta comercial. Con Gormaran lo hago en 12 minutos. He cerrado 4 contratos este mes que antes ni llegaba a presentar.',
    quoteEn: 'I used to spend 3 hours preparing a commercial proposal. With Gormaran I do it in 12 minutes. I closed 4 contracts this month that I previously never even got to present.',
    metricLabel1Es: 'Tiempo ahorrado/mes', metricLabel1En: 'Time saved/month',
    metric1: '40h',
    metricLabel2Es: 'Contratos cerrados', metricLabel2En: 'Contracts closed',
    metric2: '+4/mes',
  },
  {
    avatar: '🧑‍💻',
    name: 'Carlos R.',
    roleEs: 'Co-fundador · Agencia Pixel Growth · Barcelona',
    roleEn: 'Co-founder · Pixel Growth Agency · Barcelona',
    planTag: 'Grow',
    planColor: '#6366f1',
    quoteEs: 'Gestionamos 8 clientes con un equipo de 3. Gormaran nos permite hacer el trabajo de 6. Las propuestas, informes y copies los generamos en minutos y el nivel de calidad es increíble.',
    quoteEn: 'We manage 8 clients with a team of 3. Gormaran lets us do the work of 6. We generate proposals, reports and copies in minutes and the quality level is incredible.',
    metricLabel1Es: 'Clientes gestionados', metricLabel1En: 'Clients managed',
    metric1: '8',
    metricLabel2Es: 'Personas en el equipo', metricLabel2En: 'Team size',
    metric2: '3',
  },
  {
    avatar: '🛍️',
    name: 'Ana T.',
    roleEs: 'Dueña de E-commerce · Moda sostenible',
    roleEn: 'E-commerce Owner · Sustainable fashion',
    planTag: 'Grow',
    planColor: '#6366f1',
    quoteEs: 'Mis descripciones de producto y emails los hacía yo sola. Ahora Gormaran los genera en segundos y he subido mi tasa de conversión un 23%. Es como tener un copywriter senior en el equipo.',
    quoteEn: "I used to write my product descriptions and emails alone. Now Gormaran generates them in seconds and I've raised my conversion rate by 23%. It's like having a senior copywriter on the team.",
    metricLabel1Es: 'Conversión', metricLabel1En: 'Conversion rate',
    metric1: '+23%',
    metricLabel2Es: 'Tiempo en contenido', metricLabel2En: 'Content time',
    metric2: '-70%',
  },
  {
    avatar: '🚀',
    name: 'Miguel S.',
    roleEs: 'CMO · SaaS B2B · Sector Fintech',
    roleEn: 'CMO · B2B SaaS · Fintech sector',
    planTag: 'Evolution',
    planColor: '#f59e0b',
    quoteEs: 'Integramos Gormaran vía API en nuestro flujo de producción de contenido. Generamos 200+ piezas al mes de forma completamente automatizada. El ROI es brutal.',
    quoteEn: 'We integrated Gormaran via API into our content production pipeline. We generate 200+ pieces per month fully automated. The ROI is insane.',
    metricLabel1Es: 'Piezas/mes vía API', metricLabel1En: 'Pieces/month via API',
    metric1: '200+',
    metricLabel2Es: 'ROI estimado', metricLabel2En: 'Estimated ROI',
    metric2: '18x',
  },
];

export default function SuccessStoriesPage() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');

  return (
    <div className="page ss-page">
      <div className="ss-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            style={{ textAlign: 'center', padding: '5rem 0 3rem' }}
          >
            <span className="badge badge-primary">🏆 {isEs ? 'Casos de Éxito' : 'Success Stories'}</span>
            <h1 style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              {isEs
                ? <>Resultados reales de<br /><span className="gradient-text">personas reales</span></>
                : <>Real results from<br /><span className="gradient-text">real people</span></>}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '520px', margin: '0 auto' }}>
              {isEs
                ? 'Freelancers, agencias y empresas que ya usan Gormaran para ahorrar tiempo y crecer más rápido.'
                : 'Freelancers, agencies and companies already using Gormaran to save time and grow faster.'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '6rem' }}>
        <div className="ss-grid">
          {STORIES.map((story, i) => (
            <motion.div
              key={i}
              className="ss-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: (i % 2) * 0.1 }}
            >
              <div className="ss-card__header">
                <div className="ss-card__avatar">{story.avatar}</div>
                <div>
                  <strong className="ss-card__name">{story.name}</strong>
                  <p className="ss-card__role">{isEs ? story.roleEs : story.roleEn}</p>
                </div>
                <span
                  className="ss-card__plan"
                  style={{ background: story.planColor + '22', color: story.planColor, border: `1px solid ${story.planColor}44` }}
                >
                  {story.planTag}
                </span>
              </div>

              <blockquote className="ss-card__quote">
                "{isEs ? story.quoteEs : story.quoteEn}"
              </blockquote>

              <div className="ss-card__metrics">
                <div className="ss-card__metric">
                  <span className="ss-card__metric-val">{story.metric1}</span>
                  <span className="ss-card__metric-label">{isEs ? story.metricLabel1Es : story.metricLabel1En}</span>
                </div>
                <div className="ss-card__metric-divider" />
                <div className="ss-card__metric">
                  <span className="ss-card__metric-val">{story.metric2}</span>
                  <span className="ss-card__metric-label">{isEs ? story.metricLabel2Es : story.metricLabel2En}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          style={{ textAlign: 'center', marginTop: '4rem' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem' }}>
            {isEs
              ? '¿Quieres ser el próximo caso de éxito?'
              : 'Want to be the next success story?'}
          </p>
          <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
            {isEs ? 'Empieza gratis →' : 'Start for free →'}
          </Link>
        </motion.div>
      </div>

      <style>{`
        .ss-page { min-height: 100vh; }
        .ss-hero { background: var(--gradient-hero, var(--bg-surface-2)); }
        .ss-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
        }
        .ss-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .ss-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
        .ss-card__header { display: flex; align-items: center; gap: 1rem; }
        .ss-card__avatar { font-size: 2.5rem; flex-shrink: 0; }
        .ss-card__name { font-size: 1rem; font-weight: 700; display: block; }
        .ss-card__role { font-size: 0.82rem; color: var(--text-muted); margin: 0; }
        .ss-card__plan {
          margin-left: auto;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.65rem;
          border-radius: 6px;
          white-space: nowrap;
        }
        .ss-card__quote {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.7;
          font-style: italic;
          border-left: 3px solid var(--color-primary);
          padding-left: 1rem;
          margin: 0;
        }
        .ss-card__metrics {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 1.25rem;
          background: var(--bg-surface-2);
          border-radius: 12px;
        }
        .ss-card__metric { display: flex; flex-direction: column; gap: 0.2rem; }
        .ss-card__metric-val { font-size: 1.5rem; font-weight: 800; color: var(--color-primary-light); }
        .ss-card__metric-label { font-size: 0.75rem; color: var(--text-muted); }
        .ss-card__metric-divider { width: 1px; height: 36px; background: var(--border-color); flex-shrink: 0; }
        @media (max-width: 768px) { .ss-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
