/**
 * Role hierarchy and permission helpers.
 *
 * Pure functions — no DB or network calls. Every role check in the
 * codebase should go through these helpers so the hierarchy is defined
 * in exactly one place.
 *
 * Hierarchy (highest → lowest):
 *   manager  >  staff
 *
 * There is no rider role: the shop is pickup-only (issue #114). A stored
 * "RIDER" or "Delivery" role therefore resolves to null — not a recognised
 * employee — so such an account cannot sign in or pass any guard. Those
 * accounts were disabled by 20260927000000_pickup_only_drop_rider_and_delivery.sql.
 */

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const EMPLOYEE_ROLES = ["MANAGER", "STAFF"] as const;
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

const UI_ROLE_ALIASES: Record<string, EmployeeRole> = {
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  SERVER: "STAFF",
  COOK: "STAFF",
  CASHIER: "STAFF",
  "MANAGER ": "MANAGER",
  "STAFF ": "STAFF",
  "SERVER ": "STAFF",
  "COOK ": "STAFF",
  "CASHIER ": "STAFF",
};

export function normalizeEmployeeRoleLabel(
  role: string | null | undefined,
): EmployeeRole | null {
  if (!role) return null;

  const canonical = role.trim().toUpperCase();
  if (canonical in UI_ROLE_ALIASES) {
    return UI_ROLE_ALIASES[canonical];
  }

  return isEmployeeRole(canonical) ? canonical : null;
}

/** Numeric weight — higher number = more authority. */
export const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  MANAGER: 2,
  STAFF: 1,
};

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/** Type-guard: is the value a known EmployeeRole? */
export function isEmployeeRole(value: unknown): value is EmployeeRole {
  return (
    typeof value === "string" &&
    EMPLOYEE_ROLES.includes(value as EmployeeRole)
  );
}

/** MANAGER — the highest-privilege employee role. */
export function isManager(role: EmployeeRole): boolean {
  return role === "MANAGER";
}

/** MANAGER or STAFF — every employee role. */
export function canAccessManage(role: EmployeeRole): boolean {
  return role === "MANAGER" || role === "STAFF";
}

/**
 * Routes that are restricted to MANAGER only (reports, staff
 * management). STAFF can still reach orders and menu.
 */
export function canAccessAdminOnly(role: EmployeeRole): boolean {
  return isManager(role);
}

// ---------------------------------------------------------------------------
// Role-change rules
// ---------------------------------------------------------------------------

/**
 * Can `callerRole` change an employee whose current role is
 * `targetCurrentRole` to `newRole`?
 *
 * Rules:
 *  - MANAGER → can change anyone to any role
 *  - STAFF → never
 */
export function canChangeRole(
  callerRole: EmployeeRole,
  targetCurrentRole: EmployeeRole,
  newRole: EmployeeRole,
): boolean {
  // Staff can never change roles.
  if (callerRole === "STAFF") return false;

  // Manager can do anything.
  if (callerRole === "MANAGER") return true;

  return false;
}

/**
 * Can `callerRole` disable/enable an employee whose role is `targetRole`?
 *
 * Rules:
 *  - Cannot disable own account
 *  - MANAGER → can disable/enable STAFF only (cannot touch other MANAGERs)
 *  - STAFF → never
 */
export function canDisableEmployee(
  callerRole: EmployeeRole,
  targetRole: EmployeeRole,
  isSelf: boolean = false,
): boolean {
  if (isSelf) return false;
  if (callerRole === "MANAGER") {
    return targetRole === "STAFF";
  }
  return false;
}

/**
 * Can `callerRole` reset/change the password of an employee with `targetRole`?
 *
 * Rules:
 *  - Anyone can change their own password
 *  - MANAGER → can change STAFF passwords only (cannot touch other MANAGERs)
 *  - STAFF → cannot change anyone else's password
 */
export function canResetEmployeePassword(
  callerRole: EmployeeRole,
  targetRole: EmployeeRole,
  isSelf: boolean = false,
): boolean {
  if (isSelf) return true;
  if (callerRole === "MANAGER") {
    return targetRole === "STAFF";
  }
  return false;
}

// ---------------------------------------------------------------------------
// Display + routing
// ---------------------------------------------------------------------------

/**
 * The two roles the back office presents. Every legacy label (Server, Cook,
 * Cashier, …) is folded into STAFF by `normalizeEmployeeRoleLabel`, so the
 * directory, its filter and the create/edit form only ever show these.
 */
export const ROLE_DISPLAY_LABELS: Record<EmployeeRole, string> = {
  MANAGER: "Manager",
  STAFF: "Staff",
};

/** "Manager" | "Staff" for any stored role spelling; "Staff" if unknown. */
export function roleDisplayLabel(role: string | null | undefined): string {
  const normalized = normalizeEmployeeRoleLabel(role);
  return normalized ? ROLE_DISPLAY_LABELS[normalized] : ROLE_DISPLAY_LABELS.STAFF;
}

/**
 * Case-insensitive, alias-aware role read. Stored roles are not guaranteed to
 * be upper-case ("Manager", "manager"), and comparing them with `===` against
 * "MANAGER" is what made a valid manager fail every permission check.
 */
export function resolveEmployeeRole(
  role: string | null | undefined,
): EmployeeRole | null {
  return normalizeEmployeeRoleLabel(role);
}

/**
 * Where each role lands after signing in.
 *
 * A null role — no employee row, or one whose role nobody recognises — is sent
 * to the employee login rather than to the dashboard. Returning a /manage page
 * for a role that `canAccessManagePath` then refuses is how a redirect ends up
 * pointing at itself.
 */
export function homePathForRole(role: EmployeeRole | null): string {
  if (role === "STAFF") return "/manage/orders";
  if (role === "MANAGER") return "/manage/dashboard";
  return "/employee/login";
}

/**
 * The /manage pages STAFF may open. Everything else under /manage (dashboard,
 * reports, customers, employees) is manager-only, and is hidden from the
 * sidebar *and* refused here, so typing the URL does not get around it.
 */
const STAFF_MANAGE_PREFIXES = [
  "/manage/orders",
  "/manage/menu",
  "/manage/kds",
  "/manage/profile",
] as const;

export function canAccessManagePath(
  role: EmployeeRole | null,
  pathname: string,
): boolean {
  if (role === "MANAGER") return true;
  if (role === "STAFF") {
    return STAFF_MANAGE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }
  return false;
}
