import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllPublishedPosts } from '../utils/blogService';
import './BlogListPage.css';

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

function excerpt(content, max = 160) {
  if (!content) return '';
  const plain = content
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/[#*`>\[\]!_~]/g, '')    // strip markdown syntax
    .replace(/\n+/g, ' ')
    .trim();
  return plain.length > max ? plain.slice(0, max) + '…' : plain;
}

export default function BlogListPage() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPublishedPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const title = isEs ? 'Blog' : 'Blog';
  const subtitle = isEs
    ? 'Estrategias, tutoriales y tendencias de marketing con IA para hacer crecer tu negocio.'
    : 'AI marketing strategies, tutorials and trends to grow your business.';
  const emptyMsg = isEs ? 'Próximamente los primeros artículos.' : 'First articles coming soon.';

  return (
    <div className="blog-list">
      <div className="blog-list__hero">
        <h1 className="blog-list__heading">{title}</h1>
        <p className="blog-list__sub">{subtitle}</p>
      </div>

      {loading ? (
        <div className="blog-list__loading">
          {[1, 2, 3].map(i => <div key={i} className="blog-list__skeleton" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="blog-list__empty">{emptyMsg}</p>
      ) : (
        <div className="blog-list__grid">
          {posts.map(p => {
            const postTitle = isEs ? (p.seo_title_es || p.seo_title_en) : (p.seo_title_en || p.seo_title_es);
            const postExcerpt = isEs ? excerpt(p.content_es) : excerpt(p.content_en);
            return (
              <Link to={`/blog/${p.slug}`} key={p.id} className="blog-card">
                {p.featured_image && (
                  <img src={p.featured_image} alt={postTitle} className="blog-card__img" />
                )}
                <div className="blog-card__body">
                  <h2 className="blog-card__title">{postTitle}</h2>
                  {postExcerpt && <p className="blog-card__excerpt">{postExcerpt}</p>}
                  <div className="blog-card__footer">
                    <span className="blog-card__date">{formatDate(p.published_at)}</span>
                    <span className="blog-card__views">👁 {formatViews(p.view_count)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
