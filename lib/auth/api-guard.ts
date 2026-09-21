import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveEmployeeRole, type EmployeeRole } from "@/lib/auth/roles";

/**
 * Authorisation for the REST routes under `/api`.
 *
 * `middleware.ts` deliberately does not run on `/api` (its matcher excludes
 * it), so a route handler that does not check the caller itself is open to
 * anyone on the internet. These handlers talk to Supabase with the anon key,
 * and the tables they write to are granted to the `anon` role — so an
 * unauthenticated `DELETE /api/menu/products/:id` really did delete a product.
 * Every mutating route, and every route returning staff-only data, now starts
 * with one of these guards.
 *
 * This is the application half of the fix. The database half —
 * row-level security plus revoking the anon write grants — is in
 * `supabase/migrations/20260921000004_lock_down_public_tables.sql`, and is
 * what protects the same tables from a request made straight to Supabase's
 * own REST API with the public anon key, which never passes through this code.
 */

export type ApiEmployee = {
  employeeId: string;
  role: EmployeeRole;
};

type GuardResult =
  | { employee: ApiEmployee; response: null }
  | { employee: null; response: NextResponse };

/**
 * Requires a signed-in employee whose role is one of `allowed`
 * (any employee role when `allowed` is empty).
 *
 * Returns either the employee or the response to send back — callers do:
 *
 *     const guard = await requireApiEmployee("MANAGER");
 *     if (guard.response) return guard.response;
 */
export async function requireApiEmployee(
  ...allowed: EmployeeRole[]
): Promise<GuardResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      employee: null,
      response: NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      ),
    };
  }

  const { data: employee } = await supabase
    .from("employee")
    .select("employee_id, role, is_account_disabled")
    .eq("employee_id", user.id)
    .maybeSingle();

  if (!employee) {
    return {
      employee: null,
      response: NextResponse.json(
        { error: "You are not registered as an employee." },
        { status: 403 },
      ),
    };
  }

  if (employee.is_account_disabled) {
    return {
      employee: null,
      response: NextResponse.json(
        { error: "Your account has been disabled." },
        { status: 403 },
      ),
    };
  }

  const role = resolveEmployeeRole(employee.role);
  if (!role || (allowed.length > 0 && !allowed.includes(role))) {
    return {
      employee: null,
      response: NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 },
      ),
    };
  }

  return {
    employee: { employeeId: employee.employee_id, role },
    response: null,
  };
}
