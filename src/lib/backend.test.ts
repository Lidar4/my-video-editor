import { describe, expect, it } from "vitest";
import { getBackendStatus } from "@/lib/backend";
import { projectSchema, timelineClipSchema, aiPlanSchema } from "@/lib/domain";

const uuid = "00000000-0000-4000-8000-000000000001";

const scene = {
  sceneId: "SC-01", durationMs: 1000, characterIds: [], location: "forest", visualDescription: "A quiet forest", imagePrompt: "forest", videoPrompt: "slow forest", dialogue: "", voiceSettings: { provider: "not_configured" }, subtitleText: "", soundEffects: [], requiredAssets: [], generationStatus: "draft" as const,
};

describe("backend capability detection", () => {
  it("enables auth, database and storage independently from worker credentials", () => {
    const status = getBackendStatus({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable" });
    expect(status.configured).toBe(true);
    expect(status.capabilities.auth).toBe(true);
    expect(status.capabilities.database).toBe(true);
    expect(status.capabilities.storage).toBe(true);
    expect(status.capabilities.renderQueue).toBe(false);
  });
  it("reports missing public configuration", () => {
    expect(getBackendStatus({}).capabilities.auth).toBe(false);
  });
});

describe("domain validation", () => {
  it("rejects an invalid project payload", () => {
    expect(projectSchema.safeParse({ id: "bad", name: "" }).success).toBe(false);
  });
  it("rejects invalid clip ranges", () => {
    expect(timelineClipSchema.safeParse({ id: uuid, trackId: uuid, assetId: null, sourceInMs: 10, sourceOutMs: 10, timelineStartMs: 0, timelineEndMs: 0, transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }, captionText: null }).success).toBe(false);
  });
  it("rejects an AI plan with mismatched scene duration", () => {
    expect(aiPlanSchema.safeParse({ projectId: uuid, prompt: "make a scene", scenes: [scene], totalDurationMs: 2000, approvalStatus: "draft", provider: null, estimatedCostUsd: null }).success).toBe(false);
  });
});
