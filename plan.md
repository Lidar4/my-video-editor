# MotionForge free-first completion plan

## Goal

Deliver the maximum useful product without paid APIs: a browser-local photo-to-animation Story Lab that accepts an image and Bengali/English prompt, creates a structured scene plan, previews a Ken Burns-style animated scene, and exports a WebM video directly in the browser. Preserve the existing MotionForge editor and static Netlify architecture.

## Design

Three possible styles: cinematic dark control room (0.62), playful storyboard canvas (0.08), bright creator dashboard (0.30). Chosen style: cinematic dark control room.

- Design movement: cinematic production software with a calm, focused control-room mood.
- Core principles: clear preview-first workflow, honest capability labels, low-friction controls, reversible actions.
- Color philosophy: deep navy reduces fatigue; violet signals imagination; cyan signals active media; amber marks configuration or attention.
- Layout paradigm: left workflow rail, central live stage, right recipe inspector.
- Signature elements: scene-stage glow, storyboard scene cards, progress/status pills.
- Interaction philosophy: every expensive or destructive action is explicit; local render feedback never pretends to be AI generation.
- Animation: slow camera motion, subtle parallax, restrained transitions, reduced-motion fallback.
- Typography: Inter for interface, Noto Sans Bengali for user-facing Bengali copy.
- Brand essence: a transparent AI-assisted animation studio for episodic creators; cinematic, practical, trustworthy.
- Brand voice: direct and reassuring. Example: “একটি ছবি দিন, দৃশ্যের মুড লিখুন।” / “লোকাল render সম্পন্ন—এটি API-generated animation নয়।”
- Signature color: violet-to-cyan gradient.

## Structure

- `src/components/story-lab/free-story-lab.tsx`: client-only photo/prompt workflow and browser WebM renderer.
- `src/lib/local-renderer.ts`: canvas animation and MediaRecorder export contract.
- `src/app/globals.css`: Story Lab visual treatment and responsive states.
- Existing Supabase/auth modules remain the future cloud persistence layer.

The local workflow must not claim external AI generation. AI provider adapters, FFmpeg worker, TTS and long-form server rendering remain explicit future capabilities requiring credentials or local infrastructure.
