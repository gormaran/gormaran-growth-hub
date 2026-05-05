import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  Panel,
  Handle,
  Position,
} from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@xyflow/react/dist/style.css';
import { streamChat, generateImage } from '../utils/api';
import { NODE_TYPES } from '../data/templates';
import './NodeFlowBuilder.css';

/* ─────────────────────────────────────────────────────────────────
   Palette with pre-built prompts
───────────────────────────────────────────────────────────────── */
const PALETTE = [
  { type: 'context',   icon: '◈', label: 'Context input',   color: '#64748b', group: 'BASICS',
    defaultPrompt: '' },
  { type: 'text',      icon: 'T',  label: 'Generate text',   color: '#7c3aed', group: 'BASICS',
    defaultPrompt: 'Write clear, engaging content based on the context. Be specific and professional.' },
  { type: 'image',     icon: '⬡',  label: 'AI image',        color: '#f97316', group: 'BASICS',
    defaultPrompt: 'Professional, high-quality visual with clean composition' },
  { type: 'chat',      icon: '◉',  label: 'AI assistant',    color: '#6366f1', group: 'BASICS',
    defaultPrompt: 'Analyze the input and provide a detailed, expert response with actionable insights.' },
  { type: 'summarize', icon: '📝', label: 'Summarize',        color: '#475569', group: 'BASICS',
    defaultPrompt: 'Create a concise executive summary. Extract key points and action items. Max 200 words.' },
  { type: 'format',    icon: '≡',  label: 'Format output',   color: '#94a3b8', group: 'BASICS',
    defaultPrompt: 'Structure and format the content with clear headings (##), bullet points, and tables.' },
  { type: 'persona',   icon: '◎',  label: 'Buyer persona',   color: '#be185d', group: 'CONTENT',
    defaultPrompt: 'Create a detailed buyer persona. Include: name, age, job title, goals, pain points, objections, preferred channels, and buying triggers. Use a structured table format.' },
  { type: 'seo',       icon: '🔍', label: 'SEO optimize',    color: '#10b981', group: 'CONTENT',
    defaultPrompt: 'Optimize for SEO. Output: primary keyword, 5 LSI keywords, H1 tag, meta title (60 chars), meta description (155 chars), H2 outline, 3 internal link suggestions.' },
  { type: 'social',    icon: '📱', label: 'Social post',     color: '#ec4899', group: 'CONTENT',
    defaultPrompt: 'Write platform-native posts: LinkedIn (professional, 150 words), Instagram (casual + 30 hashtags), X/Twitter (punchy, under 280 chars).' },
  { type: 'email',     icon: '✉',  label: 'Email',           color: '#6366f1', group: 'CONTENT',
    defaultPrompt: 'Write a conversion-focused email: subject line, preheader, opening hook, body (max 150 words), CTA, PS line.' },
  { type: 'script',    icon: '🎬', label: 'Video script',    color: '#0284c7', group: 'CONTENT',
    defaultPrompt: 'Write a 60-second video script. [0-5s] hook, [5-15s] problem, [15-40s] solution, [40-55s] proof, [55-60s] CTA. Include speaker notes in brackets.' },
  { type: 'ads',       icon: '🎯', label: 'Ad copy',         color: '#ef4444', group: 'CONTENT',
    defaultPrompt: 'Generate 5 ad variations. Each: headline (max 30 chars), description (max 90 chars), CTA. Use urgency, curiosity, social proof, benefit, FOMO angles.' },
  { type: 'research',  icon: '◇',  label: 'Research',        color: '#0891b2', group: 'STRATEGY',
    defaultPrompt: 'Research the topic. Output: market size, 5 key trends, top 3 competitors with positioning, customer pain points, 3 strategic opportunities. Use tables for comparisons.' },
  { type: 'brand',     icon: '⚡', label: 'Brand voice',     color: '#f59e0b', group: 'STRATEGY',
    defaultPrompt: 'Apply brand voice: confident, clear, and human. Rewrite maintaining the message but elevating language to match a premium, trusted brand.' },
  { type: 'translate', icon: '🌐', label: 'Translate',       color: '#8b5cf6', group: 'STRATEGY',
    defaultPrompt: 'Translate to Spanish. Maintain the original tone, style, and formatting exactly.' },
  { type: 'analyze',   icon: '📊', label: 'Analyze',         color: '#64748b', group: 'STRATEGY',
    defaultPrompt: 'Perform a detailed analysis. Include SWOT, key metrics, trends, risks, and 3 data-driven recommendations.' },
  { type: 'code',      icon: '<>', label: 'Generate code',   color: '#10b981', group: 'STRATEGY',
    defaultPrompt: 'Write clean, production-ready code following best practices. Include comments for complex logic.' },
  { type: 'video',     icon: '▶',  label: 'AI video',        color: '#0284c7', group: 'GENERATE',
    defaultPrompt: 'Cinematic, professional video with dynamic motion and high production value' },
  { type: 'audio',     icon: '♪',  label: 'AI audio',        color: '#059669', group: 'GENERATE',
    defaultPrompt: 'Professional voice narration, clear and engaging' },
];

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
}

/* ─────────────────────────────────────────────────────────────────
   Flow node card — shows instructions only, not output
───────────────────────────────────────────────────────────────── */
function FlowNodeComp({ id, data, selected }) {
  const { type, label, icon, color, inputValue, prompt, output, isRunning, isDone, error, onChange, onDelete, onSelect } = data;

  const statusDot = isRunning ? 'running' : isDone ? 'done' : error ? 'error' : 'idle';

  return (
    <div
      className={`fnc fnc--${statusDot}${selected ? ' fnc--selected' : ''}`}
      style={{ '--node-color': color }}
      onClick={() => onSelect?.(id)}
    >
      <Handle type="target" position={Position.Left} className="fnc__handle fnc__handle--t" />

      <div className="fnc__header">
        <span className="fnc__icon" style={{ color }}>{icon}</span>
        <span className="fnc__label">{label}</span>
        <div className="fnc__status-row">
          {isRunning && <span className="fnc__spinner" />}
          {isDone && !isRunning && <span className="fnc__badge fnc__badge--done">✓ Done</span>}
          {error && <span className="fnc__badge fnc__badge--error" title={error}>!</span>}
          <button
            className="fnc__delete"
            onClick={e => { e.stopPropagation(); onDelete?.(id); }}
            title="Remove"
            onMouseDown={e => e.stopPropagation()}
          >✕</button>
        </div>
      </div>

      {type === 'context' ? (
        <textarea
          className="fnc__textarea"
          value={inputValue || ''}
          onChange={e => onChange?.(id, 'inputValue', e.target.value)}
          placeholder="Enter context, brand brief, or input data…"
          rows={3}
          onMouseDown={e => e.stopPropagation()}
        />
      ) : (
        <textarea
          className="fnc__textarea fnc__textarea--prompt"
          value={prompt || ''}
          onChange={e => onChange?.(id, 'prompt', e.target.value)}
          placeholder="Instructions for this step…"
          rows={3}
          onMouseDown={e => e.stopPropagation()}
        />
      )}

      {/* Compact output preview — first 60 chars only */}
      {output && !isRunning && (
        <div className="fnc__preview" onClick={e => { e.stopPropagation(); onSelect?.(id); }}>
          {type === 'image'
            ? <span className="fnc__preview-img-badge">🖼 Image ready — click to view</span>
            : <span className="fnc__preview-text">{typeof output === 'string' ? output.replace(/#+\s/g, '').slice(0, 70) + (output.length > 70 ? '…' : '') : ''}</span>
          }
        </div>
      )}

      <Handle type="source" position={Position.Right} className="fnc__handle fnc__handle--s" />
    </div>
  );
}

const nodeTypes = { flowNode: FlowNodeComp };

/* ─────────────────────────────────────────────────────────────────
   Build flow from template
───────────────────────────────────────────────────────────────── */
function buildFromTemplate(templateNodes) {
  const nodes = templateNodes.map((typeKey, i) => {
    const pal = PALETTE.find(p => p.type === typeKey) || PALETTE[1];
    return {
      id: `n${i}`,
      type: 'flowNode',
      position: { x: 80 + i * 340, y: 100 },
      data: {
        type: typeKey, label: pal.label, icon: pal.icon, color: pal.color,
        inputValue: '', prompt: pal.defaultPrompt,
        output: null, isRunning: false, isDone: false, error: null,
        onChange: null, onDelete: null, onSelect: null,
      },
    };
  });
  const edges = nodes.slice(0, -1).map((n, i) => ({
    id: `e${i}`,
    source: `n${i}`,
    target: `n${i + 1}`,
    type: 'smoothstep',
    style: { stroke: '#475569', strokeWidth: 2 },
  }));
  return { nodes, edges };
}

/* ─────────────────────────────────────────────────────────────────
   Output Panel — shows full output of selected/last node
───────────────────────────────────────────────────────────────── */
function OutputPanel({ nodes, selectedNodeId, onClose }) {
  const [copiedId, setCopiedId] = useState(null);

  const doneNodes = nodes.filter(n => n.data.isDone && n.data.output);
  const active = doneNodes.find(n => n.id === selectedNodeId) || doneNodes[doneNodes.length - 1];

  if (!active) return null;

  const handleCopy = async (nodeId, text) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(nodeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = (text) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `flow-output-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="nfb__output-panel">
      <div className="nfb__output-panel-header">
        <div className="nfb__output-tabs">
          {doneNodes.map(n => (
            <button
              key={n.id}
              className={`nfb__output-tab${active.id === n.id ? ' nfb__output-tab--active' : ''}`}
              onClick={() => active.id !== n.id && onClose(n.id)}
              style={{ '--tc': n.data.color }}
            >
              <span style={{ color: n.data.color }}>{n.data.icon}</span>
              {n.data.label}
            </button>
          ))}
        </div>
        <div className="nfb__output-actions">
          <button className="nfb__output-action-btn" onClick={() => handleCopy(active.id, active.data.output)}>
            {copiedId === active.id ? '✅ Copied' : '📋 Copy'}
          </button>
          <button className="nfb__output-action-btn" onClick={() => handleExport(active.data.output)}>
            ⬇️ Export
          </button>
          <button className="nfb__output-close" onClick={() => onClose(null)}>✕</button>
        </div>
      </div>
      <div className="nfb__output-body">
        {active.data.type === 'image' && active.data.output ? (
          <img src={active.data.output} alt="Generated" className="nfb__output-img" />
        ) : (
          <div className="nfb__output-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{active.data.output || ''}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main NodeFlowBuilder
───────────────────────────────────────────────────────────────── */
export default function NodeFlowBuilder({ preloadTemplate, subscription, usageCount, freeLimit }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [running, setRunning] = useState(false);
  const [flowName, setFlowName] = useState('Untitled flow');
  const [search, setSearch] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const nodeIdRef = useRef(100);
  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  /* Callbacks */
  const handleNodeChange = useCallback((nodeId, field, value) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n));
  }, [setNodes]);

  const handleNodeDelete = useCallback((nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleNodeSelect = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    setShowOutput(true);
  }, []);

  const injectCallbacks = useCallback((nodeList) =>
    nodeList.map(n => ({ ...n, data: { ...n.data, onChange: handleNodeChange, onDelete: handleNodeDelete, onSelect: handleNodeSelect } })),
  [handleNodeChange, handleNodeDelete, handleNodeSelect]);

  useEffect(() => {
    if (!preloadTemplate?.nodes?.length) return;
    const { nodes: n, edges: e } = buildFromTemplate(preloadTemplate.nodes);
    setFlowName(preloadTemplate.name);
    setNodes(injectCallbacks(n));
    setEdges(e);
    setShowOutput(false);
    setSelectedNodeId(null);
  }, [preloadTemplate?.id]); // eslint-disable-line

  useEffect(() => {
    setNodes(prev => injectCallbacks(prev));
  }, [injectCallbacks]); // eslint-disable-line

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const addNode = useCallback((pal) => {
    const id = `n${++nodeIdRef.current}`;
    setNodes(prev => injectCallbacks([...prev, {
      id, type: 'flowNode',
      position: { x: 80 + prev.length * 340, y: 100 },
      data: {
        type: pal.type, label: pal.label, icon: pal.icon, color: pal.color,
        inputValue: '', prompt: pal.defaultPrompt,
        output: null, isRunning: false, isDone: false, error: null,
        onChange: handleNodeChange, onDelete: handleNodeDelete, onSelect: handleNodeSelect,
      },
    }]));
  }, [setNodes, injectCallbacks, handleNodeChange, handleNodeDelete, handleNodeSelect]);

  const handleAutoFill = useCallback(() => {
    setNodes(prev => prev.map(n => {
      if (n.data.type === 'context' || n.data.prompt) return n;
      const pal = PALETTE.find(p => p.type === n.data.type);
      return pal?.defaultPrompt ? { ...n, data: { ...n.data, prompt: pal.defaultPrompt } } : n;
    }));
  }, [setNodes]);

  /* Topology */
  function topoSort(nodeList, edgeList) {
    const inDeg = {}; const adj = {};
    nodeList.forEach(n => { inDeg[n.id] = 0; adj[n.id] = []; });
    edgeList.forEach(e => { inDeg[e.target] = (inDeg[e.target] || 0) + 1; adj[e.source].push(e.target); });
    const q = nodeList.filter(n => inDeg[n.id] === 0).map(n => n.id);
    const order = [];
    while (q.length) { const c = q.shift(); order.push(c); adj[c].forEach(nx => { inDeg[nx]--; if (!inDeg[nx]) q.push(nx); }); }
    return order;
  }

  function upstreamOf(nodeId, nodeMap, edgeList) {
    const e = edgeList.find(e => e.target === nodeId);
    return e ? nodeMap[e.source]?.data?.output || null : null;
  }

  /* Run */
  const handleRunFlow = useCallback(async () => {
    if (running || limitReached || !nodes.length) return;
    setRunning(true);
    setShowOutput(false);

    const order = topoSort(nodes, edges);
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, { ...n }]));

    const upd = (id, patch) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
      if (nodeMap[id]) nodeMap[id] = { ...nodeMap[id], data: { ...nodeMap[id].data, ...patch } };
    };

    order.forEach(id => upd(id, { output: null, isDone: false, error: null, isRunning: false }));
    await new Promise(r => setTimeout(r, 60));

    let lastDoneId = null;

    for (const nodeId of order) {
      const node = nodeMap[nodeId];
      if (!node) continue;
      const { type, inputValue, prompt } = node.data;
      upd(nodeId, { isRunning: true });

      const upstream = upstreamOf(nodeId, nodeMap, edges);
      const ctx = upstream ? `Context from previous step:\n${upstream}\n\n` : '';

      try {
        if (type === 'context') {
          upd(nodeId, { output: inputValue || '(no input)', isDone: true, isRunning: false });

        } else if (type === 'image') {
          const subj = (ctx + (prompt || 'Professional high-quality image')).slice(0, 900);
          const result = await generateImage({ subject: subj, style: 'photorealistic', aspect_ratio: '16:9 — Landscape', mood: 'professional', lighting: 'natural light' });
          upd(nodeId, { output: result.imageUrl || null, isDone: !!result.imageUrl, isRunning: false, error: result.imageUrl ? null : 'Image failed' });

        } else {
          const sys = prompt || 'Process the input and produce high-quality, expert-level output.';
          const msg = ctx ? `${ctx}${prompt ? `\nTask: ${prompt}` : 'Continue based on the context above.'}` : (prompt || 'Generate output.');
          let acc = '';
          await new Promise((resolve, reject) => {
            streamChat({
              message: msg, history: [], tab: 'text', systemPrompt: sys,
              onChunk: (c) => { acc += c; upd(nodeId, { output: acc }); },
              onDone: resolve,
              onError: (err) => reject(new Error(typeof err === 'string' ? err : 'Stream error')),
            });
          });
          upd(nodeId, { isDone: true, isRunning: false });
        }
        lastDoneId = nodeId;
      } catch (err) {
        upd(nodeId, { error: err?.message || 'Failed', isRunning: false });
      }
      await new Promise(r => setTimeout(r, 120));
    }

    if (lastDoneId) { setSelectedNodeId(lastDoneId); setShowOutput(true); }
    setRunning(false);
  }, [running, limitReached, nodes, edges, setNodes]);

  const handleClear = () => { setNodes([]); setEdges([]); setFlowName('Untitled flow'); setShowOutput(false); setSelectedNodeId(null); };

  const filtered = search ? PALETTE.filter(p => p.label.toLowerCase().includes(search.toLowerCase())) : PALETTE;
  const groups = groupBy(filtered, 'group');
  const hasOutput = nodes.some(n => n.data.isDone && n.data.output);

  /* Empty state */
  if (!nodes.length) {
    return (
      <div className="nfb__empty">
        <div className="nfb__empty-inner">
          <div className="nfb__empty-icon">⬡</div>
          <h3 className="nfb__empty-title">Visual Flow Builder</h3>
          <p className="nfb__empty-sub">Connect nodes to chain AI steps. Each node has pre-built instructions — customize or run as-is.</p>
          <div className="nfb__empty-groups">
            {Object.entries(groupBy(PALETTE.slice(0, 12), 'group')).map(([grp, items]) => (
              <div key={grp} className="nfb__empty-group">
                <div className="nfb__empty-group-label">{grp}</div>
                <div className="nfb__empty-group-items">
                  {items.map(p => (
                    <button key={p.type} className="nfb__empty-add-btn" onClick={() => addNode(p)} style={{ '--nc': p.color }}>
                      <span style={{ color: p.color }}>{p.icon}</span>{p.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="nfb__empty-hint">Or pick a <strong>Template</strong> → "Use template" for a pre-built flow</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nfb">
      {/* Left palette */}
      <aside className="nfb__palette">
        <div className="nfb__palette-top">
          <input className="nfb__flow-name" value={flowName} onChange={e => setFlowName(e.target.value)} placeholder="Flow name…" />
          <input className="nfb__palette-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search nodes…" />
        </div>
        <div className="nfb__palette-scroll">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="nfb__palette-group">
              <div className="nfb__palette-group-label">{group}</div>
              {items.map(p => (
                <button key={p.type} className="nfb__palette-item" onClick={() => addNode(p)}>
                  <span className="nfb__palette-icon" style={{ color: p.color, background: `${p.color}18` }}>{p.icon}</span>
                  <span className="nfb__palette-label">{p.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Canvas + output panel column */}
      <div className="nfb__right">
        <div className="nfb__canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2} maxZoom={2}
            proOptions={{ hideAttribution: true }}
            deleteKeyCode="Delete"
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls showInteractive={false} />
            <Panel position="top-right" className="nfb__panel">
              {hasOutput && (
                <button className="nfb__output-toggle-btn" onClick={() => setShowOutput(p => !p)}>
                  {showOutput ? '▲ Hide output' : '▼ View output'}
                </button>
              )}
              <button className="nfb__autofill-btn" onClick={handleAutoFill} disabled={running}>✨ Auto-fill</button>
              <button className="nfb__run-btn" onClick={handleRunFlow} disabled={running || limitReached}>
                {running ? <><span className="nfb__run-spinner" /> Running…</> : '▶ Run flow'}
              </button>
              <button className="nfb__clear-btn" onClick={handleClear} disabled={running}>✕ Clear</button>
            </Panel>
          </ReactFlow>
        </div>

        {/* Output panel — rendered below canvas when visible */}
        {showOutput && hasOutput && (
          <OutputPanel
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onClose={(id) => { if (id) setSelectedNodeId(id); else setShowOutput(false); }}
          />
        )}
      </div>
    </div>
  );
}
