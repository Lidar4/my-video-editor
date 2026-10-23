# ChatGPT-এর জন্য Copy-Ready Backend Continuation Prompt

নিচের সম্পূর্ণ অংশটি copy করে ChatGPT-কে দিন:

```text
তুমি একজন Senior Full-Stack Engineer, Backend Architect, Database Engineer, Security Engineer এবং AI Systems Engineer হিসেবে কাজ করবে।

আমার project:
- GitHub repository: https://github.com/Lidar4/my-video-editor
- Working branch: manus/motionforge-ai-studio
- Current latest commit: a731605 feat: add backend audit and data contracts
- Live frontend: https://motionforge-ai-studio.netlify.app/
- Product: MotionForge AI Studio — AI-powered video editor and AI video creation platform

## গুরুত্বপূর্ণ কাজের নিয়ম

1. প্রথমে repository এবং branch audit করবে। অনুমান করে কোনো feature complete বলবে না।
2. বর্তমান UI অকারণে redesign করবে না। Existing structure পুনর্ব্যবহার করবে।
3. `main` branch-এ merge করবে না। কাজ শুধু `manus/motionforge-ai-studio` branch-এ করবে।
4. কোনো secret, API key, service-role key বা private environment file Git-এ commit করবে না।
5. কোনো feature বাস্তবে কাজ না করলে সেটিকে mock, local-only, not configured বা incomplete হিসেবে দেখাবে।
6. প্রতিটি phase-এর পরে typecheck, build এবং প্রাসঙ্গিক tests চালাবে। Failed test ঠিক না করে পরের phase-এ যাবে না।
7. বড় পরিবর্তনের আগে ছোট, যাচাইযোগ্য এবং rollback-friendly commit করবে।
8. কোনো destructive database migration, data deletion বা production deployment করার আগে স্পষ্ট confirmation চাইবে।
9. API key frontend-এ রাখবে না। `NEXT_PUBLIC_` variable-এ কখনো service-role key বা provider secret রাখবে না।
10. বর্তমান Netlify deployment static frontend হিসেবে চলছে। `next.config.ts`-এ `output: "export"` এবং `trailingSlash: true` আছে। তাই long-running backend কাজ Netlify static page-এর ভিতরে চালাবে না।

## বর্তমান repository-তে ইতিমধ্যে যা আছে

বর্তমান branch-এ একটি professional frontend foundation আছে:

- Next.js 16 + React 19 + TypeScript
- `src/components/studio/studio-app.tsx`: main studio workspace
- `src/components/studio/director-panel.tsx`: AI Director structured planning UI
- Cinematic dark UI, violet AI accent, cyan processing accent
- Sidebar navigation: Home, Projects, Assets, AI Director, Characters, Templates, Render Queue, Settings
- Project-aware top bar, saved status, undo/redo presentation, preview এবং export controls
- Preview monitor এবং playback UI
- Multi-track timeline presentation:
  - video
  - VFX overlay
  - voiceover
  - music
  - captions
- Right inspector:
  - transform
  - position
  - scale
  - rotation
  - opacity
  - blend mode
  - color controls
- Import media modal আছে, কিন্তু বর্তমানে file bytes upload করে না; browser state-এ filename রাখে।
- AI Copilot আছে, কিন্তু বর্তমানে real AI provider call করে না।
- AI Director আছে, structured scene plan preview দেখায় এবং provider status `Not configured` দেখায়।
- Render/export progress toast আছে, কিন্তু real FFmpeg export বা output file তৈরি করে না।
- Responsive layout এবং reduced-motion support আছে।
- `public/manus-routes.json` route manifest আছে।
- Netlify production site বর্তমানে HTTPS-এ live।

## বর্তমান backend audit-এর সত্য অবস্থা

বর্তমানে repository-তে এখনো নেই:

- Supabase project connection
- Supabase client
- Supabase Auth flow
- Database connection
- Applied database migration
- Private storage bucket connection
- Real signed upload flow
- Server-side API routes বা Edge Functions
- Background queue
- Persistent render worker
- FFmpeg processing
- Real AI provider adapter
- Real TTS/STT/image/video generation
- Production monitoring
- Unit, integration বা security test suite

সুতরাং এগুলোকে complete বা production-ready বলবে না।

## ইতিমধ্যে backend foundation হিসেবে যা তৈরি করা হয়েছে

### 1. Audit
`BACKEND_AUDIT.md`-এ বর্তমান architecture, risk, deployment boundary, recommended data model, RLS requirements, API/job boundary এবং phased implementation plan লেখা আছে।

### 2. Runtime schemas
`src/lib/domain.ts`-এ Zod schema এবং TypeScript types আছে:

- workspace role
- project status
- asset status
- track type
- render job status
- generation status
- project
- media asset
- timeline clip
- AI scene
- AI plan
- render job

Timeline clip validation source and timeline duration consistency যাচাই করে। AI plan validation scene duration sum এবং total duration consistency যাচাই করে।

### 3. Backend readiness boundary
`src/lib/backend.ts`-এ environment-aware `getBackendStatus()` আছে। এটি credentials না থাকলে missing variables এবং capability status জানায়। এটি fake success বা fake backend connection তৈরি করে না।

Required environment names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only
- `RENDER_QUEUE_URL`
- provider secrets server/worker secret manager-এ থাকবে

### 4. Database migration draft
`supabase/migrations/0001_motionforge_foundation.sql`-এ PostgreSQL/Supabase schema এবং RLS draft আছে। এতে আছে:

- profiles
- workspaces
- workspace_members
- projects
- project_revisions
- media_assets
- timelines
- timeline_tracks
- timeline_clips
- characters
- ai_plans
- render_jobs
- private `motionforge-media` storage bucket
- workspace membership helper functions
- RLS policies
- viewer/editor/owner role boundary

খুব গুরুত্বপূর্ণ: migration file তৈরি হয়েছে, কিন্তু কোনো Supabase project-এ apply করা হয়নি। Apply করার আগে schema review, Supabase project confirmation এবং migration validation করো।

### 5. Environment template
`.env.example` আছে। এতে শুধু empty variable names আছে; কোনো বাস্তব secret নেই।

## Hosting architecture

বর্তমান recommended architecture:

Browser / Netlify static frontend
  ├─ Supabase Auth
  ├─ Supabase Postgres + RLS
  ├─ Supabase private Storage + signed URLs
  ├─ Supabase Edge Functions for short authenticated operations
  └─ Separate persistent worker for FFmpeg, AI generation and long-running jobs

Netlify static export-এর ভিতরে FFmpeg, provider API call, service-role key বা long-running request রাখবে না।

## এখন তোমার কাজ: ধাপে ধাপে backend বাস্তবায়ন

### Phase 1 — Audit verification and backend contract hardening

1. প্রথমে repository files পড়ে বর্তমান state verify করো।
2. `BACKEND_AUDIT.md`, `src/lib/domain.ts`, `src/lib/backend.ts` এবং migration পড়ো।
3. Zod schema-গুলোর missing boundary খুঁজে বের করো।
4. Unit tests যোগ করো:
   - invalid MIME type reject
   - file size > 500 MB reject
   - timeline source range invalid হলে reject
   - timeline end <= start হলে reject
   - AI scene duration mismatch reject
   - AI plan total duration mismatch reject
   - render progress 0–100-এর বাইরে reject
5. Test script যোগ করো, যেমন `pnpm test`।
6. Migration SQL static review করো এবং policy/security সমস্যা থাকলে আগে fix করো।
7. Supabase project না থাকলে migration apply করার ভান করবে না।

### Phase 2 — Supabase project and authenticated persistence

Supabase project credentials secure environment-এ পাওয়া গেলে:

1. Browser-safe Supabase client এবং server-only Supabase client তৈরি করো।
2. Auth sign-in/sign-up/sign-out/session recovery flow যোগ করো।
3. First user-এর জন্য workspace bootstrap করো।
4. Project create/read/update/archive implement করো।
5. Project revision snapshot এবং optimistic revision check implement করো।
6. Autosave debounce যোগ করো।
7. Two-tab overwrite প্রতিরোধ করো।
8. Missing backend configuration হলে UI-তে স্পষ্ট `Backend not configured` state দেখাও।
9. Authenticated user ছাড়া project data return করবে না।
10. Service-role client browser bundle-এ ঢুকেছে কি না verify করো।

### Phase 3 — Secure media lifecycle

1. Private Supabase Storage bucket ব্যবহার করো।
2. Signed upload URL বা resumable upload flow implement করো।
3. File type, extension, size, filename এবং detected metadata validate করো।
4. Allowed types:
   - MP4
   - MOV
   - PNG
   - JPG/JPEG
   - MP3
   - WAV
   - SRT
5. Maximum size 500 MB রাখো, প্রয়োজন অনুযায়ী configurable করো।
6. Deterministic path ব্যবহার করো:
   `workspaces/{workspace_id}/projects/{project_id}/assets/{asset_id}/source`
7. User-provided arbitrary storage path গ্রহণ করো না।
8. Upload start, upload complete, failed upload ও cleanup state রাখো।
9. Thumbnail এবং media duration metadata extraction রাখো।
10. Frontend import modal-কে real asset row এবং signed playback URL-এর সঙ্গে connect করো।

### Phase 4 — Timeline editing contract

1. Timeline operation types তৈরি করো:
   - add
   - trim
   - split
   - move
   - delete
   - layer
   - caption-edit
2. প্রতিটি operation Zod schema দিয়ে validate করো।
3. Track type এবং clip duration consistency enforce করো।
4. Revision-safe save implement করো।
5. Undo/redo command history persist বা reconstruct করার ব্যবস্থা করো।
6. Timeline UI-কে real persisted state-এর সঙ্গে connect করো।
7. Media engine না থাকলে UI-তে `Editing engine not connected` দেখাও; fake video mutation দেখাবে না।

### Phase 5 — AI Director provider adapter

1. Server-only provider interface তৈরি করো:
   - `planFromPrompt`
   - `validatePlan`
   - `estimateUsage`
2. Provider-specific code UI বা browser bundle-এ রাখবে না।
3. Structured output অবশ্যই `aiPlanSchema` validate করবে।
4. Scene fields রাখো:
   - scene ID
   - duration
   - character IDs
   - location
   - visual description
   - image prompt
   - video prompt
   - dialogue
   - voice settings
   - subtitle text
   - sound effects
   - required assets
   - generation status
5. Plan প্রথমে `draft` হবে।
6. User approval ছাড়া destructive timeline change বা provider job শুরু করবে না।
7. Provider না থাকলে `Not configured` return করবে; fake plan generation result বা fake job ID তৈরি করবে না।
8. Rate limit, timeout, usage/cost metadata এবং meaningful error handling যোগ করো।

### Phase 6 — Render queue and worker

1. API request-এ FFmpeg চালাবে না।
2. `render_jobs` থেকে durable job create করো।
3. Idempotency key বাধ্যতামূলক করো।
4. Worker job claim করবে এবং status transition রাখবে:
   `queued -> running -> succeeded | failed | cancelled`
5. Progress 0–100 validate করো।
6. Retry সর্বোচ্চ সীমা রাখো।
7. Timeout এবং failure recovery রাখো।
8. FFmpeg দিয়ে video, audio, captions, overlays একত্রে render করো।
9. Output private storage-এ রাখো।
10. Output object verify না হওয়া পর্যন্ত `succeeded` দেবে না।
11. Signed download URL তৈরি করো।
12. Frontend Render Queue status poll বা realtime subscription দিয়ে দেখাও।

### Phase 7 — Security, observability and production quality

1. RLS integration tests তৈরি করো।
2. Viewer editor বা owner-only operation করতে পারছে কি না test করো।
3. Cross-workspace access test করো।
4. Upload path traversal এবং MIME spoofing test করো।
5. Provider timeout, invalid output এবং quota error test করো।
6. Request ID, structured logging এবং error monitoring যোগ করো।
7. Secret scanning এবং dependency audit চালাও।
8. File retention এবং orphan cleanup implement করো।
9. Cost safeguard এবং provider budget implement করো।
10. Production deploy-এর আগে environment validation চালাও।

## Required final response format

প্রতিটি কাজ শেষে বাংলায় উত্তর দেবে এবং এই format অনুসরণ করবে:

1. কী তৈরি হয়েছে
2. কোন files পরিবর্তন হয়েছে
3. কোন feature বাস্তবে কাজ করে
4. কোন feature এখনো mock/not configured/incomplete
5. কোন tests চালানো হয়েছে
6. কোন tests pass/fail করেছে
7. কোন credentials বা account setup বাকি
8. migration apply হয়েছে কি না
9. deployment status
10. পরবর্তী ধাপ

কোনো কাজ complete বলবে না যদি বাস্তবে test না করা থাকে।

এখন প্রথমে audit verification এবং Phase 1 test/schema hardening করো। তারপর থামো এবং ফলাফল জানাও। আমার অনুমতি ছাড়া Supabase migration apply, production database change, main merge, production deployment বা secret পরিবর্তন করো না।
```
