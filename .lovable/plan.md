

# Plan: Transform NAZAR into a Real Operational Security Monitoring Platform

## Overview

The current app has static/seed data. The user wants a real tool where they configure monitoring sources (email servers, network endpoints) and the system collects actual data. The app will run locally on their network. Public visitors see only the explanation/landing pages.

---

## Architecture

```text
Admin Dashboard
  ├── User Management (create accounts, assign roles: user/supervisor/admin)
  ├── Email Server Config (add IMAP/SMTP/POP3 servers with host, port, credentials)
  ├── Endpoint Config (add network IPs/hostnames to monitor)
  └── All data starts empty — populated only from configured sources

Edge Functions (backend)
  ├── email-scanner: connects to configured email servers, fetches headers/metadata, stores in domain_emails, flags threats
  ├── endpoint-scanner: pings/probes configured IPs, collects status, stores in endpoints table
  └── threat-analyzer: analyzes collected data for anomalies, creates threat_alerts

Dashboard pages read from these tables (already built, just need real data flow)
```

---

## Database Changes (New Tables)

### 1. `email_server_configs` — stores IMAP/SMTP/POP3 server connections
- `id`, `name`, `protocol` (IMAP/SMTP/POP3/Exchange), `host`, `port`, `username`, `encrypted_password`, `use_tls`, `is_active`, `last_scan_at`, `created_by` (uuid), `created_at`
- RLS: admin-only CRUD

### 2. `endpoint_configs` — stores network IPs/hosts to monitor  
- `id`, `hostname`, `ip_address`, `os`, `monitor_type` (ping/ssh/agent), `is_active`, `scan_interval_minutes`, `last_scan_at`, `created_by` (uuid), `created_at`
- RLS: admin-only CRUD

### 3. `managed_users` — admin creates user accounts with role assignments
- Uses existing `profiles` + `user_roles` tables. Admin page gets a "Create User" form that calls the `create-admin` edge function pattern (service role signup).

### 4. Update `app_role` enum
- Add `supervisor` role: ALTER TYPE app_role ADD VALUE 'supervisor'

### 5. Clear seed data
- DELETE all rows from `domain_emails`, `threat_alerts`, `endpoints`, `security_events`, `reports` so tables start empty

---

## New Edge Functions

### `email-scanner/index.ts`
- Called on-demand or scheduled by admin
- Reads `email_server_configs` (active ones) using service role
- Connects to IMAP/POP3 servers, fetches recent email headers (from, to, subject, date, size, attachments)
- Analyzes for threats (phishing keywords, suspicious domains, spam scoring)
- Inserts results into `domain_emails` and creates `threat_alerts` for detected threats
- Note: Real IMAP connection requires network access — this will work when running locally. On Lovable preview, it will show connection errors (expected).

### `endpoint-scanner/index.ts`
- Reads `endpoint_configs` (active ones)
- Attempts to reach each IP/hostname (HTTP probe or TCP check)
- Updates `endpoints` table with status (secure/warning/critical/offline), last_seen
- Creates `security_events` for status changes
- Same local-network caveat applies

### `manage-users/index.ts`
- Admin-only edge function using service role
- Create user accounts (email + password + display name + role)
- Update user roles
- Disable/delete user accounts

---

## UI Changes

### Admin Page (`src/pages/Admin.tsx`) — Complete Rebuild with Tabs:

1. **Users Tab** (existing, enhanced)
   - "Create User" button → dialog with email, password, display name, role (user/supervisor/admin)
   - Role change dropdown per user
   - Delete user button

2. **Email Servers Tab** (new)
   - Table of configured email servers
   - "Add Email Server" button → form: name, protocol (IMAP/SMTP/POP3), host, port, username, password, TLS toggle
   - "Scan Now" button per server → invokes `email-scanner` edge function
   - Status indicator (last scan time, error state)

3. **Endpoints Tab** (new)
   - Table of configured endpoints
   - "Add Endpoint" button → form: hostname, IP, OS, monitor type
   - "Scan Now" button → invokes `endpoint-scanner`
   - Status indicator

4. **Visitor Stats Tab** (existing, kept)
5. **Audit Logs Tab** (existing, kept)

### Existing Pages — No Major Changes
- `EmailMonitor.tsx`, `Threats.tsx`, `Endpoints.tsx`, `Reports.tsx`, `Analytics.tsx` already read from the right tables — they'll show data once scanners populate it
- Remove random data fallbacks in `Dashboard.tsx` and `Analytics.tsx` (lines that use `Math.random()`)
- Show "No data yet — configure monitoring sources in Admin panel" empty states

### Role-Based Sidebar Visibility
- `user` role: Dashboard, Email Monitor, Threats, Endpoints (read-only)
- `supervisor` role: All of user + Reports, Analytics
- `admin` role: Everything + Admin Panel

### Public vs Authenticated
- Landing page (`/`) and feature explanation pages remain public
- All dashboard routes remain behind `ProtectedRoute` (already done)

---

## Files Modified/Created

- **New migration**: `email_server_configs`, `endpoint_configs` tables, add `supervisor` to enum, clear seed data
- **New edge function**: `supabase/functions/email-scanner/index.ts`
- **New edge function**: `supabase/functions/endpoint-scanner/index.ts`
- **New edge function**: `supabase/functions/manage-users/index.ts`
- **Rewrite**: `src/pages/Admin.tsx` — full admin dashboard with user management, server config, endpoint config tabs
- **Edit**: `src/components/AppSidebar.tsx` — role-based nav visibility
- **Edit**: `src/pages/Dashboard.tsx` — remove random data fallbacks
- **Edit**: `src/pages/Analytics.tsx` — remove random data fallbacks
- **Edit**: `src/pages/EmailMonitor.tsx` — better empty state
- **Edit**: `src/pages/Endpoints.tsx` — better empty state
- **Edit**: `src/contexts/AuthContext.tsx` — expose roles for sidebar filtering

## Implementation Order
1. Database migration (new tables, enum update, clear seed data)
2. Edge functions (manage-users, email-scanner, endpoint-scanner)
3. Admin page rebuild (user management + server config + endpoint config)
4. Role-based sidebar filtering
5. Clean up empty states and random data fallbacks

