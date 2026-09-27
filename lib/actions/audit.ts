"use server";

import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_DISABLED_CODE,
  EMPLOYEE_ACCOUNT_DISABLED_MESSAGE,
} from "@/lib/auth/account-status";
import { isManager, resolveEmployeeRole, type EmployeeRole } from "@/lib/auth/roles";
import { entityTypesFor } from "@/lib/audit/audit-actions";
import {
  auditLogFilterSchema,
  manilaDayAfter,
  manilaDayStart,
  sanitiseAuditSearch,
  type AuditLogFilters,
} from "@/lib/validation/audit";
import type { Tables } from "@/types/database.types";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string; code?: string };

export type AuditLogEntry = Tables<"audit_log">;

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

/**
 * Managers only — the same rule as the reports. The database enforces it too:
 * `manager_select_audit_log` lets no one else read a row, so a staff session
 * that got past this would still see an empty log.
 */
async function requireAuditAccess(): Promise<
  ActionResult<{ employee_id: string; role: EmployeeRole }>
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const { data: employee, error } = await supabase
    .from("employee")
    .select("employee_id, role, is_account_disabled")
    .eq("employee_id", user.id)
    .single();

  if (error || !employee) {
    return { data: null, error: "You are not registered as an employee." };
  }

  if (employee.is_account_disabled) {
    return {
      data: null,
      error: EMPLOYEE_ACCOUNT_DISABLED_MESSAGE,
      code: ACCOUNT_DISABLED_CODE,
    };
  }

  const role = resolveEmployeeRole(employee.role);
  if (!role || !isManager(role)) {
    return {
      data: null,
      error: "You do not have permission to view the audit log.",
    };
  }

  return { data: { employee_id: employee.employee_id, role }, error: null };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * One page of the audit log, newest first, with the total for pagination.
 * Every filter is applied in the database: the log only grows, so it is never
 * loaded whole the way the customer list is.
 *
 * Requires: manager.
 */
export async function getAuditLog(
  rawFilters?: Partial<AuditLogFilters>,
): Promise<ActionResult<{ entries: AuditLogEntry[]; totalCount: number }>> {
  const auth = await requireAuditAccess();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const parsed = auditLogFilterSchema.safeParse(rawFilters ?? {});
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid filters." };
  }
  const filters = parsed.data;

  const supabase = createClient();
  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("occurred_at", { ascending: false })
    .order("audit_id", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.category) {
    query = query.in("entity_type", [...entityTypesFor(filters.category)]);
  }
  if (filters.actor_id) {
    query = query.eq("actor_id", filters.actor_id);
  }
  if (filters.date_from) {
    query = query.gte("occurred_at", manilaDayStart(filters.date_from));
  }
  if (filters.date_to) {
    query = query.lt("occurred_at", manilaDayAfter(filters.date_to));
  }
  // A value passed to .ilike() is encoded by the client: data, never syntax.
  const search = sanitiseAuditSearch(filters.search);
  if (search) {
    query = query.ilike("summary", `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("getAuditLog failed:", error);
    return { data: null, error: "Couldn't load the audit log. Please try again." };
  }

  return { data: { entries: data ?? [], totalCount: count ?? 0 }, error: null };
}

/**
 * Everyone who appears in the log, for the "Employee" filter — including
 * people since deleted, whose names survive only in the log itself.
 *
 * Requires: manager.
 */
export async function getAuditActors(): Promise<
  ActionResult<{ id: string; name: string }[]>
> {
  const auth = await requireAuditAccess();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const supabase = createClient();
  const [{ data: employees, error }, { data: logged }] = await Promise.all([
    supabase.from("employee").select("employee_id, name").order("name"),
    // The newest few hundred entries are enough to catch deleted employees
    // who acted recently, without scanning the whole log for a dropdown.
    supabase
      .from("audit_log")
      .select("actor_id, actor_name")
      .not("actor_id", "is", null)
      .order("occurred_at", { ascending: false })
      .limit(500),
  ]);

  if (error) {
    return { data: null, error: "Couldn't load the employee list." };
  }

  const byId = new Map<string, string>();
  for (const e of employees ?? []) {
    byId.set(e.employee_id, e.name ?? "Unknown employee");
  }
  for (const row of logged ?? []) {
    if (row.actor_id && !byId.has(row.actor_id)) {
      byId.set(row.actor_id, `${row.actor_name ?? "Unknown employee"} (removed)`);
    }
  }

  const actors = [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { data: actors, error: null };
}
