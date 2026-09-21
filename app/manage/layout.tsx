import { cookies } from "next/headers";
import { ManageShell } from "@/components/manage/manage-shell";
import { decrypt, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveEmployeeRole } from "@/lib/auth/roles";

/**
 * Back office layout. Staff and Business Owner.
 *
 * Literal prefix — "manage" is in the URL on purpose so middleware.ts guards
 * the whole area with one /manage/:path* match, and any page added here later
 * is protected automatically.
 *
 * This layout reads the employee's role from the signed session cookie — a
 * local JWT verify, NOT a Supabase round-trip — so the sidebar can hide the
 * manager-only pages from STAFF on the very first paint. (The layout used to
 * be async and query Supabase on every navigation, which made tab switching
 * slow; a cookie decrypt costs nothing by comparison.)
 *
 * Authorisation itself lives in middleware.ts (canAccessManagePath) and in
 * each server action; hiding a link is presentation, not protection.
 */
export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await decrypt(token) : null;
  const role = resolveEmployeeRole(payload?.role);

  return <ManageShell role={role}>{children}</ManageShell>;
}
