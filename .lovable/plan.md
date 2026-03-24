

# Plan: Zoho IMAP Read-Only Email Monitoring + Windows Event Log Endpoint Backend

## Summary

Two backend improvements: (1) upgrade email-scanner to actually connect to Zoho IMAP via `imappro.zoho.in`, read email headers, and store them in `domain_emails`; (2) replace ping-based endpoint monitoring with a Windows Event Log collection model.

---

## Current Problems

1. **Email scanner** only does a TCP connect/close probe — never reads any emails. Your Zoho server at `imappro.zoho.in:993` shows "connected" but no email data is collected.
2. **Endpoint log collector** requires Wazuh/Suricata API URLs. You added a local IP but selected no log source with an API, so "Collect Logs" returns "skipped — no API URL configured."
3. **endpoint-scanner** does TCP ping on ports 80/443/22 — not actual log monitoring.

---

## Changes

### 1. Rewrite `email-scanner` Edge Function — Real IMAP Connection

**Problem:** Deno Edge Functions cannot use Node.js IMAP libraries or raw TLS sockets for IMAP protocol parsing. The `Deno.connect()` + `Deno.connectTls()` APIs give raw TCP — but IMAP requires line-by-line command/response parsing.

**Approach:** Use Deno's `connectTls` to establish TLS connection to Zoho IMAP, then implement a minimal IMAP client that:
- Sends `LOGIN` with stored credentials
- Sends `SELECT INBOX`
- Sends `SEARCH ALL` (or `SEARCH SINCE <date>` for recent emails)
- Sends `FETCH <ids> (ENVELOPE FLAGS RFC822.SIZE)` to get sender, recipient, subject, date, size
- Parses ENVELOPE responses to extract email metadata
- Inserts new emails into `domain_emails` (deduplicating by message_id)
- Runs basic threat analysis (checks sender domain against known suspicious patterns, scores spam keywords in subject)
- Creates `threat_alerts` for detected threats
- Sends `LOGOUT`

This is a read-only test — no email modification. The function will connect, fetch headers only, and store metadata.

**Files:** `supabase/functions/email-scanner/index.ts` (complete rewrite)

### 2. Rewrite `endpoint-log-collector` — Windows Event API Support

**Approach:** Add a `windows_event_api` log source type. When an endpoint is configured with `log_source: "windows_event_api"`, the collector calls a custom API endpoint running on the Windows machine (the admin must set up a small PowerShell/Python script that exposes Windows Event Viewer logs as JSON over HTTP).

The edge function will:
- For `windows_event_api` source: fetch from `api_url` (e.g. `http://192.168.1.x:5000/events`) which returns JSON event log data
- Parse Windows event fields: EventID, Level, Source, TimeCreated, Message
- Map Windows event levels to severity (Critical/Error→high, Warning→medium, Information→low)
- Insert into `security_events` with source_endpoint set to the IP
- Upsert `endpoints` table with status based on collected data
- Flag security-relevant events (failed logins EventID 4625, USB device EventID 20001, Defender alerts, etc.)

**Files:** `supabase/functions/endpoint-log-collector/index.ts` (rewrite)

### 3. Update Endpoint Config Form — Add Windows Event API Option

Add `windows_event_api` to the Log Source dropdown in the Admin panel's Add/Edit Endpoint dialogs. Add helper text explaining what API URL to use and how to set up the Windows-side script.

**Files:** `src/pages/Admin.tsx`

### 4. Provide Windows Event Log Collector Script

Create a helper markdown file `WINDOWS_EVENT_COLLECTOR.md` with a PowerShell script that:
- Starts a lightweight HTTP server on a configurable port (default 5000)
- Exposes `/events` endpoint returning recent Windows Event Viewer logs as JSON
- Filters Security, System, Application channels
- Returns last N events or events since last poll timestamp
- The admin runs this script on each Windows endpoint they want to monitor

**Files:** `WINDOWS_EVENT_COLLECTOR.md` (new)

### 5. Update `endpoint-scanner` — Remove Ping-Only Approach

Repurpose `endpoint-scanner` to be the "scan now" action that:
- For `windows_event_api` endpoints: calls the same HTTP API to check connectivity + fetch a small batch of events
- Updates endpoint status in the `endpoints` table
- No more blind TCP port scanning

**Files:** `supabase/functions/endpoint-scanner/index.ts` (rewrite)

### 6. Deploy All Updated Edge Functions

After rewriting, deploy: `email-scanner`, `endpoint-log-collector`, `endpoint-scanner`.

---

## Implementation Order

1. Rewrite `email-scanner` with minimal IMAP client for Zoho
2. Rewrite `endpoint-log-collector` with Windows Event API support
3. Rewrite `endpoint-scanner` to match new architecture
4. Update Admin page endpoint form with new log source option
5. Create `WINDOWS_EVENT_COLLECTOR.md` helper script
6. Deploy all edge functions

