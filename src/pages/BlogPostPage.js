import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { getPostBySlug } from '../utils/blogService';
import './BlogPostPage.css';

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const appLang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lang, setLang] = useState(appLang);

  useEffect(() => {
    setLang(appLang);
  }, [appLang]);

  useEffect(() => {
    getPostBySlug(slug)
      .then(p => {
        if (!p || p.status !== 'published') setNotFound(true);
        else setPost(p);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="blog-post">
      <div className="blog-post__skeleton-hero" />
      <div className="blog-post__skeleton-body" />
    </div>
  );
  if (notFound) return <Navigate to="/blog" replace />;
  if (!post) return null;

  const title = lang === 'es' ? (post.seo_title_es || post.seo_title_en) : (post.seo_title_en || post.seo_title_es);
  const content = lang === 'es' ? (post.content_es || post.content_en) : (post.content_en || post.content_es);
  const hasEs = !!(post.content_es?.trim());
  const hasEn = !!(post.content_en?.trim());

  return (
    <div className="blog-post">
      {post.featured_image && (
        <div className="blog-post__hero">
          <img src={post.featured_image} alt={title} className="blog-post__hero-img" />
        </div>
      )}

      <div className="blog-post__container">
        <div className="blog-post__meta">
          <Link to="/blog" className="blog-post__back">← Blog</Link>
          <span className="blog-post__date">{formatDate(post.published_at)}</span>
        </div>

        <h1 className="blog-post__title">{title}</h1>

        {/* Language toggle */}
        {hasEs && hasEn && (
          <div className="blog-post__lang-toggle">
            <button
              className={`blog-post__lang-btn ${lang === 'es' ? 'active' : ''}`}
              onClick={() => setLang('es')}
            >
              🇪🇸 Español
            </button>
            <button
              className={`blog-post__lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              🇬🇧 English
            </button>
          </div>
        )}

        <article className="blog-post__content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>

        <div className="blog-post__footer">
          <Link to="/blog" className="blog-post__back">← {lang === 'es' ? 'Volver al Blog' : 'Back to Blog'}</Link>
        </div>
      </div>
    </div>
  );
}
