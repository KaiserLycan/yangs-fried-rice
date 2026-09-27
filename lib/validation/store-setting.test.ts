import { describe, expect, it } from "vitest";
import { pauseStoreSchema, updateStoreSettingsSchema } from "./store-setting";

const valid = {
  open_time: "06:30",
  close_time: "19:31",
  extra_prep_minutes: 0,
  max_active_orders: 20,
  is_force_open: false,
};

describe("updateStoreSettingsSchema (issue #115)", () => {
  it("accepts hours to the minute", () => {
    expect(updateStoreSettingsSchema.safeParse(valid).success).toBe(true);
  });

  it("refuses a close time that is not after the open time", () => {
    const res = updateStoreSettingsSchema.safeParse({ ...valid, close_time: "06:30" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Closing time must be later than opening time.");
      expect(res.error.issues[0].path).toEqual(["close_time"]);
    }
  });

  it("accepts closing at end of day but not opening at it", () => {
    expect(updateStoreSettingsSchema.safeParse({ ...valid, close_time: "24:00" }).success).toBe(true);
    expect(updateStoreSettingsSchema.safeParse({ ...valid, open_time: "24:00" }).success).toBe(false);
  });

  it("refuses malformed times", () => {
    expect(updateStoreSettingsSchema.safeParse({ ...valid, open_time: "6:30am" }).success).toBe(false);
  });

  it("keeps the other limits", () => {
    expect(updateStoreSettingsSchema.safeParse({ ...valid, max_active_orders: 0 }).success).toBe(false);
    expect(updateStoreSettingsSchema.safeParse({ ...valid, extra_prep_minutes: 121 }).success).toBe(false);
  });
});

describe("pauseStoreSchema", () => {
  it("accepts a timed or open-ended pause", () => {
    expect(pauseStoreSchema.safeParse(15).success).toBe(true);
    expect(pauseStoreSchema.safeParse(null).success).toBe(true);
    expect(pauseStoreSchema.safeParse(0).success).toBe(false);
  });
});
