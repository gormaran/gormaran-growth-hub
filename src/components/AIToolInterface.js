import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { streamAIResponse } from '../utils/api';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AIToolInterface.css';

function FormField({ field, value, onChange, toolId }) {
  const { t } = useTranslation();
  const label = t(`input.${toolId}.${field.id}.label`, { defaultValue: field.label });
  const placeholder = t(`input.${toolId}.${field.id}.placeholder`, { defaultValue: field.placeholder || '' });

  const commonProps = {
    id: field.id,
    value: value || '',
    onChange: (e) => onChange(field.id, e.target.value),
    placeholder,
    required: field.required,
  };

  if (field.type === 'textarea') {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={field.id}>
          {label}
          {field.required && <span className="required-mark"> *</span>}
        </label>
        <textarea className="form-textarea" rows={4} {...commonProps} />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={field.id}>
          {label}
          {field.required && <span className="required-mark"> *</span>}
        </label>
        <select className="form-select" {...commonProps}>
          <option value="">{t('ui.selectOption', { defaultValue: 'Select an option...' })}</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={field.id}>
        {label}
        {field.required && <span className="required-mark"> *</span>}
      </label>
      <input type="text" className="form-input" {...commonProps} />
    </div>
  );
}

export default function AIToolInterface({ tool, categoryId }) {
  const [inputs, setInputs] = useState({});
  const [output, setOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const outputRef = useRef(null);
  const outputPanelRef = useRef(null);
  const abortRef = useRef(false);
  const finalOutputRef = useRef('');
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { currentUser } = useAuth();
  const { canUseSpecificTool, trackUsage, subscription } = useSubscription();
  const { t, i18n } = useTranslation();

  // Reset when tool changes
  useEffect(() => {
    setInputs({});
    setOutput('');
    setError('');
    setIsStreaming(false);
  }, [tool?.id]);

  // Load history when tool changes
  useEffect(() => {
    if (tool?.id) {
      try {
        const stored = localStorage.getItem(`gormaran_history_${tool.id}`);
        setHistory(stored ? JSON.parse(stored) : []);
      } catch {
        setHistory([]);
      }
    }
    setHistoryOpen(false);
  }, [tool?.id]);

  // Track word count
  useEffect(() => {
    if (output) {
      setWordCount(output.split(/\s+/).filter(Boolean).length);
    } else {
      setWordCount(0);
    }
  }, [output]);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current && isStreaming) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isStreaming]);

  function handleInputChange(fieldId, value) {
    setInputs((prev) => ({ ...prev, [fieldId]: value }));
  }

  function validateInputs() {
    const required = tool.inputs.filter((f) => f.required);
    for (const field of required) {
      if (!inputs[field.id] || inputs[field.id].trim() === '') {
        const fieldLabel = t(`input.${tool.id}.${field.id}.label`, { defaultValue: field.label });
        return `"${fieldLabel}" is required`;
      }
    }
    return null;
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError(t('ui.signInRequired', { defaultValue: 'Please sign in or create a free account to use this tool.' }));
      return;
    }

    if (!canUseSpecificTool(categoryId, tool.id)) {
      setError(t('ui.upgradeRequired', { defaultValue: 'This tool requires an upgrade. Visit the pricing page to see your options.' }));
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setOutput('');
    finalOutputRef.current = '';
    setIsStreaming(true);
    abortRef.current = false;
    setTimeout(() => outputPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    const capturedInputs = { ...inputs };

    await streamAIResponse({
      categoryId,
      toolId: tool.id,
      inputs: { ...inputs, _language: i18n.language },
      onChunk: (text) => {
        if (!abortRef.current) {
          setOutput((prev) => {
            const next = prev + text;
            finalOutputRef.current = next;
            return next;
          });
        }
      },
      onDone: () => {
        setIsStreaming(false);
        trackUsage();
        saveToHistory(capturedInputs, finalOutputRef.current);
      },
      onError: (msg) => {
        setIsStreaming(false);
        setError(msg);
      },
    });
  }

  function handleStop() {
    abortRef.current = true;
    setIsStreaming(false);
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClear() {
    setOutput('');
    setError('');
    setInputs({});
    finalOutputRef.current = '';
  }

  function saveToHistory(queryInputs, queryOutput) {
    if (!tool?.id || !queryOutput) return;
    const entry = { id: Date.now(), timestamp: new Date().toISOString(), inputs: queryInputs, output: queryOutput };
    const key = `gormaran_history_${tool.id}`;
    const existing = (() => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } })();
    const updated = [entry, ...existing].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updated));
    setHistory(updated);
  }

  if (!tool) {
    return (
      <div className="ai-tool__empty">
        <div className="ai-tool__empty-icon">⬅️</div>
        <h3>{t('ui.selectTool', { defaultValue: 'Select a tool to get started' })}</h3>
        <p>{t('ui.selectToolSub', { defaultValue: 'Choose a tool from the sidebar to generate AI-powered content' })}</p>
      </div>
    );
  }

  const toolName = t(`tool.${tool.id}.name`, { defaultValue: tool.name });
  const toolDesc = t(`tool.${tool.id}.desc`, { defaultValue: tool.description });

  return (
    <div className="ai-tool">
      {/* Header */}
      <div className="ai-tool__header">
        <div className="ai-tool__title-row">
          <span className="ai-tool__icon">{tool.icon}</span>
          <div>
            <h2 className="ai-tool__title">{toolName}</h2>
            <p className="ai-tool__description">{toolDesc}</p>
          </div>
        </div>
      </div>

      {/* Upgrade notice */}
      {!canUseSpecificTool(categoryId, tool.id) && (
        <div className="ai-tool__upgrade">
          <div className="ai-tool__upgrade-icon">🔒</div>
          <div>
            <strong>{t('ui.proFeature', { defaultValue: 'Pro feature' })}</strong>
            <p>{t('ui.proOnlyText', { defaultValue: 'This tool is available on Grow plan and above.' })}</p>
          </div>
          <Link to="/pricing" className="btn btn-primary btn-sm">{t('ui.upgradeNow', { defaultValue: 'Upgrade Now' })}</Link>
        </div>
      )}

      <div className="ai-tool__layout">
        {/* Input Panel */}
        <div className="ai-tool__panel ai-tool__input-panel">
          <h3 className="ai-tool__panel-title">{t('ui.yourInputs', { defaultValue: '📝 Your Inputs' })}</h3>
          <form onSubmit={handleGenerate}>
            {tool.inputs.map((field) => (
              <FormField
                key={field.id}
                field={field}
                value={inputs[field.id]}
                onChange={handleInputChange}
                toolId={tool.id}
              />
            ))}

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="ai-tool__actions">
              {isStreaming ? (
                <button type="button" className="btn btn-danger" onClick={handleStop}>
                  ⏹ {t('ui.stopGenerating', { defaultValue: 'Stop Generating' })}
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!canUseSpecificTool(categoryId, tool.id)}
                >
                  <span>✨</span>
                  {t('ui.generateWithAI', { defaultValue: 'Generate with AI' })}
                </button>
              )}
              {output && !isStreaming && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear}>
                  {t('ui.clear', { defaultValue: 'Clear' })}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Output Panel */}
        <div className="ai-tool__panel ai-tool__output-panel" ref={outputPanelRef}>
          <div className="ai-tool__output-header">
            <h3 className="ai-tool__panel-title">
              {isStreaming ? (
                <span className="ai-tool__streaming">
                  <span className="ai-tool__streaming-dot" />
                  {t('ui.aiGenerating', { defaultValue: 'AI is generating...' })}
                </span>
              ) : output ? (
                `✅ ${t('ui.aiOutput', { defaultValue: 'AI Output' })}`
              ) : (
                `🤖 ${t('ui.aiOutput', { defaultValue: 'AI Output' })}`
              )}
            </h3>
            {output && (
              <div className="ai-tool__output-controls">
                <span className="ai-tool__word-count">{wordCount} {t('ui.words', { defaultValue: 'words' })}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopy}
                  disabled={isStreaming}
                >
                  {copied ? `✅ ${t('ui.copied', { defaultValue: 'Copied!' })}` : `📋 ${t('ui.copy', { defaultValue: 'Copy' })}`}
                </button>
              </div>
            )}
          </div>

          <div className="ai-tool__output-body" ref={outputRef}>
            {!output && !isStreaming && (
              <div className="ai-tool__output-placeholder">
                <div className="ai-tool__placeholder-icon">✨</div>
                <p>{t('ui.fillInputs', { defaultValue: 'Fill in the inputs on the left and click' })} <strong>{t('ui.generateWithAI', { defaultValue: 'Generate with AI' })}</strong>.</p>
                <div className="ai-tool__placeholder-features">
                  <span>{t('ui.structuredOutput', { defaultValue: '📊 Structured output' })}</span>
                  <span>{t('ui.categorySpecific', { defaultValue: '🎯 Category-specific' })}</span>
                  <span>{t('ui.realTimeStreaming', { defaultValue: '⚡ Real-time streaming' })}</span>
                </div>
              </div>
            )}

            <AnimatePresence>
              {(output || isStreaming) && (
                <motion.div
                  className="ai-tool__output-content markdown-output"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                  {isStreaming && <span className="ai-tool__cursor">▋</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Query History */}
      {history.length > 0 && (
        <div className="ai-tool__history">
          <button
            type="button"
            className="ai-tool__history-toggle"
            onClick={() => setHistoryOpen((o) => !o)}
          >
            <span>🕐</span>
            <span>{t('ui.history', { defaultValue: 'Recent queries' })} ({history.length})</span>
            <span className={`ai-tool__history-arrow ${historyOpen ? 'open' : ''}`}>▾</span>
          </button>

          {historyOpen && (
            <div className="ai-tool__history-list">
              {history.map((entry) => {
                const firstKey = Object.keys(entry.inputs).find((k) => !k.startsWith('_'));
                const raw = firstKey ? String(entry.inputs[firstKey] || '') : '';
                const preview = raw.slice(0, 70);
                const d = new Date(entry.timestamp);
                const timeStr =
                  d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                  ' · ' +
                  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className="ai-tool__history-item"
                    onClick={() => {
                      setInputs(entry.inputs);
                      setOutput(entry.output);
                      finalOutputRef.current = entry.output;
                      setHistoryOpen(false);
                    }}
                  >
                    <span className="ai-tool__history-time">{timeStr}</span>
                    <span className="ai-tool__history-preview">{preview}{raw.length > 70 ? '…' : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
