import { useState, useRef, useCallback, useEffect } from 'react';
import { streamChat } from '../utils/api';
import './AppBuilder.css';

const SYSTEM_PROMPT = `You are an AI mini-app builder. When given a description, generate a complete self-contained HTML application.

STRICT RULES:
- Output ONLY a complete HTML document — start with <!DOCTYPE html>, end with </html>
- No external CDN links. Use only vanilla JavaScript and inline CSS
- Must be interactive and functional with realistic sample/mock data
- Dark modern UI: background #0f0f1a, surface #12121e, accent #6366f1, text #f1f5f9
- Font: system-ui, -apple-system, sans-serif
- Include all logic and data inline — no backend needed
- Do NOT wrap in markdown code blocks — return raw HTML only
- Do NOT explain anything — just the HTML

For refinements: modify the previous app based on the instruction.`;

const EXAMPLES = [
  { icon: '📊', label: 'KPI Dashboard', prompt: 'Build a KPI dashboard for a SaaS startup with metrics: MRR, churn, DAU, conversion rate. Include mini charts and trend indicators.' },
  { icon: '🗓️', label: 'Content Calendar', prompt: 'Create a 30-day social media content calendar app. Show posts by platform (LinkedIn, Instagram, Twitter), let me mark them as done.' },
  { icon: '💰', label: 'Budget Tracker', prompt: 'Build a monthly budget tracker with income/expense categories, running total, and a pie chart breakdown.' },
  { icon: '🎯', label: 'Campaign Planner', prompt: 'Create a marketing campaign planner with timeline, channels, budget per channel, and status tracking.' },
  { icon: '📝', label: 'Lead Scorer', prompt: 'Build a B2B lead scoring tool. Input: company size, industry, engagement level, budget. Output: score 0-100 with recommendation.' },
  { icon: '🤖', label: 'Persona Builder', prompt: 'Create a buyer persona builder with fields for demographics, goals, pain points, preferred channels. Export as a card layout.' },
];

function extractHtml(text) {
  const match = text.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
    const start = text.indexOf('<!DOCTYPE html>') !== -1 ? text.indexOf('<!DOCTYPE html>') : text.indexOf('<html');
    return text.slice(start).trim();
  }
  return null;
}

export default function AppBuilder({ session, onUpdate, subscription, usageCount, freeLimit }) {
  const isEs = navigator.language?.startsWith('es');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  // Restore from session
  useEffect(() => {
    if (session?.appHtml) setGeneratedHtml(session.appHtml);
    if (session?.appMessages?.length) setMessages(session.appMessages);
  }, [session?.id]); // eslint-disable-line

  const buildSystemPrompt = useCallback((currentHtml) => {
    if (!currentHtml) return SYSTEM_PROMPT;
    return SYSTEM_PROMPT + `\n\nCURRENT APP HTML (modify this based on user's refinement request):\n${currentHtml.slice(0, 8000)}`;
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || limitReached) return;
    setInput('');
    setIsLoading(true);
    setStreamText('');

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);

    const controller = new AbortController();
    abortRef.current = controller;
    let acc = '';

    streamChat({
      message: text,
      history: messages.slice(-4).map(m => ({ role: m.role, content: m.content })),
      tab: 'text',
      systemPrompt: buildSystemPrompt(generatedHtml),
      signal: controller.signal,
      onChunk: (c) => { acc += c; setStreamText(acc); },
      onDone: () => {
        const html = extractHtml(acc);
        const aiMsg = { role: 'assistant', content: acc, ts: Date.now(), hasApp: !!html };
        const finalMsgs = [...nextMsgs, aiMsg];
        setMessages(finalMsgs);
        if (html) {
          setGeneratedHtml(html);
          onUpdate?.({ appHtml: html, appMessages: finalMsgs }, text.slice(0, 45));
        }
        setStreamText(''); setIsLoading(false);
      },
      onError: (err) => {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err}`, ts: Date.now(), error: true }]);
        setStreamText(''); setIsLoading(false);
      },
    });
  }, [input, isLoading, messages, generatedHtml, limitReached, buildSystemPrompt, onUpdate]);

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };

  const handleExample = (ex) => {
    setInput(ex.prompt);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([]); setGeneratedHtml(''); setStreamText(''); setIsLoading(false); setInput('');
    onUpdate?.({ appHtml: '', appMessages: [] }, '');
  };

  return (
    <div className="ab">
      {/* Left chat panel */}
      <aside className="ab__panel">
        <div className="ab__panel-header">
          <span className="ab__panel-title">⚡ App Builder</span>
          {(generatedHtml || messages.length > 0) && (
            <button className="ab__reset-btn" onClick={handleReset} title="Start over">↺ New</button>
          )}
        </div>

        <div className="ab__messages">
          {messages.length === 0 ? (
            <div className="ab__welcome">
              <div className="ab__welcome-icon">⚡</div>
              <h3 className="ab__welcome-title">Build any app with AI</h3>
              <p className="ab__welcome-sub">Describe what you want — a dashboard, tracker, calculator, tool — and AI generates it instantly.</p>
              <div className="ab__examples">
                {EXAMPLES.map((ex, i) => (
                  <button key={i} className="ab__example" onClick={() => handleExample(ex)}>
                    <span className="ab__example-icon">{ex.icon}</span>
                    <span className="ab__example-label">{ex.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`ab__msg ab__msg--${msg.role}`}>
                <div className="ab__msg-avatar">{msg.role === 'user' ? '👤' : '⚡'}</div>
                <div className="ab__msg-body">
                  {msg.role === 'assistant' && !msg.error
                    ? msg.hasApp
                      ? <span className="ab__msg-built">✓ App generated — see preview →</span>
                      : <span className="ab__msg-text">{msg.content.slice(0, 120)}{msg.content.length > 120 ? '…' : ''}</span>
                    : <span className="ab__msg-text">{msg.content}</span>
                  }
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="ab__msg ab__msg--assistant">
              <div className="ab__msg-avatar">⚡</div>
              <div className="ab__msg-body">
                {streamText
                  ? <span className="ab__msg-text ab__msg-text--stream">Building…</span>
                  : <span className="ab__thinking"><span /><span /><span /></span>
                }
              </div>
            </div>
          )}
        </div>

        <div className="ab__input-area">
          <textarea
            ref={inputRef}
            className="ab__input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={generatedHtml
              ? (isEs ? 'Refina tu app… "añade un gráfico de barras"' : 'Refine your app… "add a bar chart"')
              : (isEs ? 'Describe la app que quieres crear…' : 'Describe the app you want to build…')
            }
            disabled={isLoading || limitReached}
            rows={2}
          />
          <button
            className={`ab__send${input.trim() && !limitReached ? ' ab__send--active' : ''}`}
            onClick={isLoading ? () => { abortRef.current?.abort(); setIsLoading(false); } : handleSubmit}
          >
            {isLoading
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            }
          </button>
        </div>
        {limitReached && (
          <div className="ab__limit">No credits left — <a href="/pricing">upgrade →</a></div>
        )}
      </aside>

      {/* Right preview panel */}
      <div className="ab__preview">
        {generatedHtml ? (
          <>
            <div className="ab__preview-bar">
              <div className="ab__preview-dots"><span /><span /><span /></div>
              <span className="ab__preview-label">Live Preview</span>
              <button className="ab__download-btn" onClick={() => {
                const blob = new Blob([generatedHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'app.html'; a.click();
                URL.revokeObjectURL(url);
              }}>⬇ Export HTML</button>
            </div>
            <iframe
              srcDoc={generatedHtml}
              sandbox="allow-scripts allow-forms allow-same-origin"
              title="Generated app"
              className="ab__iframe"
            />
          </>
        ) : (
          <div className="ab__preview-empty">
            <div className="ab__preview-empty-icon">⚡</div>
            <p>Your app will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
