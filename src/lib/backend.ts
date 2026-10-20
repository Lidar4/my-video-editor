export type BackendCapability = "auth" | "database" | "storage" | "aiPlanner" | "renderQueue";

export type BackendStatus = {
  configured: boolean;
  missing: string[];
  capabilities: Record<BackendCapability, boolean>;
};

/**
 * Reports configuration readiness only. It does not create a client or make
 * network requests, keeping the static-export frontend safe without secrets.
 */
export function getBackendStatus(env: NodeJS.ProcessEnv = process.env): BackendStatus {
  const supabaseReady = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  // These are core backend requirements. AI provider credentials are checked
  // separately so the UI can distinguish a connected backend from AI readiness.
  const required: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    ["SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY],
    ["RENDER_QUEUE_URL", env.RENDER_QUEUE_URL],
  ];

  const missing = required
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  return {
    configured: missing.length === 0,
    missing,
    capabilities: {
      auth: supabaseReady,
      database: supabaseReady,
      storage: supabaseReady,
      // A Supabase setup alone does not mean an AI model can be called.
      aiPlanner: Boolean(supabaseReady && env.AI_PROVIDER_API_KEY?.trim()),
      renderQueue: Boolean(env.RENDER_QUEUE_URL?.trim()),
    },
  };
}
