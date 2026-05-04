import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { streamAIResponse, generateLogoImage, generateImage, translateText } from '../utils/api';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AIToolInterface.css';

// Maps brand profile keys → possible tool input field IDs
const BRAND_FIELD_MAP = {
  companyName:    ['company', 'company_name', 'business_name', 'brand_name', 'business', 'startup_name', 'nombre'],
  website:        ['website', 'url', 'business_url', 'site_url', 'my_website'],
  industry:       ['industry', 'niche', 'sector', 'market', 'business_type'],
  targetAudience: ['audience', 'target_audience', 'target_market', 'customer', 'customer_segment', 'target_customer', 'icp'],
  toneOfVoice:    ['tone', 'tone_of_voice', 'voice', 'writing_tone'],
  usp:            ['usp', 'differentiator', 'my_differentiator', 'differentiation', 'value_proposition'],
  location:       ['location', 'country', 'city', 'geography', 'region'],
  description:    ['description', 'about', 'business_description', 'overview'],
};

function applyBrandProfile(brandProfile, toolInputs) {
  const defaults = {};
  const prefilled = new Set();
  if (!brandProfile || !toolInputs) return { defaults, prefilled };
  for (const [profileKey, fieldIds] of Object.entries(BRAND_FIELD_MAP)) {
    const val = brandProfile[profileKey];
    if (!val) continue;
    for (const fieldId of fieldIds) {
      if (toolInputs.find(f => f.id === fieldId)) {
        defaults[fieldId] = val;
        prefilled.add(fieldId);
        break;
      }
    }
  }
  return { defaults, prefilled };
}

function FormField({ field, value, onChange, toolId, prefilled }) {
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

  const labelEl = (
    <label className="form-label" htmlFor={field.id}>
      {label}
      {field.required && <span className="required-mark"> *</span>}
      {prefilled && <span className="ai-tool__prefilled-badge">🏢 Brand</span>}
    </label>
  );

  if (field.type === 'textarea') {
    return (
      <div className="form-group">
        {labelEl}
        <textarea className="form-textarea" rows={4} {...commonProps} />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="form-group">
        {labelEl}
        <select className="form-select" {...commonProps}>
          <option value="">{t('ui.selectOption', { defaultValue: 'Select an option...' })}</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'multiselect') {
    const selected = value ? value.split(', ').filter(Boolean) : [];
    return (
      <div className="form-group">
        {labelEl}
        <div className="form-multiselect">
          {field.options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label key={opt} className={`form-multiselect__option${checked ? ' form-multiselect__option--checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, opt]
                      : selected.filter((o) => o !== opt);
                    onChange(field.id, next.join(', '));
                  }}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="form-group">
      {labelEl}
      <input type="text" className="form-input" {...commonProps} />
    </div>
  );
}

export default function AIToolInterface({ tool, categoryId, rerunInputs, onRerunConsumed }) {
  const [inputs, setInputs] = useState({});
  const [prefilledFields, setPrefilledFields] = useState(new Set());
  const [output, setOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]); // [{role,content}] after first assistant turn
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const outputRef = useRef(null);
  const outputPanelRef = useRef(null);
  const abortControllerRef = useRef(null);
  const finalOutputRef = useRef('');
  const brandProfileRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [outputMode, setOutputMode] = useState('image'); // 'image' | 'prompt'
  const [refImage, setRefImage] = useState(null); // { dataUrl, b64, mime, name }
  const refImageInputRef = useRef(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedOutput, setTranslatedOutput] = useState('');
  const [translatePicker, setTranslatePicker] = useState(false);
  const [translateLangLabel, setTranslateLangLabel] = useState('');
  const translatePickerRef = useRef(null);

  const { currentUser } = useAuth();
  const { brandProfile, currentWorkspaceId } = useWorkspace();
  const { canUseSpecificTool, trackUsage, subscription, hasMonthlyUsageLeft, usageCount, FREE_MONTHLY_LIMIT, isInTrial } = useSubscription();
  const { t, i18n } = useTranslation();

  // Keep brandProfileRef in sync with context (no Firestore fetch needed here)
  useEffect(() => {
    brandProfileRef.current = brandProfile;
  }, [brandProfile]);

  // Reset when tool changes — also apply brand profile defaults
  useEffect(() => {
    const { defaults, prefilled } = applyBrandProfile(brandProfileRef.current, tool?.inputs);
    // If a re-run was requested, overlay those inputs on top of brand defaults
    if (rerunInputs) {
      setInputs({ ...defaults, ...rerunInputs });
      setPrefilledFields(new Set());
      onRerunConsumed?.();
    } else {
      setInputs(defaults);
      setPrefilledFields(prefilled);
    }
    setOutput('');
    setError('');
    setIsStreaming(false);
    setGeneratedImage(null);
    setImageError('');
    setOutputMode('image');
    setRefImage(null);
    setConversationHistory([]);
    setRefineInput('');
  }, [tool?.id, categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Load Firestore templates when tool or user changes
  useEffect(() => {
    setTemplates([]);
    setTemplatesOpen(false);
    setShowSaveTemplate(false);
    setTemplateName('');
    if (tool?.id && currentUser) loadTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool?.id, currentUser?.uid]);

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
    if (prefilledFields.has(fieldId)) {
      setPrefilledFields(prev => { const next = new Set(prev); next.delete(fieldId); return next; });
    }
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

    if (!hasMonthlyUsageLeft()) {
      setError(t('ui.monthlyLimitReached', { defaultValue: `You've used all ${FREE_MONTHLY_LIMIT} free generations this month. Upgrade to Grow for unlimited access.` }));
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    // imageOnly tools skip text streaming and go straight to image generation
    if (tool.imageOnly) {
      setTimeout(() => outputPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      handleGenerateImage();
      return;
    }

    // imageOrPrompt tools route based on the selected output mode
    if (tool.imageOrPrompt) {
      setTimeout(() => outputPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      if (outputMode === 'image') {
        handleGenerateImage();
      } else {
        // fall through to streaming below
        setOutput('');
        finalOutputRef.current = '';
        setIsStreaming(true);
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const capturedInputs = { ...inputs };
        await streamAIResponse({
          categoryId,
          toolId: tool.id,
          inputs: { ...inputs, _language: i18n.language },
          signal: controller.signal,
          onChunk: (text) => {
            setOutput((prev) => {
              const next = prev + text;
              finalOutputRef.current = next;
              return next;
            });
          },
          onDone: () => {
            setIsStreaming(false);
            trackUsage(2);
            saveToHistory(capturedInputs, finalOutputRef.current);
            setConversationHistory([{ role: 'assistant', content: finalOutputRef.current }]);
          },
          onError: (msg) => {
            setIsStreaming(false);
            setError(msg);
          },
        });
      }
      return;
    }

    setOutput('');
    finalOutputRef.current = '';
    setConversationHistory([]);
    setRefineInput('');
    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setTimeout(() => outputPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    const capturedInputs = { ...inputs };

    await streamAIResponse({
      categoryId,
      toolId: tool.id,
      inputs: { ...inputs, _language: i18n.language },
      signal: controller.signal,
      onChunk: (text) => {
        setOutput((prev) => {
          const next = prev + text;
          finalOutputRef.current = next;
          return next;
        });
      },
      onDone: () => {
        setIsStreaming(false);
        trackUsage(2);
        saveToHistory(capturedInputs, finalOutputRef.current);
        setConversationHistory([{ role: 'assistant', content: finalOutputRef.current }]);
      },
      onError: (msg) => {
        setIsStreaming(false);
        setError(msg);
      },
    });
  }

  async function handleRefine() {
    const instruction = refineInput.trim();
    if (!instruction || isStreaming) return;
    setRefineInput('');
    const newHistory = [...conversationHistory, { role: 'user', content: instruction }];
    setOutput('');
    finalOutputRef.current = '';
    setIsRefining(true);
    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    await streamAIResponse({
      categoryId,
      toolId: tool.id,
      inputs: { ...inputs, _language: i18n.language },
      conversationHistory: newHistory,
      signal: controller.signal,
      onChunk: (text) => {
        setOutput(prev => {
          const next = prev + text;
          finalOutputRef.current = next;
          return next;
        });
      },
      onDone: () => {
        setIsStreaming(false);
        setIsRefining(false);
        trackUsage(2);
        setConversationHistory([...newHistory, { role: 'assistant', content: finalOutputRef.current }]);
      },
      onError: (msg) => {
        setIsStreaming(false);
        setIsRefining(false);
        setError(msg);
      },
    });
  }

  function handleStop() {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }

  function handleRefImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5 MB safety margin under the 5 MB API limit
    const MAX_DIMENSION = 1920;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      // Try quality levels until under MAX_BYTES
      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length * 0.75 > MAX_BYTES && quality > 0.3) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      const [, b64] = dataUrl.split(',');
      setRefImage({ dataUrl, b64, mime: 'image/jpeg', name: file.name });
      setInputs(prev => ({ ...prev, _ref_image_b64: b64, _ref_image_mime: 'image/jpeg' }));
    };
    img.src = objectUrl;
  }

  function handleRemoveRefImage() {
    setRefImage(null);
    setInputs(prev => {
      const next = { ...prev };
      delete next._ref_image_b64;
      delete next._ref_image_mime;
      return next;
    });
    if (refImageInputRef.current) refImageInputRef.current.value = '';
  }

  async function handleGenerateImage() {
    setImageError('');
    setGeneratedImage(null);
    setIsGeneratingImage(true);
    try {
      const apiFn = tool.imageEndpoint === 'generate' ? generateImage : generateLogoImage;
      const { imageUrl } = await apiFn({ ...inputs, _language: i18n.language });
      setGeneratedImage(imageUrl);
    } catch (err) {
      setImageError(err.message || 'Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  }

  function stripMarkdown(text) {
    return text
      .replace(/```[\w]*\n?([\s\S]*?)```/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1')
      .replace(/_{1,3}([^_\n]+)_{1,3}/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/^[-*_]{3,}\s*$/gm, '')
      .replace(/^\|[-| :]+\|$/gm, '')
      .replace(/^\|(.+)\|$/gm, (_, cells) =>
        cells.split('|').map(c => c.trim()).filter(Boolean).join('  '))
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(stripMarkdown(output));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const TRANSLATE_LANGS = [
    { code: 'es', label: '🇪🇸 Spanish' },
    { code: 'en', label: '🇺🇸 English' },
    { code: 'fr', label: '🇫🇷 French' },
    { code: 'de', label: '🇩🇪 German' },
    { code: 'pt', label: '🇧🇷 Portuguese' },
    { code: 'it', label: '🇮🇹 Italian' },
    { code: 'zh', label: '🇨🇳 Chinese' },
    { code: 'ja', label: '🇯🇵 Japanese' },
    { code: 'ar', label: '🇸🇦 Arabic' },
  ];

  async function handleTranslate(langCode, langLabel) {
    if (!output) return;
    setTranslatePicker(false);
    setIsTranslating(true);
    setTranslateLangLabel(langLabel);
    setTranslatedOutput('');
    try {
      const result = await translateText(output, 'auto', langCode);
      setTranslatedOutput(result);
    } catch (e) {
      setTranslatedOutput(`⚠️ Translation failed. ${e.message}`);
    } finally {
      setIsTranslating(false);
    }
  }

  function handleClear() {
    const { defaults, prefilled } = applyBrandProfile(brandProfileRef.current, tool?.inputs);
    setInputs(defaults);
    setPrefilledFields(prefilled);
    setOutput('');
    setError('');
    setConversationHistory([]);
    setRefineInput('');
    finalOutputRef.current = '';
  }

  function extractJson(text) {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  }

  function handleDownloadPdf() {
    if (!output || !outputRef.current) return;
    const contentEl = outputRef.current.querySelector('.markdown-output');
    const renderedHtml = contentEl ? contentEl.innerHTML : `<pre>${stripMarkdown(output)}</pre>`;
    const date = new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${toolName} — Gormaran AI</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.7; color: #1a1a2e; padding: 48px 56px; max-width: 820px; margin: 0 auto; }
    .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #6366f1; margin-bottom: 28px; }
    .pdf-header h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
    .pdf-header .meta { font-size: 11px; color: #64748b; text-align: right; line-height: 1.6; }
    .pdf-brand { font-size: 11px; font-weight: 700; color: #6366f1; letter-spacing: 0.08em; text-transform: uppercase; }
    h1, h2, h3, h4 { color: #1a1a2e; margin: 20px 0 8px; font-weight: 700; line-height: 1.3; }
    h1 { font-size: 20px; } h2 { font-size: 17px; } h3 { font-size: 15px; }
    p { margin-bottom: 10px; }
    ul, ol { margin: 8px 0 12px 22px; }
    li { margin-bottom: 4px; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    code { font-family: 'Courier New', monospace; font-size: 12px; background: #f1f5f9; padding: 1px 5px; border-radius: 3px; }
    pre { background: #f1f5f9; padding: 14px; border-radius: 6px; overflow-x: auto; margin: 12px 0; font-size: 12px; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 14px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
    blockquote { border-left: 3px solid #6366f1; padding-left: 14px; color: #64748b; margin: 12px 0; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
    .pdf-footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print {
      body { padding: 0; }
      @page { margin: 2cm 2.5cm; }
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div>
      <div class="pdf-brand">⚡ Gormaran AI Growth Hub</div>
      <h1>${toolName}</h1>
    </div>
    <div class="meta">
      <div>${date}</div>
    </div>
  </div>
  <div class="pdf-content">${renderedHtml}</div>
  <div class="pdf-footer">Generated by Gormaran AI · gormaran.io</div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); }<\/script>
</body>
</html>`);
    printWindow.document.close();
  }

  function handleDownloadTxt() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadJson() {
    const json = extractJson(output);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function saveToHistory(queryInputs, queryOutput) {
    if (!tool?.id || !queryOutput) return;
    const entry = { id: Date.now(), timestamp: new Date().toISOString(), inputs: queryInputs, output: queryOutput };
    const key = `gormaran_history_${tool.id}`;
    const existing = (() => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } })();
    const updated = [entry, ...existing].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updated));
    setHistory(updated);
    // Persist to Firestore if logged in
    if (currentUser) {
      addDoc(collection(db, 'users', currentUser.uid, 'history'), {
        toolId: tool.id, toolName: tool.name, categoryId,
        inputs: queryInputs, output: queryOutput,
        workspaceId: currentWorkspaceId || 'personal',
        createdAt: serverTimestamp(),
      }).catch(console.error);
    }
  }

  async function loadTemplates() {
    try {
      const q = query(
        collection(db, 'users', currentUser.uid, 'templates'),
        where('toolId', '==', tool.id),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { setTemplates([]); }
  }

  async function saveTemplate() {
    if (!templateName.trim() || !currentUser) return;
    setSavingTemplate(true);
    try {
      const cleanInputs = Object.fromEntries(
        Object.entries(inputs).filter(([k]) => !k.startsWith('_'))
      );
      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'templates'), {
        name: templateName.trim(), toolId: tool.id, toolName: tool.name, categoryId,
        inputs: cleanInputs, createdAt: serverTimestamp(),
      });
      setTemplates(prev => [{ id: docRef.id, name: templateName.trim(), inputs: cleanInputs }, ...prev]);
      setTemplateName('');
      setShowSaveTemplate(false);
    } catch (e) { console.error(e); }
    finally { setSavingTemplate(false); }
  }

  async function deleteTemplate(templateId) {
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'templates', templateId));
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (e) { console.error(e); }
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
          <div className="ai-tool__panel-header">
            <h3 className="ai-tool__panel-title">{t('ui.yourInputs', { defaultValue: '📝 Your Inputs' })}</h3>
            {currentUser && brandProfile?.companyName && (
              <button
                type="button"
                className="ai-tool__refill-btn"
                onClick={() => {
                  const { defaults, prefilled } = applyBrandProfile(brandProfile, tool?.inputs);
                  setInputs(prev => ({ ...prev, ...defaults }));
                  setPrefilledFields(prefilled);
                }}
                title="Re-apply your Brand Profile to all fields"
              >
                🏢 Refill from profile
              </button>
            )}
          </div>
          <form onSubmit={handleGenerate} noValidate>
            {/* Templates */}
            {currentUser && templates.length > 0 && (
              <div className="ai-tool__history">
                <button type="button" className="ai-tool__history-toggle" onClick={() => setTemplatesOpen(o => !o)}>
                  <span>⭐</span>
                  <span>{t('ui.myTemplates', { defaultValue: 'My Templates' })} ({templates.length})</span>
                  <span className={`ai-tool__history-arrow ${templatesOpen ? 'open' : ''}`}>▾</span>
                </button>
                {templatesOpen && (
                  <div className="ai-tool__history-list">
                    {templates.map(tpl => (
                      <div key={tpl.id} className="ai-tool__template-row">
                        <button
                          type="button"
                          className="ai-tool__history-item ai-tool__template-item"
                          onClick={() => { setInputs(prev => ({ ...prev, ...tpl.inputs })); setTemplatesOpen(false); }}
                        >
                          <span className="ai-tool__history-preview">⭐ {tpl.name}</span>
                        </button>
                        <button type="button" className="ai-tool__template-delete" onClick={() => deleteTemplate(tpl.id)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Brand profile nudge — shown only when logged in and profile is empty/incomplete */}
            {currentUser && !brandProfile?.companyName && (
              <div className="ai-tool__brand-nudge">
                <span className="ai-tool__brand-nudge-icon">🏢</span>
                <div className="ai-tool__brand-nudge-body">
                  <strong>Fill in once, use everywhere</strong>
                  <span>Save your business details in your <Link to="/settings" className="ai-tool__brand-nudge-link">Brand Profile</Link> and every form will auto-fill for you.</span>
                </div>
              </div>
            )}

            {tool.inputs.map((field) => (
              <FormField
                key={field.id}
                field={field}
                value={inputs[field.id]}
                onChange={handleInputChange}
                toolId={tool.id}
                prefilled={prefilledFields.has(field.id)}
              />
            ))}

            {/* Reference image upload — for imageOrPrompt and hasRefImage tools */}
            {(tool.imageOrPrompt || tool.hasRefImage) && (
              <div className="form-group">
                <label className="form-label">Reference Image (optional)</label>
                {refImage ? (
                  <div className="ai-tool__ref-image-preview">
                    <img src={refImage.dataUrl} alt="reference" className="ai-tool__ref-thumb" />
                    <div className="ai-tool__ref-info">
                      <span className="ai-tool__ref-name">{refImage.name}</span>
                      <button type="button" className="ai-tool__ref-remove" onClick={handleRemoveRefImage}>✕ Remove</button>
                    </div>
                  </div>
                ) : (
                  <div className="ai-tool__ref-upload" onClick={() => refImageInputRef.current?.click()}>
                    <span className="ai-tool__ref-upload-icon">📎</span>
                    <span>Upload reference photo for style matching</span>
                    <input
                      ref={refImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleRefImageChange}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Output mode toggle — only for imageOrPrompt tools */}
            {tool.imageOrPrompt && (
              <div className="ai-tool__output-mode-toggle">
                <button
                  type="button"
                  className={`ai-tool__mode-btn${outputMode === 'image' ? ' active' : ''}`}
                  onClick={() => setOutputMode('image')}
                >
                  🖼 Generate Image
                </button>
                <button
                  type="button"
                  className={`ai-tool__mode-btn${outputMode === 'prompt' ? ' active' : ''}`}
                  onClick={() => setOutputMode('prompt')}
                >
                  ✨ Get Prompt
                </button>
              </div>
            )}

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
                  <span>{tool.imageOrPrompt && outputMode === 'image' ? '🖼' : '✨'}</span>
                  {tool.imageOrPrompt && outputMode === 'image'
                    ? t('ui.generateImage', { defaultValue: 'Generate Image' })
                    : tool.imageOrPrompt && outputMode === 'prompt'
                      ? t('ui.getPrompt', { defaultValue: 'Get Prompt' })
                      : t('ui.generateWithAI', { defaultValue: 'Generate with AI' })}
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
              {isGeneratingImage ? (
                <span className="ai-tool__streaming">
                  <span className="ai-tool__streaming-dot" />
                  Generating with DALL·E 3…
                </span>
              ) : isStreaming ? (
                <span className="ai-tool__streaming">
                  <span className="ai-tool__streaming-dot" />
                  {t('ui.aiGenerating', { defaultValue: 'AI is generating...' })}
                </span>
              ) : generatedImage ? (
                tool.imageOrPrompt ? `✅ Image Generated` : `✅ Logo Generated`
              ) : output ? (
                `✅ ${t('ui.aiOutput', { defaultValue: 'AI Output' })}`
              ) : (
                `🤖 ${t('ui.aiOutput', { defaultValue: 'AI Output' })}`
              )}
            </h3>
            {subscription === 'free' && !isInTrial() && (
              <div className="ai-tool__usage-bar">
                <span className="ai-tool__usage-label">
                  {usageCount}/{FREE_MONTHLY_LIMIT} {t('ui.monthlyGenerations', { defaultValue: 'free generations this month' })}
                </span>
                <div className="ai-tool__usage-track">
                  <div
                    className="ai-tool__usage-fill"
                    style={{ width: `${Math.min(100, (usageCount / FREE_MONTHLY_LIMIT) * 100)}%` }}
                  />
                </div>
                {usageCount >= FREE_MONTHLY_LIMIT && (
                  <a href="/pricing" className="ai-tool__usage-upgrade">
                    ⭐ {t('ui.upgradeForUnlimited', { defaultValue: 'Upgrade for unlimited' })}
                  </a>
                )}
              </div>
            )}

            {output && !tool.imageOnly && !(tool.imageOrPrompt && outputMode === 'image') && (
              <div className="ai-tool__output-controls">
                <span className="ai-tool__word-count">{wordCount} {t('ui.words', { defaultValue: 'words' })}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopy}
                  disabled={isStreaming}
                >
                  {copied ? `✅ ${t('ui.copied', { defaultValue: 'Copied!' })}` : `📋 ${t('ui.copy', { defaultValue: 'Copy' })}`}
                </button>
                {!isStreaming && (
                  <>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleDownloadPdf}
                    >
                      📄 {t('ui.downloadPdf', { defaultValue: 'PDF' })}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleDownloadTxt}
                    >
                      ⬇️ {t('ui.downloadTxt', { defaultValue: 'TXT' })}
                    </button>
                    <div className="ai-tool__translate-wrap" ref={translatePickerRef}>
                      <button
                        className={`btn btn-secondary btn-sm${isTranslating ? ' ai-tool__btn--loading' : ''}`}
                        onClick={() => setTranslatePicker(p => !p)}
                        disabled={isTranslating}
                      >
                        {isTranslating ? '⏳' : '🌐'} {t('ui.translate', { defaultValue: 'Translate' })}
                      </button>
                      {translatePicker && (
                        <div className="ai-tool__translate-picker">
                          {TRANSLATE_LANGS.map(l => (
                            <button
                              key={l.code}
                              className="ai-tool__translate-lang"
                              onClick={() => handleTranslate(l.code, l.label)}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
                {!isStreaming && extractJson(output) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleDownloadJson}
                  >
                    ⬇️ {t('ui.downloadJson', { defaultValue: 'Download JSON' })}
                  </button>
                )}
                {!isStreaming && currentUser && (
                  showSaveTemplate ? (
                    <div className="ai-tool__save-tpl-form">
                      <input
                        className="form-input ai-tool__save-tpl-input"
                        placeholder={t('ui.templateNamePlaceholder', { defaultValue: 'Template name…' })}
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveTemplate()}
                        autoFocus
                      />
                      <button className="btn btn-primary btn-sm" onClick={saveTemplate} disabled={!templateName.trim() || savingTemplate}>
                        {savingTemplate ? '…' : t('ui.save', { defaultValue: 'Save' })}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setShowSaveTemplate(false); setTemplateName(''); }}>
                        {t('ui.cancel', { defaultValue: 'Cancel' })}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSaveTemplate(true)}>
                      ⭐ {t('ui.saveAsTemplate', { defaultValue: 'Save as template' })}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div className="ai-tool__output-body" ref={outputRef}>

            {/* ── imageOnly output (e.g. Logo Generator) ── */}
            {tool.imageOnly ? (
              <>
                {!generatedImage && !isGeneratingImage && !imageError && (
                  <div className="ai-tool__output-placeholder">
                    <div className="ai-tool__placeholder-icon">🎨</div>
                    <p>{t('ui.fillInputs', { defaultValue: 'Fill in the inputs on the left and click' })} <strong>{t('ui.generateWithAI', { defaultValue: 'Generate with AI' })}</strong>.</p>
                    <div className="ai-tool__placeholder-features">
                      <span>🖼 DALL·E 3</span>
                      <span>⚡ {t('ui.realTimeStreaming', { defaultValue: '~15 seconds' })}</span>
                      <span>⬇️ {t('ui.downloadImage', { defaultValue: 'Download' })}</span>
                    </div>
                  </div>
                )}
                {isGeneratingImage && (
                  <div className="ai-tool__image-loading">
                    <div className="ai-tool__image-spinner" />
                    <p>Generating your logo with DALL·E 3…</p>
                  </div>
                )}
                {imageError && (
                  <div className="alert alert-error">⚠️ {imageError}</div>
                )}
                {generatedImage && (
                  <motion.div
                    className="ai-tool__image-result ai-tool__image-result--full"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <img src={generatedImage} alt={`${inputs.brand_name || ''} logo`} className="ai-tool__generated-img" />
                    <p className="ai-tool__image-caption">
                      <strong>{inputs.brand_name}</strong> · {inputs.style} · {inputs.industry}
                      {inputs.colors ? ` · ${inputs.colors}` : ''}
                    </p>
                    <div className="ai-tool__image-actions">
                      <a href={generatedImage} download="logo.png" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        ⬇️ {t('ui.downloadImage', { defaultValue: 'Download' })}
                      </a>
                      <button className="btn btn-ghost btn-sm" onClick={handleGenerateImage} disabled={isGeneratingImage}>
                        🔄 {t('ui.regenerate', { defaultValue: 'Regenerate' })}
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            ) : tool.imageOrPrompt && outputMode === 'image' ? (
              /* ── imageOrPrompt in image mode ── */
              <>
                {!generatedImage && !isGeneratingImage && !imageError && (
                  <div className="ai-tool__output-placeholder">
                    <div className="ai-tool__placeholder-icon">🎨</div>
                    <p>{t('ui.fillInputs', { defaultValue: 'Fill in the inputs on the left and click' })} <strong>{t('ui.generateWithAI', { defaultValue: 'Generate with AI' })}</strong>.</p>
                    <div className="ai-tool__placeholder-features">
                      <span>🖼 DALL·E 3</span>
                      <span>⚡ ~15 seconds</span>
                      <span>⬇️ {t('ui.downloadImage', { defaultValue: 'Download' })}</span>
                    </div>
                  </div>
                )}
                {isGeneratingImage && (
                  <div className="ai-tool__image-loading">
                    <div className="ai-tool__image-spinner" />
                    <p>Generating your image with DALL·E 3…</p>
                  </div>
                )}
                {imageError && (
                  <div className="alert alert-error">⚠️ {imageError}</div>
                )}
                {generatedImage && (
                  <motion.div
                    className="ai-tool__image-result ai-tool__image-result--full"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <img src={generatedImage} alt={inputs.subject || 'generated image'} className="ai-tool__generated-img" />
                    <p className="ai-tool__image-caption">
                      {inputs.subject ? <strong>{inputs.subject.slice(0, 60)}{inputs.subject.length > 60 ? '…' : ''}</strong> : null}
                      {inputs.style ? ` · ${inputs.style}` : ''}
                      {inputs.lighting ? ` · ${inputs.lighting}` : ''}
                    </p>
                    <div className="ai-tool__image-actions">
                      <a href={generatedImage} download="image.png" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        ⬇️ {t('ui.downloadImage', { defaultValue: 'Download' })}
                      </a>
                      <button className="btn btn-ghost btn-sm" onClick={handleGenerateImage} disabled={isGeneratingImage}>
                        🔄 {t('ui.regenerate', { defaultValue: 'Regenerate' })}
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              /* ── Standard text output ── */
              <>
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

                {/* ── Translation panel ── */}
                {translatedOutput && !isStreaming && (
                  <motion.div
                    className="ai-tool__translated-panel"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="ai-tool__translated-header">
                      <span>🌐 {translateLangLabel} translation</span>
                      <button className="ai-tool__translated-close" onClick={() => setTranslatedOutput('')}>✕</button>
                    </div>
                    <div className="ai-tool__translated-body markdown-output">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{translatedOutput}</ReactMarkdown>
                    </div>
                    <div className="ai-tool__translated-copy">
                      <button className="btn btn-ghost btn-sm" onClick={async () => { await navigator.clipboard.writeText(translatedOutput); }}>
                        📋 Copy translation
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        const blob = new Blob([translatedOutput], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = `translation-${translateLangLabel.replace(/[^a-z]/gi,'').toLowerCase()}.txt`; a.click(); URL.revokeObjectURL(url);
                      }}>⬇️ Export TXT</button>
                    </div>
                  </motion.div>
                )}

                {/* ── Refine section ── */}
                {output && !isStreaming && (
                  <motion.div
                    className="ai-tool__refine"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="ai-tool__refine-header">
                      <span className="ai-tool__refine-label">✏️ {t('ui.refine', { defaultValue: 'Refine' })}</span>
                      {conversationHistory.length > 1 && (
                        <span className="ai-tool__refine-count">
                          {Math.floor(conversationHistory.length / 2)} {t('ui.refinements', { defaultValue: 'refinement(s)' })}
                        </span>
                      )}
                    </div>
                    <div className="ai-tool__refine-row">
                      <textarea
                        className="ai-tool__refine-input"
                        placeholder={t('ui.refinePlaceholder', { defaultValue: "Adjust the output… e.g. 'Make it shorter', 'More formal', 'Add a strong CTA', 'Translate to Spanish'" })}
                        value={refineInput}
                        onChange={e => setRefineInput(e.target.value)}
                        rows={2}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleRefine(); }
                        }}
                      />
                      <button
                        className="btn btn-primary ai-tool__refine-btn"
                        onClick={handleRefine}
                        disabled={!refineInput.trim() || isRefining}
                      >
                        {isRefining ? '…' : '↻ ' + t('ui.refine', { defaultValue: 'Refine' })}
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
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
