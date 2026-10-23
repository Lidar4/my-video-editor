import { getSupabaseBrowserClient } from "@/lib/supabase";
import { aiPlanSchema, timelineClipSchema } from "@/lib/domain";
import { z } from "zod";

export const projectSnapshotSchema = z.object({
  project: z.object({ name: z.string().trim().min(1).max(160), description: z.string().max(2000), aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]) }),
  timeline: z.object({ durationMs: z.number().int().nonnegative(), tracks: z.array(z.object({ type: z.string(), name: z.string(), position: z.number().int().nonnegative(), clips: z.array(timelineClipSchema) })) }),
  aiPlan: aiPlanSchema.nullable().optional(),
});

export type ProjectSnapshot = z.infer<typeof projectSnapshotSchema>;
export type SaveResult = { revision: number; savedAt: string };

export class RevisionConflictError extends Error {
  constructor(message = "This project changed in another tab. Reload the latest revision before saving.") { super(message); this.name = "RevisionConflictError"; }
}

export async function loadProject(projectId: string) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Backend not configured");
  const { data, error } = await client.from("projects").select("id, workspace_id, name, description, aspect_ratio, status, current_revision, updated_at, timelines(*, timeline_tracks(*, timeline_clips(*)))").eq("id", projectId).single();
  if (error) throw error;
  return data;
}

export async function saveProjectRevision(projectId: string, expectedRevision: number, snapshot: ProjectSnapshot): Promise<SaveResult> {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Backend not configured");
  const parsed = projectSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) throw new Error(`Invalid project snapshot: ${parsed.error.issues[0]?.message ?? "validation failed"}`);
  const { data, error } = await client.rpc("save_project_revision", { target_project_id: projectId, expected_revision: expectedRevision, snapshot: parsed.data });
  if (error) {
    if (error.code === "P0001" || error.message.toLowerCase().includes("revision conflict")) throw new RevisionConflictError();
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.revision) throw new Error("The database did not return a saved revision");
  return { revision: row.revision, savedAt: row.saved_at ?? new Date().toISOString() };
}
