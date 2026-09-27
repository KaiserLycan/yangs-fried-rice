import { describe, expect, it } from "vitest";
import { SCHEMA, functionSql } from "@/__tests__/helpers/schema";
import {
  APP_AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
  auditActionLabel,
  auditChangeRows,
  auditFieldLabel,
  categoryOf,
  entityTypesFor,
  formatAuditValue,
} from "./audit-actions";

describe("the app's action list matches the database", () => {
  // record_employee_action() refuses anything outside its allowlist, so an
  // action added on one side only would silently never be logged.
  it("allows exactly APP_AUDIT_ACTIONS", () => {
    const fn = functionSql("record_employee_action");
    const checks = fn.slice(fn.indexOf("IF p_action IN"), fn.indexOf("IF p_summary IS NULL"));
    const allowed = [...new Set([...checks.matchAll(/'([a-z_]+\.[a-z_]+)'/g)].map((m) => m[1]))].sort();
    expect(allowed).toEqual([...APP_AUDIT_ACTIONS].sort());
  });

  it("gives every entity type the trigger writes a category", () => {
    const triggerEntities = [
      ...SCHEMA.matchAll(/EXECUTE FUNCTION public\.audit_employee_write\('[a-z_]+', '[a-z_]*', '([a-z_]+)'\)/g),
    ].map((m) => m[1]);
    expect(triggerEntities.length).toBe(11);
    for (const entity of [...triggerEntities, "session"]) {
      expect(categoryOf(entity)).not.toBeNull();
    }
  });

  // Issue #118's problem reports joined the log when the two branches merged.
  it("files problem reports under Orders, with their resolve action named", () => {
    const writer = functionSql("audit_employee_write");
    expect(SCHEMA).toMatch(/audit_employee_write\('issue_id', '', 'order_issue'\)/);
    expect(writer).toMatch(/v_action := 'order_issue\.resolve'/);
    // The customer's words and photo are personal data: marked changed, never copied.
    expect(writer).toMatch(/WHEN 'order_issue' THEN ARRAY\['note', 'photo_path'\]/);
    expect(categoryOf("order_issue")).toBe("orders");
    expect(auditActionLabel("order_issue.resolve")).toBe("Problem report resolved");
    expect(auditActionLabel("order_issue.update")).toBe("Problem report updated");
  });

  it("does not log the notifications the database writes on a status change", () => {
    expect(SCHEMA).toMatch(
      /ON public\.notification FOR EACH ROW WHEN \(\(pg_trigger_depth\(\) = 0\)\) EXECUTE FUNCTION public\.audit_employee_write/,
    );
  });
});

describe("categories", () => {
  it("never puts one entity type in two categories", () => {
    const all = AUDIT_CATEGORIES.flatMap((c) => [...c.entityTypes]);
    expect(new Set(all).size).toBe(all.length);
  });

  it("maps a category to its entity types and back", () => {
    expect(entityTypesFor("menu")).toEqual(["product", "category", "add_on"]);
    expect(categoryOf("add_on")).toBe("menu");
    expect(categoryOf("session")).toBe("access");
    expect(categoryOf("unknown")).toBeNull();
  });
});

describe("labels", () => {
  it("names the specialised actions", () => {
    expect(auditActionLabel("order.status_change")).toBe("Order status changed");
    expect(auditActionLabel("product.price_change")).toBe("Price changed");
    expect(auditActionLabel("session.sign_in")).toBe("Signed in");
  });

  it("builds a label for the generic create/update/delete actions", () => {
    expect(auditActionLabel("category.create")).toBe("Category created");
    expect(auditActionLabel("add_on.delete")).toBe("Add-on deleted");
    expect(auditActionLabel("product.update")).toBe("Menu item updated");
  });

  it("reads column names the way a manager would", () => {
    expect(auditFieldLabel("product_price")).toBe("Price");
    expect(auditFieldLabel("special_instructions")).toBe("Special instructions");
  });
});

describe("values and change rows", () => {
  it("formats empty, boolean and object values", () => {
    expect(formatAuditValue(null)).toBe("—");
    expect(formatAuditValue(undefined)).toBe("—");
    expect(formatAuditValue(true)).toBe("Yes");
    expect(formatAuditValue({ a: 1 })).toBe('{"a":1}');
    expect(formatAuditValue(250)).toBe("250");
  });

  it("turns the stored changes into sorted rows", () => {
    expect(
      auditChangeRows({
        product_price: { from: 250, to: 251 },
        is_available: { to: false },
      }),
    ).toEqual([
      { field: "is_available", from: undefined, to: false },
      { field: "product_price", from: 250, to: 251 },
    ]);
  });

  it("tolerates a malformed value instead of crashing the page", () => {
    expect(auditChangeRows(null)).toEqual([]);
    expect(auditChangeRows([1, 2])).toEqual([]);
    expect(auditChangeRows({ x: "not an object" })).toEqual([
      { field: "x", from: undefined, to: undefined },
    ]);
  });
});
