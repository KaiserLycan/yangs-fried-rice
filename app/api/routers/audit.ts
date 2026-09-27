import { NextResponse } from "next/server";
import { getAuditLog as getAuditLogAction } from "@/lib/actions/audit";

function errorToStatus(error: string, code?: string): number {
  if (error.includes("must be signed in") || error.includes("not registered")) {
    return 401;
  }
  if (code === "ACCOUNT_DISABLED" || error.includes("permission")) {
    return 403;
  }
  return 400;
}

/**
 * GET /api/audit-log
 * One page of the employee audit log, newest first.
 * Query params (all optional):
 *   ?category=orders|payments|menu|employees|customers|access|reports
 *   ?actor_id=<employee uuid>
 *   ?date_from=YYYY-MM-DD  ?date_to=YYYY-MM-DD   (Manila days, inclusive)
 *   ?search=<text>          matches the summary (use actor_id for a person)
 *   ?limit=1..100 (default 25)  ?offset=0..
 * Requires: manager.
 */
export async function getAuditLog(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: Record<string, string> = {};
  for (const key of ["category", "actor_id", "date_from", "date_to", "search", "limit", "offset"]) {
    const value = searchParams.get(key);
    if (value !== null && value.trim() !== "") filters[key] = value.trim();
  }

  const result = await getAuditLogAction(filters);

  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error ?? "", result.code) },
    );
  }

  return NextResponse.json(result.data);
}
