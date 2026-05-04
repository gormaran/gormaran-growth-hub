import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { pushEvent } from '../utils/analytics';
import {
  streamChat,
  generateImage,
  startVideoGeneration,
  pollVideoStatus,
  generateSpeech,
  startMusicGeneration,
  pollMusicStatus,
} from '../utils/api';
import OnboardingModal from '../components/OnboardingModal';
import './Dashboard.css';

/* ─────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'text',    label: 'Text',      icon: '✍️' },
  { id: 'design',  label: 'Design',    icon: '🎨' },
  { id: 'video',   label: 'Video',     icon: '🎬' },
  { id: 'audio',   label: 'Audio',     icon: '🎵' },
  { id: 'agents',  label: 'AI Agents', icon: '🤖' },
  { id: 'toolkit', label: 'Tool-kit',  icon: '🛠️', comingSoon: true },
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

const MODEL_LOGOS = {
  chatgpt:    'https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64',
  claude:     'https://www.google.com/s2/favicons?domain=claude.ai&sz=64',
  gemini:     'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64',
  grok:       'https://www.google.com/s2/favicons?domain=x.ai&sz=64',
  deepseek:   'https://www.google.com/s2/favicons?domain=deepseek.com&sz=64',
  perplexity: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64',
  qwen:       'https://www.google.com/s2/favicons?domain=chat.qwenlm.ai&sz=64',
};

function ModelLogo({ modelId, size = 24 }) {
  const src = MODEL_LOGOS[modelId];
  const m   = MODELS.find(x => x.id === modelId);
  if (!src) return <span style={{ fontWeight: 800, fontSize: size * 0.55 }}>{m?.letter}</span>;
  return <img src={src} alt={m?.name || modelId} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
}

const MODEL_VERSIONS = {
  chatgpt:    ['GPT-4.1', 'GPT-4o', 'GPT-4o mini', 'o1-preview', 'o3-mini'],
  claude:     ['Claude Sonnet 4.5', 'Claude Haiku 4.5', 'Claude Opus 4'],
  gemini:     ['Gemini 2.5 Pro', 'Gemini 2.0 Flash', 'Gemini 1.5 Pro'],
  grok:       ['Grok-3', 'Grok-3 mini', 'Grok-2'],
  deepseek:   ['DeepSeek-V3', 'DeepSeek-R1', 'DeepSeek Coder'],
  perplexity: ['Sonar Pro', 'Sonar', 'Sonar Reasoning'],
  qwen:       ['Qwen2.5-Max', 'Qwen2.5-72B', 'Qwen-VL'],
};

const VIDEO_MODELS = [
  { id: 'kling',     label: 'KLING 3.0',     by: 'Kuaishou'  },
  { id: 'sora',      label: 'Sora 2',         by: 'OpenAI'    },
  { id: 'veo',       label: 'Veo 3.1',        by: 'Google'    },
  { id: 'seedance',  label: 'Seedance 2.0',   by: 'ByteDance' },
  { id: 'wan',       label: 'WAN 2.6',        by: 'Alibaba'   },
  { id: 'minimax',   label: 'Minimax Video',  by: 'MiniMax'   },
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

function ThinkingDots() {
  return (
    <span className="dash__thinking">
      <span className="dash__thinking-dot" />
      <span className="dash__thinking-dot" />
      <span className="dash__thinking-dot" />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Welcome / empty state
───────────────────────────────────────────────────────────────── */
function WelcomeState({ model, tab, onSuggestion }) {
  const suggestions = TAB_SUGGESTIONS[tab] || TAB_SUGGESTIONS.text;
  return (
    <div className="dash__welcome">
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
function ChatArea({ session, model, modelVersion, systemPrompt, onUpdate, usageCount, freeLimit, subscription }) {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const abortRef      = useRef(null);
  const messagesRef   = useRef(null);
  const textareaRef   = useRef(null);
  const messages      = session?.messages || [];

  const scrollToBottom = useCallback(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, streamText, scrollToBottom]);

  // Auto-focus on mount for new chats (preventScroll avoids page jump)
  useEffect(() => {
    if (messages.length === 0) {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [input]);

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
    const autoTitle = (!session.title || session.title === 'New chat')
      ? text.slice(0, 48) + (text.length > 48 ? '…' : '')
      : undefined;
    onUpdate({ messages: nextMessages, title: autoTitle });

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    streamChat({
      message: text,
      history: messages.map(m => ({ role: m.role, content: m.content })),
      systemPrompt: systemPrompt || undefined,
      modelId: modelVersion || undefined,
      tab: session.tab,
      signal: controller.signal,
      onChunk: (chunk) => {
        accumulated += chunk;
        setStreamText(accumulated);
      },
      onDone: () => {
        const aiMsg = { role: 'assistant', content: accumulated, ts: Date.now() };
        onUpdate({ messages: [...nextMessages, aiMsg] });
        setStreamText('');
        setIsLoading(false);
        abortRef.current = null;
      },
      onError: (err) => {
        const friendly = err?.includes('limit') ? err : (isEs ? 'Algo salió mal. Inténtalo de nuevo.' : 'Something went wrong. Please try again.');
        const errMsg = { role: 'assistant', content: `⚠️ ${friendly}`, ts: Date.now(), error: true };
        onUpdate({ messages: [...nextMessages, errMsg] });
        setStreamText('');
        setIsLoading(false);
        abortRef.current = null;
      },
    });
  }, [input, isLoading, messages, session, subscription, usageCount, freeLimit, onUpdate]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamText) {
      onUpdate({ messages: [...messages, { role: 'assistant', content: streamText, ts: Date.now() }] });
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
        <div className="dash__messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`dash__message dash__message--${msg.role}`}>
              <div
                className="dash__message-avatar"
                style={msg.role === 'assistant'
                  ? { background: `${model.color}18`, border: `1px solid ${model.color}35` }
                  : {}}
              >
                {msg.role === 'assistant' ? <ModelLogo modelId={model.id} size={24} /> : '👤'}
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
                style={{ background: `${model.color}18`, border: `1px solid ${model.color}35` }}
              >
                <ModelLogo modelId={model.id} size={24} />
              </div>
              <div className="dash__message-body">
                <div className="dash__message-role">{model.name}</div>
                <div className="dash__message-text">
                  {streamText
                    ? <><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown><span className="dash__cursor" /></>
                    : <ThinkingDots />
                  }
                </div>
              </div>
            </div>
          )}
          <div />
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
function DesignArea({ model, subscription, usageCount, freeLimit }) {
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
            model={model}
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
   Video Generation Area (Replicate)
───────────────────────────────────────────────────────────────── */
const VIDEO_SUGGESTIONS = [
  { icon: '🌊', text: 'Cinematic ocean waves crashing at sunset, slow motion' },
  { icon: '🏙️', text: 'Futuristic city at night with neon lights and flying cars' },
  { icon: '🌿', text: 'Time-lapse of a flower blooming in a misty forest' },
  { icon: '🚀', text: 'Rocket launching through clouds into a starry sky' },
];

function VideoArea({ model, subscription, usageCount, freeLimit }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [prompt, setPrompt]         = useState('');
  const [videos, setVideos]         = useState([]);
  const [status, setStatus]         = useState(null); // null | 'generating' | 'polling'
  const [progress, setProgress]     = useState('');
  const [error, setError]           = useState(null);
  const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0].id);
  const pollRef                     = useRef(null);

  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  const stopPoll = () => { clearInterval(pollRef.current); pollRef.current = null; };

  const handleGenerate = async () => {
    if (!prompt.trim() || status || limitReached) return;
    setError(null);
    setStatus('generating');
    setProgress('');
    try {
      const { taskId } = await startVideoGeneration({ prompt: prompt.trim(), aspect_ratio: '16:9' });
      setStatus('polling');
      setPrompt('');
      pollRef.current = setInterval(async () => {
        try {
          const res = await pollVideoStatus(taskId);
          if (res.status === 'done') {
            stopPoll();
            setVideos(prev => [{ url: res.videoUrl, prompt: prompt.trim() || 'video', ts: Date.now() }, ...prev]);
            setStatus(null);
          } else if (res.status === 'failed') {
            stopPoll();
            setError(res.error || 'Video generation failed');
            setStatus(null);
          } else {
            setProgress(res.progress || '');
          }
        } catch (e) { stopPoll(); setError(e.message); setStatus(null); }
      }, 4000);
    } catch (err) {
      setError(err.message);
      setStatus(null);
    }
  };

  useEffect(() => () => stopPoll(), []);

  return (
    <>
      <div className="dash__image-area">
        {!status && videos.length === 0 && (
          <WelcomeState model={model} tab="video" onSuggestion={t => setPrompt(t)} />
        )}
        {status && (
          <div className="dash__gen-progress">
            <div className="dash__gen-progress-icon">🎬</div>
            <div className="dash__gen-progress-title">
              {isEs ? 'Generando vídeo…' : 'Generating video…'}
            </div>
            <div className="dash__gen-progress-sub">
              {isEs ? 'Esto puede tardar 1–3 minutos.' : 'This may take 1–3 minutes.'}
              {progress && <div className="dash__gen-progress-log">{progress.slice(-120)}</div>}
            </div>
            <div className="dash__thinking"><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/></div>
          </div>
        )}
        {error && <div className="dash__gen-error">⚠️ {error}</div>}
        {videos.map(v => (
          <div key={v.ts} className="dash__image-card">
            <video src={v.url} controls style={{ width: '100%', display: 'block', borderRadius: '12px 12px 0 0' }} />
            <div className="dash__image-prompt">"{v.prompt}"</div>
            <div className="dash__image-actions">
              <a href={v.url} download={`video-${v.ts}.mp4`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                ↓ {isEs ? 'Descargar' : 'Download'}
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="dash__input-bar">
        <div className="dash__video-model-row">
          <span className="dash__audio-voice-label">{isEs ? 'Modelo:' : 'Model:'}</span>
          <div className="dash__video-model-list">
            {VIDEO_MODELS.map(vm => (
              <button
                key={vm.id}
                className={`dash__video-model-chip${videoModel === vm.id ? ' dash__video-model-chip--active' : ''}`}
                onClick={() => setVideoModel(vm.id)}
                disabled={!!status}
              >
                {vm.label}
                <span className="dash__video-model-by">{vm.by}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="dash__input-wrap">
          <div className="dash__input-row">
            <textarea className="dash__textarea" value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder={limitReached ? 'Upgrade to generate videos' : (isEs ? 'Describe el vídeo que quieres crear…' : 'Describe the video you want to create…')}
              disabled={!!status || limitReached} rows={1}
            />
            <button className={`dash__send${prompt.trim() && !status ? ' dash__send--active' : ''}`}
              onClick={handleGenerate} disabled={!prompt.trim() || !!status || limitReached}>
              {status ? <span className="dash__spinner" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
            </button>
          </div>
          <div className="dash__input-footer">
            <span />
            <span className="dash__input-hint">
              {VIDEO_MODELS.find(v => v.id === videoModel)?.label} · {VIDEO_MODELS.find(v => v.id === videoModel)?.by}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Audio Area (ElevenLabs TTS + MusicGen)
───────────────────────────────────────────────────────────────── */
const AUDIO_VOICES = [
  { id: 'rachel', label: 'Rachel — Female, calm' },
  { id: 'josh', label: 'Josh — Male, deep' },
  { id: 'bella', label: 'Bella — Female, warm' },
  { id: 'adam', label: 'Adam — Male, natural' },
  { id: 'elli', label: 'Elli — Female, young' },
  { id: 'callum', label: 'Callum — Male, Scottish' },
];
const MUSIC_SUGGESTIONS = [
  { icon: '🎵', text: 'Upbeat electronic music for a product demo, 120 BPM' },
  { icon: '🎹', text: 'Calm piano background music for focus and productivity' },
  { icon: '🎸', text: 'Epic cinematic orchestral score for an action trailer' },
  { icon: '🌊', text: 'Relaxing ambient music with nature sounds and soft synths' },
];

function AudioArea({ model, subscription, usageCount, freeLimit }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [mode, setMode]         = useState('speech'); // 'speech' | 'music'
  const [text, setText]         = useState('');
  const [voice, setVoice]       = useState('rachel');
  const [musicPrompt, setMusicPrompt] = useState('');
  const [duration, setDuration] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [audioItems, setAudioItems] = useState([]);
  const [error, setError]       = useState(null);
  const [musicStatus, setMusicStatus] = useState(null);
  const pollRef = useRef(null);

  const limitReached = subscription === 'free' && usageCount >= freeLimit;
  const stopPoll = () => { clearInterval(pollRef.current); pollRef.current = null; };
  useEffect(() => () => stopPoll(), []);

  const handleSpeech = async () => {
    if (!text.trim() || isLoading || limitReached) return;
    setError(null); setIsLoading(true);
    try {
      const audioUrl = await generateSpeech({ text: text.trim(), voice });
      setAudioItems(prev => [{ url: audioUrl, label: text.slice(0, 50), mode: 'speech', ts: Date.now() }, ...prev]);
      setText('');
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleMusic = async () => {
    if (!musicPrompt.trim() || musicStatus || limitReached) return;
    setError(null); setMusicStatus('generating');
    try {
      const { taskId } = await startMusicGeneration({ prompt: musicPrompt.trim(), duration });
      setMusicPrompt('');
      pollRef.current = setInterval(async () => {
        try {
          const res = await pollMusicStatus(taskId);
          if (res.status === 'done') {
            stopPoll(); setMusicStatus(null);
            setAudioItems(prev => [{ url: res.audioUrl, label: musicPrompt.slice(0, 50), mode: 'music', ts: Date.now() }, ...prev]);
          } else if (res.status === 'failed') {
            stopPoll(); setMusicStatus(null); setError(res.error || 'Music generation failed');
          }
        } catch (e) { stopPoll(); setMusicStatus(null); setError(e.message); }
      }, 4000);
    } catch (err) { setMusicStatus(null); setError(err.message); }
  };

  return (
    <>
      <div className="dash__image-area">
        {/* Mode toggle */}
        <div className="dash__audio-mode-toggle">
          <button className={`dash__audio-mode-btn${mode === 'speech' ? ' active' : ''}`} onClick={() => setMode('speech')}>
            🎙️ {isEs ? 'Voz (TTS)' : 'Voice (TTS)'}
          </button>
          <button className={`dash__audio-mode-btn${mode === 'music' ? ' active' : ''}`} onClick={() => setMode('music')}>
            🎵 {isEs ? 'Música' : 'Music'}
          </button>
        </div>

        {mode === 'music' && !musicStatus && audioItems.filter(a => a.mode === 'music').length === 0 && (
          <WelcomeState model={model} tab="audio" onSuggestion={t => setMusicPrompt(t)} />
        )}
        {musicStatus && (
          <div className="dash__gen-progress">
            <div className="dash__gen-progress-icon">🎵</div>
            <div className="dash__gen-progress-title">{isEs ? 'Generando música…' : 'Generating music…'}</div>
            <div className="dash__gen-progress-sub">{isEs ? 'Esto puede tardar 30–60 segundos.' : 'This may take 30–60 seconds.'}</div>
            <div className="dash__thinking"><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/><span className="dash__thinking-dot"/></div>
          </div>
        )}
        {error && <div className="dash__gen-error">⚠️ {error}</div>}

        {audioItems.map(item => (
          <div key={item.ts} className="dash__audio-card">
            <div className="dash__audio-card-label">
              {item.mode === 'speech' ? '🎙️' : '🎵'} {item.label}
            </div>
            <audio controls src={item.url} style={{ width: '100%', marginTop: '0.5rem' }} />
            <div className="dash__image-actions">
              <a href={item.url} download={`audio-${item.ts}.mp3`} className="btn btn-secondary btn-sm">
                ↓ {isEs ? 'Descargar' : 'Download'}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      {mode === 'speech' ? (
        <div className="dash__input-bar">
          <div className="dash__audio-voice-row">
            <label className="dash__audio-voice-label">{isEs ? 'Voz:' : 'Voice:'}</label>
            <select className="dash__audio-voice-select" value={voice} onChange={e => setVoice(e.target.value)}>
              {AUDIO_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          <div className="dash__input-wrap">
            <div className="dash__input-row">
              <textarea className="dash__textarea" value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); handleSpeech(); } }}
                placeholder={isEs ? 'Escribe el texto para convertir a voz…' : 'Type the text to convert to speech…'}
                disabled={isLoading || limitReached} rows={2}
              />
              <button className={`dash__send${text.trim() && !isLoading ? ' dash__send--active' : ''}`}
                onClick={handleSpeech} disabled={!text.trim() || isLoading || limitReached}>
                {isLoading ? <span className="dash__spinner" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
              </button>
            </div>
            <div className="dash__input-footer"><span /><span className="dash__input-hint">Powered by ElevenLabs</span></div>
          </div>
        </div>
      ) : (
        <div className="dash__input-bar">
          <div className="dash__audio-duration-row">
            <label className="dash__audio-voice-label">{isEs ? `Duración: ${duration}s` : `Duration: ${duration}s`}</label>
            <input type="range" min={5} max={30} step={5} value={duration} onChange={e => setDuration(+e.target.value)}
              className="dash__audio-duration-slider" />
          </div>
          <div className="dash__input-wrap">
            <div className="dash__input-row">
              <textarea className="dash__textarea" value={musicPrompt}
                onChange={e => setMusicPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleMusic(); } }}
                placeholder={isEs ? 'Describe la música que quieres generar…' : 'Describe the music you want to generate…'}
                disabled={!!musicStatus || limitReached} rows={1}
              />
              <button className={`dash__send${musicPrompt.trim() && !musicStatus ? ' dash__send--active' : ''}`}
                onClick={handleMusic} disabled={!musicPrompt.trim() || !!musicStatus || limitReached}>
                {musicStatus ? <span className="dash__spinner" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
              </button>
            </div>
            <div className="dash__input-footer"><span /><span className="dash__input-hint">Powered by Meta MusicGen via Replicate</span></div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI Agents Area
───────────────────────────────────────────────────────────────── */
const AGENTS_KEY = 'gormaran_agents_v1';
function loadAgents() { try { return JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]'); } catch { return []; } }
function saveAgents(a) { try { localStorage.setItem(AGENTS_KEY, JSON.stringify(a)); } catch {} }

function AgentsArea({ model, subscription, usageCount, freeLimit }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [agents, setAgents]       = useState(loadAgents);
  const [activeAgent, setActiveAgent] = useState(null);
  const [creating, setCreating]   = useState(false);
  const [form, setForm]           = useState({ name: '', desc: '', prompt: '' });
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const abortRef   = useRef(null);
  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  useEffect(() => { saveAgents(agents); }, [agents]);
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages.length, streamText]);

  const handleCreateAgent = () => {
    if (!form.name.trim()) return;
    const agent = { id: crypto.randomUUID(), name: form.name.trim(), desc: form.desc.trim(), prompt: form.prompt.trim(), model: model.id, createdAt: Date.now() };
    const next = [agent, ...agents];
    setAgents(next);
    setCreating(false);
    setForm({ name: '', desc: '', prompt: '' });
    setActiveAgent(agent);
    setMessages([]);
  };

  const handleDeleteAgent = (id) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    if (activeAgent?.id === id) { setActiveAgent(null); setMessages([]); }
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || limitReached || !activeAgent) return;
    setInput('');
    setStreamText('');
    setIsLoading(true);
    const userMsg = { role: 'user', content: text, ts: Date.now() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    const controller = new AbortController();
    abortRef.current = controller;
    let acc = '';
    streamChat({
      message: text,
      history: messages.map(m => ({ role: m.role, content: m.content })),
      tab: 'text',
      systemPrompt: activeAgent.prompt || undefined,
      signal: controller.signal,
      onChunk: (c) => { acc += c; setStreamText(acc); },
      onDone: () => {
        setMessages([...nextMsgs, { role: 'assistant', content: acc, ts: Date.now() }]);
        setStreamText(''); setIsLoading(false); abortRef.current = null;
      },
      onError: (err) => {
        setMessages([...nextMsgs, { role: 'assistant', content: `⚠️ ${err}`, ts: Date.now(), error: true }]);
        setStreamText(''); setIsLoading(false); abortRef.current = null;
      },
    });
  }, [input, isLoading, messages, activeAgent, limitReached]);

  return (
    <div className="dash__agents">
      {/* Agent list sidebar */}
      <div className="dash__agents-sidebar">
        <div className="dash__agents-sidebar-hd">
          <span className="dash__agents-title">{isEs ? 'Mis Agentes' : 'My Agents'}</span>
          <button className="dash__agents-new-btn" onClick={() => { setCreating(true); setActiveAgent(null); }}>+</button>
        </div>
        <div className="dash__agents-list">
          {agents.length === 0 && !creating && (
            <div className="dash__agents-empty">{isEs ? 'Sin agentes aún. Crea uno.' : 'No agents yet. Create one.'}</div>
          )}
          {agents.map(a => (
            <div key={a.id} className={`dash__agents-item${activeAgent?.id === a.id ? ' dash__agents-item--active' : ''}`}
              onClick={() => { setActiveAgent(a); setMessages([]); setCreating(false); }}>
              <div className="dash__agents-item-icon">🤖</div>
              <div className="dash__agents-item-body">
                <div className="dash__agents-item-name">{a.name}</div>
                {a.desc && <div className="dash__agents-item-desc">{a.desc}</div>}
              </div>
              <button className="dash__agents-item-del" onClick={e => { e.stopPropagation(); handleDeleteAgent(a.id); }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="dash__agents-main">
        {creating && (
          <div className="dash__agents-form">
            <h3 className="dash__agents-form-title">{isEs ? 'Crear agente' : 'Create agent'}</h3>
            <label className="dash__agents-label">{isEs ? 'Nombre *' : 'Name *'}</label>
            <input className="dash__agents-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={isEs ? 'Mi agente de marketing' : 'My marketing agent'} />
            <label className="dash__agents-label">{isEs ? 'Descripción' : 'Description'}</label>
            <input className="dash__agents-input" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder={isEs ? 'Para qué sirve este agente' : 'What this agent does'} />
            <label className="dash__agents-label">System Prompt</label>
            <textarea className="dash__agents-textarea" rows={6} value={form.prompt}
              onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              placeholder={isEs ? 'Eres un experto en marketing B2B. Responde siempre con datos y ejemplos concretos...' : 'You are a B2B marketing expert. Always respond with data and concrete examples...'}
            />
            <div className="dash__agents-form-actions">
              <button className="dash__agents-cancel-btn" onClick={() => setCreating(false)}>{isEs ? 'Cancelar' : 'Cancel'}</button>
              <button className="dash__agents-create-btn" onClick={handleCreateAgent} disabled={!form.name.trim()}>{isEs ? 'Crear agente' : 'Create agent'}</button>
            </div>
          </div>
        )}

        {!creating && !activeAgent && (
          <div className="dash__agents-placeholder">
            <div className="dash__agents-placeholder-icon">🤖</div>
            <div className="dash__agents-placeholder-title">{isEs ? 'Agentes de IA' : 'AI Agents'}</div>
            <p className="dash__agents-placeholder-sub">
              {isEs ? 'Crea agentes con instrucciones personalizadas, especializados en tareas concretas.' : 'Create agents with custom instructions, specialized for specific tasks.'}
            </p>
            <button className="dash__agents-create-btn" onClick={() => setCreating(true)}>{isEs ? '+ Crear primer agente' : '+ Create first agent'}</button>
          </div>
        )}

        {!creating && activeAgent && (
          <>
            <div className="dash__agents-chat-hd">
              <div className="dash__agents-chat-name">🤖 {activeAgent.name}</div>
              {activeAgent.desc && <div className="dash__agents-chat-desc">{activeAgent.desc}</div>}
            </div>
            <div className="dash__messages" ref={messagesRef} style={{ flex: 1 }}>
              {messages.length === 0 && (
                <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  {isEs ? `Habla con ${activeAgent.name}` : `Start talking to ${activeAgent.name}`}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`dash__message dash__message--${msg.role}`}>
                  <div className="dash__message-avatar" style={msg.role === 'assistant' ? { background: `${model.color}18`, border: `1px solid ${model.color}35` } : {}}>
                    {msg.role === 'assistant' ? '🤖' : '👤'}
                  </div>
                  <div className="dash__message-body">
                    {msg.role === 'assistant' && <div className="dash__message-role">{activeAgent.name}</div>}
                    <div className="dash__message-text"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="dash__message dash__message--assistant">
                  <div className="dash__message-avatar" style={{ background: `${model.color}18`, border: `1px solid ${model.color}35` }}>🤖</div>
                  <div className="dash__message-body">
                    <div className="dash__message-role">{activeAgent.name}</div>
                    <div className="dash__message-text">
                      {streamText ? <><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown><span className="dash__cursor" /></> : <ThinkingDots />}
                    </div>
                  </div>
                </div>
              )}
              <div />
            </div>
            <div className="dash__input-bar">
              <div className="dash__input-wrap">
                <div className="dash__input-row">
                  <textarea ref={textareaRef} className="dash__textarea" value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={limitReached ? 'Upgrade to continue' : (isEs ? `Escribe a ${activeAgent.name}…` : `Message ${activeAgent.name}…`)}
                    disabled={limitReached} rows={1}
                  />
                  <button className={`dash__send${input.trim() && !limitReached ? ' dash__send--active' : ''}`}
                    onClick={isLoading ? () => { abortRef.current?.abort(); setIsLoading(false); setStreamText(''); } : handleSend}>
                    {isLoading
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                  </button>
                </div>
                <div className="dash__input-footer"><span /><span className="dash__input-hint">{isEs ? 'Intro para enviar' : 'Enter to send'}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
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
   Model Panel — syntx.ai style: provider + version + system prompt
───────────────────────────────────────────────────────────────── */
function ModelPanel({ selectedId, selectedVersion, onSelect, onSelectVersion, systemPrompt, onSystemPrompt, onClose }) {
  const [providerOpen, setProviderOpen] = useState(false);
  const [systemOpen, setSystemOpen]     = useState(false);
  const selected = MODELS.find(m => m.id === selectedId) || MODELS[0];
  const versions = MODEL_VERSIONS[selectedId] || [];

  return (
    <aside className="dash__model-panel">
      <div className="dash__model-panel-hd">
        <span className="dash__model-panel-title">Model selection</span>
        <button className="dash__model-panel-x" onClick={onClose}>✕</button>
      </div>

      {/* AI provider selector */}
      <div className="dash__mp-section">
        <div className="dash__mp-label">AI</div>
        <button className="dash__mp-dropdown" onClick={() => setProviderOpen(v => !v)}>
          <div className="dash__model-av dash__model-av--sm">
            <ModelLogo modelId={selected.id} size={20} />
          </div>
          <span className="dash__mp-dropdown-name">{selected.name}</span>
          <span className="dash__mp-dropdown-arr">{providerOpen ? '▲' : '▼'}</span>
        </button>
        {providerOpen && (
          <div className="dash__mp-provider-list">
            {MODELS.map(m => (
              <button
                key={m.id}
                className={`dash__mp-provider-item${selectedId === m.id ? ' dash__mp-provider-item--active' : ''}`}
                onClick={() => {
                  onSelect(m.id);
                  onSelectVersion(MODEL_VERSIONS[m.id]?.[0] || '');
                  setProviderOpen(false);
                }}
              >
                <div className="dash__model-av dash__model-av--sm">
                  <ModelLogo modelId={m.id} size={20} />
                </div>
                <div className="dash__model-info">
                  <div className="dash__model-name">{m.name}</div>
                  <div className="dash__model-by">{m.by}</div>
                </div>
                {selectedId === m.id && <span className="dash__mp-check">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Model version selector */}
      <div className="dash__mp-section">
        <div className="dash__mp-label">Model</div>
        <div className="dash__mp-select-wrap">
          <select
            className="dash__mp-select"
            value={selectedVersion}
            onChange={e => onSelectVersion(e.target.value)}
          >
            {versions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <span className="dash__mp-select-arr">▼</span>
        </div>
      </div>

      <div className="dash__mp-info">
        Here you can choose the AI and its model.
      </div>

      <div className="dash__mp-divider" />

      {/* System Prompt */}
      <div className="dash__mp-section dash__mp-section--system">
        <button className="dash__mp-system-hd" onClick={() => setSystemOpen(v => !v)}>
          <span>⚙ System Prompt</span>
          <span>{systemOpen ? '▲' : '▼'}</span>
        </button>
        {systemOpen && (
          <textarea
            className="dash__mp-system-input"
            value={systemPrompt}
            onChange={e => onSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant…"
            rows={5}
          />
        )}
      </div>

      <div className="dash__mp-footer">
        <button className="dash__mp-footer-btn" onClick={() => { onSystemPrompt(''); setSystemOpen(false); }}>
          ↺ Reset all
        </button>
        <button className="dash__mp-footer-btn" onClick={() => setSystemOpen(v => !v)}>
          {systemOpen ? '▲ Close all' : '▼ Open all'}
        </button>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Left Sidebar
───────────────────────────────────────────────────────────────── */
function Sidebar({ sessions, activeId, onNew, onSelect, onDelete, subscription, usageCount, freeLimit, sessionListRef }) {
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

      <div className="dash__session-list" ref={sessionListRef}>
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

  const [activeTab, setActiveTab]             = useState('text');
  const [selectedModel, setSelectedModel]     = useState('chatgpt');
  const [selectedVersion, setSelectedVersion] = useState(MODEL_VERSIONS.chatgpt[0]);
  const [systemPrompt, setSystemPrompt]       = useState('');
  const [modelPanelOpen, setModelPanelOpen]   = useState(true);
  const [sessions, setSessions]               = useState(loadSessions);
  const [currentId, setCurrentId]             = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const sidebarListRef = useRef(null);
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
    currentIdRef.current = s.id; // sync before setState so first message goes to correct session
    setSessions(prev => [s, ...prev]);
    setCurrentId(s.id);
    requestAnimationFrame(() => {
      sidebarListRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, [activeTab, selectedModel]);

  const handleSelectSession = useCallback((id) => {
    const s = sessions.find(s => s.id === id);
    if (s) { currentIdRef.current = id; setCurrentId(id); setActiveTab(s.tab); }
  }, [sessions]);

  const handleTabChange = useCallback((tabId) => {
    currentIdRef.current = null;
    setActiveTab(tabId);
    setCurrentId(null);
  }, []);

  const updateMessages = useCallback((id, messages) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, messages } : s));
  }, []);

  const updateTitle = useCallback((id, title) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  }, []);

  // Atomic session update — creates session on first call if needed
  const currentIdRef = useRef(null);
  useEffect(() => { currentIdRef.current = currentId; }, [currentId]);

  const handleChatUpdate = useCallback(({ messages, title }) => {
    setSessions(prev => {
      const id = currentIdRef.current;
      if (id) {
        return prev.map(s => s.id === id
          ? { ...s, messages, ...(title ? { title } : {}) }
          : s
        );
      }
      // Create new session atomically — title + messages in one shot
      const s = makeSession(activeTab, selectedModel);
      currentIdRef.current = s.id;
      setCurrentId(s.id);
      return [{ ...s, messages, ...(title ? { title } : {}) }, ...prev];
    });
  }, [activeTab, selectedModel]);

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
          sessionListRef={sidebarListRef}
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
                  modelVersion={selectedVersion}
                  systemPrompt={systemPrompt}
                  onUpdate={handleChatUpdate}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                  subscription={subscription}
                />
              )}
              {activeTab === 'design' && (
                <DesignArea
                  model={activeModel}
                  subscription={subscription}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                />
              )}
              {activeTab === 'video' && (
                <VideoArea
                  model={activeModel}
                  subscription={subscription}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                />
              )}
              {activeTab === 'audio' && (
                <AudioArea
                  model={activeModel}
                  subscription={subscription}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                />
              )}
              {activeTab === 'agents' && (
                <AgentsArea
                  model={activeModel}
                  subscription={subscription}
                  usageCount={usageCount}
                  freeLimit={FREE_MONTHLY_LIMIT}
                />
              )}
              {activeTab === 'toolkit' && (
                <ComingSoon tab="toolkit" />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {modelPanelOpen && (
          <ModelPanel
            selectedId={selectedModel}
            selectedVersion={selectedVersion}
            onSelect={setSelectedModel}
            onSelectVersion={setSelectedVersion}
            systemPrompt={systemPrompt}
            onSystemPrompt={setSystemPrompt}
            onClose={() => setModelPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
