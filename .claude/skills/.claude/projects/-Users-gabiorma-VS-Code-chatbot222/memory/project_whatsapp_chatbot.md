---
name: whatsapp_chatbot_rioja_alta
description: WhatsApp chatbot for Bodegas Grupo La Rioja Alta, S.A. — architecture, files, and setup status
type: project
---

Client chatbot project for Bodegas Grupo La Rioja Alta, S.A. (https://riojalta.com)

**Why:** Client needs a WhatsApp customer service chatbot with <2s response time and web search capability.

**How to apply:** When user asks to modify, extend, or debug this chatbot, refer to the architecture below.

## Files (in /Users/gabiorma/VS Code/chatbot222/)

| File | Purpose |
|------|---------|
| `app.py` | FastAPI webhook server — Twilio WhatsApp integration |
| `chatbot.py` | Claude Haiku 4.5 + web_search tool + per-user history |
| `knowledge_base.py` | Loads all 5 Excel files + static website content → system prompt |
| `requirements.txt` | anthropic, fastapi, uvicorn, twilio, pandas, openpyxl, python-dotenv |
| `.env.example` | Template: ANTHROPIC_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER |

## Excel knowledge sources
- `Copia de Precios tienda.riojalta PRESTASHOP SHEETS.xlsx` — 85 products with prices (IVA incl.), URLs, YouTube videocata links
- `Copia de Listado importadores SHEETS.xlsx` — 166 international importers by continent/country
- `Copia de distribuidores rasa SHEETS.xlsx` — 78 Spanish distributors by province
- `Equipo Directivo SHEETS.xlsx` — 24 executive team members with titles
- `RASA Fincas para Gabriela SHEETS.xlsx` — vineyard data (hectares, vine age, varieties, DOC)

## Architecture decisions
- Model: `claude-haiku-4-5` (fastest, sub-2s for knowledge-base queries)
- Web search: `web_search_20260209` server-side tool (no client-side loop needed)
- History: 8 turn pairs per user, 2h session timeout, in-memory dict
- WhatsApp: Twilio webhook → TwiML response (single HTTP round-trip)
- Knowledge base: ~11K tokens, built at startup from Excel + static website content

## WhatsApp integration
Uses **Meta WhatsApp Business Cloud API** (official), phone +34684804986.
Previous n8n workflow was 10-20s due to 7 Google Sheets API calls per message.
This solution pre-loads all knowledge in RAM → single Claude Haiku call = <2s.

## Setup still needed by user
1. Copy `.env.example` → `.env` and fill keys:
   - `ANTHROPIC_API_KEY`
   - `META_ACCESS_TOKEN` — System User permanent token from Meta Business Suite
   - `META_PHONE_NUMBER_ID` — numeric ID from Meta Developer Portal → WhatsApp → API Setup
   - `META_APP_SECRET` — optional, for webhook signature validation
   - `WEBHOOK_VERIFY_TOKEN` — any string, must match what's entered in Meta portal
2. Deploy server (Railway/Render/Fly.io) or use ngrok for local dev
3. In Meta Developer Portal → WhatsApp → Configuration → Webhook:
   - Callback URL: `https://<domain>/webhook`
   - Verify Token: value of `WEBHOOK_VERIFY_TOKEN`
   - Subscribe to: `messages`
4. Run: `uvicorn app:app --port 8000`

## Meta webhook endpoints
- `GET /webhook` — verification (called once by Meta during setup)
- `POST /webhook` — incoming messages (background task → returns 200 instantly)
