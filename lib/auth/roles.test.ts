import { describe, it, expect } from "vitest";
import {
  canChangeRole,
  canAccessManage,
  canAccessAdminOnly,
  isManager,
  isEmployeeRole,
  canDisableEmployee,
  canResetEmployeePassword,
  EMPLOYEE_ROLES,
  ROLE_HIERARCHY,
  roleDisplayLabel,
  resolveEmployeeRole,
  canAccessManagePath,
  homePathForRole,
} from "./roles";

describe("isEmployeeRole", () => {
  it.each(EMPLOYEE_ROLES)("accepts '%s'", (role) => {
    expect(isEmployeeRole(role)).toBe(true);
  });

  it("rejects unknown strings", () => {
    expect(isEmployeeRole("superadmin")).toBe(false);
    expect(isEmployeeRole("")).toBe(false);
    expect(isEmployeeRole("admin")).toBe(false);
    expect(isEmployeeRole("ADMIN")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isEmployeeRole(null)).toBe(false);
    expect(isEmployeeRole(undefined)).toBe(false);
    expect(isEmployeeRole(42)).toBe(false);
  });
});

describe("ROLE_HIERARCHY ordering", () => {
  it("MANAGER > STAFF", () => {
    expect(ROLE_HIERARCHY.MANAGER).toBeGreaterThan(ROLE_HIERARCHY.STAFF);
  });
});

describe("isManager", () => {
  it("returns true for MANAGER", () => {
    expect(isManager("MANAGER")).toBe(true);
  });

  it("returns false for STAFF", () => {
    expect(isManager("STAFF")).toBe(false);
  });
});

describe("canAccessManage", () => {
  it("allows MANAGER, STAFF", () => {
    expect(canAccessManage("MANAGER")).toBe(true);
    expect(canAccessManage("STAFF")).toBe(true);
  });
});

describe("canAccessAdminOnly", () => {
  it("allows MANAGER", () => {
    expect(canAccessAdminOnly("MANAGER")).toBe(true);
  });

  it("denies STAFF", () => {
    expect(canAccessAdminOnly("STAFF")).toBe(false);
  });
});

describe("canChangeRole", () => {
  // ---- MANAGER caller ----
  describe("MANAGER caller", () => {
    it("can promote STAFF to MANAGER", () => {
      expect(canChangeRole("MANAGER", "STAFF", "MANAGER")).toBe(true);
    });

    it("can demote MANAGER to STAFF", () => {
      expect(canChangeRole("MANAGER", "MANAGER", "STAFF")).toBe(true);
    });
  });

  // ---- STAFF caller ----
  describe("STAFF caller", () => {
    it("cannot change any role", () => {
      expect(canChangeRole("STAFF", "STAFF", "MANAGER")).toBe(false);
      expect(canChangeRole("STAFF", "MANAGER", "STAFF")).toBe(false);
    });
  });
});

describe("canDisableEmployee", () => {
  it("never allows self-disable", () => {
    expect(canDisableEmployee("MANAGER", "MANAGER", true)).toBe(false);
  });

  describe("MANAGER caller", () => {
    it("can disable STAFF", () => {
      expect(canDisableEmployee("MANAGER", "STAFF", false)).toBe(true);
    });

    it("cannot disable another MANAGER", () => {
      expect(canDisableEmployee("MANAGER", "MANAGER", false)).toBe(false);
    });
  });

  describe("STAFF caller", () => {
    it("cannot disable anyone", () => {
      expect(canDisableEmployee("STAFF", "STAFF", false)).toBe(false);
    });
  });
});

describe("canResetEmployeePassword", () => {
  it("allows self-reset for any role", () => {
    expect(canResetEmployeePassword("MANAGER", "MANAGER", true)).toBe(true);
    expect(canResetEmployeePassword("STAFF", "STAFF", true)).toBe(true);
  });

  describe("MANAGER caller", () => {
    it("can reset password for STAFF", () => {
      expect(canResetEmployeePassword("MANAGER", "STAFF", false)).toBe(true);
    });

    it("cannot reset password for another MANAGER", () => {
      expect(canResetEmployeePassword("MANAGER", "MANAGER", false)).toBe(false);
    });
  });

  describe("STAFF caller", () => {
    it("cannot reset anyone else's password", () => {
      expect(canResetEmployeePassword("STAFF", "STAFF", false)).toBe(false);
    });
  });
});

describe("role display + routing", () => {
  it("folds legacy staff labels into Staff", () => {
    expect(roleDisplayLabel("Server")).toBe("Staff");
    expect(roleDisplayLabel("cook")).toBe("Staff");
    expect(roleDisplayLabel("CASHIER")).toBe("Staff");
    expect(roleDisplayLabel("manager")).toBe("Manager");
    expect(roleDisplayLabel(null)).toBe("Staff");
  });

  it("reads stored roles regardless of casing", () => {
    expect(resolveEmployeeRole("Manager")).toBe("MANAGER");
    expect(resolveEmployeeRole("manager")).toBe("MANAGER");
    expect(resolveEmployeeRole("nonsense")).toBeNull();
  });

  // Pickup-only (issue #114): a stored rider role is no longer an employee
  // role, so it passes no guard and has no home page.
  it("does not recognise the retired rider roles", () => {
    expect(resolveEmployeeRole("RIDER")).toBeNull();
    expect(resolveEmployeeRole("Delivery")).toBeNull();
    expect(isEmployeeRole("RIDER")).toBe(false);
    expect(homePathForRole(resolveEmployeeRole("RIDER"))).toBe("/employee/login");
  });

  it("keeps the dashboard and admin pages away from STAFF", () => {
    expect(canAccessManagePath("STAFF", "/manage/dashboard")).toBe(false);
    expect(canAccessManagePath("STAFF", "/manage/reports")).toBe(false);
    expect(canAccessManagePath("STAFF", "/manage/customers")).toBe(false);
    expect(canAccessManagePath("STAFF", "/manage/employee")).toBe(false);
    expect(canAccessManagePath("STAFF", "/manage/orders")).toBe(true);
    expect(canAccessManagePath("STAFF", "/manage/menu")).toBe(true);
    expect(canAccessManagePath("STAFF", "/manage/kds")).toBe(true);
    expect(canAccessManagePath("STAFF", "/manage/profile")).toBe(true);
  });

  it("does not let a prefix match a look-alike path", () => {
    expect(canAccessManagePath("STAFF", "/manage/orders-admin")).toBe(false);
  });

  it("lets a MANAGER anywhere and an unrecognised role nowhere under /manage", () => {
    expect(canAccessManagePath("MANAGER", "/manage/dashboard")).toBe(true);
    expect(canAccessManagePath(null, "/manage/orders")).toBe(false);
  });

  it("sends each role to its own home page", () => {
    expect(homePathForRole("MANAGER")).toBe("/manage/dashboard");
    expect(homePathForRole("STAFF")).toBe("/manage/orders");
  });
});
