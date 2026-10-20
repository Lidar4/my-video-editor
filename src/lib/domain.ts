import { z } from "zod";

export const workspaceRoleSchema = z.enum(["owner", "editor", "viewer"]);
export const projectStatusSchema = z.enum(["draft", "active", "archived"]);
export const assetStatusSchema = z.enum(["pending", "ready", "failed", "deleted"]);
export const trackTypeSchema = z.enum(["video", "audio", "voiceover", "subtitle", "overlay"]);
export const jobStatusSchema = z.enum(["queued", "running", "succeeded", "failed", "cancelled"]);
export const generationStatusSchema = z.enum(["draft", "approved", "queued", "running", "succeeded", "failed", "not_configured"]);

export const projectSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(""),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]),
  status: projectStatusSchema,
  revision: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["video/mp4", "video/quicktime", "image/png", "image/jpeg", "audio/mpeg", "audio/wav", "application/x-subrip"]),
  byteSize: z.number().int().positive().max(524_288_000),
  durationMs: z.number().int().nonnegative().nullable(),
  storagePath: z.string().regex(/^workspaces\/[0-9a-f-]+\/projects\/[0-9a-f-]+\/assets\/[0-9a-f-]+\/source$/),
  status: assetStatusSchema,
});

export const timelineClipSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  assetId: z.string().uuid().nullable(),
  sourceInMs: z.number().int().nonnegative(),
  sourceOutMs: z.number().int().positive(),
  timelineStartMs: z.number().int().nonnegative(),
  timelineEndMs: z.number().int().positive(),
  transform: z.object({ x: z.number(), y: z.number(), scale: z.number().positive().max(20), rotation: z.number().min(-360).max(360), opacity: z.number().min(0).max(1) }),
  captionText: z.string().max(10_000).nullable(),
}).superRefine((clip, context) => {
  if (clip.sourceOutMs <= clip.sourceInMs) context.addIssue({ code: "custom", path: ["sourceOutMs"], message: "sourceOutMs must be greater than sourceInMs" });
  if (clip.timelineEndMs <= clip.timelineStartMs) context.addIssue({ code: "custom", path: ["timelineEndMs"], message: "timelineEndMs must be greater than timelineStartMs" });
});

export const sceneSchema = z.object({
  sceneId: z.string().regex(/^SC-[0-9]{2,}$/),
  durationMs: z.number().int().positive().max(86_400_000),
  characterIds: z.array(z.string().uuid()).max(20),
  location: z.string().trim().min(1).max(240),
  visualDescription: z.string().trim().min(1).max(4000),
  imagePrompt: z.string().max(4000),
  videoPrompt: z.string().max(4000),
  dialogue: z.string().max(10_000),
  voiceSettings: z.object({ provider: z.string().max(80), voiceId: z.string().max(160).optional(), language: z.string().max(20).optional() }),
  subtitleText: z.string().max(10_000),
  soundEffects: z.array(z.string().max(240)).max(50),
  requiredAssets: z.array(z.string().uuid()).max(50),
  generationStatus: generationStatusSchema,
});

export const aiPlanSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().trim().min(1).max(20_000),
  scenes: z.array(sceneSchema).min(1).max(200),
  totalDurationMs: z.number().int().positive(),
  approvalStatus: z.enum(["draft", "approved", "rejected"]),
  provider: z.string().max(80).nullable(),
  estimatedCostUsd: z.number().nonnegative().nullable(),
}).superRefine((plan, context) => {
  const total = plan.scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  if (total !== plan.totalDurationMs) context.addIssue({ code: "custom", path: ["totalDurationMs"], message: "totalDurationMs must equal the sum of scene durations" });
});

export const renderJobSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  revision: z.number().int().nonnegative(),
  status: jobStatusSchema,
  progress: z.number().int().min(0).max(100),
  outputAssetId: z.string().uuid().nullable(),
  retryCount: z.number().int().min(0).max(5),
  errorCode: z.string().max(120).nullable(),
});

export type Project = z.infer<typeof projectSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type TimelineClip = z.infer<typeof timelineClipSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type AiPlan = z.infer<typeof aiPlanSchema>;
export type RenderJob = z.infer<typeof renderJobSchema>;
