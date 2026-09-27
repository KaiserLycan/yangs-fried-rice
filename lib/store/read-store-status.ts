import { createClient } from "@/lib/supabase/server";
import {
  fallbackStoreStatus,
  parseStoreStatus,
  type StoreStatus,
} from "@/lib/store/store-status";

/**
 * `FORCE_STORE_OPEN=true` in the environment: treat the shop as open in the
 * Next.js layer (banners, the checkout button, `submitCart`'s own check).
 *
 * The database cannot read `.env`, so `submit_cart_to_order` still applies
 * the hours. For a full after-hours demo, also switch on "Force open" on the
 * manager dashboard (`store_setting.is_force_open`).
 */
export function isForceOpenByEnv(): boolean {
  return process.env.FORCE_STORE_OPEN === "true";
}

/**
 * Applies the env override to a status. Pure, so it can be tested without
 * a database.
 */
export function withEnvOverride(status: StoreStatus, forceOpen: boolean): StoreStatus {
  return forceOpen ? { ...status, isOpen: true, isAccepting: true } : status;
}

/**
 * The shop's status right now, from `get_store_status()`. Server-only.
 *
 * Never throws: a failed read falls back to the default hours with no pause,
 * because refusing every customer over a settings hiccup is worse than
 * letting checkout reach the database, which checks again.
 */
export async function readStoreStatus(): Promise<StoreStatus> {
  let status: StoreStatus;
  try {
    const { data, error } = await createClient().rpc("get_store_status");
    if (error) {
      console.error("readStoreStatus: get_store_status failed:", error);
      status = fallbackStoreStatus();
    } else {
      status = parseStoreStatus(data);
    }
  } catch (error) {
    console.error("readStoreStatus:", error);
    status = fallbackStoreStatus();
  }

  return withEnvOverride(status, isForceOpenByEnv());
}
