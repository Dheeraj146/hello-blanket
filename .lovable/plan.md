# Dashboard Update Plan — Red/Black Theme, Dark/Light Mode, AI Bot, Google Sign-In, Feature Explanations, Admin Visit Counts

## Summary of Changes

8 areas of work across theme, UI components, auth, and database.

---

## 1. Red and Black Color Scheme

Update `src/index.css` CSS variables to replace cyan/teal primary with red accents:

- `--primary`: change from `174 100% 42%` (cyan) to `0 72% 51%` (red)
- `--accent`: red variant
- `--ring`: red
- `--cyber-cyan` → keep but add `--cyber-red` as main accent
- Sidebar primary/ring: red
- Keep dark background (`220 20% 4%`) as-is for dark mode

Add a **light mode** `:root` or `.light` variant with light backgrounds, dark text, red accents. The `darkMode: ["class"]` is already set in tailwind config — just need to add light theme CSS variables and a toggle mechanism.

Update `cyber-glow`, `cyber-glow-text` utilities to use red instead of cyan.

**Files:** `src/index.css`

---

## 2. Dark/Light Mode Toggle

Create a `ThemeProvider` context (`src/contexts/ThemeContext.tsx`) that:

- Reads preference from `localStorage`
- Toggles `dark` class on `<html>` element
- Provides `theme` and `toggleTheme`

Add a Sun/Moon toggle button in the dashboard header (`DashboardLayout.tsx`).

**Files:** `src/contexts/ThemeContext.tsx` (new), `src/components/DashboardLayout.tsx`, `src/App.tsx`, `src/index.css` (light mode vars)

---

## 3. Move AI Bot to Bottom-Left + Add "Clear" Button

Update `FloatingAIBot.tsx`:

- Change position from `right-4` to `left-4` (both the panel and button)
- Change panel from `bottom-20 right-4` to `bottom-20 left-4`
- Add a "Clear Chat" button in the header styled with red/destructive colors
- The clear button resets the `messages` array to `[]`

**Files:** `src/components/FloatingAIBot.tsx`

---

## 4. Feature Explanation Dialogs

When users click on Email Monitoring, Threat Detection, or Endpoint Monitoring in the sidebar (or on the landing page feature cards), show a dialog/sheet with a detailed explanation.

**Approach:** Add a `FeatureExplanationDialog` component using shadcn `Dialog`. Each feature (Email Monitoring, Threat Detection, Endpoint Monitoring) gets a detailed explanation covering:

- What it does
- How it works (protocols, detection methods)
- Key metrics tracked

Add an info icon button (ℹ️) next to the page title on each of the three pages (EmailMonitor, Threats, Endpoints) that opens the explanation dialog. Also make the landing page feature cards clickable to show explanations.

**Files:** `src/components/FeatureExplanation.tsx` (new), `src/pages/EmailMonitor.tsx`, `src/pages/Threats.tsx`, `src/pages/Endpoints.tsx`, `src/pages/Index.tsx`

---

## 5. User Visit Counts on Admin Page

Create a `page_visits` table in the database:

- `id` (uuid), `user_id` (uuid), `page` (text), `visited_at` (timestamptz default now())
- RLS: authenticated can INSERT own rows, admins can SELECT all

Add a hook or effect in `DashboardLayout` that logs each page navigation to `page_visits`.

On the Admin page, add a "Visitor Stats" tab showing:

- Total visits per user
- Most visited pages
- Recent activity

**Database migration:** Create `page_visits` table + RLS policies
**Files:** `src/pages/Admin.tsx`, `src/components/DashboardLayout.tsx`

---

## 6. Google Sign-In

Use Lovable Cloud's managed Google OAuth via the Configure Social Login tool, then add a "Sign in with Google" button on the Login page using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.

**Files:** `src/pages/Login.tsx`, social login configuration

---

## 7. Landing Page Feature Cards — Clickable Explanations

Make each feature card on `Index.tsx` open the `FeatureExplanationDialog` with the relevant content when clicked (for Email Monitoring, Threat Detection, Endpoint Monitoring). Other cards navigate to login.

**Files:** `src/pages/Index.tsx`

---

## 8. Keep "NAZAR" Branding

Already in place — no changes needed. The name stays as NAZAR throughout.

---

## Implementation Order

1. Database migration for `page_visits` table
2. Red/black theme + light mode CSS variables
3. ThemeProvider context + toggle in header
4. AI bot repositioned to bottom-left with clear button
5. Feature explanation dialog component
6. Add explanation triggers to EmailMonitor, Threats, Endpoints, and Index pages
7. Admin page visitor stats tab
8. Page visit tracking in DashboardLayout
9. Google Sign-In integration  
  
use old zero trust monitoring name only instead of email security monitoring