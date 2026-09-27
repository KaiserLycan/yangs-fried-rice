import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canAccessManagePath } from "@/lib/auth/roles";
import { SCHEMA, functionSql, policiesOn, tableSql } from "../helpers/schema";

/**
 * The employee audit log, checked statically against the migrations. The
 * behaviour was verified against the live project with a rolled-back dry run
 * (manager, staff, customer, anon and owner sessions); these tests stop a
 * later edit from quietly weakening it.
 */

describe("who can read the log", () => {
  it("has RLS on, and only a manager can select", () => {
    expect(SCHEMA).toMatch(/ALTER TABLE public\.audit_log ENABLE ROW LEVEL SECURITY;/);
    const policies = policiesOn("public.audit_log");
    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatch(/FOR SELECT TO authenticated/);
    expect(policies[0]).toMatch(/current_employee_role\(\) = 'MANAGER'/);
  });

  it("grants nothing to anon, and no write to anyone but the service role", () => {
    expect(SCHEMA).toMatch(/REVOKE ALL ON TABLE public\.audit_log FROM anon;/);
    expect(SCHEMA).toMatch(/REVOKE ALL ON TABLE public\.audit_log FROM authenticated;/);
    expect(SCHEMA).toMatch(/GRANT SELECT ON TABLE public\.audit_log TO authenticated;/);
    expect(SCHEMA).not.toMatch(/GRANT [A-Z, ]*(INSERT|UPDATE|DELETE|ALL)[^;]*ON TABLE public\.audit_log TO (anon|authenticated)/);
  });

  it("keeps /manage/audit-log away from staff", () => {
    expect(canAccessManagePath("MANAGER", "/manage/audit-log")).toBe(true);
    expect(canAccessManagePath("STAFF", "/manage/audit-log")).toBe(false);
    expect(canAccessManagePath(null, "/manage/audit-log")).toBe(false);
  });
});

describe("nobody can rewrite history", () => {
  it("refuses UPDATE, DELETE and TRUNCATE with triggers, which bind the service role too", () => {
    expect(SCHEMA).toMatch(
      /BEFORE DELETE OR UPDATE ON public\.audit_log FOR EACH ROW EXECUTE FUNCTION public\.audit_log_is_append_only\(\)/,
    );
    expect(SCHEMA).toMatch(
      /BEFORE TRUNCATE ON public\.audit_log FOR EACH STATEMENT EXECUTE FUNCTION public\.audit_log_is_append_only\(\)/,
    );
  });

  it("keeps entries when an employee is deleted (no foreign key)", () => {
    expect(tableSql("audit_log")).toMatch(/actor_name text/);
    expect(SCHEMA).not.toMatch(/ALTER TABLE ONLY public\.audit_log\s+ADD CONSTRAINT [a-z_]+ FOREIGN KEY/);
  });
});

describe("entries can't be forged", () => {
  const record = functionSql("record_employee_action");

  it("takes the actor from the session, never from a parameter", () => {
    const signature = record.slice(0, record.indexOf(")"));
    expect(signature).not.toMatch(/actor/);
    expect(record).toMatch(/SELECT \* INTO v_actor FROM public\.audit_current_actor\(\);/);
    expect(functionSql("audit_current_actor")).toMatch(/WHERE e\.employee_id = auth\.uid\(\)/);
  });

  it("accepts only a fixed list of app-side actions", () => {
    expect(record).toMatch(/ELSE\s+RAISE EXCEPTION 'Unknown audit action/);
  });

  it("lets signed-in users call it, and anon not at all", () => {
    expect(SCHEMA).toMatch(/REVOKE ALL ON FUNCTION public\.record_employee_action\([^)]*\) FROM PUBLIC;/);
    expect(SCHEMA).toMatch(/REVOKE ALL ON FUNCTION public\.record_employee_action\([^)]*\) FROM anon;/);
    expect(SCHEMA).toMatch(/GRANT ALL ON FUNCTION public\.record_employee_action\([^)]*\) TO authenticated;/);
  });

  it("does not expose the internal helpers over the API", () => {
    for (const fn of ["audit_current_actor", "audit_employee_write", "audit_log_is_append_only"]) {
      for (const role of ["PUBLIC", "anon", "authenticated"]) {
        expect(SCHEMA).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\([^)]*\\) FROM ${role};`));
      }
    }
  });

  it("pins search_path on its SECURITY DEFINER functions", () => {
    for (const fn of ["record_employee_action", "audit_current_actor", "audit_employee_write"]) {
      expect(functionSql(fn)).toMatch(/SECURITY DEFINER\s+SET search_path TO 'public'/);
    }
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
    ["order_issue", "order_issue"],
  ])("audits writes to public.%s as %s", (table, entity) => {
    expect(SCHEMA).toMatch(
      new RegExp(
        `CREATE OR REPLACE TRIGGER trg_audit_employee_write AFTER INSERT OR DELETE OR UPDATE ON public\\.${table} FOR EACH ROW[^;]*audit_employee_write\\('[a-z_]+', '[a-z_]*', '${entity}'\\)`,
      ),
    );
  });

  const writer = functionSql("audit_employee_write");

  it("never copies a Senior/PWD ID number into the log", () => {
    expect(writer).toMatch(/v_redact\s+text\[\] := ARRAY\['discount_id_number'\]/);
  });

  it("skips non-employees and updates that only touch bookkeeping columns", () => {
    expect(writer).toMatch(/IF v_actor\.actor_id IS NULL THEN\s+RETURN NULL;/);
    expect(writer).toMatch(/v_ignore\s+text\[\] := ARRAY\['last_access_log', 'password_last_updated'\];/);
    expect(writer).toMatch(/IF TG_OP = 'UPDATE' AND v_changes = '\{\}'::jsonb THEN/);
  });

  it("skips generated columns by catalog, so add_on.name is still recorded", () => {
    expect(writer).toMatch(/a\.attgenerated <> ''/);
    expect(writer).not.toMatch(/v_ignore[^;]*'name'/);
  });

  it("records that a customer's personal data changed, never the value", () => {
    expect(writer).toMatch(/WHEN 'customer' THEN ARRAY\['email', 'phone_number',/);
    expect(writer).toMatch(/to_jsonb\('\[personal data\]'::text\)/);
    expect(writer).toMatch(/WHEN v_entity = 'customer' THEN '#' \|\| left\(btrim\(v_row ->> 'customer_id'\), 8\)/);
  });
});

describe("record_employee_action rules", () => {
  const fn = functionSql("record_employee_action");

  it("lets only a manager record manager actions, and only yourself for self-service ones", () => {
    expect(fn).toMatch(
      /'employee\.create', 'employee\.update', 'employee\.password_reset',\s+'employee\.disable', 'employee\.enable', 'employee\.role_change'\) THEN\s+IF [^;]*v_actor\.actor_role IS DISTINCT FROM 'MANAGER'/,
    );
    expect(fn).toMatch(/p_action = 'report\.export' THEN\s+IF [^;]*v_actor\.actor_role IS DISTINCT FROM 'MANAGER'/);
    expect(fn).toMatch(/'session\.sign_in', 'session\.sign_out', 'session\.password_change'\) THEN\s+IF [^;]*NOT v_is_self/);
  });

  it("records a password reset done from an emailed link", () => {
    const actions = readFileSync("app/(auth)/actions.ts", "utf8");
    const reset = actions.slice(actions.indexOf("export async function resetPassword("));
    expect(reset.slice(0, reset.indexOf("await supabase.auth.signOut();"))).toMatch(/action: "session\.password_change"/);
  });
});
