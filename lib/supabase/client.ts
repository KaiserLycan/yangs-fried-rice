import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Use inside Client Components ("use client").
 * Reads/writes the browser session cookie automatically.
 *
 * See lib/supabase/server.ts for why the explicit "public" schema
 * argument is required — same open @supabase/ssr bug, same workaround.
 */
export function createClient() {
  return createBrowserClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}