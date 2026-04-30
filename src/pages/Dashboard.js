import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { pushEvent } from '../utils/analytics';
import { streamChat, generateImage } from '../utils/api';
import OnboardingModal from '../components/OnboardingModal';
import './Dashboard.css';

/* ─────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'text',    label: 'Text',     icon: '✍️' },
  { id: 'design',  label: 'Design',   icon: '🎨' },
  { id: 'video',   label: 'Video',    icon: '🎬', comingSoon: true },
  { id: 'audio',   label: 'Audio',    icon: '🎵', comingSoon: true },
  { id: 'toolkit', label: 'Tool-kit', icon: '🛠️', comingSoon: true },
];

const MODELS = [
  { id: 'chatgpt',    name: 'ChatGPT',    by: 'OpenAI',     letter: 'G', color: '#10a37f',
    desc: 'Designed for tasks that require fast, accurate and general-purpose AI. Well suited for a wide variety of everyday queries.',
    caps: ['Fast responses', 'Link analysis', 'Up-to-date information', 'Context awareness'] },
  { id: 'claude',     name: 'Claude',     by: 'Anthropic',  letter: 'C', color: '#e54717',
    desc: 'Excels at nuanced reasoning, long documents and careful writing. Ideal for complex strategy and detailed outputs.',
    caps: ['Long context', 'Complex reasoning', 'Careful writing', 'Safety-focused'] },
  { id: 'gemini',     name: 'Gemini',     by: 'Google',     letter: 'G', color: '#4285f4',
    desc: 'Multimodal intelligence with real-time data access. Great for queries blending text, data and current knowledge.',
    caps: ['Multimodal', 'Real-time data', 'Fast inference', 'Code & analysis'] },
  { id: 'grok',       name: 'Grok',       by: 'xAI',        letter: 'X', color: '#e0e0e0',
    desc: 'Built for real-time web knowledge and X/Twitter data. Best for current events and trend analysis.',
    caps: ['Live web search', 'Current events', 'X/Twitter data', 'Witty reasoning'] },
  { id: 'deepseek',   name: 'Deepseek',   by: 'DeepSeek',   letter: 'D', color: '#1677ff',
    desc: 'Advanced reasoning with exceptional math and code capabilities. Efficient for complex technical tasks.',
    caps: ['Math & code', 'Deep reasoning', 'Chain-of-thought', 'Efficient'] },
  { id: 'perplexity', name: 'Perplexity', by: 'Perplexity', letter: 'P', color: '#20b2aa',
    desc: 'AI-powered search that provides cited, up-to-date answers. Best for research requiring source attribution.',
    caps: ['Cited answers', 'Web search', 'Up-to-date info', 'Source links'] },
  { id: 'qwen',       name: 'Qwen',       by: 'Alibaba',    letter: 'Q', color: '#ff6a00',
    desc: 'Strong multilingual model with long context support. Excellent for international content and coding.',
    caps: ['Multilingual', 'Long context', 'Code generation', 'Efficient'] },
];

const TAB_SUGGESTIONS = {
  text: [
    { icon: '📊', text: 'Analyse the market opportunity for my SaaS product' },
    { icon: '✍️', text: 'Write a blog post about AI trends in 2025' },
    { icon: '📧', text: 'Draft a cold email sequence for B2B outreach' },
    { icon: '🎯', text: 'Create a go-to-market strategy for my startup' },
  ],
  design: [
    { icon: '🖼️', text: 'A minimalist brand logo for a fintech startup, blue and white' },
    { icon: '🌅', text: 'Cinematic product shot of wireless headphones on a dark background' },
    { icon: '🎨', text: 'Abstract geometric banner for a tech conference, purple gradient' },
    { icon: '🏙️', text: 'Modern office interior, clean and professional, natural light' },
  ],
};

const SESSIONS_KEY = 'gormaran_sessions_v2';
const MAX_SESSIONS = 30;

/* ─────────────────────────────────────────────────────────────────
   Session helpers (localStorage)
───────────────────────────────────────────────────────────────── */
function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); }
  catch { return []; }
}
function saveSessions(sessions) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS))); }
  catch {}
}
function makeSession(tab, model) {
  return { id: crypto.randomUUID(), title: 'New chat', tab, model, messages: [], createdAt: Date.now() };
}
function sessionIcon(tab) {
  return TABS.find(t => t.id === tab)?.icon || '💬';
}

/* ─────────────────────────────────────────────────────────────────
   SimpleSpinner
───────────────────────────────────────────────────────────────── */
function Spinner() { return <span className="dash__spinner" />; }

/* ─────────────────────────────────────────────────────────────────
   Welcome / empty state
───────────────────────────────────────────────────────────────── */
function WelcomeState({ model, tab, onSuggestion }) {
  const suggestions = TAB_SUGGESTIONS[tab] || TAB_SUGGESTIONS.text;
  return (
    <div className="dash__welcome">
      <div
        className="dash__welcome-avatar"
        style={{ background: `${model.color}18`, borderColor: `${model.color}45`, color: model.color }}
      >
        {model.letter}
      </div>
      <div className="dash__welcome-name">{model.name}</div>
      <p className="dash__welcome-desc">{model.desc}</p>
      <div className="dash__welcome-caps-label">Key capabilities</div>
      <div className="dash__welcome-caps">
        {model.caps.map(c => <span key={c} className="dash__welcome-cap">{c}</span>)}
      </div>
      <div className="dash__suggestions">
        {suggestions.map((s, i) => (
          <button key={i} className="dash__suggestion" onClick={() => onSuggestion(s.text)}>
            <span className="dash__suggestion-icon">{s.icon}</span>
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Text Chat Area
───────────────────────────────────────────────────────────────── */
function ChatArea({ session, model, onMessagesUpdate, onTitleUpdate, usageCount, freeLimit, subscription }) {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const abortRef   = useRef(null);
  const bottomRef  = useRef(null);
  const textareaRef = useRef(null);
  const messages   = session?.messages || [];

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, streamText, scrollToBottom]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (subscription === 'free' && usageCount >= freeLimit) {
      return;
    }

    setInput('');
    setStreamText('');
    setIsLoading(true);

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    const nextMessages = [...messages, userMsg];
    onMessagesUpdate(nextMessages);

    if (!session.title || session.title === 'New chat') {
      onTitleUpdate(text.slice(0, 45) + (text.length > 45 ? '…' : ''));
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    streamChat({
      message: text,
      history: messages.map(m => ({ role: m.role, content: m.content })),
      tab: session.tab,
      signal: controller.signal,
      onChunk: (chunk) => {
        accumulated += chunk;
        setStreamText(accumulated);
      },
      onDone: () => {
        const aiMsg = { role: 'assistant', content: accumulated, ts: Date.now() };
        onMessagesUpdate([...nextMessages, aiMsg]);
        setStreamText('');
        setIsLoading(false);
        abortRef.current = null;
      },
      onError: (err) => {
        const errMsg = { role: 'assistant', content: `_Error: ${err}_`, ts: Date.now(), error: true };
        onMessagesUpdate([...nextMessages, errMsg]);
        setStreamText('');
        setIsLoading(false);
        abortRef.current = null;
      },
    });
  }, [input, isLoading, messages, session, subscription, usageCount, freeLimit, onMessagesUpdate, onTitleUpdate]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamText) {
      const aiMsg = { role: 'assistant', content: streamText, ts: Date.now() };
      onMessagesUpdate([...messages, aiMsg]);
    }
    setStreamText('');
    setIsLoading(false);
  };

  const limitReached = subscription === 'free' && usageCount >= freeLimit;
  const placeholder = limitReached
    ? (isEs ? 'Límite alcanzado — actualiza para continuar' : 'Limit reached — upgrade to continue')
    : (isEs ? 'Escribe tu mensaje…' : 'Write your message…');

  return (
    <>
      {messages.length === 0 && !isLoading ? (
        <WelcomeState
          model={model}
          tab={session.tab}
          onSuggestion={(text) => { setInput(text); textareaRef.current?.focus(); }}
        />
      ) : (
        <div className="dash__messages">
          {messages.map((msg, i) => (
            <div key={i} className={`dash__message dash__message--${msg.role}`}>
              <div
                className="dash__message-avatar"
                style={msg.role === 'assistant'
                  ? { background: `${model.color}18`, color: model.color, border: `1px solid ${model.color}35` }
                  : {}}
              >
                {msg.role === 'assistant' ? model.letter : '👤'}
              </div>
              <div className="dash__message-body">
                {msg.role === 'assistant' && (
                  <div className="dash__message-role">{model.name}</div>
                )}
                <div className="dash__message-text">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="dash__message dash__message--assistant">
              <div
                className="dash__message-avatar"
                style={{ background: `${model.color}18`, color: model.color, border: `1px solid ${model.color}35` }}
              >
                {model.letter}
              </div>
              <div className="dash__message-body">
                <div className="dash__message-role">{model.name}</div>
                <div className="dash__message-text">
                  {streamText
                    ? <><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown><span className="dash__cursor" /></>
                    : <Spinner />
                  }
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="dash__input-bar">
        <div className="dash__input-wrap">
          <div className="dash__input-row">
            <textarea
              ref={textareaRef}
              className="dash__textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              disabled={limitReached}
              rows={1}
            />
            <button
              className={`dash__send${input.trim() && !limitReached ? ' dash__send--active' : ''}${isLoading ? ' dash__send--loading' : ''}`}
              onClick={isLoading ? handleStop : handleSubmit}
              title={isLoading ? 'Stop' : 'Send'}
            >
              {isLoading
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
            </button>
          </div>
          <div className="dash__input-footer">
            {isLoading
              ? <button className="dash__stop-btn" onClick={handleStop}>■ Stop</button>
              : <span />
            }
            <span className="dash__input-hint">
              {limitReached
                ? <Link to="/pricing" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Upgrade →</Link>
                : isEs ? 'Intro para enviar · Shift+Intro para nueva línea' : 'Enter to send · Shift+Enter for new line'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Design / Image Generation Area
───────────────────────────────────────────────────────────────── */
function DesignArea({ subscription, usageCount, freeLimit }) {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [prompt, setPrompt]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages]     = useState([]);
  const [error, setError]       = useState(null);

  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading || limitReached) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateImage({ prompt: prompt.trim(), style: 'vivid', quality: 'standard' });
      if (result.imageUrl) {
        setImages(prev => [{ url: result.imageUrl, prompt: prompt.trim(), ts: Date.now() }, ...prev]);
        setPrompt('');
      }
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
  };

  return (
    <>
      <div className="dash__image-area">
        {images.length === 0 && !isLoading && (
          <WelcomeState
            model={MODELS.find(m => m.id === 'chatgpt')}
            tab="design"
            onSuggestion={(text) => setPrompt(text)}
          />
        )}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Spinner />
            {isEs ? 'Generando imagen con DALL·E 3…' : 'Generating image with DALL·E 3…'}
          </div>
        )}
        {error && (
          <div style={{ padding: '0.75rem 1.1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', maxWidth: 520 }}>
            ⚠️ {error}
          </div>
        )}
        {images.map((img) => (
          <div key={img.ts} className="dash__image-card">
            <img src={img.url} alt={img.prompt} loading="lazy" />
            <div className="dash__image-prompt">"{img.prompt}"</div>
            <div className="dash__image-actions">
              <a href={img.url} download={`gormaran-${img.ts}.png`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                ↓ {isEs ? 'Descargar' : 'Download'}
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="dash__input-bar">
        <div className="dash__input-wrap">
          <div className="dash__input-row">
            <textarea
              className="dash__textarea"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              placeholder={limitReached
                ? (isEs ? 'Límite alcanzado — actualiza' : 'Limit reached — upgrade to continue')
                : (isEs ? 'Describe la imagen que quieres crear…' : 'Describe the image you want to create…')}
              disabled={limitReached || isLoading}
              rows={1}
            />
            <button
              className={`dash__send${prompt.trim() && !limitReached ? ' dash__send--active' : ''}`}
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading || limitReached}
              title="Generate"
            >
              {isLoading ? <Spinner /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
            </button>
          </div>
          <div className="dash__input-footer">
            <span />
            <span className="dash__input-hint">
              {limitReached
                ? <Link to="/pricing" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Upgrade →</Link>
                : 'Powered by DALL·E 3'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Coming Soon placeholder
───────────────────────────────────────────────────────────────── */
function ComingSoon({ tab }) {
  const cfg = {
    video:   { icon: '🎬', title: 'Video generation', sub: 'Create cinematic AI videos from a text prompt. Powered by Sora, Runway and Kling.' },
    audio:   { icon: '🎵', title: 'Audio & Music AI', sub: 'Generate music, voiceovers and soundscapes with Suno, ElevenLabs and Udio.' },
    toolkit: { icon: '🛠️', title: 'Tool-kit',         sub: 'Structured AI tools for ads, automation and specialised business tasks.' },
  }[tab] || { icon: '⚡', title: 'Coming soon', sub: '' };

  return (
    <div className="dash__coming-soon">
      <div className="dash__coming-icon">{cfg.icon}</div>
      <div className="dash__coming-title">{cfg.title}</div>
      <p className="dash__coming-sub">{cfg.sub}</p>
      <span className="dash__coming-badge">✦ Coming soon</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Model Panel
───────────────────────────────────────────────────────────────── */
function ModelPanel({ selectedId, onSelect, onClose }) {
  const selected = MODELS.find(m => m.id === selectedId) || MODELS[0];
  return (
    <aside className="dash__model-panel">
      <div className="dash__model-panel-hd">
        <span className="dash__model-panel-title">Model selection</span>
        <button className="dash__model-panel-x" onClick={onClose}>✕</button>
      </div>
      <div className="dash__model-selected">
        <div className="dash__model-sel-av" style={{ background: `${selected.color}20`, color: selected.color }}>
          {selected.letter}
        </div>
        <div>
          <div className="dash__model-sel-name">{selected.name}</div>
          <div className="dash__model-sel-by">{selected.by}</div>
        </div>
        <span className="dash__model-sel-arr">▾</span>
      </div>
      <div className="dash__model-list">
        {MODELS.map(m => (
          <button
            key={m.id}
            className={`dash__model-item${selectedId === m.id ? ' dash__model-item--active' : ''}`}
            onClick={() => onSelect(m.id)}
          >
            <div className="dash__model-av" style={{ background: `${m.color}18`, color: m.color }}>{m.letter}</div>
            <div className="dash__model-info">
              <div className="dash__model-name">{m.name}</div>
              <div className="dash__model-by">{m.by}</div>
            </div>
            <div className="dash__model-radio" />
          </button>
        ))}
      </div>
      <div className="dash__model-note">
        Model selection affects response style. All text generation is powered by Claude Sonnet on the backend.
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Left Sidebar
───────────────────────────────────────────────────────────────── */
function Sidebar({ sessions, activeId, onNew, onSelect, onDelete, subscription, usageCount, freeLimit }) {
  const [navTab, setNavTab] = useState('chats');
  const { t } = useTranslation();

  const usagePct = subscription === 'free' ? Math.min(100, Math.round((usageCount / freeLimit) * 100)) : 100;
  const chatSessions = sessions.filter(s => s.tab !== 'design');
  const designSessions = sessions.filter(s => s.tab === 'design');
  const displaySessions = navTab === 'chats' ? chatSessions : designSessions;

  function fmt(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <aside className="dash__sidebar">
      <div className="dash__sidebar-top">
        <button className="dash__new-btn" onClick={onNew}>
          <span>✦</span> New chat
        </button>
      </div>

      <div className="dash__nav-tabs">
        <button className={`dash__nav-tab${navTab === 'chats' ? ' dash__nav-tab--active' : ''}`} onClick={() => setNavTab('chats')}>Chats</button>
        <button className={`dash__nav-tab${navTab === 'projects' ? ' dash__nav-tab--active' : ''}`} onClick={() => setNavTab('projects')}>Projects</button>
      </div>

      <div className="dash__session-list">
        {displaySessions.length === 0 ? (
          <div className="dash__session-empty">
            {navTab === 'chats'
              ? 'There\'s a blank page here for now\nSend a message, and a chat will\nappear right away'
              : 'No projects yet.\nStart a new chat to create one.'}
          </div>
        ) : displaySessions.map(s => (
          <button
            key={s.id}
            className={`dash__session-item${s.id === activeId ? ' dash__session-item--active' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="dash__session-icon">{sessionIcon(s.tab)}</span>
            <div className="dash__session-body">
              <span className="dash__session-title">{s.title}</span>
              <span className="dash__session-meta">{fmt(s.createdAt)}</span>
            </div>
          </button>
        ))}
      </div>

      {subscription === 'free' && (
        <div className="dash__sidebar-footer">
          <div className="dash__usage-row">
            <span>{usageCount}/{freeLimit} {t('dashboard.usedThisMonth', { defaultValue: 'used' })}</span>
            <span>{freeLimit - usageCount} left</span>
          </div>
          <div className="dash__usage-track">
            <div className="dash__usage-fill" style={{ width: `${usagePct}%` }} />
          </div>
          <Link to="/pricing" className="dash__upgrade-link">Upgrade for unlimited →</Link>
        </div>
      )}
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { currentUser, refreshUserProfile, userProfile } = useAuth();
  const { subscription, usageCount, FREE_MONTHLY_LIMIT } = useSubscription();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');

  const [activeTab, setActiveTab]         = useState('text');
  const [selectedModel, setSelectedModel] = useState('chatgpt');
  const [modelPanelOpen, setModelPanelOpen] = useState(true);
  const [sessions, setSessions]           = useState(loadSessions);
  const [currentId, setCurrentId]         = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const showOnboarding = userProfile && !userProfile.onboardingCompleted;

  const paymentStatus = searchParams.get('payment');
  const planChip = { free: 'free', grow: 'grow', scale: 'scale', evolution: 'evolution' }[subscription] || 'free';
  const planLabel = { free: 'Free', grow: '⭐ Grow', scale: '💎 Scale', evolution: '🚀 Evolution' }[subscription] || 'Free';

  useEffect(() => {
    if (paymentStatus === 'success' && currentUser) {
      pushEvent('Suscribe', { value: 0, currency: 'EUR' });
      setTimeout(() => refreshUserProfile(currentUser.uid), 2000);
    }
  }, [paymentStatus, currentUser]); // eslint-disable-line

  // Sync sessions to localStorage
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  const currentSession = useMemo(() => sessions.find(s => s.id === currentId) || null, [sessions, currentId]);
  const activeModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  const handleNew = useCallback(() => {
    const s = makeSession(activeTab, selectedModel);
    setSessions(prev => [s, ...prev]);
    setCurrentId(s.id);
  }, [activeTab, selectedModel]);

  const handleSelectSession = useCallback((id) => {
    const s = sessions.find(s => s.id === id);
    if (s) { setCurrentId(id); setActiveTab(s.tab); }
  }, [sessions]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setCurrentId(null);
  }, []);

  const updateMessages = useCallback((id, messages) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, messages } : s));
  }, []);

  const updateTitle = useCallback((id, title) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  }, []);

  // Auto-create session for current tab if none exists
  const getOrCreateSession = useCallback(() => {
    if (currentSession) return currentSession;
    const s = makeSession(activeTab, selectedModel);
    setSessions(prev => [s, ...prev]);
    setCurrentId(s.id);
    return s;
  }, [currentSession, activeTab, selectedModel]);

  // Wrap handlers to always have a session
  const handleMessagesUpdate = useCallback((messages) => {
    const s = getOrCreateSession();
    updateMessages(s.id, messages);
  }, [getOrCreateSession, updateMessages]);

  const handleTitleUpdate = useCallback((title) => {
    const s = getOrCreateSession();
    updateTitle(s.id, title);
  }, [getOrCreateSession, updateTitle]);

  const session = currentSession || { id: null, tab: activeTab, model: selectedModel, messages: [], title: 'New chat' };

  const cols = modelPanelOpen ? '256px 1fr 276px' : '256px 1fr';

  return (
    <div className="dash">
      {showOnboarding && <OnboardingModal onComplete={() => refreshUserProfile(currentUser.uid)} />}

      {/* Banners */}
      {paymentStatus === 'success' && !bannerDismissed && (
        <div className="dash__banner dash__banner--success">
          <span>🎉 Welcome to {planLabel}!</span>
          <button className="dash__banner-x" onClick={() => setBannerDismissed(true)}>✕</button>
        </div>
      )}
      {usageCount >= FREE_MONTHLY_LIMIT && subscription === 'free' && (
        <div className="dash__banner dash__banner--warning">
          <span>🚫 {isEs ? 'Límite mensual alcanzado —' : 'Monthly limit reached —'} <Link to="/pricing" style={{ color: 'inherit', fontWeight: 700 }}>{isEs ? 'actualiza para continuar' : 'upgrade to continue'}</Link></span>
        </div>
      )}

      {/* Tab bar */}
      <div className="dash__tabbar">
        <div className="dash__tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`dash__tab${activeTab === tab.id ? ' dash__tab--active' : ''}${tab.comingSoon ? ' dash__tab--soon' : ''}`}
              onClick={() => !tab.comingSoon && handleTabChange(tab.id)}
            >
              {tab.label}
              {tab.comingSoon && <span className="dash__soon-badge">Soon</span>}
            </button>
          ))}
        </div>
        <div className="dash__tabbar-right">
          <button
            className={`dash__model-toggle${modelPanelOpen ? ' dash__model-toggle--active' : ''}`}
            onClick={() => setModelPanelOpen(v => !v)}
          >
            <span className="dash__model-dot" style={{ background: activeModel.color }} />
            {activeModel.name} ▾
          </button>
          <span className={`dash__plan-chip dash__plan-chip--${planChip}`}>{planLabel}</span>
        </div>
      </div>

      {/* Workspace */}
      <div className="dash__workspace" style={{ gridTemplateColumns: cols }}>

        <Sidebar
          sessions={sessions}
          activeId={currentId}
          onNew={handleNew}
          onSelect={handleSelectSession}
          onDelete={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
          subscription={subscription}
          usageCount={usageCount}
          freeLimit={FREE_MONTHLY_LIMIT}
        />

        <main className="dash__main">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}
            >
              {activeTab === 'text' && (
                <ChatArea
                  key={session.id || 'new'}
                  session={session}
                  model={activeModel}
                  onMessagesUpdate={handleMessagesUpdate}
                  onTitleUpdate={handleTitleUpdate}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                  subscription={subscription}
                />
              )}
              {activeTab === 'design' && (
                <DesignArea
                  subscription={subscription}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                />
              )}
              {(activeTab === 'video' || activeTab === 'audio' || activeTab === 'toolkit') && (
                <ComingSoon tab={activeTab} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {modelPanelOpen && (
          <ModelPanel
            selectedId={selectedModel}
            onSelect={setSelectedModel}
            onClose={() => setModelPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
