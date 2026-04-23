import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getPostBySlug, incrementViewCount, getComments, addComment } from '../utils/blogService';
import './BlogPostPage.css';

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

/* ─── Share Button ─────────────────────────────────────────────── */
function ShareButton({ title, url }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch (_) {}
    }
    setOpen(o => !o);
  }

  function copyLink() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 2000);
  }

  const networks = [
    { label: 'Twitter / X', icon: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { label: 'LinkedIn',    icon: '💼', href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}` },
    { label: 'WhatsApp',    icon: '💬', href: `https://wa.me/?text=${encodeURIComponent(title + ' — ' + url)}` },
  ];

  return (
    <div className="share-wrap">
      <button className="share-btn" onClick={handleShare}>↗ Compartir</button>
      {open && (
        <div className="share-menu">
          <button className="share-menu__item" onClick={copyLink}>
            {copied ? '✅ Enlace copiado' : '📋 Copiar enlace'}
          </button>
          {networks.map(n => (
            <a key={n.label} className="share-menu__item" href={n.href} target="_blank" rel="noopener noreferrer">
              {n.icon} {n.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Comments ─────────────────────────────────────────────────── */
function CommentsSection({ slug, currentUser }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [comments, setComments] = useState([]);
  const [loadingC, setLoadingC] = useState(true);
  const [name, setName] = useState(currentUser?.displayName || '');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getComments(slug).then(setComments).finally(() => setLoadingC(false));
  }, [slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await addComment(slug, { author_name: name, content: body });
      setComments(prev => [...prev, {
        id: Date.now().toString(),
        author_name: name,
        content: body,
        created_at: { toDate: () => new Date() },
      }]);
      setBody('');
      setMsg(isEs ? '✅ Comentario publicado' : '✅ Comment published');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg(isEs ? '❌ Error al publicar. Inténtalo de nuevo.' : '❌ Failed to post. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const label = isEs ? 'Comentarios' : 'Comments';
  const placeholder = isEs ? 'Escribe tu comentario…' : 'Write your comment…';
  const submitLabel = submitting ? (isEs ? 'Publicando…' : 'Posting…') : (isEs ? 'Publicar comentario' : 'Post comment');
  const emptyLabel = isEs ? 'Sé el primero en comentar.' : 'Be the first to comment.';
  const namePlaceholder = isEs ? 'Tu nombre *' : 'Your name *';

  return (
    <section className="blog-comments">
      <h2 className="blog-comments__title">{label} ({comments.length})</h2>

      <form className="blog-comment-form" onSubmit={handleSubmit}>
        {!currentUser && (
          <input
            className="blog-comment-input"
            type="text"
            placeholder={namePlaceholder}
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={60}
          />
        )}
        <textarea
          className="blog-comment-ta"
          placeholder={placeholder}
          value={body}
          onChange={e => setBody(e.target.value)}
          required
          maxLength={1000}
          rows={4}
        />
        <div className="blog-comment-form__row">
          {msg && <span className="blog-comment-msg">{msg}</span>}
          <button
            type="submit"
            className="blog-comment-submit"
            disabled={submitting || !body.trim() || !name.trim()}
          >
            {submitLabel}
          </button>
        </div>
      </form>

      {loadingC ? null : (
        <div className="blog-comment-list">
          {comments.length === 0 && <p className="blog-comment-empty">{emptyLabel}</p>}
          {comments.map(c => (
            <div key={c.id} className="blog-comment">
              <div className="blog-comment__header">
                <span className="blog-comment__author">{c.author_name}</span>
                <span className="blog-comment__date">{formatDate(c.created_at)}</span>
              </div>
              <p className="blog-comment__text">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function BlogPostPage() {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const { currentUser } = useAuth();
  const appLang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lang, setLang] = useState(appLang);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => { setLang(appLang); }, [appLang]);

  useEffect(() => {
    getPostBySlug(slug)
      .then(p => {
        if (!p || p.status !== 'published') { setNotFound(true); return; }
        setPost(p);
        const base = p.view_count || 0;
        const key = `viewed_${p.id}`;
        if (!sessionStorage.getItem(key)) {
          setViewCount(base + 1);
          incrementViewCount(p.id);
          sessionStorage.setItem(key, '1');
        } else {
          setViewCount(base);
        }
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
  const postUrl = window.location.href;

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
          <div className="blog-post__meta-right">
            <span className="blog-post__views">👁 {formatNumber(viewCount)}</span>
            <span className="blog-post__date">{formatDate(post.published_at)}</span>
          </div>
        </div>

        <h1 className="blog-post__title">{title}</h1>

        <div className="blog-post__actions">
          {hasEs && hasEn && (
            <div className="blog-post__lang-toggle">
              <button className={`blog-post__lang-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>🇪🇸 Español</button>
              <button className={`blog-post__lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>🇬🇧 English</button>
            </div>
          )}
          <ShareButton title={title} url={postUrl} />
        </div>

        <article className="blog-post__content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
        </article>

        <div className="blog-post__footer">
          <Link to="/blog" className="blog-post__back">← {lang === 'es' ? 'Volver al Blog' : 'Back to Blog'}</Link>
          <ShareButton title={title} url={postUrl} />
        </div>

        <CommentsSection slug={slug} currentUser={currentUser} />
      </div>
    </div>
  );
}
