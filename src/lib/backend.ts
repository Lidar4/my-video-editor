export type BackendCapability = "auth" | "database" | "storage" | "aiPlanner" | "renderQueue";

export type BackendStatus = {
  configured: boolean;
  missing: string[];
  capabilities: Record<BackendCapability, boolean>;
};

/**
 * This intentionally reports readiness only. It does not create a client or
 * make a request, which keeps static export safe until a server-side adapter
 * and a real Supabase project are configured.
 */
export function getBackendStatus(env: NodeJS.ProcessEnv = process.env): BackendStatus {
  const required = {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serverSecret: env.SUPABASE_SERVICE_ROLE_KEY,
    renderQueueUrl: env.RENDER_QUEUE_URL,
  };
  const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
  const configured = missing.length === 0;

  return {
    configured,
    missing,
    capabilities: {
      auth: Boolean(required.supabaseUrl && required.supabaseAnonKey),
      database: Boolean(required.supabaseUrl && required.supabaseAnonKey),
      storage: Boolean(required.supabaseUrl && required.supabaseAnonKey),
      aiPlanner: Boolean(required.serverSecret),
      renderQueue: Boolean(required.renderQueueUrl),
    },
  };
}
