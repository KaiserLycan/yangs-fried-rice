import { z } from "zod";

/**
 * What a manager may send when changing `store_setting` (issue #115). The
 * table has CHECK constraints for the same bounds; these give a readable
 * message before the round trip.
 */

/** The preset pause lengths the dashboard offers, in minutes. */
export const PAUSE_PRESETS = [5, 15, 30] as const;

/** Longest timed pause a manager can pick, in minutes. */
export const MAX_PAUSE_MINUTES = 240;

/** Minutes to pause for, or null for "until I resume". */
export const pauseStoreSchema = z
  .number()
  .int({ message: "Pause length must be whole minutes." })
  .min(1, { message: "Pause for at least 1 minute." })
  .max(MAX_PAUSE_MINUTES, {
    message: `Pause for at most ${MAX_PAUSE_MINUTES} minutes.`,
  })
  .nullable();

export const updateStoreSettingsSchema = z
  .object({
    open_hour: z.number().int().min(0).max(23, { message: "Opening hour must be 0–23." }),
    close_hour: z.number().int().min(1).max(24, { message: "Closing hour must be 1–24." }),
    extra_prep_minutes: z
      .number()
      .int()
      .min(0, { message: "Extra prep time can't be negative." })
      .max(120, { message: "Extra prep time can be at most 120 minutes." }),
    max_active_orders: z
      .number()
      .int()
      .min(1, { message: "The busy limit must be at least 1 order." })
      .max(500, { message: "The busy limit can be at most 500 orders." }),
    is_force_open: z.boolean(),
  })
  .refine((v) => v.open_hour < v.close_hour, {
    message: "The store must open before it closes.",
    path: ["close_hour"],
  });

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
