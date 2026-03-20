

# Plan: AI Bot Position, Admin Fixes, Edit Capabilities, Endpoint Monitoring Rethink, and Threat Intel Integration

## Summary

11 areas of work addressing UI fixes, admin functionality, endpoint monitoring architecture, and threat intelligence API integration.

---

## 1. Move AI Bot to Bottom-Right with Draggable Option

**FloatingAIBot.tsx:**
- Change `left-4` to `right-4` for both the button and panel
- Change panel from `bottom-20 left-4` to `bottom-20 right-4`
- Add simple drag support: use `react-draggable` or a custom drag handler so the bot icon can be repositioned by the user if it overlaps content

**Files:** `src/components/FloatingAIBot.tsx`

---

## 2. System Uptime — Show Application Uptime

The "99.97%" is hardcoded. Change it to reflect actual application uptime (calculated from when the app was first deployed or the earliest security event). If no data exists, show "N/A" or "—". This is the application's own uptime, not endpoint uptime.

**Files:** `src/pages/Dashboard.tsx` (line 38)

---

## 3. Fix Admin Account Creation Login Issue

When a new admin is created via `manage-users` edge function, the user gets `email_confirm: true` so they can log in immediately. However, the issue is likely that newly created admin accounts with the admin role need to be able to sign in using the admin login form. Currently the admin login form hardcodes `admin@nazar.security` — only the primary admin can use it.

**Fix:** The admin login form should accept any username/email. If the user enters a plain username (no @), treat it as `username@nazar.security`. Otherwise use the email directly. The `manage-users` edge function already assigns roles correctly. The real issue is that created users use normal email auth, so they should use the regular "Sign In" form, not the admin login form.

**Clarification in Login UI:** Remove the separate "Admin Login" section. Instead, have a single login form with email + password + Google sign-in. Admins log in with their email just like everyone else. Keep the `admin@nazar.security` / `admin@1234` as the pre-seeded admin, but don't expose these credentials in the UI.

**Files:** `src/pages/Login.tsx`

---

## 4. Hide Admin Credentials from Login Page

Remove the "admin?" divider and the "Admin Login" button from the login page. All users (including admins) use the same email + password form. The admin@nazar.security account is internal — not shown in UI.

Also in the Create User dialog: remove any pre-filled admin info. The form fields should start empty.

**Files:** `src/pages/Login.tsx`

---

## 5. Edit User in Admin Panel (Password Reset, Details Update)

Add an "Edit" button per user row in Admin → Users tab. Opens a dialog with:
- Update display name
- Reset password (set new password)
- Change role

Add a new `update_user` action to `manage-users` edge function that uses `adminClient.auth.admin.updateUserById()` to change password/email/metadata.

**Protect main admin:** The user with email `admin@nazar.security` cannot be deleted. Hide the delete button for this user. Edit (password change, display name) should still work.

**Files:** `src/pages/Admin.tsx`, `supabase/functions/manage-users/index.ts`

---

## 6. Edit Email Servers and Endpoints

Add an "Edit" button (pencil icon) next to each email server and endpoint config row. Opens a pre-filled dialog where admin can update any field. Uses `supabase.from("email_server_configs").update(...)` and `supabase.from("endpoint_configs").update(...)`.

**Files:** `src/pages/Admin.tsx`

---

## 7. Rethink Endpoint Monitoring — Log Collection Architecture

The user does not want simple ping/HTTP probes. They want real endpoint monitoring: system logs, event viewer data, USB device events, Windows Defender alerts, etc.

**Realistic approach for a web app:**

The edge function cannot directly connect to Windows Event Viewer or install agents. Instead, the architecture should support **log ingestion via API/webhook**:

1. **Add `monitor_type` options**: `wazuh`, `suricata`, `siem_webhook`, `windows_event_log`, `custom_api`
2. **Add API/webhook fields to `endpoint_configs`**: `api_url`, `api_key`, `webhook_secret` — so the admin can configure how to connect to their SIEM/agent
3. **New edge function `endpoint-log-collector`**: Fetches logs from configured Wazuh API, Suricata API, or any webhook endpoint. Stores parsed events in `security_events`
4. **Webhook receiver edge function `endpoint-webhook`**: Accepts incoming log data pushed by agents (Wazuh, Suricata, custom scripts) and stores in `security_events`

**Database migration:** Add columns to `endpoint_configs`: `api_url`, `api_key`, `webhook_secret`, `log_source` (wazuh/suricata/event_viewer/custom)

**Files:** Database migration, `supabase/functions/endpoint-log-collector/index.ts` (new), `supabase/functions/endpoint-webhook/index.ts` (new), `src/pages/Admin.tsx` (update endpoint form)

---

## 8. Threat Intelligence API Integration

Store the provided API keys as secrets:
- `SHODAN_API_KEY`
- `ABUSEIPDB_API_KEY`
- `OTX_API_KEY`
- `IPINFO_TOKEN`
- `VIRUSTOTAL_API_KEY`
- `HUNTER_API_KEY`
- `HIBP_API_KEY`
- `ZOOMEYE_API_KEY`
- `SECURITYTRAILS_API_KEY`

Create a new edge function `threat-intel/index.ts` that:
- Accepts an IP, domain, or email to investigate
- Queries Shodan (host info, open ports), AbuseIPDB (abuse reports), OTX (threat indicators), VirusTotal (file/URL scan), IPInfo (geo/ASN), Hunter (email verification), HIBP (breach check), ZoomEye (device search), SecurityTrails (DNS history)
- Returns consolidated threat intelligence report
- Auto-enriches threat_alerts and security_events with intel data

Add a "Threat Intel" tab or section in the Threats page where admin can look up any IP/domain/email against all configured APIs.

**Files:** `supabase/functions/threat-intel/index.ts` (new), `src/pages/Threats.tsx` (add lookup UI), secrets configuration

---

## 9. Local Network Deployment Notes

The app is already a standard Vite/React app that can run locally. For local deployment:
- The edge functions run on Lovable Cloud but when self-hosted, they'd run as Supabase Edge Functions locally
- The webhook endpoint allows local SIEM tools to push data to the cloud database
- No changes needed to the codebase — it already works via browser

---

## 10. Implementation Order

1. Store threat intel API keys as secrets
2. Database migration (add endpoint_configs columns, etc.)
3. Move AI bot to bottom-right with drag
4. Fix login page (single form, hide admin credentials)
5. Fix system uptime display
6. Add edit capabilities to Users, Email Servers, Endpoints tabs
7. Protect main admin from deletion
8. Update manage-users edge function with update_user action
9. Create endpoint-log-collector and endpoint-webhook edge functions
10. Create threat-intel edge function
11. Add Threat Intel lookup UI to Threats page

