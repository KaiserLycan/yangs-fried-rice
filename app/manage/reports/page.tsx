import { cookies } from "next/headers";
import { decrypt, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveEmployeeRole } from "@/lib/auth/roles";
import ReportsPageClient from "./reports-client";

export default async function ReportsPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await decrypt(token) : null;
  const role = resolveEmployeeRole(payload?.role);
  
  const isManager = role === "MANAGER";

  return <ReportsPageClient isManager={isManager} />;
}
