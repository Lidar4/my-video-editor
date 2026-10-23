# Supabase setup for MotionForge AI Studio

The frontend remains a Next.js static export hosted on Netlify. Supabase provides browser-safe Auth, Postgres and private Storage through the publishable/anon key plus RLS. Long-running rendering and provider jobs are intentionally not part of this phase.

## 1. Create the project

Create a Supabase project and keep the project URL and public publishable key available. The legacy anon key is also supported. Never use the service-role key in the browser or in `NEXT_PUBLIC_*` variables.

## 2. Apply migrations in order

Run these files using the Supabase migration workflow:

1. `supabase/migrations/0001_motionforge_foundation.sql`
2. `supabase/migrations/0002_security_and_persistence.sql`

The second migration is additive. It adds indexes, the profile trigger, secure workspace bootstrap, atomic optimistic-revision save RPC and safer storage-path validation. It should not be substituted for the first migration.

Before applying to an existing production database, inspect the migration history and take a backup. The repository has not applied these migrations to a live Supabase project in this environment.

## 3. Frontend environment variables

Set these in local `.env.local` and in Netlify Site configuration. Use placeholders only in Git:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
# Legacy alternative:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

The app reports `Backend not configured` until URL and one public key are present. Authentication, database and storage readiness are evaluated separately from render-worker readiness.

## 4. Auth URLs

For a Netlify site, set the Supabase Auth URL configuration to the deployed HTTPS origin:

- Site URL: `https://motionforge-ai-studio.netlify.app`
- Redirect URL: `https://motionforge-ai-studio.netlify.app`
- Local development redirect URL: `http://localhost:3000`

Configure email confirmation according to the product policy. Password-reset requests use the current origin as the redirect target. Confirm the exact URL in the Supabase dashboard before production use.

## 5. Run and validate locally

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Without Supabase credentials, the auth gate intentionally stays in preview mode and no live database request is made. This is expected and is not an end-to-end backend test.

## 6. What is implemented in this phase

- Supabase browser client with publishable-key and anon-key compatibility.
- Sign up, sign in, sign out, session restore, auth-state listener and password-reset request UI.
- Secure workspace bootstrap RPC invocation after a restored session.
- Typed project snapshot validation.
- Atomic `save_project_revision` RPC contract with expected-revision conflict handling.
- Debounced autosave controller with explicit saving/saved/failed/conflict states.
- Foundation schema and RLS migrations.

## 7. Still requires external setup or later phases

The live Supabase project, migration application, RLS integration tests against that project, project-list UI wiring, signed media uploads, AI providers, FFmpeg worker, render queue, monitoring and production browser tests are not claimed complete until configured and verified.
