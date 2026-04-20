import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const POSTS = [
  {
    emoji: '🤖',
    categoryEs: 'IA & Marketing',
    categoryEn: 'AI & Marketing',
    titleEs: '10 prompts de IA que todo marketer debería usar en 2025',
    titleEn: '10 AI prompts every marketer should use in 2025',
    excerptEs: 'Hemos probado cientos de prompts con nuestros usuarios. Estos 10 son los que más resultados generan en menos tiempo.',
    excerptEn: "We've tested hundreds of prompts with our users. These 10 generate the most results in the least time.",
    readTimeEs: '5 min lectura',
    readTimeEn: '5 min read',
    date: '2025-04-15',
    featured: true,
  },
  {
    emoji: '📊',
    categoryEs: 'Agencias',
    categoryEn: 'Agencies',
    titleEs: 'Cómo una agencia de 3 personas gestiona 12 clientes con IA',
    titleEn: 'How a 3-person agency manages 12 clients with AI',
    excerptEs: 'El sistema completo de Pixel Growth para automatizar propuestas, informes y contenido sin perder la calidad.',
    excerptEn: "Pixel Growth's complete system for automating proposals, reports and content without losing quality.",
    readTimeEs: '8 min lectura',
    readTimeEn: '8 min read',
    date: '2025-04-08',
    featured: false,
  },
  {
    emoji: '✍️',
    categoryEs: 'Copywriting',
    categoryEn: 'Copywriting',
    titleEs: 'El método PAS con IA: cómo escribir copies que venden',
    titleEn: 'The PAS method with AI: how to write copies that sell',
    excerptEs: 'Problem, Agitation, Solution. El framework más efectivo del copywriting, potenciado con inteligencia artificial.',
    excerptEn: 'Problem, Agitation, Solution. The most effective copywriting framework, powered by artificial intelligence.',
    readTimeEs: '6 min lectura',
    readTimeEn: '6 min read',
    date: '2025-04-01',
    featured: false,
  },
  {
    emoji: '🛍️',
    categoryEs: 'E-commerce',
    categoryEn: 'E-commerce',
    titleEs: 'Cómo aumenté mi conversión un 23% con descripciones de producto generadas por IA',
    titleEn: 'How I increased my conversion by 23% with AI-generated product descriptions',
    excerptEs: 'El caso real de una tienda de moda sostenible que automatizó su contenido de producto y disparó sus ventas.',
    excerptEn: 'The real case of a sustainable fashion store that automated its product content and skyrocketed its sales.',
    readTimeEs: '7 min lectura',
    readTimeEn: '7 min read',
    date: '2025-03-25',
    featured: false,
  },
  {
    emoji: '⚙️',
    categoryEs: 'Automatizaciones',
    categoryEn: 'Automations',
    titleEs: 'n8n + Gormaran: el dúo perfecto para automatizar tu marketing',
    titleEn: 'n8n + Gormaran: the perfect duo for automating your marketing',
    excerptEs: 'Guía paso a paso para conectar Gormaran con n8n y crear flujos de trabajo que trabajan por ti 24/7.',
    excerptEn: 'Step-by-step guide to connecting Gormaran with n8n and creating workflows that work for you 24/7.',
    readTimeEs: '10 min lectura',
    readTimeEn: '10 min read',
    date: '2025-03-18',
    featured: false,
  },
  {
    emoji: '🎯',
    categoryEs: 'Estrategia',
    categoryEn: 'Strategy',
    titleEs: 'De freelancer a agencia: el salto que la IA hace posible',
    titleEn: 'From freelancer to agency: the leap that AI makes possible',
    excerptEs: 'Por qué 2025 es el mejor año para escalar tu consultoría y cómo la IA es el palancamiento que lo hace realidad.',
    excerptEn: "Why 2025 is the best year to scale your consultancy and how AI is the leverage that makes it reality.",
    readTimeEs: '9 min lectura',
    readTimeEn: '9 min read',
    date: '2025-03-10',
    featured: false,
  },
];

function formatDate(dateStr, isEs) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(isEs ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPage() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const featured = POSTS.find(p => p.featured);
  const rest = POSTS.filter(p => !p.featured);

  return (
    <div className="page blog-page">
      <div className="blog-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            style={{ textAlign: 'center', padding: '5rem 0 3rem' }}
          >
            <span className="badge badge-primary">📝 Blog</span>
            <h1 style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              {isEs
                ? <>Ideas, casos y guías sobre<br /><span className="gradient-text">IA aplicada al marketing</span></>
                : <>Ideas, cases and guides on<br /><span className="gradient-text">AI applied to marketing</span></>}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
              {isEs
                ? 'Publicamos cada semana. Sin fluff. Solo lo que funciona.'
                : 'We publish every week. No fluff. Just what works.'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '6rem' }}>
        {/* Featured post */}
        {featured && (
          <motion.div
            className="blog-featured"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="blog-featured__left">
              <span className="blog-card__emoji">{featured.emoji}</span>
              <span className="blog-card__category">{isEs ? featured.categoryEs : featured.categoryEn}</span>
              <h2 className="blog-featured__title">{isEs ? featured.titleEs : featured.titleEn}</h2>
              <p className="blog-card__excerpt">{isEs ? featured.excerptEs : featured.excerptEn}</p>
              <div className="blog-card__meta">
                <span>{formatDate(featured.date, isEs)}</span>
                <span>·</span>
                <span>{isEs ? featured.readTimeEs : featured.readTimeEn}</span>
              </div>
              <Link to="/auth?mode=register" className="btn btn-primary" style={{ marginTop: '1rem', width: 'fit-content' }}>
                {isEs ? 'Leer artículo →' : 'Read article →'}
              </Link>
            </div>
            <div className="blog-featured__right">
              <div className="blog-featured__placeholder">{featured.emoji}</div>
            </div>
          </motion.div>
        )}

        <div className="blog-grid">
          {rest.map((post, i) => (
            <motion.div
              key={i}
              className="blog-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
            >
              <span className="blog-card__emoji">{post.emoji}</span>
              <span className="blog-card__category">{isEs ? post.categoryEs : post.categoryEn}</span>
              <h3 className="blog-card__title">{isEs ? post.titleEs : post.titleEn}</h3>
              <p className="blog-card__excerpt">{isEs ? post.excerptEs : post.excerptEn}</p>
              <div className="blog-card__meta">
                <span>{formatDate(post.date, isEs)}</span>
                <span>·</span>
                <span>{isEs ? post.readTimeEs : post.readTimeEn}</span>
              </div>
              <Link to="/auth?mode=register" className="blog-card__cta">
                {isEs ? 'Leer →' : 'Read →'}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .blog-page { min-height: 100vh; }
        .blog-hero { background: var(--gradient-hero, var(--bg-surface-2)); }
        .blog-featured {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 2.5rem;
          margin-top: 3rem;
          margin-bottom: 2rem;
        }
        .blog-featured__left { display: flex; flex-direction: column; gap: 0.75rem; }
        .blog-featured__title { font-size: 1.5rem; font-weight: 800; margin: 0; }
        .blog-featured__right {
          background: var(--bg-surface-2);
          border-radius: 16px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .blog-featured__placeholder { font-size: 5rem; }
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .blog-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .blog-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
        .blog-card__emoji { font-size: 1.8rem; }
        .blog-card__category { font-size: 0.72rem; font-weight: 600; color: var(--color-primary-light); text-transform: uppercase; letter-spacing: 0.06em; }
        .blog-card__title { font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.35; }
        .blog-card__excerpt { font-size: 0.85rem; color: var(--text-secondary); flex: 1; line-height: 1.6; }
        .blog-card__meta { display: flex; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted); }
        .blog-card__cta {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-primary-light);
          text-decoration: none;
          margin-top: auto;
        }
        .blog-card__cta:hover { color: var(--color-primary); }
        @media (max-width: 900px) {
          .blog-featured { grid-template-columns: 1fr; }
          .blog-featured__right { display: none; }
          .blog-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) { .blog-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
