# MindLab — Psychology Academy

A responsive Next.js frontend for a psychology-learning platform, with Supabase email magic-link authentication scaffold and a Supabase schema for user progress and notes. The app runs locally without Supabase; in that mode, progress and notes are stored in the browser.

## Requirements
- Node.js 18.17+ (Node 20 LTS recommended)
- A Supabase project if you want accounts and server-backed user data
- A hosting account (Vercel is a straightforward option) for a public HTTPS URL

## Run locally
1. Extract this project.
2. In the project folder run:
   ```bash
   npm install
   cp .env.example .env.local
   npm run dev
   ```
3. Open `http://localhost:3000`.

Without Supabase credentials, the sign-in modal explains that configuration is needed; course browsing, lessons, quizzes, local progress and notes work without an account.

## Configure Supabase
1. Create a project at https://supabase.com.
2. In Supabase Project Settings → API, copy the Project URL and anon/public key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
3. In the Supabase SQL Editor, run `supabase/schema.sql`. Row-level security policies ensure users can access only rows with their own `user_id`.
4. In Authentication → URL Configuration, add your local URL `http://localhost:3000` and your deployed URL to allowed redirect URLs.
5. Restart `npm run dev`.

The included email sign-in uses Supabase OTP/magic links. After sign-in, the app loads progress and notes from Supabase and writes changes to the `user_progress` and `user_notes` tables. Browser-local copies are also retained as a fallback. Test the configured project end-to-end before relying on it for important data.

## Deploy for a public link
1. Push this folder to a private or public GitHub repository.
2. Import the repository into Vercel (https://vercel.com).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in Vercel if using Supabase.
4. Deploy. Vercel will give you a public `https://...vercel.app` URL.
5. Add that URL to Supabase's allowed redirect URLs and redeploy if needed.

## Current scope
- Responsive dashboard and course library
- 12 modules, 36 lessons, quizzes, completion states and reflection journal
- Local persistence for progress and notes
- Supabase magic-link authentication UI
- Supabase SQL schema with row-level security for future cloud persistence

## Important
This is an application starter, not a deployment. No hosting account or Supabase project is connected by this package, so it does not yet have a live public URL. Psychology content is educational and not a diagnostic or treatment service.
