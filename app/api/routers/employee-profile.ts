import { NextResponse } from "next/server";
import {
  getMyEmployeeProfile as getMyEmployeeProfileAction,
  updateMyEmployeeProfile as updateMyEmployeeProfileAction,
  deactivateMyEmployeeAccount as deactivateMyEmployeeAccountAction,
  deleteMyEmployeeAccount as deleteMyEmployeeAccountAction,
} from "@/lib/actions/employee-profile";

function errorToStatus(error: string): number {
  if (error.includes("must be signed in")) {
    return 401;
  }
  if (error.includes("Only a manager")) {
    return 403;
  }
  return 400;
}

/**
 * GET /api/employee/profile
 * The signed-in employee's own profile. Exists for direct API testing
 * per this issue's instructions (AC6) — not called by the frontend,
 * which has its own read path per profile page.
 * Requires: authenticated employee.
 */
export async function getMyEmployeeProfile() {
  const result = await getMyEmployeeProfileAction();
  if (!result.success) {
    return NextResponse.json(
      { error: result.error, fieldErrors: "fieldErrors" in result ? result.fieldErrors : undefined },
      { status: errorToStatus(result.error) },
    );
  }
  return NextResponse.json({ data: result.data });
}

/**
 * PATCH /api/employee/profile
 * Body: { name?, mobile?, department?, scheduleShift?, role? } — any subset.
 * `role` requires the caller to already be a Manager; `mobile` and
 * `department` are validated but not persisted (no matching columns yet).
 * Requires: authenticated employee.
 */
export async function updateMyEmployeeProfile(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 },
    );
  }

  const result = await updateMyEmployeeProfileAction(body as any);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error, fieldErrors: "fieldErrors" in result ? result.fieldErrors : undefined },
      { status: errorToStatus(result.error) },
    );
  }
  return NextResponse.json({ message: "Profile updated successfully" });
}

/**
 * DELETE /api/employee/profile
 * Permanently deletes the signed-in employee's account — only succeeds
 * if they have no order/delivery/report history. See
 * lib/actions/employee-profile.ts's deleteMyEmployeeAccount for the
 * full reasoning.
 * Requires: authenticated employee.
 */
export async function deleteMyEmployeeAccount() {
  const result = await deleteMyEmployeeAccountAction();
  if (!result.success) {
    return NextResponse.json(
      { error: result.error, fieldErrors: "fieldErrors" in result ? result.fieldErrors : undefined },
      { status: errorToStatus(result.error) },
    );
  }
  return NextResponse.json({ message: "Account deleted successfully" });
}

/**
 * PATCH /api/employee/profile/deactivate
 * No body. Always available regardless of history, unlike deletion.
 * Requires: authenticated employee.
 */
export async function deactivateMyEmployeeAccount() {
  const result = await deactivateMyEmployeeAccountAction();
  if (!result.success) {
    return NextResponse.json(
      { error: result.error, fieldErrors: "fieldErrors" in result ? result.fieldErrors : undefined },
      { status: errorToStatus(result.error) },
    );
  }
  return NextResponse.json({ message: "Account deactivated successfully" });
}
