import { afterEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ rpc }),
}));

import { readStoreStatus, withEnvOverride } from "./read-store-status";
import { fallbackStoreStatus } from "./store-status";

describe("withEnvOverride", () => {
  it("opens a closed shop when FORCE_STORE_OPEN is set", () => {
    const closed = { ...fallbackStoreStatus(), isOpen: false };
    expect(withEnvOverride(closed, true).isOpen).toBe(true);
    expect(withEnvOverride(closed, false).isOpen).toBe(false);
  });

  it("does not lift a pause", () => {
    const paused = { ...fallbackStoreStatus(), isOpen: false, isPaused: true };
    expect(withEnvOverride(paused, true).isPaused).toBe(true);
  });
});

describe("readStoreStatus", () => {
  afterEach(() => {
    rpc.mockReset();
    vi.unstubAllEnvs();
  });

  it("reads get_store_status()", async () => {
    rpc.mockResolvedValue({
      data: { is_open: false, is_paused: false, is_busy: true, open_hour: 8, close_hour: 18 },
      error: null,
    });
    vi.stubEnv("FORCE_STORE_OPEN", "");

    const status = await readStoreStatus();

    expect(rpc).toHaveBeenCalledWith("get_store_status");
    expect(status.isOpen).toBe(false);
    expect(status.isBusy).toBe(true);
  });

  it("applies FORCE_STORE_OPEN=true", async () => {
    rpc.mockResolvedValue({ data: { is_open: false }, error: null });
    vi.stubEnv("FORCE_STORE_OPEN", "true");

    expect((await readStoreStatus()).isOpen).toBe(true);
  });

  it("falls back instead of throwing when the read fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    vi.stubEnv("FORCE_STORE_OPEN", "");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const status = await readStoreStatus();

    expect(status.isPaused).toBe(false);
    expect(status.openHour).toBe(8);
    spy.mockRestore();
  });
});
