/**
 * The audit log's vocabulary, in one place (supabase/migrations/
 * 20260927000004_employee_audit_log.sql writes it; /manage/audit-log reads it).
 *
 * Pure — no client, no I/O — so the server action, the API route and the page
 * all agree on what an action is called and which filter it falls under.
 */

/**
 * Events the app records itself through `record_employee_action()`, because
 * the database trigger cannot see them: service-role writes, Auth-only
 * changes, and events that write no row. Must match the function's allowlist
 * (latest definition: 20260927000005_audit_log_review_fixes.sql).
 */
export const APP_AUDIT_ACTIONS = [
  "session.sign_in",
  "session.sign_out",
  "session.password_change",
  "employee.create",
  "employee.update",
  "employee.disable",
  "employee.enable",
  "employee.role_change",
  "employee.delete",
  "employee.password_reset",
  "employee.photo_change",
  "report.export",
] as const;

export type AppAuditAction = (typeof APP_AUDIT_ACTIONS)[number];

/**
 * The filter a manager picks, and the `entity_type`s it covers. Filtering on
 * `entity_type` (indexed) rather than on action prefixes keeps the query one
 * `IN` list.
 */
export const AUDIT_CATEGORIES = [
  { id: "orders", label: "Orders", entityTypes: ["order"] },
  { id: "payments", label: "Payments", entityTypes: ["payment"] },
  { id: "menu", label: "Menu", entityTypes: ["product", "category", "add_on"] },
  { id: "employees", label: "Employees", entityTypes: ["employee"] },
  { id: "customers", label: "Customers", entityTypes: ["customer", "review", "notification"] },
  { id: "access", label: "Sign-ins", entityTypes: ["session"] },
  { id: "reports", label: "Reports", entityTypes: ["report"] },
] as const;

export type AuditCategoryId = (typeof AUDIT_CATEGORIES)[number]["id"];

export const AUDIT_CATEGORY_IDS = AUDIT_CATEGORIES.map((c) => c.id) as [
  AuditCategoryId,
  ...AuditCategoryId[],
];

export function entityTypesFor(category: AuditCategoryId): readonly string[] {
  return AUDIT_CATEGORIES.find((c) => c.id === category)?.entityTypes ?? [];
}

/** Which filter an entity type belongs to — used for the badge colour. */
export function categoryOf(entityType: string): AuditCategoryId | null {
  const match = AUDIT_CATEGORIES.find((c) =>
    (c.entityTypes as readonly string[]).includes(entityType),
  );
  return match?.id ?? null;
}

const ACTION_LABELS: Record<string, string> = {
  "order.status_change": "Order status changed",
  "order.cancel": "Order cancelled",
  "payment.status_change": "Payment status changed",
  "product.price_change": "Price changed",
  "product.availability_change": "Availability changed",
  "product.archive": "Item archived",
  "product.restore": "Item restored",
  "employee.role_change": "Role changed",
  "employee.disable": "Employee disabled",
  "employee.enable": "Employee enabled",
  "employee.password_reset": "Password reset",
  "employee.photo_change": "Photo changed",
  "customer.disable": "Customer disabled",
  "customer.enable": "Customer enabled",
  "session.sign_in": "Signed in",
  "session.sign_out": "Signed out",
  "session.password_change": "Changed own password",
  "report.export": "Report exported",
};

const ENTITY_LABELS: Record<string, string> = {
  order: "Order",
  payment: "Payment",
  product: "Menu item",
  category: "Category",
  add_on: "Add-on",
  employee: "Employee",
  customer: "Customer",
  review: "Review",
  notification: "Notification",
  report: "Report",
  session: "Session",
};

const VERB_LABELS: Record<string, string> = {
  create: "created",
  update: "updated",
  delete: "deleted",
};

/** "order.status_change" → "Order status changed"; "category.create" → "Category created". */
export function auditActionLabel(action: string): string {
  const known = ACTION_LABELS[action];
  if (known) return known;

  const [entity = "", verb = ""] = action.split(".");
  const noun = ENTITY_LABELS[entity] ?? humanise(entity);
  return `${noun} ${VERB_LABELS[verb] ?? humanise(verb).toLowerCase()}`.trim();
}

/** "add_on" → "Add-on". The kind of record an entry is about. */
export function auditEntityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? humanise(entityType);
}

/** "product_price" → "Product price". Column names as a manager reads them. */
export function auditFieldLabel(field: string): string {
  const known: Record<string, string> = {
    product_price: "Price",
    is_available: "Available",
    archived_at: "Archived",
    order_status: "Status",
    payment_status: "Payment status",
    payment_method: "Payment method",
    total_paid: "Total paid",
    cancellation_reason: "Cancellation reason",
    cancelled_at: "Cancelled at",
    completed_at: "Completed at",
    is_account_disabled: "Disabled",
    schedule_shift: "Shift",
    phone_number: "Mobile number",
    date_of_birth: "Date of birth",
    profileImage_URL: "Photo",
    image_url: "Photo",
  };
  return known[field] ?? humanise(field);
}

function humanise(value: string): string {
  const words = value.replace(/_/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "";
}

/**
 * One cell of the before/after table. Objects and arrays are shown as JSON,
 * a missing value as an em dash, booleans as Yes/No.
 */
export function formatAuditValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export type AuditChange = { field: string; from: unknown; to: unknown };

/** `{ col: { from, to } }` as rows, in a stable order. Tolerates a malformed value. */
export function auditChangeRows(changes: unknown): AuditChange[] {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return [];
  return Object.entries(changes as Record<string, unknown>)
    .map(([field, value]) => {
      const pair = (value && typeof value === "object" ? value : {}) as {
        from?: unknown;
        to?: unknown;
      };
      return { field, from: pair.from, to: pair.to };
    })
    .sort((a, b) => a.field.localeCompare(b.field));
}
