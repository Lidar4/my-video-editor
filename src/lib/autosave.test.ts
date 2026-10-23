import { afterEach, describe, expect, it, vi } from "vitest";
import { createAutosaveController } from "@/lib/autosave";

describe("autosave controller", () => {
  afterEach(() => vi.useRealTimers());

  it("coalesces rapid updates into one save", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = createAutosaveController(save, 500);
    controller.update({ value: 1 });
    controller.update({ value: 2 });
    await vi.advanceTimersByTimeAsync(500);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ value: 2 });
    expect(controller.getState()).toBe("saved");
  });

  it("keeps a failed value available for retry", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockRejectedValue(new Error("offline"));
    const controller = createAutosaveController(save, 100);
    controller.update({ value: 1 });
    await expect(controller.flush()).rejects.toThrow("offline");
    expect(controller.getState()).toBe("failed");
  });
});
