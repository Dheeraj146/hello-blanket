# Plan: Backend Monitoring Data, AI Bot Fix, PDF Theme, and Polish

## Problem Summary

1. **AI chatbot fails** — edge function uses `NVIDIA_API_KEY` which is not configured. Screenshot shows "Failed to connect to AI service."
2. **No monitoring data** — all tables are empty, so dashboard/email monitor/threats/endpoints show nothing
3. **PDF reports** need NAZAR red/black theme (like uploaded sample)
4. **"Edit with Lovable" badge** needs to be hidden
5. **Admin credentials** — user wants default admin with email "admin" / password "admin@1234" (not possible with standard auth — will seed an actual admin user)

---

## Changes

### 1. Fix AI Chatbot — Switch to Lovable AI Gateway

The `NVIDIA_API_KEY` secret does not exist. Switch `supabase/functions/ai-chat/index.ts` to use the pre-configured Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) with `LOVABLE_API_KEY` (already available). Use `google/gemini-3-flash-preview` model. Keep the cybersecurity system prompt.

use : nvidia/nemotron-3-super-120b-a12b:free   api key   
nvidia/llama-nemotron-embed-vl-1b-v2:free  
nvidia/nemotron-3-nano-30b-a3b:free  
nvidia/nemotron-nano-12b-v2-vl:free

**Files:** `supabase/functions/ai-chat/index.ts`

### 2. Seed Monitoring Data into Database

Insert realistic sample data into all monitoring tables so the dashboard is populated on login:

- **domain_emails** — ~20 sample emails (mix of inbound/outbound, SMTP/IMAP/Exchange, some with threats like phishing/spam/malware)
- **threat_alerts** — ~8 alerts (mix of severities, some resolved)
- **endpoints** — ~6 endpoints (various OS, statuses)
- **security_events** — ~10 events (various types and severities)
- **reports** — ~3 sample reports with data

Use the database insert tool for data operations.

### 3. Update PDF Theme to Red/Black NAZAR Style

Update `src/lib/pdf.ts`:

- Header background: dark black (#0a0f14)
- NAZAR title in red instead of cyan
- Tagline: "Zero Trust Monitoring Dashboard"
- Table header: red (#dc2626) instead of teal
- Footer: "NAZAR - Zero Trust Monitoring | Confidential"
- Match the style of the uploaded forensic report PDF

**Files:** `src/lib/pdf.ts`

### 4. Hide "Edit with Lovable" Badge

Add CSS to `src/index.css` to hide the Lovable badge:

```css
a[href*="lovable.dev"][target="_blank"] { display: none !important; }
```

**Files:** `src/index.css`

### 5. Admin User Note

Standard authentication does not support hardcoded credentials. The user needs to:

1. Sign up with their preferred email
2. Then we assign admin role via database

Will document this clearly. Cannot use "admin" as an email (invalid format).

### 6. Deploy Edge Function

After updating `ai-chat`, deploy it so changes take effect.

---

## Files Modified

- `supabase/functions/ai-chat/index.ts` — Lovable AI gateway
- `src/lib/pdf.ts` — red/black NAZAR theme
- `src/index.css` — hide Lovable badge
- Database inserts for seed data (domain_emails, threat_alerts, endpoints, security_events, reports)

## Implementation Order

1. Update and deploy ai-chat edge function
2. Insert seed monitoring data
3. Update PDF theme
4. Hide Lovable badge