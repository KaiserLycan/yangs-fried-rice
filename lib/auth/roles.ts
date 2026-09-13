/**
 * Role hierarchy and permission helpers.
 *
 * Pure functions — no DB or network calls. Every role check in the
 * codebase should go through these helpers so the hierarchy is defined
 * in exactly one place.
 *
 * Hierarchy (highest → lowest):
 *   manager  >  staff  >  rider
 */

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const EMPLOYEE_ROLES = ["MANAGER", "STAFF", "RIDER"] as const;
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

/** Numeric weight — higher number = more authority. */
export const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  MANAGER: 2,
  STAFF: 1,
  RIDER: 0,
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

/** MANAGER or STAFF — everyone except riders. */
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
 *  - STAFF / RIDER → never
 */
export function canChangeRole(
  callerRole: EmployeeRole,
  targetCurrentRole: EmployeeRole,
  newRole: EmployeeRole,
): boolean {
  // Staff and riders can never change roles.
  if (callerRole === "STAFF" || callerRole === "RIDER") return false;

  // Manager can do anything.
  if (callerRole === "MANAGER") return true;

  return false;
}

/**
 * Can `callerRole` disable/enable an employee whose role is `targetRole`?
 *
 * Rules:
 *  - Cannot disable own account
 *  - MANAGER → can disable/enable STAFF and RIDER only (cannot touch other MANAGERs)
 *  - STAFF / RIDER → never
 */
export function canDisableEmployee(
  callerRole: EmployeeRole,
  targetRole: EmployeeRole,
  isSelf: boolean = false,
): boolean {
  if (isSelf) return false;
  if (callerRole === "MANAGER") {
    return targetRole === "STAFF" || targetRole === "RIDER";
  }
  return false;
}

/**
 * Can `callerRole` reset/change the password of an employee with `targetRole`?
 *
 * Rules:
 *  - Anyone can change their own password
 *  - MANAGER → can change STAFF and RIDER passwords only (cannot touch other MANAGERs)
 *  - STAFF / RIDER → cannot change anyone else's password
 */
export function canResetEmployeePassword(
  callerRole: EmployeeRole,
  targetRole: EmployeeRole,
  isSelf: boolean = false,
): boolean {
  if (isSelf) return true;
  if (callerRole === "MANAGER") {
    return targetRole === "STAFF" || targetRole === "RIDER";
  }
  return false;
}


