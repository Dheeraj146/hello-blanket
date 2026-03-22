

# Downloading Your Code for Local Deployment

You have two options to get your code locally:

## Option 1: GitHub (Recommended)
1. Go to **Settings → Connectors → GitHub**
2. Connect your GitHub account
3. Push your project to a repository
4. Clone the repo locally: `git clone <your-repo-url>`

## Option 2: Direct Download
1. Click the **project name** in the top-left corner
2. Select **Settings**
3. Look for the **GitHub** section — you can export from there

## After Downloading

Follow the `LOCAL_DEPLOYMENT.md` file already in your project:

1. Install Supabase CLI: `npm install -g supabase`
2. Run `supabase start` (requires Docker)
3. Create `.env.local` with local Supabase URLs
4. Run `supabase db reset` to apply migrations
5. Set edge function secrets (threat intel API keys)
6. Run `npm install && npm run dev -- --host 0.0.0.0`
7. Access from LAN at `http://<your-ip>:8080`

No code changes needed — the app is already configured for local deployment.

