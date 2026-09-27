import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canAccessManagePath } from "@/lib/auth/roles";

/**
 * The employee audit log (supabase/migrations/20260927000004_*.sql), checked
 * statically. The behaviour was verified against the live project with a
 * rolled-back dry run (manager, staff, customer, anon and owner sessions);
 * these tests stop a later edit from quietly weakening it.
 */

const raw = readFileSync("supabase/migrations/20260927000004_employee_audit_log.sql", "utf8");
/** Comments stripped, so prose that mentions a statement doesn't count as one. */
const sql = raw.replace(/--.*$/gm, "");
/** The persona-review fixes, which redefine both functions. */
const fixes = readFileSync("supabase/migrations/20260927000005_audit_log_review_fixes.sql", "utf8").replace(/--.*$/gm, "");

describe("who can read the log", () => {
  it("has RLS on, and only a manager can select", () => {
    expect(sql).toMatch(/ALTER TABLE public\.audit_log ENABLE ROW LEVEL SECURITY;/);
    const policies = sql.match(/CREATE POLICY [^;]+ON public\.audit_log[^;]+;/g) ?? [];
    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatch(/FOR SELECT TO authenticated/);
    expect(policies[0]).toMatch(/current_employee_role\(\) = 'MANAGER'/);
  });

  it("grants nothing to anon, and no write to anyone", () => {
    expect(sql).toMatch(/REVOKE ALL ON TABLE public\.audit_log FROM PUBLIC, anon, authenticated;/);
    expect(sql).toMatch(/GRANT SELECT ON TABLE public\.audit_log TO authenticated;/);
    expect(sql).not.toMatch(/GRANT (INSERT|UPDATE|DELETE|ALL)[^;]*ON TABLE public\.audit_log/);
  });

  it("keeps /manage/audit-log away from staff", () => {
    expect(canAccessManagePath("MANAGER", "/manage/audit-log")).toBe(true);
    expect(canAccessManagePath("STAFF", "/manage/audit-log")).toBe(false);
    expect(canAccessManagePath(null, "/manage/audit-log")).toBe(false);
  });
});

describe("nobody can rewrite history", () => {
  it("refuses UPDATE, DELETE and TRUNCATE with triggers, which bind the service role too", () => {
    expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON public\.audit_log\s+FOR EACH ROW EXECUTE FUNCTION public\.audit_log_is_append_only\(\)/);
    expect(sql).toMatch(/BEFORE TRUNCATE ON public\.audit_log\s+FOR EACH STATEMENT EXECUTE FUNCTION public\.audit_log_is_append_only\(\)/);
  });

  it("keeps entries when an employee is deleted (no foreign key)", () => {
    const table = sql.slice(sql.indexOf("CREATE TABLE IF NOT EXISTS public.audit_log"), sql.indexOf(");", sql.indexOf("CREATE TABLE IF NOT EXISTS public.audit_log")));
    expect(table).not.toMatch(/REFERENCES/);
    expect(table).toMatch(/actor_name\s+text/);
  });
});

describe("entries can't be forged", () => {
  it("takes the actor from the session, never from a parameter", () => {
    const fn = sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION public.record_employee_action("));
    const signature = fn.slice(0, fn.indexOf(")"));
    expect(signature).not.toMatch(/actor/);
    expect(fn).toMatch(/SELECT \* INTO v_actor FROM public\.audit_current_actor\(\);/);
    expect(sql).toMatch(/WHERE e\.employee_id = auth\.uid\(\)/);
  });

  it("accepts only a fixed list of app-side actions", () => {
    expect(sql).toMatch(/IF p_action IS NULL OR p_action NOT IN \(/);
  });

  it("lets signed-in users call it, and anon not at all", () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.record_employee_action\(text, text, text, text, jsonb\) FROM PUBLIC, anon;/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.record_employee_action\(text, text, text, text, jsonb\) TO authenticated;/);
  });

  it("does not expose the internal helpers over the API", () => {
    for (const fn of ["audit_current_actor()", "audit_employee_write()", "audit_log_is_append_only()"]) {
      expect(sql).toContain(`REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticated;`);
    }
  });

  it("pins search_path on every SECURITY DEFINER function it adds", () => {
    const definers = sql.match(/SECURITY DEFINER\s+SET search_path = public/g) ?? [];
    const allDefiners = sql.match(/SECURITY DEFINER/g) ?? [];
    expect(definers.length).toBe(allDefiners.length);
    expect(definers.length).toBe(3);
  });
});

describe("what gets captured", () => {
  it.each([
    ["order", "order"],
    ["transaction", "payment"],
    ["product", "product"],
    ["categories", "category"],
    ["add_on", "add_on"],
    ["employee", "employee"],
    ["customer", "customer"],
    ["reports", "report"],
    ["review", "review"],
    ["notification", "notification"],
  ])("audits writes to public.%s as %s", (table, entity) => {
    expect(sql).toMatch(new RegExp(`\\('${table}',\\s*'[a-z_]+',\\s*'[a-z_]*',\\s*'${entity}'\\)`));
  });

  it("fires after insert, update and delete", () => {
    expect(sql).toMatch(/AFTER INSERT OR UPDATE OR DELETE ON public\.%I/);
  });

  it("never copies a Senior/PWD ID number into the log", () => {
    expect(sql).toMatch(/v_redact\s+text\[\] := ARRAY\['discount_id_number'\]/);
  });

  it("skips non-employees and updates that only touch bookkeeping columns", () => {
    expect(sql).toMatch(/IF v_actor\.actor_id IS NULL THEN\s+RETURN NULL;/);
    expect(sql).toMatch(/'last_access_log', 'password_last_updated'/);
    expect(sql).toMatch(/IF TG_OP = 'UPDATE' AND v_changes = '\{\}'::jsonb THEN/);
  });
});

describe("persona review fixes (20260927000005)", () => {
  it("skips generated columns by catalog, so add_on.name is still recorded", () => {
    expect(fixes).toMatch(/a\.attgenerated <> ''/);
    expect(fixes).toMatch(/v_ignore\s+text\[\] := ARRAY\['last_access_log', 'password_last_updated'\];/);
    expect(fixes).not.toMatch(/v_ignore[^;]*'name'/);
  });

  it("records that a customer's personal data changed, never the value", () => {
    expect(fixes).toMatch(/WHEN 'customer' THEN ARRAY\['email', 'phone_number', 'date_of_birth', 'first_name',/);
    expect(fixes).toMatch(/to_jsonb\('\[personal data\]'::text\)/);
    expect(fixes).toMatch(/WHEN v_entity = 'customer' THEN '#' \|\| left\(btrim\(v_row ->> 'customer_id'\), 8\)/);
  });

  it("lets only a manager record manager actions, and only yourself for self-service ones", () => {
    const fn = fixes.slice(fixes.indexOf("CREATE OR REPLACE FUNCTION public.record_employee_action("));
    expect(fn).toMatch(/'employee\.create', 'employee\.update', 'employee\.password_reset',\s+'employee\.disable', 'employee\.enable', 'employee\.role_change'\) THEN\s+IF [^;]*v_actor\.actor_role IS DISTINCT FROM 'MANAGER'/);
    expect(fn).toMatch(/p_action = 'report\.export' THEN\s+IF [^;]*v_actor\.actor_role IS DISTINCT FROM 'MANAGER'/);
    expect(fn).toMatch(/'session\.sign_in', 'session\.sign_out', 'session\.password_change'\) THEN\s+IF [^;]*NOT v_is_self/);
    expect(fn).toMatch(/ELSE\s+RAISE EXCEPTION 'Unknown audit action/);
  });

  it("keeps both redefined functions private and pinned", () => {
    expect(fixes).toMatch(/REVOKE ALL ON FUNCTION public\.audit_employee_write\(\) FROM PUBLIC, anon, authenticated;/);
    expect(fixes).toMatch(/REVOKE ALL ON FUNCTION public\.record_employee_action\(text, text, text, text, jsonb\) FROM PUBLIC, anon;/);
    expect((fixes.match(/SECURITY DEFINER\s+SET search_path = public/g) ?? []).length).toBe(2);
  });

  it("records a password reset done from an emailed link", () => {
    const actions = readFileSync("app/(auth)/actions.ts", "utf8");
    const reset = actions.slice(actions.indexOf("export async function resetPassword("));
    expect(reset.slice(0, reset.indexOf("await supabase.auth.signOut();"))).toMatch(/action: "session\.password_change"/);
  });
});
