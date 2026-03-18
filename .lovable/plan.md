# Fix: Floating AI Bot Visibility, Dark/Light Toggle, API Model Update, and Theme Consistency

## Issues Identified

1. **Chatbot not visible on landing page** — `FloatingAIBot` is only rendered inside `DashboardLayout` (protected routes). The landing page (`/`) doesn't include it.
2. **Dark/light toggle not visible on landing page** — Same reason; the toggle is only in the dashboard header.
3. **AI model needs updating** — Change from `nvidia/nemotron-3-super-120b-a12b:free` to `nvidia/llama-nemotron-embed-vl-1b-v2:free`.
4. **"Clear" on typing "clear"** — When user types "clear" as a message, clear the chat instead of sending it.
5. **Theme consistency** — Red/black theme is already applied. Need to ensure both light and dark modes look correct with red accents.

---

## Changes

### 1. Add FloatingAIBot + Theme Toggle to Landing Page (`src/pages/Index.tsx`)

- Import and render `<FloatingAIBot />` at the bottom of the component
- Add a dark/light mode toggle button in the landing page header (Sun/Moon icon using `useTheme`)

### 2. Update FloatingAIBot (`src/components/FloatingAIBot.tsx`)

- In `sendMessage`, check if `content.trim().toLowerCase() === "clear"` — if so, call `setMessages([])` and return early instead of sending to API

### 3. Update AI Edge Function Model (`supabase/functions/ai-chat/index.ts`)

- Change model from `nvidia/nemotron-3-super-120b-a12b:free` to `nvidia/llama-nemotron-embed-vl-1b-v2:free`

### 4. Verify Theme (`src/index.css`)

- Already has red primary colors for both light and dark. No changes needed — the theme is correct.

### 5. Verify ThemeContext (`src/contexts/ThemeContext.tsx`)

- Already exists and works. No changes needed.

---

## Files Modified

- `src/pages/Index.tsx` — add FloatingAIBot + theme toggle
- `src/components/FloatingAIBot.tsx` — add "clear" command detection
- `supabase/functions/ai-chat/index.ts` — update model ID

make changes in explaination for email monitoring , threat detection ,endpoint monitoring , reports and analytics , role based access (when user clicks any of this it should open new page with proper explaination of particular feature ) for eg user clicks email monitoring tab it should open new page with proper detailed explaination how it works 