# Fix Sign-In, Add Admin Login, and Redirect to Dashboard

## Issues Found

1. **Google sign-in works** (2 Google users exist in DB) but the redirect after sign-in goes to `/` (home) instead of `/dashboard` — the `redirect_uri` is set to `window.location.origin` which is the root
2. **No admin login button** — user wants a separate admin login with username "admin" / password "admin@1234"
3. **No admin user exists** — `user_roles` table is empty (0 rows), so no one has admin access
  &nbsp;

## Changes

### 1. Fix Google Sign-In Redirect (`src/pages/Login.tsx`)

- After Google OAuth completes, the user lands back on `/` because `redirect_uri` points there
- Add a `useEffect` in `Login.tsx` that watches for `user` state — when authenticated, navigate to `/dashboard`
- Also add the same redirect logic in `Index.tsx` — if user is already logged in, redirect to `/dashboard`
- `Admin will create user account then only user can login.`

### 2. Add Admin Login Section (`src/pages/Login.tsx`)

- Add a separate "Admin Login" button/section below the regular sign-in
- When clicked, show username + password fields (not email)
- Map username "admin" to a pre-created admin email `admin@nazar.security` in the backend
- On submit, call `signIn("admin@nazar.security", password)`

### 3. Create Admin User in Database

- Use Supabase auth to create user with email `admin@nazar.security` and password `admin@1234`
- Since this is a demo/internal account, enable auto-confirm for this specific signup or create via service role
- Insert admin role into `user_roles` table for this user
- Create profile entry

**Approach:** Create an edge function `create-admin` that uses the service role key to create the admin user, then call it once. Alternatively, we can use a database migration to handle the role assignment after the user is created via the signup API.

**Simpler approach:** Since we need the admin user created programmatically:

1. Add a database function that auto-assigns admin role when a user signs up with email `admin@nazar.security`
2. Use the existing signup flow to create the account
3. Or better: Create a one-time setup in the `handle_new_user` trigger to assign admin role for this specific email

### 4. Auto-Redirect Authenticated Users (`src/pages/Index.tsx`)

- If `useAuth()` shows a logged-in user, redirect to `/dashboard`

---

## Files Modified

- `src/pages/Login.tsx` — add admin login section, fix post-auth redirect
- `src/pages/Index.tsx` — redirect authenticated users to dashboard
- `src/contexts/AuthContext.tsx` — add `adminSignIn` method that maps "admin" → admin email
- Database: update `handle_new_user` trigger to auto-assign admin role for `admin@nazar.security`
- Database migration: add trigger logic for admin auto-role

## Implementation Order

1. Database migration — update trigger to auto-assign admin role for admin email
2. Update Login page with admin login section and redirect fix
3. Update Index page with auth redirect
4. Create admin account (signup via edge function or direct)