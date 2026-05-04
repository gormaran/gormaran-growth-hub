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
import '@xyflow/react/dist/style.css';
import { streamChat, generateImage } from '../utils/api';
import { NODE_TYPES } from '../data/templates';
import './NodeFlowBuilder.css';

/* ─────────────────────────────────────────────────────────────────
   Extended node palette with pre-built system prompts
───────────────────────────────────────────────────────────────── */
const PALETTE = [
  // BASICS
  { type: 'context',   icon: '◈', label: 'Context input',   color: '#64748b', group: 'BASICS',
    defaultPrompt: '' },
  { type: 'text',      icon: 'T',  label: 'Generate text',   color: '#7c3aed', group: 'BASICS',
    defaultPrompt: 'Write clear, engaging content based on the context. Be specific and professional. No filler.' },
  { type: 'image',     icon: '⬡',  label: 'AI image',        color: '#f97316', group: 'BASICS',
    defaultPrompt: 'Professional, high-quality visual with clean composition and modern aesthetic' },
  { type: 'chat',      icon: '◉',  label: 'AI assistant',    color: '#6366f1', group: 'BASICS',
    defaultPrompt: 'Analyze the input and provide a detailed, expert response with actionable insights.' },
  { type: 'summarize', icon: '📝', label: 'Summarize',        color: '#475569', group: 'BASICS',
    defaultPrompt: 'Create a concise executive summary. Extract key points, decisions, and action items. Max 200 words.' },
  { type: 'format',    icon: '≡',  label: 'Format output',   color: '#94a3b8', group: 'BASICS',
    defaultPrompt: 'Structure and format the content with clear headings (##), bullet points, and tables where appropriate.' },

  // CONTENT
  { type: 'persona',   icon: '◎',  label: 'Buyer persona',   color: '#be185d', group: 'CONTENT',
    defaultPrompt: 'Create a detailed buyer persona. Include: name, age, job title, goals, pain points, objections, preferred channels, and buying triggers. Use a structured table format.' },
  { type: 'seo',       icon: '🔍', label: 'SEO optimize',    color: '#10b981', group: 'CONTENT',
    defaultPrompt: 'Optimize for SEO. Output: primary keyword, 5 LSI keywords, H1 tag, meta title (60 chars), meta description (155 chars), H2 outline, and 3 internal link suggestions.' },
  { type: 'social',    icon: '📱', label: 'Social post',     color: '#ec4899', group: 'CONTENT',
    defaultPrompt: 'Write platform-native posts for LinkedIn (professional, 150 words), Instagram (casual, emojis, 30 hashtags), and X/Twitter (punchy, under 280 chars, no hashtags).' },
  { type: 'email',     icon: '✉',  label: 'Email',           color: '#6366f1', group: 'CONTENT',
    defaultPrompt: 'Write a conversion-focused email. Output: subject line, preheader, opening hook, body (150 words max), CTA, and PS line. Use a direct, human tone.' },
  { type: 'script',    icon: '🎬', label: 'Video script',    color: '#0284c7', group: 'CONTENT',
    defaultPrompt: 'Write a 60-second video script. Structure: [0-5s] hook, [5-15s] problem, [15-40s] solution, [40-55s] proof, [55-60s] CTA. Include speaker notes in brackets.' },
  { type: 'ads',       icon: '🎯', label: 'Ad copy',         color: '#ef4444', group: 'CONTENT',
    defaultPrompt: 'Generate 5 ad variations. Each: headline (max 30 chars), description (max 90 chars), CTA. Use different angles: urgency, curiosity, social proof, benefit, fear of missing out.' },

  // STRATEGY
  { type: 'research',  icon: '◇',  label: 'Research',        color: '#0891b2', group: 'STRATEGY',
    defaultPrompt: 'Research the topic. Output: market size, 5 key trends, top 3 competitors with positioning, customer pain points, and 3 strategic opportunities. Use tables for comparisons.' },
  { type: 'brand',     icon: '⚡', label: 'Brand voice',     color: '#f59e0b', group: 'STRATEGY',
    defaultPrompt: 'Apply brand voice: confident, clear, and human. Rewrite the content maintaining the message but elevating the language to match a premium, trusted brand.' },
  { type: 'translate', icon: '🌐', label: 'Translate',       color: '#8b5cf6', group: 'STRATEGY',
    defaultPrompt: 'Translate to Spanish. Maintain the original tone, style, and formatting exactly. Use natural, local expressions, not literal translations.' },
  { type: 'analyze',   icon: '📊', label: 'Analyze',         color: '#64748b', group: 'STRATEGY',
    defaultPrompt: 'Perform a detailed analysis. Include SWOT, key metrics, trends, risks, and 3 data-driven recommendations.' },
  { type: 'code',      icon: '<>', label: 'Generate code',   color: '#10b981', group: 'STRATEGY',
    defaultPrompt: 'Write clean, production-ready code following best practices. Include inline comments for complex logic. Use modern syntax.' },

  // VIDEO / AUDIO
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
   Custom Flow Node Component
───────────────────────────────────────────────────────────────── */
function FlowNodeComp({ id, data }) {
  const { type, label, icon, color, inputValue, prompt, output, isRunning, isDone, error, onChange, onDelete } = data;

  return (
    <div className={`fnc${isDone ? ' fnc--done' : ''}${isRunning ? ' fnc--running' : ''}${error ? ' fnc--error' : ''}`}
      style={{ '--node-color': color }}>
      <Handle type="target" position={Position.Left} className="fnc__handle fnc__handle--target" />

      <div className="fnc__header">
        <span className="fnc__icon" style={{ color }}>{icon}</span>
        <span className="fnc__label">{label}</span>
        <div className="fnc__status">
          {isRunning && <span className="fnc__spinner" />}
          {isDone && !isRunning && <span className="fnc__check">✓</span>}
          {error && <span className="fnc__err-icon" title={error}>!</span>}
        </div>
        <button className="fnc__delete-btn" onClick={() => onDelete?.(id)} title="Remove node"
          onMouseDown={e => e.stopPropagation()}>✕</button>
      </div>

      {type === 'context' ? (
        <textarea
          className="fnc__textarea"
          value={inputValue || ''}
          onChange={e => onChange?.(id, 'inputValue', e.target.value)}
          placeholder="Your context, brief, or input data…"
          rows={4}
          onMouseDown={e => e.stopPropagation()}
        />
      ) : (
        <textarea
          className="fnc__textarea fnc__textarea--prompt"
          value={prompt || ''}
          onChange={e => onChange?.(id, 'prompt', e.target.value)}
          placeholder={`${label} instructions…`}
          rows={3}
          onMouseDown={e => e.stopPropagation()}
        />
      )}

      {output && (
        <div className="fnc__output">
          {type === 'image' ? (
            <img src={output} alt="AI generated" className="fnc__output-img" />
          ) : (
            <div className="fnc__output-text">
              {output.slice(0, 300)}{output.length > 300 ? '…' : ''}
            </div>
          )}
          <button className="fnc__copy-btn" onClick={() => navigator.clipboard.writeText(output)} title="Copy output"
            onMouseDown={e => e.stopPropagation()}>📋</button>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="fnc__handle fnc__handle--source" />
    </div>
  );
}

const nodeTypes = { flowNode: FlowNodeComp };

/* ─────────────────────────────────────────────────────────────────
   Build flow from template
───────────────────────────────────────────────────────────────── */
function buildFromTemplate(templateNodes) {
  const nodes = templateNodes.map((typeKey, i) => {
    const palItem = PALETTE.find(p => p.type === typeKey) || PALETTE[0];
    return {
      id: `n${i}`,
      type: 'flowNode',
      position: { x: 60 + i * 360, y: 140 },
      data: {
        type: typeKey,
        label: palItem.label,
        icon: palItem.icon,
        color: palItem.color,
        inputValue: '',
        prompt: palItem.defaultPrompt,
        output: null,
        isRunning: false,
        isDone: false,
        error: null,
        onChange: null,
        onDelete: null,
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
   Main NodeFlowBuilder
───────────────────────────────────────────────────────────────── */
export default function NodeFlowBuilder({ preloadTemplate, subscription, usageCount, freeLimit }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [running, setRunning] = useState(false);
  const [flowName, setFlowName] = useState('Untitled flow');
  const [search, setSearch] = useState('');
  const nodeIdRef = useRef(100);

  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  /* onChange for node data */
  const handleNodeChange = useCallback((nodeId, field, value) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n
    ));
  }, [setNodes]);

  /* onDelete for nodes */
  const handleNodeDelete = useCallback((nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  /* Inject callbacks whenever nodes change */
  const injectCallbacks = useCallback((nodeList) =>
    nodeList.map(n => ({ ...n, data: { ...n.data, onChange: handleNodeChange, onDelete: handleNodeDelete } })),
  [handleNodeChange, handleNodeDelete]);

  /* Load template */
  useEffect(() => {
    if (!preloadTemplate?.nodes?.length) return;
    const { nodes: newNodes, edges: newEdges } = buildFromTemplate(preloadTemplate.nodes);
    setFlowName(preloadTemplate.name);
    setNodes(injectCallbacks(newNodes));
    setEdges(newEdges);
  }, [preloadTemplate?.id]); // eslint-disable-line

  /* Keep callbacks fresh */
  useEffect(() => {
    setNodes(prev => injectCallbacks(prev));
  }, [injectCallbacks]); // eslint-disable-line

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  /* Add node */
  const addNode = useCallback((palItem) => {
    const id = `n${++nodeIdRef.current}`;
    setNodes(prev => injectCallbacks([...prev, {
      id,
      type: 'flowNode',
      position: { x: 80 + prev.length * 360, y: 140 },
      data: {
        type: palItem.type,
        label: palItem.label,
        icon: palItem.icon,
        color: palItem.color,
        inputValue: '',
        prompt: palItem.defaultPrompt,
        output: null,
        isRunning: false,
        isDone: false,
        error: null,
        onChange: handleNodeChange,
        onDelete: handleNodeDelete,
      },
    }]));
  }, [setNodes, injectCallbacks, handleNodeChange, handleNodeDelete]);

  /* Auto-fill: fill all empty prompts with defaults */
  const handleAutoFill = useCallback(() => {
    setNodes(prev => prev.map(n => {
      if (n.data.type === 'context' || n.data.prompt) return n;
      const palItem = PALETTE.find(p => p.type === n.data.type);
      if (!palItem?.defaultPrompt) return n;
      return { ...n, data: { ...n.data, prompt: palItem.defaultPrompt } };
    }));
  }, [setNodes]);

  /* Topological sort */
  function getExecutionOrder(nodeList, edgeList) {
    const inDeg = {}; const adj = {};
    nodeList.forEach(n => { inDeg[n.id] = 0; adj[n.id] = []; });
    edgeList.forEach(e => { inDeg[e.target] = (inDeg[e.target] || 0) + 1; adj[e.source].push(e.target); });
    const queue = nodeList.filter(n => inDeg[n.id] === 0).map(n => n.id);
    const order = [];
    while (queue.length) {
      const cur = queue.shift();
      order.push(cur);
      adj[cur].forEach(next => { inDeg[next]--; if (inDeg[next] === 0) queue.push(next); });
    }
    return order;
  }

  function getUpstream(nodeId, nodeMap, edgeList) {
    const e = edgeList.find(e => e.target === nodeId);
    return e ? nodeMap[e.source]?.data?.output || null : null;
  }

  /* Run flow */
  const handleRunFlow = useCallback(async () => {
    if (running || limitReached || nodes.length === 0) return;
    setRunning(true);
    const order = getExecutionOrder(nodes, edges);
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

    const updateNode = (id, patch) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
      if (nodeMap[id]) nodeMap[id] = { ...nodeMap[id], data: { ...nodeMap[id].data, ...patch } };
    };

    order.forEach(id => updateNode(id, { output: null, isDone: false, error: null, isRunning: false }));
    await new Promise(r => setTimeout(r, 60));

    for (const nodeId of order) {
      const node = nodeMap[nodeId];
      if (!node) continue;
      const { type, inputValue, prompt } = node.data;
      updateNode(nodeId, { isRunning: true, output: null, error: null, isDone: false });

      const upstream = getUpstream(nodeId, nodeMap, edges);
      const ctx = upstream ? `Context from previous step:\n${upstream}\n\n` : '';

      try {
        if (type === 'context') {
          updateNode(nodeId, { output: inputValue || '(no input provided)', isDone: true, isRunning: false });

        } else if (type === 'image') {
          const subject = prompt ? `${ctx}${prompt}` : ctx || 'Professional high-quality image';
          const result = await generateImage({
            subject: subject.slice(0, 900),
            style: 'photorealistic',
            aspect_ratio: '16:9 — Landscape',
            mood: 'professional',
            lighting: 'natural light',
          });
          updateNode(nodeId, { output: result.imageUrl || null, isDone: !!result.imageUrl, error: result.imageUrl ? null : 'Image generation failed', isRunning: false });

        } else {
          const sysPrompt = prompt || 'Process the input and produce high-quality, expert-level output.';
          const userMsg = ctx ? `${ctx}${prompt ? `\nTask: ${prompt}` : 'Continue based on the context above.'}` : (prompt || 'Generate relevant output.');
          let acc = '';
          await new Promise((resolve, reject) => {
            streamChat({
              message: userMsg,
              history: [],
              tab: 'text',
              systemPrompt: sysPrompt,
              onChunk: (c) => { acc += c; updateNode(nodeId, { output: acc }); },
              onDone: resolve,
              onError: (err) => reject(new Error(typeof err === 'string' ? err : String(err))),
            });
          });
          updateNode(nodeId, { isDone: true, isRunning: false });
        }
      } catch (err) {
        updateNode(nodeId, { error: err?.message || 'Failed', isRunning: false });
      }

      await new Promise(r => setTimeout(r, 150));
    }
    setRunning(false);
  }, [running, limitReached, nodes, edges, setNodes]);

  const handleClear = () => { setNodes([]); setEdges([]); setFlowName('Untitled flow'); };

  const filteredPalette = search
    ? PALETTE.filter(p => p.label.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase()))
    : PALETTE;
  const paletteGroups = groupBy(filteredPalette, 'group');

  /* ── Empty state ── */
  if (nodes.length === 0) {
    return (
      <div className="nfb__empty">
        <div className="nfb__empty-inner">
          <div className="nfb__empty-icon">⬡</div>
          <h3 className="nfb__empty-title">Visual Flow Builder</h3>
          <p className="nfb__empty-sub">
            Build multi-step AI workflows. Connect nodes to chain outputs into inputs.
            Each node has pre-built instructions — or write your own.
          </p>
          <div className="nfb__empty-groups">
            {Object.entries(groupBy(PALETTE.slice(0, 12), 'group')).map(([grp, items]) => (
              <div key={grp} className="nfb__empty-group">
                <div className="nfb__empty-group-label">{grp}</div>
                <div className="nfb__empty-group-items">
                  {items.map(p => (
                    <button key={p.type} className="nfb__empty-add-btn" onClick={() => addNode(p)}
                      style={{ '--nc': p.color }}>
                      <span style={{ color: p.color }}>{p.icon}</span>{p.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="nfb__empty-hint">Or pick a <strong>Template</strong> → "Use template" to start with a pre-built flow</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nfb">
      {/* Left palette */}
      <aside className="nfb__palette">
        <div className="nfb__palette-top">
          <input
            className="nfb__flow-name"
            value={flowName}
            onChange={e => setFlowName(e.target.value)}
            placeholder="Flow name…"
          />
          <input
            className="nfb__palette-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes…"
          />
        </div>
        <div className="nfb__palette-scroll">
          {Object.entries(paletteGroups).map(([group, items]) => (
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

      {/* Canvas */}
      <div className="nfb__canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.25}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode="Delete"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls showInteractive={false} />
          <Panel position="top-right" className="nfb__panel">
            <button className="nfb__autofill-btn" onClick={handleAutoFill} disabled={running} title="Fill all empty nodes with pre-built instructions">
              ✨ Auto-fill
            </button>
            <button className="nfb__run-btn" onClick={handleRunFlow} disabled={running || limitReached}>
              {running ? <><span className="nfb__run-spinner" /> Running…</> : '▶ Run flow'}
            </button>
            <button className="nfb__clear-btn" onClick={handleClear} disabled={running}>
              ✕ Clear
            </button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
