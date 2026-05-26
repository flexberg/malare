# MålarSaaS – CLAUDE.md

## Projektöversikt
SaaS för målare. 46elks-nummer → samtal spelas in → Whisper transkriberar → Claude analyserar → data sparas per kundkort → målaren får SMS med länk.

## Köra projektet

```powershell
# Backend (från malar-saas/)
npm install
copy .env.example .env   # Fyll i dina nycklar
npx ts-node backend/server.ts

# Frontend (i annan terminal)
cd frontend
npm install
copy .env.example .env   # Sätt VITE_API_URL om nödvändigt
npm run dev
```

## Struktur
- `backend/server.ts` – Express-entry + påminnelse-cron
- `backend/routes/elks.ts` – 46elks webhooks (POST /webhook/incoming, POST /webhook/recording-ready)
- `backend/routes/dashboard.ts` – REST API för frontend (/api/*)
- `backend/routes/auth.ts` – PIN-login via SMS (/auth/*)
- `backend/services/customerStore.ts` – Alla Supabase-queries
- `backend/services/transcription.ts` – Whisper (OpenAI), laddar ned med 46elks Basic Auth
- `backend/services/aiAnalysis.ts` – Claude claude-sonnet-4-6
- `backend/services/smsNotifier.ts` – 46elks SMS (HTTPS POST till api.46elks.com/a1/sms)
- `supabase/schema.sql` – Kör i Supabase SQL Editor
- `frontend/src/` – React + Vite, mörkt tema, orange accent #FF6B35

## 46elks Console-setup
1. Köp ett +46-nummer på [46elks.com](https://46elks.com)
2. Sätt "Voice start"-URL till `https://din-backend.com/webhook/incoming` (POST)
3. 46elks anropar automatiskt `BACKEND_URL/webhook/recording-ready` när inspelningen är klar (styrs via JSON-svaret från /webhook/incoming)

### Webhook-flöde
```
Inkommande samtal → POST /webhook/incoming
  ↳ Svar: { connect: PAINTER_REAL_PHONE, record: "yes", recordingurl: BACKEND_URL/webhook/recording-ready }

Inspelning klar → POST /webhook/recording-ready
  Body: { callid, recording, from, to, direction, duration }
  ↳ Laddar ned med Basic Auth → Whisper → Claude → Supabase → SMS
```

## Miljövariabler (.env)
```
ELKS_API_USERNAME=        # Från 46elks dashboard
ELKS_API_PASSWORD=        # Från 46elks dashboard
ELKS_PHONE_NUMBER=        # +46-numret du köpt
PAINTER_REAL_PHONE=       # Målarens riktiga telefon (dit samtal kopplas)
PAINTER_PHONE=            # Dit SMS-notiser skickas
BACKEND_URL=              # Din publika backend-URL (behövs för recordingurl)
DASHBOARD_URL=            # Din publika frontend-URL
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
PORT=3000
```

## Hosting
- Backend: Railway.app
- Frontend: Vercel (sätt VITE_API_URL till Railway-URL)
- DB: Supabase

## Prioriteringsordning (återstår)
- [x] Supabase-schema
- [x] 46elks webhook
- [x] Whisper-transkribering
- [x] Claude-analys
- [x] SMS-notis (46elks)
- [x] Frontend dashboard
- [x] Kundkort
- [x] Samtalstidslinje + transkript
- [x] SMS-påminnelsesystem
- [ ] Autentisering (PIN via SMS – routes/auth.ts finns, ej kopplad till frontend)
