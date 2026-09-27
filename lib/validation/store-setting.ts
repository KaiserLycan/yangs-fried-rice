import { z } from "zod";
import { closesAfterOpening, isValidTime } from "@/lib/store-hours";

/** Shown under "Closes at" the moment it is not after "Opens at". */
export const CLOSE_BEFORE_OPEN_MESSAGE = "Closing time must be later than opening time.";

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
    // "HH:MM", Manila, to the minute (issue #115 follow-up).
    open_time: z
      .string()
      .refine((v) => isValidTime(v) && v !== "24:00", {
        message: "Enter an opening time, like 6:30 AM.",
      }),
    close_time: z
      .string()
      .refine(isValidTime, { message: "Enter a closing time, like 7:31 PM." }),
    extra_prep_minutes: z
      .number()
      .int()
      .min(0, { message: "Extra prep time can't be negative." })
      .max(120, { message: "Extra prep time can be at most 120 minutes." }),
    /** No new orders this many minutes before closing (L1). */
    last_order_minutes: z
      .number()
      .int()
      .min(0, { message: "Last orders can't be negative." })
      .max(180, { message: "Last orders can be at most 180 minutes before closing." })
      // Left out, the saved value stays as it is.
      .optional(),
    max_active_orders: z
      .number()
      .int()
      .min(1, { message: "The busy limit must be at least 1 order." })
      .max(500, { message: "The busy limit can be at most 500 orders." }),
    is_force_open: z.boolean(),
  })
  .refine((v) => closesAfterOpening({ openTime: v.open_time, closeTime: v.close_time }), {
    message: CLOSE_BEFORE_OPEN_MESSAGE,
    path: ["close_time"],
  });

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
