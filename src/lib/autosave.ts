export type AutosaveState = "idle" | "scheduled" | "saving" | "saved" | "failed" | "conflict";

export type AutosaveController<T> = {
  update: (value: T) => void;
  flush: () => Promise<void>;
  cancel: () => void;
  getState: () => AutosaveState;
};

export function createAutosaveController<T>(save: (value: T) => Promise<void>, delayMs = 900, onStateChange?: (state: AutosaveState) => void): AutosaveController<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: T | undefined;
  let saving = false;
  let dirtyWhileSaving = false;
  let state: AutosaveState = "idle";
  const setState = (next: AutosaveState) => { state = next; onStateChange?.(next); };

  const flush = async () => {
    if (pending === undefined) return;
    if (saving) { dirtyWhileSaving = true; return; }
    const value = pending;
    pending = undefined;
    saving = true;
    let failed = false;
    setState("saving");
    try {
      await save(value);
      setState("saved");
    } catch (error) {
      failed = true;
      pending = value;
      setState(error instanceof Error && error.name === "RevisionConflictError" ? "conflict" : "failed");
      throw error;
    } finally {
      saving = false;
      if (!failed && (dirtyWhileSaving || pending !== undefined)) { dirtyWhileSaving = false; void flush(); }
    }
  };

  return {
    update(value) {
      pending = value;
      dirtyWhileSaving = saving;
      if (timer) clearTimeout(timer);
      setState("scheduled");
      timer = setTimeout(() => { timer = undefined; void flush(); }, delayMs);
    },
    flush,
    cancel() { if (timer) clearTimeout(timer); timer = undefined; pending = undefined; dirtyWhileSaving = false; setState("idle"); },
    getState: () => state,
  };
}
