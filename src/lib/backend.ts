export type BackendCapability = "auth" | "database" | "storage" | "aiPlanner" | "renderQueue";

export type BackendStatus = {
  configured: boolean;
  missing: string[];
  capabilities: Record<BackendCapability, boolean>;
};

/** Reports configuration readiness only; it never makes network requests. */
export function getBackendStatus(env: Record<string, string | undefined> = process.env): BackendStatus {
  const publicKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseReady = Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim() && publicKey?.trim());
  const required: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL],
    [env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY", publicKey],
  ];
  const missing = required.filter(([, value]) => !value?.trim()).map(([name]) => name);
  return {
    configured: supabaseReady,
    missing,
    capabilities: {
      auth: supabaseReady,
      database: supabaseReady,
      storage: supabaseReady,
      aiPlanner: Boolean(supabaseReady && env.AI_PROVIDER_API_KEY?.trim()),
      renderQueue: Boolean(env.RENDER_QUEUE_URL?.trim()),
    },
  };
}
