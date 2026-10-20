# MotionForge AI Studio — Backend Audit

**Repository:** `Lidar4/my-video-editor`  
**Branch:** `manus/motionforge-ai-studio`  
**Audit date:** 2026-10-21  
**Scope:** repository code, dependencies, current Netlify/static-export deployment, backend readiness and production architecture.

## Executive finding

The repository currently contains a polished Next.js 16 frontend prototype, not a backend-enabled application. There are no API routes, server actions, authentication flows, database clients, migrations, storage integrations, background workers, provider adapters or render pipeline. The current Netlify deployment is a successful static export, so it is suitable for serving the UI but cannot safely host the long-running media and AI work described in the product brief.

The product should be evolved in layers rather than embedding secrets or long-running jobs in the frontend. Recommended target architecture:

```text
Browser / Netlify static frontend
  ├─ Supabase Auth (session and identity)
  ├─ Supabase Postgres + RLS (workspace/project/plan/timeline/job metadata)
  ├─ Supabase private Storage (media and render outputs via signed URLs)
  ├─ Supabase Edge Functions (short, authenticated orchestration endpoints)
  └─ Render / worker service (FFmpeg, media processing and provider jobs)
```

The browser must never receive provider secrets. Long media processing must not run inside a normal API request or static Netlify page.

## Audit evidence

### Repository and runtime

The branch contains `src/app/page.tsx`, `src/app/layout.tsx`, the studio components, CSS, `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `public/manus-routes.json` and documentation. The package has only the frontend runtime dependencies: Next.js, React, React DOM, Lucide React, Next Themes and TypeScript tooling. There is no Supabase SDK, database driver, validation library, queue client, FFmpeg wrapper or object-storage SDK.

`next.config.ts` currently uses `output: "export"` and `trailingSlash: true`. This produces `out/index.html` and static assets for Netlify. It also means Next server routes, server actions and runtime request handlers cannot be added without changing the hosting model. Keep static export while backend calls are externalized to Supabase and a worker; remove static export only if the app later needs a dedicated Next server runtime.

### Current feature boundary

The preview monitor, playback buttons, timeline, inspector controls, AI Copilot, AI Director, upload modal and render toast are UI/state prototypes. They use React state and sample data. They do not persist to a user account, upload bytes, modify media, call an AI provider, enqueue a render job or produce a final video.

The AI Director already presents a structured local plan preview and marks providers as `Not configured`. This is the correct safety boundary to preserve until a real server-side provider is connected. The current import flow stores selected file names in browser state only. It does not transfer files to storage. The current export flow presents local progress and must not be labeled as a successful video export.

### Deployment boundary

Netlify is serving the current static export successfully over HTTPS. The deployment has no Netlify Functions, Edge Functions, redirects or header rules. This is compatible with a frontend-only phase, but not sufficient for authentication callbacks, private file authorization, provider secrets, FFmpeg processing or long-running render jobs. Netlify can remain the frontend host while Supabase and a separate worker provide backend capabilities.

## Recommended data model

Use PostgreSQL UUID primary keys and timestamps with server defaults. Every tenant-owned row should carry a `workspace_id` and be protected by RLS. Do not trust a workspace or user ID supplied by the browser; derive identity from the authenticated Supabase JWT inside policies and server functions.

### Core entities

- `profiles`: one row per auth user; display name, avatar, preferred language and created/updated timestamps.
- `workspaces`: user/team-owned editing spaces; name, slug, owner and plan metadata.
- `workspace_members`: workspace membership and role (`owner`, `editor`, `viewer`).
- `projects`: title, description, aspect ratio, status, current revision, workspace owner and timestamps.
- `project_revisions`: immutable or append-only project snapshots for recovery and audit history.
- `media_assets`: logical asset metadata, MIME type, byte size, duration, checksum, storage path, thumbnail path and upload status.
- `project_assets`: project-to-asset relation with ordering and role.
- `timelines`: one current timeline per project plus revision metadata.
- `timeline_tracks`: track type (`video`, `audio`, `voiceover`, `subtitle`, `overlay`) and order.
- `timeline_clips`: asset reference, track reference, source in/out, timeline start/end, transform, audio and caption metadata.
- `characters`: reusable character identity, appearance, clothing, voice profile and workspace ownership.
- `character_references`: private reference asset relation and intended use.
- `ai_plans`: prompt, normalized structured JSON, validation status, approval status, provider metadata and cost estimate.
- `ai_plan_scenes`: optional queryable scene rows derived from the plan for UI and execution tracking.
- `render_jobs`: project revision, status, progress, worker ID, retry count, error code and output asset relation.
- `provider_configs`: server-side provider name and non-secret settings; secrets belong in deployment secret storage, not this table.
- `audit_events`: security-sensitive actions such as approval, export, deletion, membership changes and provider-job transitions.

## RLS and security requirements

RLS must be enabled on every workspace-owned table. A user can read or mutate a row only when a membership row exists for the current authenticated user and the requested role permits the operation. Viewer members may read projects and assets but cannot mutate timelines, approve AI plans or create render jobs. Only owners can change members, provider configuration or delete a workspace.

Storage buckets should be private. Use deterministic paths such as `workspaces/{workspace_id}/projects/{project_id}/assets/{asset_id}/source` and generate short-lived signed upload/download URLs after authorization. Validate MIME type, extension, byte size and detected media metadata. Never use a user-provided path directly.

Provider keys and webhook signing secrets belong in Supabase Edge Function secrets or the worker platform's encrypted environment. Do not expose them in `NEXT_PUBLIC_*` variables, browser bundles, database rows or Git. Add request IDs, structured logs, timeouts, idempotency keys and rate limits around all provider and render operations.

## API and job boundaries

Short authenticated operations can be Supabase Edge Functions or a small server runtime:

- `project-create`, `project-save`, `project-load`, `project-recover`
- `media-create-upload-session`, `media-complete-upload`, `media-delete`
- `ai-plan-create`, `ai-plan-validate`, `ai-plan-approve`
- `render-job-create`, `render-job-cancel`, `render-job-retry`, `render-job-status`

The client should receive a job ID and subscribe/poll for status. It should never wait for FFmpeg, TTS or video generation in the request that creates the job. The worker must claim jobs with an idempotency guard, update progress, write outputs to private storage and mark the job `succeeded` only after the output object and metadata have been verified.

## Risks and mitigations

| Risk | Current state | Mitigation |
|---|---|---|
| False production claims | UI implies local progress/export | Add explicit capability labels and connect success states only to verified backend status. |
| Static export/API mismatch | `output: "export"` is enabled | Keep backend external to Netlify; use Supabase Functions and a separate worker. |
| Unauthorized project access | No auth or persistence exists | Supabase Auth plus workspace membership RLS on every query and storage path. |
| Large file request failures | Browser only holds file names | Resumable/signed uploads directly to private storage with server-side limits. |
| Long render timeout | No worker exists | Persistent queue and worker with retry, timeout and dead-letter state. |
| Provider key leakage | No provider layer exists | Server-only adapter interface and encrypted environment variables. |
| Duplicate expensive jobs | No idempotency exists | Stable request/job keys, unique constraints and provider usage budgets. |
| Lost edits | No save/recovery exists | Revision snapshots, optimistic version checks and autosave debounce. |

## Phased implementation plan

### Phase 1 — backend contract and project data

Add schema types and runtime validation with Zod; add Supabase browser/server clients behind environment checks; create migrations for profiles, workspaces, projects, revisions, assets, timelines, plans and render jobs; enable RLS and write policy tests. The frontend should show a clear `Backend not configured` state when required environment variables are absent.

### Phase 2 — authenticated project persistence

Add Supabase Auth UI, workspace bootstrap, project create/load/save, revision snapshots and recovery. Replace sample project title/status with database-backed state. Add optimistic revision checks so two tabs do not silently overwrite each other.

### Phase 3 — secure media lifecycle

Add signed upload sessions, private storage buckets, MIME/size validation, upload completion, metadata extraction, thumbnails and cleanup. Connect the import modal to real asset rows and signed playback URLs.

### Phase 4 — editing contract

Define and validate timeline operations (`add`, `trim`, `split`, `move`, `delete`, `layer`, `caption-edit`). Persist operations as revision-safe commands and add unit tests for duration, ordering and track constraints before connecting a media worker.

### Phase 5 — AI Director provider layer

Create a server-only provider adapter interface. Validate prompts into the structured scene schema, store plans as drafts, require explicit approval and record provider usage/cost metadata. Return `Not configured` when no provider is enabled; never fabricate generation results.

### Phase 6 — render and generation workers

Deploy a persistent worker with FFmpeg/WebCodecs-compatible processing, a queue, progress events, retry/backoff, cancellation, private output storage and verified download. Add adapters one at a time for image, video, TTS and speech-to-text providers.

### Phase 7 — production hardening

Add unit, integration, RLS/security and browser tests; structured logging and error monitoring; quota/cost safeguards; retention cleanup; deployment environment validation; and disaster-recovery documentation.

## Credentials and missing setup

No Supabase project, database URL, anon key, service-role key, storage bucket, provider key, queue endpoint or worker deployment is present in the repository. These must be connected through secure environment configuration before real backend functionality can be claimed. The service-role key must never be added to the frontend or committed to Git.

## Audit conclusion

The current UI foundation is a useful frontend milestone, but backend work is substantially outstanding. Phase 1 has now been started safely: validated TypeScript domain contracts, an environment-aware backend status boundary, a Supabase/PostgreSQL schema migration and RLS policy draft are present in the branch. The migration has not been applied because no Supabase project or credentials are connected. Real authentication, persistence, uploads, AI generation and rendering must remain incomplete until credentials are connected and each flow has an end-to-end test.
