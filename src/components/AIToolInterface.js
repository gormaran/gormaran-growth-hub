import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { streamAIResponse } from '../utils/api';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import './AIToolInterface.css';

function FormField({ field, value, onChange }) {
  const commonProps = {
    id: field.id,
    value: value || '',
    onChange: (e) => onChange(field.id, e.target.value),
    placeholder: field.placeholder || '',
    required: field.required,
  };

  if (field.type === 'textarea') {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={field.id}>
          {field.label}
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
          {field.label}
          {field.required && <span className="required-mark"> *</span>}
        </label>
        <select className="form-select" {...commonProps}>
          <option value="">Select an option...</option>
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
        {field.label}
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
  const abortRef = useRef(false);

  const { currentUser } = useAuth();
  const { canUseTool, trackUsage, isAtLimit, subscription } = useSubscription();

  // Reset when tool changes
  useEffect(() => {
    setInputs({});
    setOutput('');
    setError('');
    setIsStreaming(false);
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
        return `"${field.label}" is required`;
      }
    }
    return null;
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('Please sign in to use this tool.');
      return;
    }

    if (!canUseTool(categoryId)) {
      if (isAtLimit()) {
        setError('Daily usage limit reached. Upgrade to Pro for unlimited access.');
      } else {
        setError('This category requires a Pro plan.');
      }
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setOutput('');
    setIsStreaming(true);
    abortRef.current = false;

    await streamAIResponse({
      categoryId,
      toolId: tool.id,
      inputs,
      onChunk: (text) => {
        if (!abortRef.current) {
          setOutput((prev) => prev + text);
        }
      },
      onDone: () => {
        setIsStreaming(false);
        trackUsage();
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
  }

  const locked = !canUseTool(categoryId) && !isAtLimit();
  const atLimit = isAtLimit() && subscription === 'free';

  if (!tool) {
    return (
      <div className="ai-tool__empty">
        <div className="ai-tool__empty-icon">⬅️</div>
        <h3>Select a tool to get started</h3>
        <p>Choose a tool from the sidebar to generate AI-powered content</p>
      </div>
    );
  }

  return (
    <div className="ai-tool">
      {/* Header */}
      <div className="ai-tool__header">
        <div className="ai-tool__title-row">
          <span className="ai-tool__icon">{tool.icon}</span>
          <div>
            <h2 className="ai-tool__title">{tool.name}</h2>
            <p className="ai-tool__description">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Upgrade notice */}
      {(locked || atLimit) && (
        <div className="ai-tool__upgrade">
          <div className="ai-tool__upgrade-icon">🔒</div>
          <div>
            <strong>{atLimit ? 'Daily limit reached' : 'Pro feature'}</strong>
            <p>
              {atLimit
                ? 'You\'ve used all 5 free daily requests. Upgrade to Pro for unlimited access.'
                : 'This category is available on Pro and Business plans.'}
            </p>
          </div>
          <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade Now</Link>
        </div>
      )}

      <div className="ai-tool__layout">
        {/* Input Panel */}
        <div className="ai-tool__panel ai-tool__input-panel">
          <h3 className="ai-tool__panel-title">📝 Your Inputs</h3>
          <form onSubmit={handleGenerate}>
            {tool.inputs.map((field) => (
              <FormField
                key={field.id}
                field={field}
                value={inputs[field.id]}
                onChange={handleInputChange}
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
                  ⏹ Stop Generating
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={locked || atLimit}
                >
                  <span>✨</span>
                  Generate with AI
                </button>
              )}
              {output && !isStreaming && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear}>
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Output Panel */}
        <div className="ai-tool__panel ai-tool__output-panel">
          <div className="ai-tool__output-header">
            <h3 className="ai-tool__panel-title">
              {isStreaming ? (
                <span className="ai-tool__streaming">
                  <span className="ai-tool__streaming-dot" />
                  AI is generating...
                </span>
              ) : output ? (
                '✅ AI Output'
              ) : (
                '🤖 AI Output'
              )}
            </h3>
            {output && (
              <div className="ai-tool__output-controls">
                <span className="ai-tool__word-count">{wordCount} words</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopy}
                  disabled={isStreaming}
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            )}
          </div>

          <div className="ai-tool__output-body" ref={outputRef}>
            {!output && !isStreaming && (
              <div className="ai-tool__output-placeholder">
                <div className="ai-tool__placeholder-icon">✨</div>
                <p>Fill in the inputs on the left and click <strong>Generate with AI</strong> to create content.</p>
                <div className="ai-tool__placeholder-features">
                  <span>📊 Structured output</span>
                  <span>🎯 Category-specific</span>
                  <span>⚡ Real-time streaming</span>
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
                  <ReactMarkdown>{output}</ReactMarkdown>
                  {isStreaming && <span className="ai-tool__cursor">▋</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
