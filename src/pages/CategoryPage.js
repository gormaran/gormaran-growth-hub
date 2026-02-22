import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryById } from '../data/categories';
import { useSubscription } from '../context/SubscriptionContext';
import AIToolInterface from '../components/AIToolInterface';
import './CategoryPage.css';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { isCategoryLocked } = useSubscription();

  const category = getCategoryById(categoryId);
  const [selectedTool, setSelectedTool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!category) {
      navigate('/dashboard');
      return;
    }
    // Auto-select first tool
    if (category.tools.length > 0) {
      setSelectedTool(category.tools[0]);
    }
  }, [categoryId, category, navigate]);

  if (!category) return null;

  const locked = isCategoryLocked(categoryId);

  return (
    <div className="page">
      <div className="category">
        {/* Top breadcrumb bar */}
        <div className="category__topbar">
          <div className="container">
            <div className="category__breadcrumb">
              <Link to="/dashboard" className="category__breadcrumb-link">
                ← Dashboard
              </Link>
              <span className="category__breadcrumb-sep">/</span>
              <span className="category__breadcrumb-icon">{category.icon}</span>
              <span className="category__breadcrumb-name">{category.name}</span>
            </div>
          </div>
        </div>

        <div className="category__layout">
          {/* Sidebar */}
          <motion.aside
            className={`category__sidebar ${sidebarOpen ? '' : 'category__sidebar--closed'}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="category__sidebar-header">
              <div className="category__sidebar-cat">
                <div
                  className="category__sidebar-icon"
                  style={{ background: `${category.color}20`, borderColor: `${category.color}40` }}
                >
                  {category.icon}
                </div>
                <div>
                  <h3 className="category__sidebar-name">{category.name}</h3>
                  <span className="category__sidebar-count">{category.tools.length} tools</span>
                </div>
              </div>
            </div>

            {locked && (
              <div className="category__sidebar-upgrade">
                <span>🔒</span>
                <div>
                  <strong>Pro Required</strong>
                  <p>Upgrade to unlock all tools</p>
                </div>
                <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade</Link>
              </div>
            )}

            <nav className="category__sidebar-nav">
              {category.tools.map((tool) => (
                <button
                  key={tool.id}
                  className={`category__tool-btn ${selectedTool?.id === tool.id ? 'active' : ''}`}
                  onClick={() => setSelectedTool(tool)}
                >
                  <span className="category__tool-btn-icon">{tool.icon}</span>
                  <div className="category__tool-btn-text">
                    <span className="category__tool-btn-name">{tool.name}</span>
                    <span className="category__tool-btn-desc">{tool.description}</span>
                  </div>
                  {selectedTool?.id === tool.id && (
                    <motion.div
                      className="category__tool-active-indicator"
                      layoutId="activeToolIndicator"
                    />
                  )}
                </button>
              ))}
            </nav>
          </motion.aside>

          {/* Main content */}
          <main className="category__main">
            <button
              className="category__sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>

            <AnimatePresence mode="wait">
              {selectedTool && (
                <motion.div
                  key={selectedTool.id}
                  className="category__content"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AIToolInterface tool={selectedTool} categoryId={categoryId} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
