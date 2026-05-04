import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_KEY = 'gormaran_tour_v1';

/* ─────────────────────────────────────────────────────────────────
   SVG Characters — flat-style, distinct per step
───────────────────────────────────────────────────────────────── */
function CharMarketer() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none">
      <ellipse cx="45" cy="30" rx="20" ry="20" fill="#FBBF24" />
      <ellipse cx="45" cy="14" rx="16" ry="9" fill="#7c3aed" />
      <circle cx="38" cy="27" r="2.5" fill="#1e293b" />
      <circle cx="52" cy="27" r="2.5" fill="#1e293b" />
      <circle cx="39" cy="26.5" r="1" fill="white" />
      <circle cx="53" cy="26.5" r="1" fill="white" />
      <path d="M40 36 Q45 41 50 36" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="20" y="52" width="50" height="38" rx="10" fill="#f97316" />
      <rect x="6" y="58" width="18" height="9" rx="4.5" fill="#FBBF24" />
      <rect x="66" y="58" width="18" height="9" rx="4.5" fill="#FBBF24" />
      <rect x="30" y="90" width="12" height="20" rx="4" fill="#ea580c" />
      <rect x="48" y="90" width="12" height="20" rx="4" fill="#ea580c" />
      <rect x="34" y="66" width="22" height="14" rx="3" fill="white" opacity="0.3" />
    </svg>
  );
}

function CharDesigner() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none">
      <ellipse cx="45" cy="30" rx="20" ry="20" fill="#f9a8d4" />
      <ellipse cx="45" cy="13" rx="19" ry="10" fill="#be185d" />
      <ellipse cx="26" cy="22" rx="5" ry="9" fill="#be185d" />
      <ellipse cx="64" cy="22" rx="5" ry="9" fill="#be185d" />
      <circle cx="38" cy="28" r="2.5" fill="#1e293b" />
      <circle cx="52" cy="28" r="2.5" fill="#1e293b" />
      <circle cx="39" cy="27.5" r="1" fill="white" />
      <circle cx="53" cy="27.5" r="1" fill="white" />
      <path d="M40 37 Q45 43 50 37" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="18" y="52" width="54" height="38" rx="10" fill="#ec4899" />
      <rect x="4" y="58" width="18" height="9" rx="4.5" fill="#f9a8d4" />
      <rect x="68" y="58" width="18" height="9" rx="4.5" fill="#f9a8d4" />
      <rect x="28" y="90" width="12" height="20" rx="4" fill="#be185d" />
      <rect x="50" y="90" width="12" height="20" rx="4" fill="#be185d" />
      <path d="M58 62 L66 54 L70 58 L62 66 Z" fill="white" opacity="0.5" />
      <circle cx="60" cy="70" r="3" fill="white" opacity="0.5" />
    </svg>
  );
}

function CharEngineer() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none">
      <ellipse cx="45" cy="30" rx="20" ry="20" fill="#a78bfa" />
      <ellipse cx="45" cy="13" rx="18" ry="9" fill="#1e293b" />
      <rect x="26" y="18" width="38" height="6" rx="3" fill="#1e293b" />
      <circle cx="38" cy="28" r="2.5" fill="#1e293b" />
      <circle cx="52" cy="28" r="2.5" fill="#1e293b" />
      <rect x="35" y="25" width="8" height="5" rx="1" fill="#7dd3fc" opacity="0.7" />
      <rect x="47" y="25" width="8" height="5" rx="1" fill="#7dd3fc" opacity="0.7" />
      <path d="M40 37 Q45 42 50 37" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="18" y="52" width="54" height="38" rx="10" fill="#7c3aed" />
      <rect x="4" y="56" width="18" height="9" rx="4.5" fill="#a78bfa" />
      <rect x="68" y="56" width="18" height="9" rx="4.5" fill="#a78bfa" />
      <rect x="28" y="90" width="12" height="20" rx="4" fill="#6d28d9" />
      <rect x="50" y="90" width="12" height="20" rx="4" fill="#6d28d9" />
      <text x="30" y="76" fontSize="11" fill="white" fontFamily="monospace" opacity="0.7">&lt;/&gt;</text>
    </svg>
  );
}

function CharMusician() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none">
      <ellipse cx="45" cy="30" rx="20" ry="20" fill="#6ee7b7" />
      <ellipse cx="45" cy="13" rx="17" ry="8" fill="#065f46" />
      <path d="M27 22 Q27 13 35 13" stroke="#065f46" strokeWidth="4" fill="none" />
      <path d="M63 22 Q63 13 55 13" stroke="#065f46" strokeWidth="4" fill="none" />
      <circle cx="38" cy="29" r="2.5" fill="#1e293b" />
      <circle cx="52" cy="29" r="2.5" fill="#1e293b" />
      <path d="M40 38 Q45 44 50 38" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="18" y="52" width="54" height="38" rx="10" fill="#059669" />
      <rect x="4" y="58" width="18" height="9" rx="4.5" fill="#6ee7b7" />
      <rect x="68" y="58" width="18" height="9" rx="4.5" fill="#6ee7b7" />
      <rect x="28" y="90" width="12" height="20" rx="4" fill="#047857" />
      <rect x="50" y="90" width="12" height="20" rx="4" fill="#047857" />
      <path d="M30 70 Q36 65 42 70 Q48 75 54 70 Q60 65 66 70" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  );
}

function CharStrategist() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none">
      <ellipse cx="45" cy="30" rx="20" ry="20" fill="#FCD34D" />
      <ellipse cx="45" cy="14" rx="16" ry="8" fill="#92400e" />
      <rect x="27" y="20" width="36" height="6" rx="3" fill="#92400e" />
      <circle cx="38" cy="29" r="2.5" fill="#1e293b" />
      <circle cx="52" cy="29" r="2.5" fill="#1e293b" />
      <circle cx="39" cy="28.5" r="1" fill="white" />
      <circle cx="53" cy="28.5" r="1" fill="white" />
      <path d="M40 38 Q45 44 50 38" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="18" y="52" width="54" height="38" rx="10" fill="#d97706" />
      <rect x="4" y="58" width="18" height="9" rx="4.5" fill="#FCD34D" />
      <rect x="68" y="58" width="18" height="9" rx="4.5" fill="#FCD34D" />
      <rect x="28" y="90" width="12" height="20" rx="4" fill="#b45309" />
      <rect x="50" y="90" width="12" height="20" rx="4" fill="#b45309" />
      <path d="M30 75 L37 65 L44 70 L51 62 L58 68 L65 60" stroke="white" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}

function CharAgent() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none">
      <rect x="25" y="12" width="40" height="36" rx="12" fill="#38bdf8" />
      <rect x="33" y="20" width="10" height="8" rx="2" fill="#0369a1" />
      <rect x="47" y="20" width="10" height="8" rx="2" fill="#0369a1" />
      <rect x="33" y="22" width="10" height="8" rx="2" fill="#7dd3fc" opacity="0.5" />
      <rect x="47" y="22" width="10" height="8" rx="2" fill="#7dd3fc" opacity="0.5" />
      <rect x="35" y="36" width="20" height="5" rx="2.5" fill="#0369a1" />
      <path d="M45 48 L45 54" stroke="#38bdf8" strokeWidth="3" />
      <rect x="18" y="54" width="54" height="36" rx="10" fill="#0284c7" />
      <rect x="4" y="60" width="18" height="9" rx="4.5" fill="#38bdf8" />
      <rect x="68" y="60" width="18" height="9" rx="4.5" fill="#38bdf8" />
      <rect x="28" y="90" width="12" height="20" rx="4" fill="#0369a1" />
      <rect x="50" y="90" width="12" height="20" rx="4" fill="#0369a1" />
      <circle cx="36" cy="68" r="4" fill="#7dd3fc" opacity="0.6" />
      <circle cx="45" cy="63" r="4" fill="#7dd3fc" opacity="0.6" />
      <circle cx="54" cy="68" r="4" fill="#7dd3fc" opacity="0.6" />
    </svg>
  );
}

function CharCreator() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none">
      <ellipse cx="45" cy="30" rx="20" ry="20" fill="#fb923c" />
      <ellipse cx="45" cy="13" rx="18" ry="8" fill="#7c2d12" />
      <circle cx="38" cy="28" r="2.5" fill="#1e293b" />
      <circle cx="52" cy="28" r="2.5" fill="#1e293b" />
      <circle cx="39" cy="27.5" r="1" fill="white" />
      <circle cx="53" cy="27.5" r="1" fill="white" />
      <path d="M40 38 Q45 44 50 38" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="45" cy="40" rx="4" ry="3" fill="#fda4af" />
      <rect x="18" y="52" width="54" height="38" rx="10" fill="#ea580c" />
      <rect x="4" y="56" width="18" height="9" rx="4.5" fill="#fb923c" />
      <rect x="68" y="56" width="18" height="9" rx="4.5" fill="#fb923c" />
      <rect x="28" y="90" width="12" height="20" rx="4" fill="#c2410c" />
      <rect x="50" y="90" width="12" height="20" rx="4" fill="#c2410c" />
      <path d="M31 72 L38 65 L38 72 Z" fill="white" opacity="0.4" />
      <rect x="40" y="64" width="20" height="2" rx="1" fill="white" opacity="0.4" />
      <rect x="40" y="68" width="16" height="2" rx="1" fill="white" opacity="0.4" />
      <rect x="40" y="72" width="18" height="2" rx="1" fill="white" opacity="0.4" />
    </svg>
  );
}

function CharCelebrate() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none">
      <ellipse cx="45" cy="30" rx="20" ry="20" fill="#c084fc" />
      <ellipse cx="45" cy="13" rx="17" ry="8" fill="#6b21a8" />
      <circle cx="38" cy="27" r="2.5" fill="#1e293b" />
      <circle cx="52" cy="27" r="2.5" fill="#1e293b" />
      <circle cx="39" cy="26.5" r="1" fill="white" />
      <circle cx="53" cy="26.5" r="1" fill="white" />
      <path d="M39 38 Q45 45 51 38" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="18" y="52" width="54" height="38" rx="10" fill="#9333ea" />
      <path d="M4 64 L8 58 L14 66 L8 68 Z" fill="#c084fc" />
      <path d="M86 64 L82 58 L76 66 L82 68 Z" fill="#c084fc" />
      <rect x="28" y="90" width="12" height="20" rx="4" fill="#7e22ce" />
      <rect x="50" y="90" width="12" height="20" rx="4" fill="#7e22ce" />
      <circle cx="35" cy="67" r="4" fill="#f97316" opacity="0.8" />
      <text x="30" y="71" fontSize="10" fill="white">⚡</text>
      <text x="44" y="75" fontSize="14" fill="white" fontFamily="system-ui">50</text>
      <circle cx="14" cy="46" r="3" fill="#f97316" opacity="0.7" />
      <circle cx="76" cy="42" r="2" fill="#fbbf24" opacity="0.7" />
      <circle cx="20" cy="54" r="2" fill="#34d399" opacity="0.7" />
      <circle cx="70" cy="50" r="3" fill="#f87171" opacity="0.7" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Animated Preview Mockups (CSS animation via inline style tags)
───────────────────────────────────────────────────────────────── */
function PreviewAllModels() {
  const models = [
    { letter: 'G', color: '#10a37f', name: 'ChatGPT' },
    { letter: 'C', color: '#e54717', name: 'Claude' },
    { letter: 'G', color: '#4285f4', name: 'Gemini' },
    { letter: 'X', color: '#e0e0e0', name: 'Grok' },
    { letter: 'D', color: '#1677ff', name: 'Deepseek' },
    { letter: 'P', color: '#20b2aa', name: 'Perplexity' },
    { letter: 'Q', color: '#ff6a00', name: 'Qwen' },
  ];
  return (
    <div className="pt-preview pt-preview--models">
      <style>{`
        @keyframes ptModelPop {
          from { opacity: 0; transform: scale(0.5) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .pt-model-chip { animation: ptModelPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>
      <div className="pt-preview-label">7 AI models · One platform</div>
      <div className="pt-models-grid">
        {models.map((m, i) => (
          <div key={m.name} className="pt-model-chip" style={{ animationDelay: `${i * 0.09}s` }}>
            <div className="pt-model-av" style={{ background: m.color + '22', color: m.color }}>
              {m.letter}
            </div>
            <span className="pt-model-label">{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewChat() {
  const bubbles = [
    { role: 'user',  text: 'Write a go-to-market strategy for my SaaS', delay: '0.1s' },
    { role: 'ai',    text: 'Here\'s a 90-day GTM plan with 5 key phases...', delay: '0.6s' },
    { role: 'user',  text: 'Now add budget estimates', delay: '1.2s' },
    { role: 'ai',    text: '✅ Budget breakdown by channel...', delay: '1.7s' },
  ];
  return (
    <div className="pt-preview pt-preview--chat">
      <style>{`
        @keyframes ptBubbleIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pt-bubble { animation: ptBubbleIn 0.35s ease both; }
        @keyframes ptCursor { 0%,100% { opacity:1 } 50% { opacity:0 } }
        .pt-cursor { animation: ptCursor 0.9s infinite; display:inline-block; }
      `}</style>
      <div className="pt-chat-msgs">
        {bubbles.map((b, i) => (
          <div key={i} className={`pt-bubble pt-bubble--${b.role}`} style={{ animationDelay: b.delay }}>
            {b.text}{i === bubbles.length - 1 && <span className="pt-cursor">|</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewDesign() {
  return (
    <div className="pt-preview pt-preview--design">
      <style>{`
        @keyframes ptImgFade { from { opacity:0; filter:blur(12px); } to { opacity:1; filter:blur(0); } }
        @keyframes ptProgress { from { width:0 } to { width:100% } }
        .pt-design-img { animation: ptImgFade 1.2s ease 0.3s both; }
        .pt-progress-fill { animation: ptProgress 1s ease 0.1s both; }
      `}</style>
      <div className="pt-design-prompt">"Minimalist product shot, studio lighting, white bg"</div>
      <div className="pt-design-bar">
        <div className="pt-progress-fill" />
      </div>
      <div className="pt-design-img">
        <div className="pt-design-mock">
          <div className="pt-design-mock-light" />
          <div className="pt-design-mock-product" />
          <div className="pt-design-mock-shadow" />
        </div>
      </div>
    </div>
  );
}

function PreviewVideo() {
  return (
    <div className="pt-preview pt-preview--video">
      <style>{`
        @keyframes ptVideoScan { from { transform: translateX(-100%); } to { transform: translateX(400%); } }
        @keyframes ptThumbPop { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        .pt-video-scan { animation: ptVideoScan 2s linear infinite; }
        .pt-thumb { animation: ptThumbPop 0.4s ease both; }
      `}</style>
      <div className="pt-video-screen">
        <div className="pt-video-play">▶</div>
        <div className="pt-video-scan" />
      </div>
      <div className="pt-video-timeline">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="pt-thumb" style={{ animationDelay: `${i * 0.1}s`, height: `${24 + Math.sin(i) * 10}px` }} />
        ))}
      </div>
      <div className="pt-video-models">
        {['KLING', 'Sora', 'Veo'].map((m, i) => (
          <span key={m} className="pt-video-badge" style={{ animationDelay: `${0.3 + i * 0.12}s` }}>{m}</span>
        ))}
      </div>
    </div>
  );
}

function PreviewAudio() {
  return (
    <div className="pt-preview pt-preview--audio">
      <style>{`
        @keyframes ptWave {
          0%,100% { transform: scaleY(0.3); }
          50%      { transform: scaleY(1); }
        }
        .pt-bar { animation: ptWave ease-in-out infinite; }
      `}</style>
      <div className="pt-audio-label">🎵 Generating track…</div>
      <div className="pt-waveform">
        {Array.from({ length: 28 }, (_, i) => (
          <div
            key={i}
            className="pt-bar"
            style={{
              animationDuration: `${0.5 + Math.random() * 0.6}s`,
              animationDelay: `${i * 0.04}s`,
              height: `${12 + Math.abs(Math.sin(i * 0.7)) * 28}px`,
            }}
          />
        ))}
      </div>
      <div className="pt-audio-types">
        {['Voice', 'Music', 'Speech'].map(t => (
          <span key={t} className="pt-audio-tag">{t}</span>
        ))}
      </div>
    </div>
  );
}

function PreviewAgents() {
  const agents = ['📊 Analytics Agent', '✍️ Content Agent', '🎯 Ads Agent'];
  return (
    <div className="pt-preview pt-preview--agents">
      <style>{`
        @keyframes ptAgentSlide { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
        .pt-agent-row { animation: ptAgentSlide 0.4s ease both; }
        @keyframes ptPulse { 0%,100% { box-shadow:0 0 0 0 rgba(249,115,22,0.4); } 50% { box-shadow:0 0 0 6px rgba(249,115,22,0); } }
        .pt-agent-dot { animation: ptPulse 1.5s ease infinite; }
      `}</style>
      {agents.map((a, i) => (
        <div key={a} className="pt-agent-row" style={{ animationDelay: `${i * 0.18}s` }}>
          <div className="pt-agent-dot" />
          <span className="pt-agent-name">{a}</span>
          <span className="pt-agent-status">Running</span>
        </div>
      ))}
      <div className="pt-agent-row" style={{ animationDelay: '0.6s', opacity: 0.5 }}>
        <span style={{ fontSize: '0.7rem', color: '#f97316', marginLeft: '1rem' }}>+ Create new agent</span>
      </div>
    </div>
  );
}

function PreviewTemplates() {
  const tpls = [
    { icon: '📧', name: 'Cold Email', cat: 'Marketing' },
    { icon: '🎯', name: 'Ad Copy', cat: 'Marketing' },
    { icon: '🏠', name: 'Landing Page', cat: 'Content' },
    { icon: '🚀', name: 'GTM Strategy', cat: 'Strategy' },
    { icon: '🖼️', name: 'Hero Image', cat: 'Design' },
    { icon: '🔍', name: 'SEO Outline', cat: 'Content' },
  ];
  return (
    <div className="pt-preview pt-preview--templates">
      <style>{`
        @keyframes ptCardPop { from { opacity:0; transform:scale(0.85) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .pt-tpl-mini { animation: ptCardPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>
      <div className="pt-tpl-grid">
        {tpls.map((t, i) => (
          <div key={t.name} className="pt-tpl-mini" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="pt-tpl-mini-icon">{t.icon}</div>
            <div className="pt-tpl-mini-name">{t.name}</div>
            <div className="pt-tpl-mini-cat">{t.cat}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewCredits() {
  return (
    <div className="pt-preview pt-preview--credits">
      <style>{`
        @keyframes ptCountUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes ptCreditFill { from { width:0; } to { width:65%; } }
        .pt-credits-num { animation: ptCountUp 0.5s ease 0.2s both; }
        .pt-credit-bar-fill { animation: ptCreditFill 1.2s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
      `}</style>
      <div className="pt-credits-display">
        <div className="pt-credits-icon">⚡</div>
        <div className="pt-credits-num">50</div>
        <div className="pt-credits-label">free credits / month</div>
      </div>
      <div className="pt-credit-bar">
        <div className="pt-credit-bar-fill" />
      </div>
      <div className="pt-credit-costs">
        {[['Text', '1 cr'], ['Image', '4 cr'], ['Video', '10 cr'], ['Audio', '3 cr']].map(([t, c]) => (
          <div key={t} className="pt-cost-item">
            <span className="pt-cost-type">{t}</span>
            <span className="pt-cost-val">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Steps config
───────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    bg: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    accent: '#f97316',
    character: <CharMarketer />,
    preview: <PreviewAllModels />,
    title: 'One subscription.\nAll-In-One AI.',
    desc: 'ChatGPT, Claude, Gemini, Grok, Deepseek and more — unified in one platform. One price. All the power.',
  },
  {
    bg: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
    accent: '#f97316',
    character: <CharStrategist />,
    preview: <PreviewChat />,
    title: 'Chat with any AI model.',
    desc: 'Switch between 7 leading AI models in one chat. Pick the best tool for each task without jumping between apps.',
  },
  {
    bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
    accent: '#ec4899',
    character: <CharDesigner />,
    preview: <PreviewDesign />,
    title: 'Generate stunning visuals.',
    desc: 'Type a prompt, get a professional image in seconds. Product shots, social graphics, banners — no design skills needed.',
  },
  {
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    accent: '#059669',
    character: <CharMusician />,
    preview: <PreviewAudio />,
    title: 'Audio, voice & music AI.',
    desc: 'Generate voiceovers, background music, or speech in any style. Perfect for ads, podcasts, and social content.',
  },
  {
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffe4cc 100%)',
    accent: '#ea580c',
    character: <CharCreator />,
    preview: <PreviewVideo />,
    title: 'AI video generation.',
    desc: 'Create videos with KLING, Sora, Veo and more. From product demos to social ads — describe it, generate it.',
  },
  {
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    accent: '#0284c7',
    character: <CharAgent />,
    preview: <PreviewAgents />,
    title: 'Build your own AI agents.',
    desc: 'Create custom agents with specialized instructions. Your marketing expert, your SEO assistant — running 24/7.',
  },
  {
    bg: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
    accent: '#f97316',
    character: <CharCreator />,
    preview: <PreviewTemplates />,
    title: '13+ proven templates.',
    desc: 'Cold emails, landing pages, ad copy, SEO outlines — click a template and start immediately. No blank page.',
  },
  {
    bg: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
    accent: '#9333ea',
    character: <CharCelebrate />,
    preview: <PreviewCredits />,
    title: '50 free credits every month.',
    desc: 'Text costs 1 credit. Images 4. Videos 10. Your free plan resets monthly. Upgrade anytime for unlimited.',
  },
];

/* ─────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────── */
export default function ProductTour({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    localStorage.setItem(TOUR_KEY, '1');
    onClose?.();
  }

  return (
    <div className="pt-overlay" onClick={e => e.target === e.currentTarget && dismiss()}>
      <style>{`
        .pt-overlay {
          position: fixed; inset: 0; z-index: 2000;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .pt-modal {
          background: #ffffff;
          border-radius: 24px;
          width: 100%; max-width: 500px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.22);
          overflow: hidden;
          position: relative;
        }
        .pt-top {
          padding: 32px 28px 24px;
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 16px; min-height: 200px;
          transition: background 0.4s ease;
        }
        .pt-character { flex-shrink: 0; }
        .pt-preview-wrap {
          flex: 1; min-width: 0; border-radius: 14px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.9);
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .pt-bottom { padding: 24px 28px 28px; background: #fff; }
        .pt-title {
          font-size: 1.35rem; font-weight: 800; color: #0f172a;
          line-height: 1.25; margin: 0 0 10px;
          white-space: pre-line;
        }
        .pt-desc {
          font-size: 0.88rem; color: #64748b; line-height: 1.6;
          margin: 0 0 24px;
        }
        .pt-footer {
          display: flex; align-items: center; justify-content: space-between;
        }
        .pt-counter {
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
          color: #94a3b8; text-transform: uppercase;
        }
        .pt-actions { display: flex; align-items: center; gap: 10px; }
        .pt-skip {
          font-size: 0.8rem; color: #94a3b8; background: none;
          border: none; cursor: pointer; padding: 8px 4px;
          transition: color 0.15s;
        }
        .pt-skip:hover { color: #64748b; }
        .pt-continue {
          padding: 10px 22px; border-radius: 100px;
          font-size: 0.88rem; font-weight: 700; color: #fff;
          border: none; cursor: pointer;
          transition: filter 0.15s, transform 0.12s;
          white-space: nowrap;
        }
        .pt-continue:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .pt-continue:active { transform: translateY(0); }
        .pt-dots {
          display: flex; gap: 5px; margin-bottom: 20px;
        }
        .pt-step-dot {
          height: 3px; border-radius: 2px;
          transition: all 0.3s ease;
        }

        /* ── Preview: Models ── */
        .pt-preview { padding: 12px; }
        .pt-preview--models .pt-preview-label {
          font-size: 0.65rem; font-weight: 700; color: #f97316;
          text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;
        }
        .pt-models-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; }
        .pt-model-chip {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 6px 4px; border-radius: 8px; background: rgba(255,255,255,0.8);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .pt-model-av {
          width: 26px; height: 26px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 800;
        }
        .pt-model-label { font-size: 0.58rem; color: #475569; font-weight: 600; }

        /* ── Preview: Chat ── */
        .pt-preview--chat .pt-chat-msgs { display: flex; flex-direction: column; gap: 7px; }
        .pt-bubble {
          padding: 7px 10px; border-radius: 10px;
          font-size: 0.7rem; line-height: 1.4; max-width: 90%;
        }
        .pt-bubble--user {
          background: #f97316; color: white; align-self: flex-end; border-radius: 10px 10px 2px 10px;
        }
        .pt-bubble--ai {
          background: rgba(0,0,0,0.05); color: #1e293b; align-self: flex-start; border-radius: 10px 10px 10px 2px;
        }
        .pt-cursor { color: #f97316; font-weight: 700; }

        /* ── Preview: Design ── */
        .pt-preview--design { display: flex; flex-direction: column; gap: 8px; }
        .pt-design-prompt {
          font-size: 0.65rem; color: #64748b; font-style: italic;
          background: rgba(0,0,0,0.04); padding: 5px 8px; border-radius: 6px;
        }
        .pt-design-bar {
          height: 3px; background: rgba(0,0,0,0.07); border-radius: 2px; overflow: hidden;
        }
        .pt-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #f97316, #fbbf24);
          border-radius: 2px;
        }
        .pt-design-img { border-radius: 10px; overflow: hidden; }
        .pt-design-mock {
          height: 90px; background: #f8fafc; border-radius: 10px;
          position: relative; display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .pt-design-mock-light {
          position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
          width: 60px; height: 60px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,220,100,0.6), transparent);
        }
        .pt-design-mock-product {
          width: 60px; height: 60px; border-radius: 10px;
          background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .pt-design-mock-shadow {
          position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
          width: 50px; height: 6px; border-radius: 50%;
          background: rgba(0,0,0,0.1); filter: blur(3px);
        }

        /* ── Preview: Video ── */
        .pt-preview--video { display: flex; flex-direction: column; gap: 8px; }
        .pt-video-screen {
          height: 70px; background: #0f172a; border-radius: 8px;
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .pt-video-play { font-size: 1.4rem; color: white; z-index: 1; opacity: 0.9; }
        .pt-video-scan {
          position: absolute; top:0; bottom:0; width: 8px;
          background: linear-gradient(90deg, transparent, rgba(249,115,22,0.6), transparent);
          pointer-events: none;
        }
        .pt-video-timeline { display: flex; gap: 3px; align-items: flex-end; height: 34px; }
        .pt-thumb {
          flex: 1; background: linear-gradient(180deg, #f97316, #ea580c);
          border-radius: 3px; opacity: 0.8;
        }
        .pt-video-models { display: flex; gap: 5px; }
        .pt-video-badge {
          font-size: 0.6rem; font-weight: 700; padding: 2px 7px; border-radius: 4px;
          background: rgba(249,115,22,0.1); color: #f97316; border: 1px solid rgba(249,115,22,0.2);
        }

        /* ── Preview: Audio ── */
        .pt-preview--audio { display: flex; flex-direction: column; gap: 8px; align-items: center; }
        .pt-audio-label { font-size: 0.7rem; color: #059669; font-weight: 600; align-self: flex-start; }
        .pt-waveform {
          display: flex; align-items: center; gap: 2px; height: 44px; width: 100%;
        }
        .pt-bar {
          flex: 1; background: linear-gradient(180deg, #34d399, #059669);
          border-radius: 2px; transform-origin: bottom;
        }
        .pt-audio-types { display: flex; gap: 6px; align-self: flex-start; }
        .pt-audio-tag {
          font-size: 0.62rem; font-weight: 600; padding: 2px 8px; border-radius: 4px;
          background: rgba(5,150,105,0.1); color: #059669;
        }

        /* ── Preview: Agents ── */
        .pt-preview--agents { display: flex; flex-direction: column; gap: 8px; }
        .pt-agent-row {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; background: rgba(0,0,0,0.03); border-radius: 8px;
        }
        .pt-agent-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #f97316; flex-shrink: 0;
        }
        .pt-agent-name { flex: 1; font-size: 0.75rem; font-weight: 600; color: #1e293b; }
        .pt-agent-status {
          font-size: 0.62rem; color: #059669; font-weight: 700;
          background: rgba(5,150,105,0.1); padding: 2px 6px; border-radius: 4px;
        }

        /* ── Preview: Templates ── */
        .pt-preview--templates { }
        .pt-tpl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
        .pt-tpl-mini {
          padding: 7px 6px; background: white; border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.07); text-align: center;
        }
        .pt-tpl-mini-icon { font-size: 1rem; }
        .pt-tpl-mini-name { font-size: 0.58rem; font-weight: 700; color: #1e293b; line-height: 1.2; margin-top: 2px; }
        .pt-tpl-mini-cat { font-size: 0.52rem; color: #f97316; font-weight: 600; margin-top: 1px; }

        /* ── Preview: Credits ── */
        .pt-preview--credits { display: flex; flex-direction: column; gap: 10px; align-items: center; }
        .pt-credits-display { text-align: center; }
        .pt-credits-icon { font-size: 1.6rem; }
        .pt-credits-num { font-size: 2.4rem; font-weight: 900; color: #f97316; line-height: 1; }
        .pt-credits-label { font-size: 0.7rem; color: #64748b; font-weight: 600; }
        .pt-credit-bar {
          width: 100%; height: 6px; background: rgba(0,0,0,0.07); border-radius: 3px; overflow: hidden;
        }
        .pt-credit-bar-fill {
          height: 100%; background: linear-gradient(90deg, #f97316, #fbbf24); border-radius: 3px;
        }
        .pt-credit-costs { display: flex; gap: 6px; width: 100%; justify-content: center; }
        .pt-cost-item {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 5px 8px; background: rgba(0,0,0,0.04); border-radius: 6px;
        }
        .pt-cost-type { font-size: 0.6rem; color: #64748b; }
        .pt-cost-val { font-size: 0.68rem; font-weight: 800; color: #f97316; }
      `}</style>

      <motion.div
        className="pt-modal"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Step indicator dots */}
        <div style={{ padding: '20px 28px 0', display: 'flex', gap: '5px' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="pt-step-dot"
              style={{
                flex: i === step ? 2 : 1,
                background: i <= step ? current.accent : '#e2e8f0',
              }}
            />
          ))}
        </div>

        {/* Top — illustration area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="pt-top"
            style={{ background: current.bg }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="pt-character">{current.character}</div>
            <div className="pt-preview-wrap">{current.preview}</div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom — text + controls */}
        <div className="pt-bottom">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <div className="pt-title">{current.title}</div>
              <div className="pt-desc">{current.desc}</div>
            </motion.div>
          </AnimatePresence>

          <div className="pt-footer">
            <div className="pt-counter">{step + 1} OF {STEPS.length}</div>
            <div className="pt-actions">
              {step < STEPS.length - 1 && (
                <button className="pt-skip" onClick={dismiss}>Skip</button>
              )}
              <button
                className="pt-continue"
                style={{ background: current.accent }}
                onClick={next}
              >
                {step === STEPS.length - 1 ? 'Get started →' : 'Continue →'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function shouldShowTour() {
  return !localStorage.getItem(TOUR_KEY);
}
