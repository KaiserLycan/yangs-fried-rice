import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Use inside Server Components, Route Handlers, and Server Actions.
 * Call this fresh on every request — cookies() is request-scoped.
 *
 * Uses the getAll/setAll cookie method style (not the deprecated
 * get/set/remove style) — older @supabase/ssr versions had a confirmed
 * type-inference bug against Database types with the newer
 * __InternalSupabase metadata field. Make sure @supabase/ssr is at least
 * 0.7.0, which is when that bug was fixed upstream.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore if you
            // have middleware refreshing sessions (add when auth lands).
          }
        },
      },
    }
  );
}