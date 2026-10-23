# MotionForge AI Studio

MotionForge AI is a human-centered AI video editing and animation studio interface. It combines a timeline-first editor workspace with a transparent AI Copilot that turns Bangla or English instructions into reviewable editing plans.

## Current prototype

The current repository contains a polished responsive frontend prototype with:

- Cinematic dark workspace using violet for creative AI actions and cyan for processing states.
- Studio navigation for Home, Projects, Assets, AI Studio, Templates and Render Queue.
- Project-aware top bar with save status, undo/redo, preview and export actions.
- Preview monitor with a cinematic anime scene, playback controls and aspect ratio control.
- Multi-track timeline for video, VFX, voiceover, music and captions.
- AI Copilot with natural-language prompt input, suggested commands, planned changes and approval-oriented UX.
- Inspector panel for transforms, opacity, blend mode and color controls.
- Import media modal with file selection and upload-state feedback.
- Export progress toast and responsive narrow-screen behavior.

The rendering, storage, AI provider and worker actions are presentation-level integrations in this first frontend milestone. The UI is designed so those capabilities can be connected without replacing the editor structure.

## Backend foundation

The branch now includes a browser-safe Supabase client, authentication gate, Zod domain validation, debounced autosave/revision contracts and ordered Supabase migrations with RLS and atomic persistence RPCs. Configure Supabase using [SUPABASE_SETUP.md](./SUPABASE_SETUP.md). Until public Supabase environment variables are supplied, the site intentionally shows `Backend not configured` and remains a preview; it does not fabricate authentication, upload or export success.

See [BACKEND_AUDIT.md](./BACKEND_AUDIT.md) for the current production boundary, security review and remaining phases.

## Free Story Lab

The editor now includes a zero-API-cost `Story Lab` workflow. Open it from the left navigation, choose a JPG/PNG/WebP reference image, write a Bengali or English scene prompt, select duration and aspect ratio, preview the cinematic camera move and download a WebM generated in the browser. This is a local photo animation rather than provider-backed AI video generation, so it works without buying an API key and does not pretend that a mock render is an AI result.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

For a production build:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

## Planned integration layers

The next modules can be added behind the current UI contracts:

- AI planner: Gemini, OpenAI or Ollama with a strict JSON schema.
- Media engine: FFmpeg/WebCodecs worker for trim, split, captions, overlays, chroma key, audio mixing and export.
- Storage: multipart or resumable uploads with thumbnails and media metadata.
- AI services: ComfyUI/AnimateDiff image-to-video, Edge-TTS, lip-sync and background removal.
- Asset fetcher: license-aware Pexels/Pixabay integration through server-side routes.
- Render queue: Redis/Celery/RQ or a provider-neutral job worker with progress events.

Never commit API keys or private environment files. Add provider credentials only through a secure deployment environment.
