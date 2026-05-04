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
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { streamChat, generateImage } from '../utils/api';
import { NODE_TYPES } from '../data/templates';
import './NodeFlowBuilder.css';

/* ─────────────────────────────────────────────────────────────────
   Node palette items (left sidebar)
───────────────────────────────────────────────────────────────── */
const PALETTE = [
  { type: 'context',  icon: '◈', label: 'Context input',  color: '#64748b', group: 'BASICS' },
  { type: 'text',     icon: 'T',  label: 'Generate text',  color: '#7c3aed', group: 'BASICS' },
  { type: 'image',    icon: '⬡',  label: 'AI image',       color: '#f97316', group: 'BASICS' },
  { type: 'chat',     icon: '◉',  label: 'AI chat',        color: '#6366f1', group: 'BASICS' },
  { type: 'video',    icon: '▶',  label: 'AI video',       color: '#0284c7', group: 'AI NODES' },
  { type: 'audio',    icon: '♪',  label: 'AI audio',       color: '#059669', group: 'AI NODES' },
  { type: 'persona',  icon: '◎',  label: 'Create persona', color: '#be185d', group: 'AI NODES' },
  { type: 'research', icon: '◇',  label: 'Research',       color: '#0891b2', group: 'AI NODES' },
  { type: 'format',   icon: '≡',  label: 'Format output',  color: '#64748b', group: 'AI NODES' },
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
  const { type, label, icon, color, inputValue, prompt, output, isRunning, isDone, error, onChange } = data;
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

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
      </div>

      {type === 'context' ? (
        <textarea
          className="fnc__textarea"
          value={inputValue || ''}
          onChange={e => onChange?.(id, 'inputValue', e.target.value)}
          placeholder="Your context, brand info, or instructions…"
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
              {output.slice(0, 280)}{output.length > 280 ? '…' : ''}
            </div>
          )}
          <button className="fnc__copy-btn" onClick={() => navigator.clipboard.writeText(output)} title="Copy output">
            📋
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="fnc__handle fnc__handle--source" />
    </div>
  );
}

const nodeTypes = { flowNode: FlowNodeComp };

/* ─────────────────────────────────────────────────────────────────
   Helper: build nodes + edges from a template node array
───────────────────────────────────────────────────────────────── */
function buildFromTemplate(templateNodes, templateName) {
  const SPACING_X = 340;
  const SPACING_Y = 0;
  const BASE_X = 60;
  const BASE_Y = 120;

  const nodes = templateNodes.map((typeKey, i) => {
    const def = NODE_TYPES[typeKey] || NODE_TYPES.text;
    return {
      id: `n${i}`,
      type: 'flowNode',
      position: { x: BASE_X + i * SPACING_X, y: BASE_Y + (i % 2 === 0 ? 0 : SPACING_Y) },
      data: {
        type: typeKey,
        label: def.label,
        icon: def.icon,
        color: def.color,
        inputValue: '',
        prompt: '',
        output: null,
        isRunning: false,
        isDone: false,
        error: null,
        onChange: null,
      },
    };
  });

  const edges = nodes.slice(0, -1).map((n, i) => ({
    id: `e${i}-${i + 1}`,
    source: `n${i}`,
    target: `n${i + 1}`,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#475569', strokeWidth: 2 },
  }));

  return { nodes, edges };
}

/* ─────────────────────────────────────────────────────────────────
   Main NodeFlowBuilder component
───────────────────────────────────────────────────────────────── */
export default function NodeFlowBuilder({ preloadTemplate, subscription, usageCount, freeLimit }) {
  const isEs = document.documentElement.lang === 'es';
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [running, setRunning] = useState(false);
  const [flowName, setFlowName] = useState('Untitled flow');
  const nodeIdRef = useRef(100);

  const limitReached = subscription === 'free' && usageCount >= freeLimit;

  /* onChange for node data updates */
  const handleNodeChange = useCallback((nodeId, field, value) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n
    ));
  }, [setNodes]);

  /* Inject onChange into all nodes whenever nodes change */
  useEffect(() => {
    setNodes(prev => prev.map(n => ({
      ...n,
      data: { ...n.data, onChange: handleNodeChange },
    })));
  }, [handleNodeChange]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Load template */
  useEffect(() => {
    if (!preloadTemplate) return;
    const { nodes: newNodes, edges: newEdges } = buildFromTemplate(
      preloadTemplate.nodes || ['context', 'text'],
      preloadTemplate.name
    );
    setFlowName(preloadTemplate.name);
    setNodes(newNodes.map(n => ({ ...n, data: { ...n.data, onChange: handleNodeChange } })));
    setEdges(newEdges);
  }, [preloadTemplate?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  /* Add node from palette */
  const addNode = useCallback((typeKey) => {
    const def = NODE_TYPES[typeKey] || NODE_TYPES.text;
    const id = `n${++nodeIdRef.current}`;
    const existingCount = nodes.length;
    setNodes(prev => [...prev, {
      id,
      type: 'flowNode',
      position: { x: 60 + existingCount * 340, y: 120 },
      data: {
        type: typeKey,
        label: def.label,
        icon: def.icon,
        color: def.color,
        inputValue: '',
        prompt: '',
        output: null,
        isRunning: false,
        isDone: false,
        error: null,
        onChange: handleNodeChange,
      },
    }]);
  }, [nodes.length, setNodes, handleNodeChange]);

  /* Topological sort — resolve execution order from edges */
  function getExecutionOrder(nodeList, edgeList) {
    const inDegree = {};
    const adjList = {};
    nodeList.forEach(n => { inDegree[n.id] = 0; adjList[n.id] = []; });
    edgeList.forEach(e => { inDegree[e.target] = (inDegree[e.target] || 0) + 1; adjList[e.source].push(e.target); });
    const queue = nodeList.filter(n => inDegree[n.id] === 0).map(n => n.id);
    const order = [];
    while (queue.length > 0) {
      const cur = queue.shift();
      order.push(cur);
      adjList[cur].forEach(next => { inDegree[next]--; if (inDegree[next] === 0) queue.push(next); });
    }
    return order;
  }

  /* Get input node for a given node (its source) */
  function getUpstreamOutput(nodeId, nodeMap, edgeList) {
    const sourceEdge = edgeList.find(e => e.target === nodeId);
    if (!sourceEdge) return null;
    return nodeMap[sourceEdge.source]?.data?.output || null;
  }

  /* Run entire flow */
  const handleRunFlow = useCallback(async () => {
    if (running || limitReached || nodes.length === 0) return;
    setRunning(true);

    const order = getExecutionOrder(nodes, edges);
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

    const updateNode = (id, patch) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
      // update local map too
      if (nodeMap[id]) nodeMap[id] = { ...nodeMap[id], data: { ...nodeMap[id].data, ...patch } };
    };

    // Reset all nodes
    order.forEach(id => updateNode(id, { output: null, isDone: false, error: null, isRunning: false }));
    await new Promise(r => setTimeout(r, 50));

    for (const nodeId of order) {
      const node = nodeMap[nodeId];
      if (!node) continue;
      const { type, inputValue, prompt } = node.data;

      updateNode(nodeId, { isRunning: true, output: null, error: null, isDone: false });

      const upstream = getUpstreamOutput(nodeId, nodeMap, edges);
      const context = upstream
        ? `Previous step output:\n${upstream}\n\n`
        : '';

      try {
        if (type === 'context') {
          updateNode(nodeId, { output: inputValue || '(no input)', isDone: true, isRunning: false });

        } else if (type === 'image') {
          const imagePrompt = prompt ? context + prompt : context || 'A professional high-quality image';
          const result = await generateImage({
            subject: imagePrompt.slice(0, 900),
            style: 'photorealistic',
            aspect_ratio: '16:9 — Landscape',
            mood: 'professional',
            lighting: 'natural light',
          });
          updateNode(nodeId, { output: result.imageUrl || null, isDone: true, isRunning: false });

        } else {
          // text, chat, persona, research, format — all use LLM
          const systemMsg = prompt || `You are an expert assistant. Process the input and produce high-quality output.`;
          let acc = '';
          const userMessage = context
            ? `${context}${prompt ? `\nInstructions: ${prompt}` : 'Continue based on the above context.'}`
            : (prompt || 'Generate relevant output.');
          await new Promise((resolve, reject) => {
            streamChat({
              message: userMessage,
              history: [],
              tab: 'text',
              systemPrompt: systemMsg,
              onChunk: (c) => { acc += c; updateNode(nodeId, { output: acc }); },
              onDone: resolve,
              onError: (err) => reject(new Error(err)),
            });
          });
          updateNode(nodeId, { isDone: true, isRunning: false });
        }
      } catch (err) {
        updateNode(nodeId, { error: err?.message || 'Failed', isRunning: false });
      }

      // brief pause between nodes for visual feedback
      await new Promise(r => setTimeout(r, 200));
    }

    setRunning(false);
  }, [running, limitReached, nodes, edges, setNodes]);

  /* Clear canvas */
  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    setFlowName('Untitled flow');
  };

  const paletteGroups = groupBy(PALETTE, 'group');

  if (nodes.length === 0) {
    return (
      <div className="nfb__empty">
        <div className="nfb__empty-inner">
          <div className="nfb__empty-icon">⬡</div>
          <h3 className="nfb__empty-title">Visual Flow Builder</h3>
          <p className="nfb__empty-sub">
            Build multi-step AI workflows by connecting nodes. Add nodes from the palette or start from a template.
          </p>
          <div className="nfb__empty-palette">
            {PALETTE.slice(0, 5).map(p => (
              <button key={p.type} className="nfb__empty-add-btn" onClick={() => addNode(p.type)}
                style={{ '--nc': p.color }}>
                <span style={{ color: p.color }}>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
          <p className="nfb__empty-hint">or pick a template from the <strong>Templates</strong> tab</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nfb">
      {/* Left node palette */}
      <aside className="nfb__palette">
        <div className="nfb__palette-name">
          <input
            className="nfb__flow-name"
            value={flowName}
            onChange={e => setFlowName(e.target.value)}
            placeholder="Flow name…"
          />
        </div>
        {Object.entries(paletteGroups).map(([group, items]) => (
          <div key={group} className="nfb__palette-group">
            <div className="nfb__palette-group-label">{group}</div>
            {items.map(p => (
              <button key={p.type} className="nfb__palette-item" onClick={() => addNode(p.type)}>
                <span className="nfb__palette-icon" style={{ color: p.color, background: `${p.color}18` }}>{p.icon}</span>
                <span className="nfb__palette-label">{p.label}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Flow canvas */}
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
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={n => n.data?.color || '#475569'}
            maskColor="rgba(9,9,15,0.7)"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-color)', borderRadius: 8 }}
          />
          <Panel position="top-right" className="nfb__panel">
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
