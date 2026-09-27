"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth/require-manager";
import {
  pauseStoreSchema,
  updateStoreSettingsSchema,
  type UpdateStoreSettingsInput,
} from "@/lib/validation/store-setting";
import type { Database } from "@/types/database.types";

type StoreSettingUpdate = Database["public"]["Tables"]["store_setting"]["Update"];

/**
 * The manager's controls over `store_setting` (issue #115): pause and resume
 * ordering, and edit the hours, busy limit and extra prep time.
 *
 * Two locks on every write. This file checks the caller is a MANAGER so it
 * can say so plainly; the update then runs as that manager, not the service
 * role, so the `store_setting_manager_update` RLS policy checks again.
 */

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

/**
 * Writes to the one row. `.select()` makes a write RLS silently refused show
 * up as zero rows instead of a false success.
 */
async function writeSetting(
  supabase: ReturnType<typeof createClient>,
  values: StoreSettingUpdate,
): Promise<ActionResult<true>> {
  const { data, error } = await supabase
    .from("store_setting")
    .update(values)
    .eq("id", true)
    .select("id");

  if (error || !data || data.length === 0) {
    if (error) console.error("store-setting: update failed:", error);
    return { data: null, error: "Couldn't save the store settings. Please try again." };
  }

  revalidatePath("/manage/dashboard");
  return { data: true, error: null };
}

/** Stop taking orders, for `minutes` or (null) until resumed. */
export async function pauseStore(minutes: number | null): Promise<ActionResult<true>> {
  const parsed = pauseStoreSchema.safeParse(minutes);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid pause length." };
  }

  const supabase = createClient();
  const denied = await requireManager(supabase);
  if (denied) return { data: null, error: denied };

  const pausedUntil =
    parsed.data === null
      ? null
      : new Date(Date.now() + parsed.data * 60_000).toISOString();

  return writeSetting(supabase, { is_paused: true, paused_until: pausedUntil });
}

/** Take orders again. */
export async function resumeStore(): Promise<ActionResult<true>> {
  const supabase = createClient();
  const denied = await requireManager(supabase);
  if (denied) return { data: null, error: denied };

  return writeSetting(supabase, { is_paused: false, paused_until: null });
}

/** Save the hours, busy limit, extra prep time and "Force open". */
export async function updateStoreSettings(
  input: UpdateStoreSettingsInput,
): Promise<ActionResult<true>> {
  const parsed = updateStoreSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }

  const supabase = createClient();
  const denied = await requireManager(supabase);
  if (denied) return { data: null, error: denied };

  return writeSetting(supabase, parsed.data);
}
