# NAZAR — Local Network Deployment Guide

## Prerequisites

- Node.js 18+ and npm/bun
- Docker (for local Supabase)
- Supabase CLI (`npm install -g supabase`)

## Step 1: Install Supabase Locally

```bash
# Initialize local Supabase (from project root)
supabase start
```

This starts PostgreSQL, Auth, Edge Functions, and all services locally on Docker.
Note the output — it will show your local:
- **API URL**: `http://localhost:54321`
- **Anon Key**: (a JWT string)
- **Service Role Key**: (a JWT string)

## Step 2: Update Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<your-local-anon-key>
VITE_SUPABASE_PROJECT_ID=local
```

## Step 3: Apply Database Migrations

```bash
supabase db reset
```

This applies all migrations in `supabase/migrations/` to your local database.

## Step 4: Set Edge Function Secrets

```bash
supabase secrets set SHODAN_API_KEY=cN4oN7r3bNpTddnxjQc05JZbkiv0JVgI
supabase secrets set ABUSEIPDB_API_KEY=f0c151602a429541f906b1657adbf8d2ec7ed9688edf0b48a8a0d5520d218fcd4c0fe82f930ff497
supabase secrets set OTX_API_KEY=e0ff0a24fde0f2006505b24ff439d8c721e87f85833e7a0fa21cb20cadd18ad5
supabase secrets set IPINFO_TOKEN=05321b6f6fb1df
supabase secrets set VIRUSTOTAL_API_KEY=d385e4509a345bcd4e3481561961c451097bbff95cad82b97823733521a7f293
supabase secrets set HUNTER_API_KEY=51999b85d2c1c083e3a1c756a935dd365d089d85
supabase secrets set HIBP_API_KEY=011053FD0102E94D6AE2F8B83D76FAF94F6:1
supabase secrets set ZOOMEYE_API_KEY=80E9DFB3-08D2-d4cd6-b0e2-c81e0e483df
supabase secrets set SECURITYTRAILS_API_KEY=NC3xgSbek3aag7f33JNHoKZCRb-Njti2
```

## Step 5: Start the Frontend

```bash
npm install
npm run dev -- --host 0.0.0.0
```

The `--host 0.0.0.0` flag makes the app accessible from other devices on your LAN.

Access from other LAN devices: `http://<your-machine-ip>:8080`

## Step 6: Create Admin User

Visit `http://<your-ip>:8080/admin-login` and the admin account is auto-created when you invoke the `create-admin` edge function:

```bash
curl -X POST http://localhost:54321/functions/v1/create-admin
```

Default admin: `admin@nazar.security` / `admin@1234`
Login at `/admin-login` with username `admin` and password `admin@1234`.

## Step 7: Serve Edge Functions Locally

```bash
supabase functions serve
```

This runs all edge functions locally so email scanning, endpoint monitoring, and threat intel all work within your LAN.

## Network Architecture

```
LAN Devices → http://<server-ip>:8080 → NAZAR Dashboard
                                         ↓
                              Local Supabase (Docker)
                              ├── PostgreSQL (port 54322)
                              ├── Auth (port 54321)
                              └── Edge Functions (port 54321)
                                   ├── email-scanner → connects to IMAP/SMTP servers on LAN
                                   ├── endpoint-log-collector → fetches from Wazuh/Suricata on LAN
                                   ├── endpoint-webhook → receives agent data
                                   └── threat-intel → queries external APIs
```

## Firewall Notes

- Allow port **8080** (frontend) from LAN
- Allow port **54321** (Supabase API) from LAN if agents push to webhook
- Endpoint IPs you add in the admin panel should be reachable from the Docker containers
- For IMAP/SMTP scanning, ensure the email server ports (143, 993, 25, 587) are accessible

## Production Local Deployment

For a production-grade local setup:

```bash
npm run build
npx serve -s dist -l 8080
```

This serves the optimized build. Combine with a reverse proxy (nginx/caddy) for HTTPS on your LAN.
