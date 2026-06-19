# VideoFlow — Supabase setup (one-time)

Follow these steps, then send Claude the two values from step 3.

## 1. Create the project
1. Go to **https://supabase.com** → sign in → **New project**.
2. Name it `videoflow`, pick a strong database password (save it somewhere), choose the region closest to you, and create it. Wait ~2 min for it to provision.

## 2. Run the database schema
1. In the project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/schema.sql` from this repo, copy the whole file, paste it in, and click **Run**.
3. You should see "Success. No rows returned."

## 3. Copy your API keys  ← send these to Claude
1. Go to **Project Settings → API**.
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon / public** key (a long string under "Project API keys")
3. Paste both to Claude. (The anon key is safe to expose in a browser app — Row-Level Security protects the data.)

## 4. Enable login methods
Open **Authentication → Providers**:
- **Email** — already on. (For magic links, no extra setup needed.)
- **Google** — toggle on. You'll need a Google OAuth client ID + secret from
  https://console.cloud.google.com (Claude will walk you through it when we get there).

Under **Authentication → URL Configuration**, add these to **Redirect URLs**:
- `http://localhost:5173`
- `https://videoflow-sigma.vercel.app`

## 5. Production env vars (Claude will do this)
The same two values get added to Vercel so the live site can talk to Supabase:
`vercel env add VITE_SUPABASE_URL` and `vercel env add VITE_SUPABASE_ANON_KEY`.

---
Until these values are set, the app keeps working in **local-only mode** (browser
storage, no login). Cloud sync + collaboration light up once the keys are in.
