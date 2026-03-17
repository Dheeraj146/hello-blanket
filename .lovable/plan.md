

# Zero Trust Monitoring Dashboard — Implementation Plan

## Overview

Build a full-stack cybersecurity monitoring dashboard inspired by cyber-eye.in, with real Supabase auth, database-backed data, PDF report downloads, an AI chatbot (NVIDIA NIM), and an admin panel. Dark theme with cyan/teal accent colors.

---

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Tailwind + shadcn + Recharts)    │
│                                                      │
│  Public Pages:                                       │
│    /              Landing page (hero + features)     │
│    /login         Auth page                          │
│                                                      │
│  Protected Pages (sidebar layout):                   │
│    /dashboard     Main security command center       │
│    /threats       Threat landscape & incidents       │
│    /endpoints     Monitored endpoints table          │
│    /reports       Reports list + PDF download        │
│    /analytics     Behavioral analytics + charts      │
│    /admin         Admin panel (users, roles, logs)   │
│    /chatbot       AI Security Assistant              │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Supabase (Lovable Cloud)                            │
│    Auth: email/password, admin role check             │
│    Tables: profiles, security_events, endpoints,     │
│            threat_alerts, audit_logs, reports         │
│    Edge Functions: ai-chat (NVIDIA NIM proxy),       │
│                    generate-report (PDF)              │
│    RLS: user-scoped + admin role via has_role()       │
└─────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation & Auth

**Supabase setup:**
- Enable Lovable Cloud
- Create tables: `profiles`, `user_roles` (with `app_role` enum: admin, analyst, viewer)
- Create `has_role()` security definer function
- RLS policies on all tables
- Trigger to auto-create profile on signup

**Auth pages:**
- `/login` — email/password login + signup
- Password reset flow with `/reset-password` page
- Auth context with role-based route protection
- Admin guard using `has_role(auth.uid(), 'admin')`

---

## Phase 2: Dashboard Layout & Theme

**Theme:** Deep dark background (current theme works), add cyan accent (`174 100% 50%` — matching cyber-eye.in's teal/cyan).

**Layout:** Sidebar (shadcn sidebar component) with:
- Logo "CYBER EYE" at top
- Nav items: Dashboard, Threats, Endpoints, Reports, Analytics, AI Assistant, Admin (admin-only)
- User avatar + logout in footer
- Collapsible with icon mode

---

## Phase 3: Database Tables & Seed Data

**Tables:**
- `security_events` — id, type, severity (critical/high/medium/low), source_endpoint, description, timestamp, status
- `endpoints` — id, hostname, ip_address, os, status (secure/warning/critical), last_seen, agent_version
- `threat_alerts` — id, title, description, severity, source, detected_at, resolved, resolved_at
- `audit_logs` — id, user_id, action, details, ip_address, created_at
- `reports` — id, title, type, generated_by, created_at, data (jsonb)

Seed with realistic mock data (50+ events, 20+ endpoints, alerts).

---

## Phase 4: Dashboard Pages

### Main Dashboard (`/dashboard`)
- Stats cards: Platform Uptime, Active Incidents, Monitored Endpoints, Risk Score
- Composite Risk Score gauge (animated)
- Priority Incidents list (real-time from `threat_alerts`)
- Security events timeline chart (Recharts area chart, last 24h/7d)
- Network topology visualization (simple SVG/CSS node graph)

### Threat Landscape (`/threats`)
- Filterable table of `threat_alerts` with severity badges
- Threat distribution pie chart
- Timeline of incidents

### Endpoints (`/endpoints`)
- Table of all monitored endpoints with status indicators
- Search/filter by status, OS, hostname
- Endpoint detail drawer

### Analytics (`/analytics`)
- User behavior analytics charts
- Anomaly detection timeline
- Event volume over time
- Top threat categories bar chart

### Reports (`/reports`)
- List of generated reports
- "Generate Report" button → calls edge function
- **PDF download**: Use `jspdf` + `jspdf-autotable` libraries to generate PDF client-side from report data. Each report row has a download button.
- Report types: Daily Summary, Incident Report, Compliance Audit, Endpoint Health

### Admin Panel (`/admin`) — admin role only
- User management table (list profiles + roles)
- Assign/revoke roles
- Audit log viewer
- System settings

---

## Phase 5: AI Chatbot

**Edge function `ai-chat`:**
- Proxies requests to NVIDIA NIM API (`https://integrate.api.nvidia.com/v1/chat/completions`)
- Model: `nvidia/nemotron-3-super-120b-a12b:free` (or correct NIM model ID)
- System prompt: cybersecurity specialist context
- Streaming SSE response
- Requires NVIDIA API key as a secret (will prompt user)

**Frontend:**
- Floating chat bubble on all dashboard pages
- Chat panel with message history
- Markdown rendering for AI responses
- Suggested questions: "Analyze recent threats", "Explain zero-trust", "Summarize incidents"

---

## Phase 6: PDF Report Generation

Using `jspdf` + `jspdf-autotable` (client-side):
- Fetch report data from Supabase
- Generate styled PDF with header, logo text, tables, charts summary
- Trigger browser download on button click
- New dependency: `jspdf`, `jspdf-autotable`

---

## Dependencies to Add

- `jspdf` + `jspdf-autotable` — PDF generation
- `react-markdown` — AI chat rendering
- Already have: `recharts`, `framer-motion`, `lucide-react`, shadcn components

---

## Implementation Order

1. Enable Lovable Cloud + create database schema + auth
2. Build sidebar layout + theme + routing
3. Build dashboard page with stats cards + charts
4. Build threats, endpoints, analytics pages
5. Build reports page with PDF download
6. Build admin panel
7. Set up NVIDIA NIM API key secret + ai-chat edge function
8. Build AI chatbot UI
9. Seed realistic data + polish animations

This is a large project. I recommend implementing it in phases — starting with auth + layout + dashboard, then adding pages incrementally.

