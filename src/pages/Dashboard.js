import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { CATEGORIES } from '../data/categories';
import { pushEvent } from '../utils/analytics';
import AIToolInterface from '../components/AIToolInterface';
import OnboardingModal from '../components/OnboardingModal';
import './Dashboard.css';

/* ─────────────────────────────────────────────────────────────────
   Tab definitions  (Text | Design | Video | Audio | Tool-kit | Agents)
───────────────────────────────────────────────────────────────── */
const DASH_TABS = [
  { id: 'text',    label: 'Text',     icon: '✍️' },
  { id: 'design',  label: 'Design',   icon: '🎨' },
  { id: 'video',   label: 'Video',    icon: '🎬' },
  { id: 'audio',   label: 'Audio',    icon: '🎵', comingSoon: true },
  { id: 'toolkit', label: 'Tool-kit', icon: '🛠️' },
  { id: 'agents',  label: 'Agents',   icon: '🤖' },
];

const DESIGN_IDS  = new Set(['brand-identity', 'image-studio', 'photo-direction', 'logo-generator']);
const VIDEO_IDS   = new Set(['video-script', 'video-production', 'kling-video']);
const TOOLKIT_CATS = new Set(['digital', 'automation']);
const TEXT_CATS   = new Set(['marketing', 'content', 'strategy', 'agency', 'finance', 'startup', 'ecommerce']);

function getToolsForTab(tabId) {
  const all = CATEGORIES.flatMap(cat => cat.tools.map(tool => ({ tool, cat })));
  if (tabId === 'agents')  return all;
  if (tabId === 'audio')   return [];
  if (tabId === 'text')    return all.filter(({ cat, tool }) => TEXT_CATS.has(cat.id) && !VIDEO_IDS.has(tool.id));
  if (tabId === 'design')  return all.filter(({ tool, cat }) => cat.id === 'creative' && DESIGN_IDS.has(tool.id));
  if (tabId === 'video')   return all.filter(({ tool }) => VIDEO_IDS.has(tool.id));
  if (tabId === 'toolkit') return all.filter(({ cat }) => TOOLKIT_CATS.has(cat.id));
  return all;
}

function groupByCategory(toolEntries) {
  const map = new Map();
  for (const entry of toolEntries) {
    const key = entry.cat.id;
    if (!map.has(key)) map.set(key, { cat: entry.cat, tools: [] });
    map.get(key).tools.push(entry.tool);
  }
  return [...map.values()];
}

/* ─────────────────────────────────────────────────────────────────
   AI Model definitions (matches syntx.ai selection)
───────────────────────────────────────────────────────────────── */
const MODELS = [
  { id: 'chatgpt',    name: 'ChatGPT',    by: 'OpenAI',     color: '#10a37f', letter: 'G',
    desc: 'Designed for tasks that require fast, accurate and general-purpose AI. Well suited for a wide variety of everyday queries.',
    caps: ['Fast responses', 'Link analysis', 'Up-to-date information', 'Context awareness'] },
  { id: 'claude',     name: 'Claude',     by: 'Anthropic',  color: '#e54717', letter: 'C',
    desc: 'Excels at nuanced reasoning, long documents and careful writing. Ideal for complex strategy, research and detailed outputs.',
    caps: ['Long context', 'Complex reasoning', 'Careful writing', 'Safety focus'] },
  { id: 'gemini',     name: 'Gemini',     by: 'Google',     color: '#4285f4', letter: 'G',
    desc: 'Multimodal intelligence with real-time data access. Great for queries that blend text, data and current web knowledge.',
    caps: ['Multimodal', 'Real-time data', 'Fast inference', 'Code & analysis'] },
  { id: 'grok',       name: 'Grok',       by: 'xAI',        color: '#e0e0e0', letter: 'X',
    desc: 'Built for real-time web knowledge and X/Twitter data. Best for current events and trend analysis.',
    caps: ['Live web search', 'Current events', 'X/Twitter data', 'Witty reasoning'] },
  { id: 'deepseek',   name: 'Deepseek',   by: 'DeepSeek',   color: '#1677ff', letter: 'D',
    desc: 'Advanced reasoning with exceptional math and code capabilities. Efficient and cost-effective for complex tasks.',
    caps: ['Math & code', 'Deep reasoning', 'Chain-of-thought', 'Efficient'] },
  { id: 'perplexity', name: 'Perplexity', by: 'Perplexity', color: '#20b2aa', letter: 'P',
    desc: 'AI-powered search that provides cited, up-to-date answers. Best for research requiring source attribution.',
    caps: ['Cited answers', 'Web search', 'Up-to-date info', 'Source links'] },
  { id: 'qwen',       name: 'Qwen',       by: 'Alibaba',    color: '#ff6a00', letter: 'Q',
    desc: 'Strong multilingual model with long context support. Excellent for international content and coding tasks.',
    caps: ['Multilingual', 'Long context', 'Code generation', 'Efficient'] },
];

/* ─────────────────────────────────────────────────────────────────
   Left Sidebar
───────────────────────────────────────────────────────────────── */
function Sidebar({ activeTab, groupedTools, selectedTool, onToolSelect, subscription, usageCount, freeLimit, isCategoryLocked, canUseSpecificTool }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const hits = [];
    for (const cat of CATEGORIES) {
      for (const tool of cat.tools) {
        if (tool.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)) {
          hits.push({ tool, cat });
          if (hits.length >= 8) return hits;
        }
      }
    }
    return hits;
  }, [search]);

  const usagePct = subscription === 'free' ? Math.min(100, Math.round((usageCount / freeLimit) * 100)) : 100;
  const showUsage = subscription === 'free';

  const handleToolClick = (tool, catId) => {
    onToolSelect(tool, catId);
    setSearch('');
  };

  return (
    <aside className="dash__sidebar">
      <div className="dash__sidebar-top">
        <button className="dash__new-btn" onClick={() => onToolSelect(null, null)}>
          <span>✦</span>
          {t('dashboard.newSession', { defaultValue: 'New session' })}
        </button>
        <div className="dash__search-wrap">
          <span className="dash__search-icon">🔍</span>
          <input
            className="dash__search"
            type="text"
            placeholder={t('dashboard.searchPlaceholder', { defaultValue: 'Search agents…' })}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="dash__search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {activeTab === 'audio' ? (
        <div className="dash__coming-soon">
          <div className="dash__coming-soon-icon">🎵</div>
          <div className="dash__coming-soon-title">{t('dashboard.audioSoon', { defaultValue: 'Audio — Coming Soon' })}</div>
          <div className="dash__coming-soon-sub">{t('dashboard.audioSoonSub', { defaultValue: 'Music generation, voiceovers and podcast creation are on the way.' })}</div>
        </div>
      ) : search.trim() ? (
        <div className="dash__tool-list">
          <div className="dash__search-hits">
            {searchResults.length > 0 ? searchResults.map(({ tool, cat }) => (
              <button key={tool.id} className="dash__search-hit" onClick={() => handleToolClick(tool, cat.id)}>
                <span className="dash__search-hit-icon">{tool.icon}</span>
                <span className="dash__search-hit-name">{t(`tool.${tool.id}.name`, { defaultValue: tool.name })}</span>
                <span className="dash__search-hit-cat">{cat.icon}</span>
              </button>
            )) : (
              <div className="dash__search-empty">{t('dashboard.noResults', { defaultValue: 'No agents found' })}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="dash__tool-list">
          {groupedTools.map(({ cat, tools }) => (
            <div key={cat.id} className="dash__tool-group">
              <div className="dash__tool-group-label">
                <span>{cat.icon}</span>
                {t(`cat.${cat.id}.name`, { defaultValue: cat.name })}
              </div>
              {tools.map(tool => {
                const locked = isCategoryLocked(cat.id) || !canUseSpecificTool(cat.id, tool.id);
                return (
                  <button
                    key={tool.id}
                    className={`dash__tool-btn${selectedTool?.id === tool.id ? ' dash__tool-btn--active' : ''}`}
                    onClick={() => handleToolClick(tool, cat.id)}
                  >
                    <span className="dash__tool-icon">{tool.icon}</span>
                    <div className="dash__tool-body">
                      <span className="dash__tool-name">{t(`tool.${tool.id}.name`, { defaultValue: tool.name })}</span>
                      <span className="dash__tool-desc">{t(`tool.${tool.id}.desc`, { defaultValue: tool.description })}</span>
                    </div>
                    {locked && <span className="dash__tool-lock">🔒</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {showUsage && (
        <div className="dash__sidebar-footer">
          <div className="dash__usage-row">
            <span>{usageCount}/{freeLimit} {t('dashboard.usedThisMonth', { defaultValue: 'used this month' })}</span>
            <span>{freeLimit - usageCount} {t('dashboard.left', { defaultValue: 'left' })}</span>
          </div>
          <div className="dash__usage-track">
            <div className="dash__usage-fill" style={{ width: `${usagePct}%` }} />
          </div>
          <Link to="/pricing" className="dash__upgrade-link">
            {t('dashboard.upgradeUnlimited', { defaultValue: 'Upgrade for unlimited →' })}
          </Link>
        </div>
      )}
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Empty / model welcome state (like syntx.ai main area)
───────────────────────────────────────────────────────────────── */
function EmptyState({ model, onToolSelect, tabTools }) {
  const { t } = useTranslation();
  const suggestions = tabTools.slice(0, 4);

  return (
    <div className="dash__empty">
      <div
        className="dash__empty-avatar"
        style={{ background: `${model.color}18`, borderColor: `${model.color}40`, color: model.color }}
      >
        {model.letter}
      </div>
      <div className="dash__empty-name">{model.name}</div>
      <p className="dash__empty-desc">{model.desc}</p>
      <div className="dash__empty-caps-title">{t('dashboard.keyCapabilities', { defaultValue: 'Key capabilities' })}</div>
      <div className="dash__empty-caps">
        {model.caps.map(cap => (
          <span key={cap} className="dash__empty-cap">{cap}</span>
        ))}
      </div>
      {suggestions.length > 0 && (
        <p className="dash__empty-hint">
          {t('dashboard.selectAgent', { defaultValue: '← Select an agent from the sidebar to get started' })}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Right Model Panel
───────────────────────────────────────────────────────────────── */
function ModelPanel({ models, selectedId, onSelect, onClose }) {
  const { t } = useTranslation();
  const selected = models.find(m => m.id === selectedId) || models[0];

  return (
    <aside className="dash__model-panel">
      <div className="dash__model-panel-hd">
        <span className="dash__model-panel-title">{t('dashboard.modelSelection', { defaultValue: 'Model selection' })}</span>
        <button className="dash__model-panel-close" onClick={onClose} title="Close">✕</button>
      </div>

      <div className="dash__model-selected-card">
        <div className="dash__model-sel-avatar" style={{ background: `${selected.color}20`, color: selected.color }}>
          {selected.letter}
        </div>
        <div>
          <div className="dash__model-sel-name">{selected.name}</div>
          <div className="dash__model-sel-by">{selected.by}</div>
        </div>
        <span className="dash__model-sel-arrow">▾</span>
      </div>

      <div className="dash__model-list">
        {models.map(model => (
          <button
            key={model.id}
            className={`dash__model-item${selectedId === model.id ? ' dash__model-item--active' : ''}`}
            onClick={() => onSelect(model.id)}
          >
            <div className="dash__model-avatar" style={{ background: `${model.color}18`, color: model.color }}>
              {model.letter}
            </div>
            <div className="dash__model-info">
              <div className="dash__model-name">{model.name}</div>
              <div className="dash__model-by">{model.by}</div>
            </div>
            <div className="dash__model-radio" />
          </button>
        ))}
      </div>

      <div className="dash__model-panel-note">
        {t('dashboard.modelNote', { defaultValue: 'Model selection affects response style. All agents use the best model for each task by default.' })}
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { currentUser, refreshUserProfile, userProfile } = useAuth();
  const { subscription, isCategoryLocked, canUseSpecificTool, usageCount, FREE_MONTHLY_LIMIT } = useSubscription();
  const { brandProfile } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');

  // Tab + tool state
  const [activeTab, setActiveTab]           = useState('text');
  const [selectedTool, setSelectedTool]     = useState(null);
  const [selectedCatId, setSelectedCatId]   = useState(null);
  const [rerunInputs, setRerunInputs]       = useState(null);

  // Model panel
  const [selectedModel, setSelectedModel]   = useState('chatgpt');
  const [modelPanelOpen, setModelPanelOpen] = useState(true);

  // Banners
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const paymentStatus = searchParams.get('payment');
  const showOnboarding = userProfile && !userProfile.onboardingCompleted;
  const brandIncomplete = !brandProfile?.companyName;

  // Tab tools
  const tabTools     = useMemo(() => getToolsForTab(activeTab), [activeTab]);
  const groupedTools = useMemo(() => groupByCategory(tabTools), [tabTools]);
  const activeModel  = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  // Payment success analytics
  useEffect(() => {
    if (paymentStatus === 'success' && currentUser) {
      pushEvent('Suscribe', { value: 0, currency: 'EUR' });
      const timer = setTimeout(() => refreshUserProfile(currentUser.uid), 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle rerun from history / quick wins
  useEffect(() => {
    const raw = sessionStorage.getItem('gormaran_rerun');
    if (!raw) return;
    try {
      const { toolId, inputs } = JSON.parse(raw);
      sessionStorage.removeItem('gormaran_rerun');
      for (const cat of CATEGORIES) {
        const tool = cat.tools.find(t => t.id === toolId);
        if (tool) {
          setSelectedTool(tool);
          setSelectedCatId(cat.id);
          setRerunInputs(inputs);
          // switch to correct tab
          if (TEXT_CATS.has(cat.id)) setActiveTab('text');
          else if (cat.id === 'creative') {
            if (VIDEO_IDS.has(tool.id)) setActiveTab('video');
            else setActiveTab('design');
          } else if (TOOLKIT_CATS.has(cat.id)) setActiveTab('toolkit');
          return;
        }
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle direct tool selection (from magic bar / landing chips)
  useEffect(() => {
    const toolId = sessionStorage.getItem('gormaran_select_tool');
    if (!toolId) return;
    sessionStorage.removeItem('gormaran_select_tool');
    for (const cat of CATEGORIES) {
      const tool = cat.tools.find(t => t.id === toolId);
      if (tool) {
        setSelectedTool(tool);
        setSelectedCatId(cat.id);
        return;
      }
    }
  }, []);

  // When tab changes, clear selected tool
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSelectedTool(null);
    setSelectedCatId(null);
  }, []);

  const handleToolSelect = useCallback((tool, catId) => {
    setSelectedTool(tool);
    setSelectedCatId(catId);
    setRerunInputs(null);
  }, []);

  const planChipClass = {
    free: 'dash__plan-chip--free',
    grow: 'dash__plan-chip--grow',
    scale: 'dash__plan-chip--scale',
    evolution: 'dash__plan-chip--evolution',
  }[subscription] || 'dash__plan-chip--free';

  const planLabel = subscription === 'free' ? 'Free'
    : subscription === 'grow' ? '⭐ Grow'
    : subscription === 'scale' ? '💎 Scale'
    : subscription === 'evolution' ? '🚀 Evolution'
    : subscription;

  return (
    <div className="dash">
      {showOnboarding && (
        <OnboardingModal onComplete={() => refreshUserProfile(currentUser.uid)} />
      )}

      {/* ── Banners ────────────────────────────────────────── */}
      {paymentStatus === 'success' && !bannerDismissed && (
        <div className="dash__banner dash__banner--success">
          <span>🎉 {t('dashboard.paymentSuccess', { defaultValue: `Welcome to ${planLabel}!` })}</span>
          <button className="dash__banner-close" onClick={() => setBannerDismissed(true)}>✕</button>
        </div>
      )}

      {!userProfile?.onboardingCompleted && brandIncomplete && !bannerDismissed && (
        <div className="dash__banner dash__banner--info">
          <span>
            🏢 <strong>{isEs ? 'Configura tu Perfil de Marca' : 'Set up your Brand Profile'}</strong>
            {' — '}{isEs ? 'rellénalo una vez, todas las herramientas se autocompletan.' : 'fill it once and every agent auto-fills for you.'}
          </span>
          <Link to="/settings" className="btn btn-primary btn-sm">
            {isEs ? 'Configurar →' : 'Set up →'}
          </Link>
        </div>
      )}

      {usageCount >= FREE_MONTHLY_LIMIT && subscription === 'free' && (
        <div className="dash__banner dash__banner--warning">
          <span>🚫 <strong>{isEs ? 'Límite mensual alcanzado' : 'Monthly limit reached'}</strong> — {isEs ? 'actualiza para seguir.' : 'upgrade to keep going.'}</span>
          <Link to="/pricing" className="btn btn-primary btn-sm">{isEs ? 'Ver planes' : 'Upgrade →'}</Link>
        </div>
      )}

      {/* ── Tab bar ────────────────────────────────────────── */}
      <div className="dash__tabbar">
        <div className="dash__tabs">
          {DASH_TABS.map(tab => (
            <button
              key={tab.id}
              className={`dash__tab${activeTab === tab.id ? ' dash__tab--active' : ''}${tab.comingSoon ? ' dash__tab--soon' : ''}`}
              onClick={() => !tab.comingSoon && handleTabChange(tab.id)}
              title={tab.comingSoon ? 'Coming soon' : tab.label}
            >
              {tab.label}
              {tab.comingSoon && <span className="dash__soon-badge">Soon</span>}
            </button>
          ))}
        </div>

        <div className="dash__tabbar-right">
          <button
            className={`dash__model-toggle${modelPanelOpen ? ' dash__model-toggle--active' : ''}`}
            onClick={() => setModelPanelOpen(v => !v)}
          >
            <span className="dash__model-dot" style={{ background: activeModel.color }} />
            {activeModel.name}
            <span>▾</span>
          </button>
          <span className={`dash__plan-chip ${planChipClass}`}>{planLabel}</span>
        </div>
      </div>

      {/* ── Workspace ──────────────────────────────────────── */}
      <div className="dash__workspace" style={{ gridTemplateColumns: modelPanelOpen ? '256px 1fr 276px' : '256px 1fr' }}>

        {/* Left sidebar */}
        <Sidebar
          activeTab={activeTab}
          groupedTools={groupedTools}
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          subscription={subscription}
          usageCount={usageCount}
          freeLimit={FREE_MONTHLY_LIMIT}
          isCategoryLocked={isCategoryLocked}
          canUseSpecificTool={canUseSpecificTool}
        />

        {/* Main area */}
        <main className="dash__main">
          <AnimatePresence mode="wait">
            {selectedTool && selectedCatId ? (
              <motion.div
                key={selectedTool.id}
                className="dash__tool-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AIToolInterface
                  tool={selectedTool}
                  categoryId={selectedCatId}
                  rerunInputs={rerunInputs}
                  onRerunConsumed={() => setRerunInputs(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={`empty-${activeTab}-${selectedModel}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <EmptyState
                  model={activeModel}
                  onToolSelect={handleToolSelect}
                  tabTools={tabTools}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right model panel */}
        {modelPanelOpen && (
          <ModelPanel
            models={MODELS}
            selectedId={selectedModel}
            onSelect={setSelectedModel}
            onClose={() => setModelPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
