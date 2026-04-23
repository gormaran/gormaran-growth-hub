import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import {
  getAllPostsAdmin, getPostById, createPost, updatePost,
  deletePost, uploadBlogImage, generateSlug,
} from '../utils/blogService';
import './AdminBlogPage.css';

const ADMIN_EMAILS = [
  'gabriela.ormazabal@gormaran-marketing.com',
  'gabriela.ormazabal@gmail.com',
];

function parseClaudeOutput(text) {
  const result = {};
  for (const line of text.split('\n')) {
    if (line.includes('📌 SEO TITLE (ES):')) result.seo_title_es = line.split('📌 SEO TITLE (ES):')[1]?.replace(/\[.*?\]/g, '').trim();
    if (line.includes('📌 SEO TITLE (EN):')) result.seo_title_en = line.split('📌 SEO TITLE (EN):')[1]?.replace(/\[.*?\]/g, '').trim();
    if (line.includes('🔗 SLUG:'))           result.slug = line.split('🔗 SLUG:')[1]?.replace(/\[.*?\]/g, '').trim();
    if (line.includes('📄 META (ES):'))      result.meta_desc_es = line.split('📄 META (ES):')[1]?.replace(/\[.*?\]/g, '').trim();
    if (line.includes('📄 META (EN):'))      result.meta_desc_en = line.split('📄 META (EN):')[1]?.replace(/\[.*?\]/g, '').trim();
  }
  const esMatch = text.match(/##\s*🇪🇸 VERSIÓN EN ESPAÑOL\s*\n([\s\S]+?)(?:\n---\n|\n##\s*🇬🇧)/);
  if (esMatch) result.content_es = esMatch[1].replace(/^#[^\n]*\n/, '').trim();
  const enMatch = text.match(/##\s*🇬🇧 ENGLISH VERSION\s*\n([\s\S]+?)(?:\n---\n🔗|\n---\s*$|$)/);
  if (enMatch) result.content_en = enMatch[1].replace(/^#[^\n]*\n/, '').trim();
  return result;
}

const EMPTY_POST = {
  slug: '',
  status: 'draft',
  featured_image: '',
  seo_title_en: '',
  seo_title_es: '',
  meta_desc_en: '',
  meta_desc_es: '',
  content_en: '',
  content_es: '',
};

function MarkdownEditor({ value, onChange, onImageUpload, placeholder }) {
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(false);

  function insertAt(before, after = '') {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    }, 0);
  }

  function insertBlock(prefix) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(newVal);
    setTimeout(() => ta.focus(), 0);
  }

  async function handleImageFile(file) {
    if (!file) return;
    try {
      const url = await onImageUpload(file);
      insertAt(`![${file.name}](${url})`);
    } catch {
      alert('Error uploading image. Try again.');
    }
  }

  function promptLink() {
    const url = window.prompt('URL del enlace:', 'https://');
    if (!url) return;
    insertAt('[', `](${url})`);
  }

  const toolbar = [
    { label: 'B', title: 'Bold', action: () => insertAt('**', '**') },
    { label: 'I', title: 'Italic', action: () => insertAt('*', '*') },
    { label: 'H2', title: 'Heading 2', action: () => insertBlock('## ') },
    { label: 'H3', title: 'Heading 3', action: () => insertBlock('### ') },
    { label: '—', title: 'Separator', action: null },
    { label: '🔗', title: 'Link', action: promptLink },
    { label: '🖼', title: 'Image', action: () => fileRef.current?.click() },
    { label: '—', title: 'Separator', action: null },
    { label: '• List', title: 'Bullet list', action: () => insertBlock('- ') },
    { label: '1. List', title: 'Numbered list', action: () => insertBlock('1. ') },
    { label: '> Quote', title: 'Blockquote', action: () => insertBlock('> ') },
  ];

  return (
    <div className="md-editor">
      <div className="md-editor__toolbar">
        {toolbar.map((btn, i) =>
          btn.action === null
            ? <span key={i} className="md-editor__sep" />
            : <button key={i} type="button" title={btn.title} className="md-editor__tool" onClick={btn.action}>{btn.label}</button>
        )}
        <div style={{ flex: 1 }} />
        <button type="button" className={`md-editor__tool ${preview ? 'active' : ''}`} onClick={() => setPreview(!preview)}>
          {preview ? '✏️ Edit' : '👁 Preview'}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleImageFile(e.target.files?.[0])}
      />
      {preview ? (
        <div className="md-editor__preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || '*No content yet*'}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={taRef}
          className="md-editor__textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck
        />
      )}
    </div>
  );
}

function PostList({ posts, onEdit, onDelete, onToggleStatus, loading }) {
  const navigate = useNavigate();
  if (loading) return <div className="ablog__loading">Loading posts…</div>;
  if (!posts.length) return (
    <div className="ablog__empty">
      <p>No hay posts todavía.</p>
      <button className="ablog__btn ablog__btn--primary" onClick={() => navigate('/admin/blog/new')}>
        + Crear primer post
      </button>
    </div>
  );

  return (
    <div className="ablog__list">
      {posts.map(p => (
        <div key={p.id} className="ablog__row">
          {p.featured_image && (
            <img src={p.featured_image} alt="" className="ablog__row-thumb" />
          )}
          <div className="ablog__row-info">
            <span className="ablog__row-title">{p.seo_title_es || p.seo_title_en || '(Sin título)'}</span>
            <span className="ablog__row-slug">/{p.slug}</span>
          </div>
          <span className={`ablog__badge ${p.status === 'published' ? 'ablog__badge--pub' : 'ablog__badge--draft'}`}>
            {p.status === 'published' ? 'Publicado' : 'Borrador'}
          </span>
          <div className="ablog__row-actions">
            <button className="ablog__btn ablog__btn--sm" onClick={() => onEdit(p.id)}>✏️ Editar</button>
            <button
              className="ablog__btn ablog__btn--sm"
              onClick={() => onToggleStatus(p)}
            >
              {p.status === 'published' ? 'Despublicar' : '🚀 Publicar'}
            </button>
            <button className="ablog__btn ablog__btn--sm ablog__btn--danger" onClick={() => onDelete(p.id)}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PostEditor({ postId }) {
  const navigate = useNavigate();
  const [post, setPost] = useState(EMPTY_POST);
  const [lang, setLang] = useState('es');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState('');
  const [importText, setImportText] = useState('');
  const [importOpen, setImportOpen] = useState(postId === 'new');
  const [importMsg, setImportMsg] = useState('');
  const featImgRef = useRef(null);

  useEffect(() => {
    if (postId && postId !== 'new') {
      getPostById(postId).then(p => p && setPost(p));
    }
  }, [postId]);

  function set(field, val) {
    setPost(prev => {
      const next = { ...prev, [field]: val };
      if (field === 'seo_title_en' && !prev.slug) {
        next.slug = generateSlug(val);
      }
      return next;
    });
  }

  function handleImport() {
    const parsed = parseClaudeOutput(importText);
    const filled = Object.keys(parsed).filter(k => parsed[k]);
    if (!filled.length) {
      setImportMsg('⚠️ No se detectó el formato del skill. Pega el output completo.');
      return;
    }
    setPost(prev => ({ ...prev, ...parsed }));
    setImportMsg(`✅ Rellenado: ${filled.join(', ')}`);
    setImportText('');
    setTimeout(() => { setImportOpen(false); setImportMsg(''); }, 1500);
  }

  async function handleFeaturedImage(file) {
    if (!file) return;
    setImgUploading(true);
    setImgError('');
    try {
      const url = await uploadBlogImage(file);
      set('featured_image', url);
    } catch (e) {
      setImgError('Error al subir: ' + (e.message || 'revisa Firebase Storage rules'));
    } finally {
      setImgUploading(false);
    }
  }

  async function handleContentImageUpload(file) {
    return uploadBlogImage(file);
  }

  async function save(status) {
    setSaving(true);
    setMsg('');
    try {
      const data = { ...post, status };
      if (postId === 'new') {
        const ref = await createPost(data);
        setMsg('✅ Post guardado');
        navigate(`/admin/blog/${ref.id}`, { replace: true });
      } else {
        const wasPublished = post.status !== 'published' && status === 'published';
        await updatePost(postId, { ...data, _wasPublishedNow: wasPublished });
        setPost(p => ({ ...p, status }));
        setMsg(status === 'published' ? '🚀 Publicado' : '✅ Guardado');
      }
    } catch (e) {
      setMsg('❌ Error: ' + e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  }

  const isNew = postId === 'new';

  return (
    <div className="ablog__editor">
      <div className="ablog__editor-header">
        <button className="ablog__back" onClick={() => navigate('/admin/blog')}>← Volver</button>
        <h2 className="ablog__editor-title">{isNew ? 'Nuevo post' : 'Editar post'}</h2>
        <div className="ablog__editor-actions">
          {msg && <span className="ablog__msg">{msg}</span>}
          <button className="ablog__btn ablog__btn--secondary" onClick={() => save('draft')} disabled={saving}>
            💾 Guardar borrador
          </button>
          <button className="ablog__btn ablog__btn--primary" onClick={() => save('published')} disabled={saving}>
            🚀 Publicar
          </button>
        </div>
      </div>

      {/* Claude import panel */}
      <div className="ablog__import-panel">
        <button
          type="button"
          className="ablog__import-toggle"
          onClick={() => setImportOpen(o => !o)}
        >
          🤖 {importOpen ? 'Cerrar importador' : 'Importar desde Claude'}
        </button>
        {importOpen && (
          <div className="ablog__import-body">
            <p className="ablog__import-hint">
              Pega aquí el output completo del skill — todos los campos se rellenan automáticamente.
            </p>
            <textarea
              className="ablog__import-ta"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Pega el output de Claude aquí…"
            />
            <div className="ablog__import-row">
              {importMsg && <span className="ablog__msg">{importMsg}</span>}
              <button
                type="button"
                className="ablog__btn ablog__btn--primary"
                onClick={handleImport}
                disabled={!importText.trim()}
              >
                Rellenar campos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEO + Meta panel */}
      <details className="ablog__panel" open>
        <summary className="ablog__panel-title">SEO & Metadatos</summary>
        <div className="ablog__panel-body">
          <div className="ablog__row2">
            <label className="ablog__label">
              Título SEO (ES) — 50–60 chars
              <input className="ablog__input" value={post.seo_title_es} onChange={e => set('seo_title_es', e.target.value)} placeholder="Título en español…" maxLength={70} />
              <span className="ablog__char">{post.seo_title_es.length}/60</span>
            </label>
            <label className="ablog__label">
              SEO Title (EN) — 50–60 chars
              <input className="ablog__input" value={post.seo_title_en} onChange={e => set('seo_title_en', e.target.value)} placeholder="Title in English…" maxLength={70} />
              <span className="ablog__char">{post.seo_title_en.length}/60</span>
            </label>
          </div>
          <div className="ablog__row2">
            <label className="ablog__label">
              Meta description (ES) — 145–160 chars
              <textarea className="ablog__input ablog__textarea-sm" value={post.meta_desc_es} onChange={e => set('meta_desc_es', e.target.value)} placeholder="Meta descripción en español…" maxLength={165} />
              <span className="ablog__char">{post.meta_desc_es.length}/160</span>
            </label>
            <label className="ablog__label">
              Meta description (EN) — 145–160 chars
              <textarea className="ablog__input ablog__textarea-sm" value={post.meta_desc_en} onChange={e => set('meta_desc_en', e.target.value)} placeholder="Meta description in English…" maxLength={165} />
              <span className="ablog__char">{post.meta_desc_en.length}/160</span>
            </label>
          </div>
          <div className="ablog__row2">
            <label className="ablog__label">
              URL Slug
              <div className="ablog__slug-wrap">
                <span className="ablog__slug-prefix">gormaran.io/blog/</span>
                <input
                  className="ablog__input ablog__input--slug"
                  value={post.slug}
                  onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                  placeholder="url-del-post"
                />
              </div>
            </label>
            <label className="ablog__label">
              Imagen destacada
              <div className="ablog__feat-img-row">
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt="featured"
                    className="ablog__feat-thumb"
                    onError={e => { e.target.style.display='none'; setImgError('No se puede mostrar la imagen (revisa Firebase Storage rules)'); }}
                    onLoad={() => setImgError('')}
                  />
                ) : (
                  <span className="ablog__feat-placeholder">Sin imagen</span>
                )}
                <button type="button" className="ablog__btn ablog__btn--sm" onClick={() => featImgRef.current?.click()} disabled={imgUploading}>
                  {imgUploading ? 'Subiendo…' : '📷 Subir imagen'}
                </button>
                {post.featured_image && (
                  <button type="button" className="ablog__btn ablog__btn--sm ablog__btn--danger" onClick={() => { set('featured_image', ''); setImgError(''); }}>✕ Quitar</button>
                )}
              </div>
              {imgError && <span className="ablog__img-error">{imgError}</span>}
              {post.featured_image && !imgError && (
                <span className="ablog__img-url" title={post.featured_image}>✅ Imagen subida</span>
              )}
              <input ref={featImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFeaturedImage(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      </details>

      {/* Content editor */}
      <div className="ablog__content-panel">
        <div className="ablog__lang-tabs">
          <button className={`ablog__lang-tab ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>🇪🇸 Español</button>
          <button className={`ablog__lang-tab ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>🇬🇧 English</button>
        </div>
        {lang === 'es' ? (
          <MarkdownEditor
            key="es"
            value={post.content_es}
            onChange={v => set('content_es', v)}
            onImageUpload={handleContentImageUpload}
            placeholder="Escribe el artículo en español…"
          />
        ) : (
          <MarkdownEditor
            key="en"
            value={post.content_en}
            onChange={v => set('content_en', v)}
            onImageUpload={handleContentImageUpload}
            placeholder="Write the article in English…"
          />
        )}
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase().trim());

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await getAllPostsAdmin());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!postId) loadPosts();
  }, [postId, loadPosts]);

  if (!currentUser) {
    return <div className="ablog__access">Inicia sesión para acceder.</div>;
  }
  if (!isAdmin) {
    return (
      <div className="ablog__access">
        <p>Acceso restringido.</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>
          Email actual: {currentUser.email}
        </p>
      </div>
    );
  }

  if (postId) {
    return (
      <div className="ablog">
        <PostEditor postId={postId} />
      </div>
    );
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este post? No se puede deshacer.')) return;
    await deletePost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function handleToggleStatus(p) {
    const newStatus = p.status === 'published' ? 'draft' : 'published';
    await updatePost(p.id, { status: newStatus, _wasPublishedNow: newStatus === 'published' });
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, status: newStatus } : x));
  }

  return (
    <div className="ablog">
      <div className="ablog__header">
        <h1 className="ablog__title">Blog Admin</h1>
        <button className="ablog__btn ablog__btn--primary" onClick={() => navigate('/admin/blog/new')}>
          + Nuevo post
        </button>
      </div>
      <PostList
        posts={posts}
        loading={loading}
        onEdit={id => navigate(`/admin/blog/${id}`)}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
