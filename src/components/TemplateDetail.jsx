import { motion } from 'framer-motion';
import { TEMPLATES, NODE_TYPES } from '../data/templates';

/* ─────────────────────────────────────────────────────────────────
   Flow diagram — nodes connected by arrows
───────────────────────────────────────────────────────────────── */
function FlowDiagram({ nodeIds }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0,
      padding: '28px 24px', background: '#f8fafc', borderRadius: 16,
      border: '1px solid #e2e8f0', minHeight: 120,
    }}>
      {nodeIds.map((id, i) => {
        const n = NODE_TYPES[id] || NODE_TYPES.text;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '12px 16px', background: 'white', borderRadius: 12,
              border: `1.5px solid ${n.color}30`, minWidth: 88,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: n.bg, color: n.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 800,
              }}>
                {n.icon}
              </div>
              <span style={{
                fontSize: '0.68rem', fontWeight: 600, color: '#475569',
                textAlign: 'center', lineHeight: 1.3,
              }}>
                {n.label}
              </span>
            </div>
            {i < nodeIds.length - 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', padding: '0 6px',
                color: '#cbd5e1', fontSize: '1.1rem', fontWeight: 700,
                flexShrink: 0,
              }}>
                →
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Related template mini-card
───────────────────────────────────────────────────────────────── */
function RelatedCard({ tpl, onSelect }) {
  return (
    <button
      onClick={() => onSelect(tpl)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{
        height: 80, background: tpl.thumbnail.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {tpl.nodes.slice(0, 3).map((id, i) => {
          const n = NODE_TYPES[id] || NODE_TYPES.text;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6, background: n.bg, color: n.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.62rem', fontWeight: 800, border: `1px solid ${n.color}25`,
              }}>
                {n.icon}
              </div>
              {i < 2 && <span style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '0 2px' }}>→</span>}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{tpl.name}</div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>{tpl.desc}</div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main TemplateDetail modal
───────────────────────────────────────────────────────────────── */
export default function TemplateDetail({ template, onClose, onUse }) {
  if (!template) return null;

  const related = TEMPLATES.filter(t =>
    template.relatedIds?.includes(t.id) && t.id !== template.id
  ).slice(0, 4);

  const nodeList = template.nodes.map(id => NODE_TYPES[id] || NODE_TYPES.text);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        padding: '40px 16px 60px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'white', borderRadius: 20,
          width: '100%', maxWidth: 860,
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '6px 14px',
              fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
            }}
          >
            ‹ Back
          </button>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
            {template.category}
          </span>
        </div>

        {/* Body: two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 0 }}>
          {/* Left column */}
          <div style={{
            borderRight: '1px solid #f1f5f9',
            padding: '28px 24px',
            display: 'flex', flexDirection: 'column', gap: 24,
          }}>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{template.icon}</div>
              <h2 style={{
                fontSize: '1.3rem', fontWeight: 800, color: '#0f172a',
                lineHeight: 1.25, margin: '0 0 12px',
              }}>
                {template.name}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {template.tagline}
              </p>
            </div>

            <button
              onClick={() => onUse(template)}
              style={{
                background: '#7c3aed', color: 'white', border: 'none',
                borderRadius: 10, padding: '12px 20px',
                fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                transition: 'filter 0.15s, transform 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              Use template →
            </button>

            {/* Created by */}
            <div>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 8,
              }}>
                CREATED BY
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, background: '#7c3aed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.68rem', fontWeight: 900, color: 'white',
                }}>
                  G
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                  Gormaran
                </span>
              </div>
            </div>

            {/* Nodes used */}
            <div>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 10,
              }}>
                NODES USED
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nodeList.map((n, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: n.bg, color: n.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
                    }}>
                      {n.icon}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                      {n.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credits */}
            <div style={{
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#9a3412', fontWeight: 700, marginBottom: 2 }}>
                CREDIT COST
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed' }}>
                ⚡ {template.creditCost} {template.creditCost === 1 ? 'credit' : 'credits'}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ padding: '28px 28px 0' }}>
            {/* Flow diagram */}
            <FlowDiagram nodeIds={template.nodes} />

            {/* Description */}
            <div style={{ marginTop: 28 }}>
              <p style={{
                fontSize: '0.92rem', fontWeight: 600, color: '#1e293b',
                lineHeight: 1.65, margin: 0,
              }}>
                {template.tagline}
              </p>
            </div>

            {/* How it works */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                How it works:
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {template.howItWorks.map((item, i) => (
                  <li key={i} style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.55 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* How to make the most of it */}
            {template.howToMakeTheMost && (
              <div style={{ marginTop: 24, paddingBottom: 28 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                  How to make the most of it:
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {template.howToMakeTheMost.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.55 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related templates */}
        {related.length > 0 && (
          <div style={{ padding: '24px 28px 32px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 16,
            }}>
              TEMPLATES YOU MAY LIKE
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(related.length, 4)}, 1fr)`,
              gap: 12,
            }}>
              {related.map(tpl => (
                <RelatedCard key={tpl.id} tpl={tpl} onSelect={(t) => { onUse(t); onClose(); }} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
