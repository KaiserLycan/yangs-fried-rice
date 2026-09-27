import type { createClient } from "@/lib/supabase/server";
import type { AppAuditAction } from "@/lib/audit/audit-actions";

type SessionClient = ReturnType<typeof createClient>;

export type EmployeeActionEntry = {
  action: AppAuditAction;
  /** The kind of thing acted on; `session` for sign-in/out and own password. */
  entityType: "session" | "employee" | "report";
  entityId?: string | null;
  /** One line a manager can read without opening the entry. */
  summary: string;
  /** `{ column: { from?, to? } }` — never a password or any other secret. */
  changes?: Record<string, { from?: unknown; to?: unknown }>;
};

/**
 * Records one employee action in the audit log, for what the database trigger
 * cannot see: service-role writes, Auth-only changes, and events that write
 * no row (see supabase/migrations/20260927000004_employee_audit_log.sql).
 *
 * Pass the caller's **session** client, never the service role: the database
 * takes the actor from that session, so an entry can't be attributed to
 * anyone but the person signed in. A caller who is not an active employee is
 * a silent no-op (sign-out is shared with customers).
 *
 * Never throws and never fails the action it describes. A logging outage is
 * reported to the server log; the manager's change still goes through.
 */
export async function recordEmployeeAction(
  supabase: SessionClient,
  entry: EmployeeActionEntry,
): Promise<void> {
  try {
    const { error } = await supabase.rpc("record_employee_action", {
      p_action: entry.action,
      p_entity_type: entry.entityType,
      // The function stores an empty id as NULL.
      p_entity_id: entry.entityId ?? "",
      p_summary: entry.summary,
      p_changes: (entry.changes ?? {}) as never,
    });
    if (error) {
      console.error(`recordEmployeeAction(${entry.action}) failed:`, error.message);
    }
  } catch (err) {
    console.error(`recordEmployeeAction(${entry.action}) threw:`, err);
  }
}
