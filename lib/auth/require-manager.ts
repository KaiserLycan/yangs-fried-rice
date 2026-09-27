import type { createClient } from "@/lib/supabase/server";
import { resolveEmployeeRole } from "@/lib/auth/roles";

/**
 * Null when the signed-in user is an active MANAGER; otherwise the message to
 * refuse with. For server actions behind the manager dashboard (issue #115).
 *
 * The page itself redirects anyone else, but a server action is its own
 * endpoint and can be called without the page, so each one checks again.
 */
export async function requireManager(
  supabase: ReturnType<typeof createClient>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "You must be signed in.";

  const { data: employee } = await supabase
    .from("employee")
    .select("role, is_account_disabled")
    .eq("employee_id", user.id)
    .maybeSingle();

  if (!employee || employee.is_account_disabled) return "You must be signed in.";
  if (resolveEmployeeRole(employee.role) !== "MANAGER") {
    return "Only a manager can do this.";
  }
  return null;
}
