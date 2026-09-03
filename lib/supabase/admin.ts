import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role client — bypasses RLS entirely.
 *
 * NEVER import this into anything that runs in the browser or into a
 * Client Component. It must only be called from Server Actions/Route
 * Handlers, and only for operations the regular session-scoped client
 * genuinely can't do — right now that's exactly one thing: deleting a
 * Supabase Auth user, which has no self-service API for a user to do to
 * their own account.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Dashboard -> Settings
 * -> API -> service_role key). Keep it out of version control and never
 * prefix it with NEXT_PUBLIC_ — that prefix ships a variable to the
 * browser bundle.
 */
export function createAdminClient() {
  return createSupabaseClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}