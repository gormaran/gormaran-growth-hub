import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import './HistoryPage.css';

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filterTool, setFilterTool] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    loadHistory();
  }, [currentUser]);

  async function loadHistory() {
    try {
      const q = query(
        collection(db, 'users', currentUser.uid, 'history'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEntry(id) {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'history', id));
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  function formatDate(createdAt) {
    if (!createdAt) return '';
    const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return (
      d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }

  function previewOutput(output) {
    return (output || '').replace(/[#*_`>]/g, '').slice(0, 160);
  }

  const toolNames = [...new Set(history.map(h => h.toolName).filter(Boolean))].sort();
  const filtered = filterTool ? history.filter(h => h.toolName === filterTool) : history;

  return (
    <div className="history-page">
      <div className="container">
        {/* Header */}
        <div className="history-page__header">
          <div>
            <h1 className="history-page__title">
              🕐 {t('history.title', { defaultValue: 'Generation History' })}
            </h1>
            <p className="history-page__subtitle">
              {history.length} {t('history.totalGenerations', { defaultValue: 'generations saved' })}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ← {t('history.backToDashboard', { defaultValue: 'Dashboard' })}
          </button>
        </div>

        {/* Tool filter */}
        {toolNames.length > 1 && (
          <div className="history-page__filters">
            <button
              className={`history-filter-btn${!filterTool ? ' active' : ''}`}
              onClick={() => setFilterTool('')}
            >
              {t('history.all', { defaultValue: 'All' })} ({history.length})
            </button>
            {toolNames.map(name => (
              <button
                key={name}
                className={`history-filter-btn${filterTool === name ? ' active' : ''}`}
                onClick={() => setFilterTool(name)}
              >
                {name} ({history.filter(h => h.toolName === name).length})
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="history-page__loading">
            <div className="history-page__spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="history-page__empty">
            <div className="history-page__empty-icon">📭</div>
            <p>{t('history.empty', { defaultValue: 'No generations yet. Use an AI tool to get started.' })}</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              {t('history.goToDashboard', { defaultValue: 'Go to Dashboard' })}
            </button>
          </div>
        ) : (
          <div className="history-page__list">
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.id}
                className={`history-entry${expanded === entry.id ? ' history-entry--expanded' : ''}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i < 10 ? i * 0.03 : 0 }}
              >
                <div
                  className="history-entry__header"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <div className="history-entry__meta">
                    <span className="history-entry__tool">{entry.toolName || entry.toolId}</span>
                    <span className="history-entry__time">{formatDate(entry.createdAt)}</span>
                  </div>
                  <p className="history-entry__preview">
                    {previewOutput(entry.output)}{entry.output?.length > 160 ? '…' : ''}
                  </p>
                  <div className="history-entry__footer">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={e => { e.stopPropagation(); navigate(`/category/${entry.categoryId}`); }}
                    >
                      ↗ {t('history.openTool', { defaultValue: 'Open tool' })}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm history-entry__delete-btn"
                      onClick={e => { e.stopPropagation(); deleteEntry(entry.id); }}
                    >
                      🗑
                    </button>
                    <span className={`history-entry__arrow${expanded === entry.id ? ' open' : ''}`}>▾</span>
                  </div>
                </div>

                {expanded === entry.id && (
                  <div className="history-entry__body markdown-output">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.output || ''}</ReactMarkdown>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
