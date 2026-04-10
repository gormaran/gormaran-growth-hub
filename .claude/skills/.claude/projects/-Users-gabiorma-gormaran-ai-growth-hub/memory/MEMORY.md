# Gormaran AI Growth Hub — Memory

## User Preferences
- **CRITICAL**: Never leave AI Output responses unfinished/truncated. Always complete the full response before ending.
- Communication in Spanish (user speaks Spanish).

## Project
- SaaS at gormaran.io — AI Growth Hub with 30+ specialized tools
- Stack: React 19, i18next (EN/ES/FR/IT/DE), Framer Motion, Node/Express backend
- Deploy: git push → Render auto-deploys (~2 min)

## Key Files
- `src/pages/LandingPage.js` — Main landing page component
- `src/pages/LandingPage.css` — Landing page styles
- `src/data/categories.js` — Frontend tool registry
- `server/routes/categoryPrompts.js` — Backend prompt registry
- `src/i18n/[en|es|fr|it|de].json` — Translations (5 languages)
- `src/components/AIToolInterface.js` — Tool interface (handleCopy strips markdown)
- `public/index.html` — SVG favicon priority, Google Ads gtag (AW-17507866715)

## Architecture Notes
- Stats numbers are hardcoded in LandingPage.js STATS array (not in i18n) — one change applies to all languages
- Flip card back faces need `transform: rotateY(180deg)` on desktop, `transform: none` on mobile overrides
- Mobile flip cards use display:none/flex toggle instead of 3D transforms
