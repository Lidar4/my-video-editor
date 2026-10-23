"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, LogIn, Mail, ShieldCheck } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { getBackendStatus } from "@/lib/backend";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import StudioApp from "@/components/studio/studio-app";

export default function AuthGate() {
  const status = getBackendStatus();
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(status.capabilities.auth);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setSession(data.session); setLoading(false); }
      if (data.session) void supabase.rpc("bootstrap_user_workspace").then(({ error }) => { if (error && mounted) setError(error.message); });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : mode === "signup"
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    setMessage(mode === "signup" ? "Account created. Check your email if confirmation is enabled." : mode === "reset" ? "Password reset instructions have been sent if the account exists." : "Signed in successfully.");
  }

  if (!status.capabilities.auth || !supabase) {
    return <><div className="backend-banner"><AlertCircle size={15} /><span>Backend not configured — frontend preview mode only. Add Supabase URL and publishable/anon key to enable authentication and persistence.</span></div><StudioApp /></>;
  }
  if (loading) return <div className="auth-loading"><Loader2 className="spin" size={22} /> Restoring secure session…</div>;
  if (session) return <StudioApp session={session} />;

  return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><ShieldCheck size={18} /> MotionForge secure workspace</div><h1>{mode === "reset" ? "Reset your password" : mode === "signup" ? "Create your workspace" : "Welcome back"}</h1><p>{mode === "reset" ? "Enter your email and we will send a secure reset link." : "Sign in to save projects, revisions and workspace data securely."}</p><form onSubmit={submit}><label>Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>{mode !== "reset" && <label>Password<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>}{error && <div className="auth-error"><AlertCircle size={14} /> {error}</div>}{message && <div className="auth-success"><CheckCircle2 size={14} /> {message}</div>}<button className="auth-submit" type="submit" disabled={busy}>{busy ? <Loader2 className="spin" size={15} /> : mode === "reset" ? <Mail size={15} /> : <LogIn size={15} />}{busy ? "Please wait…" : mode === "reset" ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}</button></form><div className="auth-links">{mode !== "login" && <button type="button" onClick={() => setMode("login")}>Back to sign in</button>}{mode === "login" && <><button type="button" onClick={() => setMode("signup")}>Create account</button><button type="button" onClick={() => setMode("reset")}>Forgot password?</button></>}</div></section></main>;
}
