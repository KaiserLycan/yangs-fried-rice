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
  it("MANAGER > STAFF > RIDER", () => {
    expect(ROLE_HIERARCHY.MANAGER).toBeGreaterThan(ROLE_HIERARCHY.STAFF);
    expect(ROLE_HIERARCHY.STAFF).toBeGreaterThan(ROLE_HIERARCHY.RIDER);
  });
});

describe("isManager", () => {
  it("returns true for MANAGER", () => {
    expect(isManager("MANAGER")).toBe(true);
  });

  it("returns false for STAFF", () => {
    expect(isManager("STAFF")).toBe(false);
  });

  it("returns false for RIDER", () => {
    expect(isManager("RIDER")).toBe(false);
  });
});

describe("canAccessManage", () => {
  it("allows MANAGER, STAFF", () => {
    expect(canAccessManage("MANAGER")).toBe(true);
    expect(canAccessManage("STAFF")).toBe(true);
  });

  it("denies RIDER", () => {
    expect(canAccessManage("RIDER")).toBe(false);
  });
});

describe("canAccessAdminOnly", () => {
  it("allows MANAGER", () => {
    expect(canAccessAdminOnly("MANAGER")).toBe(true);
  });

  it("denies STAFF, RIDER", () => {
    expect(canAccessAdminOnly("STAFF")).toBe(false);
    expect(canAccessAdminOnly("RIDER")).toBe(false);
  });
});

describe("canChangeRole", () => {
  // ---- MANAGER caller ----
  describe("MANAGER caller", () => {
    it("can change STAFF to RIDER", () => {
      expect(canChangeRole("MANAGER", "STAFF", "RIDER")).toBe(true);
    });

    it("can change RIDER to STAFF", () => {
      expect(canChangeRole("MANAGER", "RIDER", "STAFF")).toBe(true);
    });

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
      expect(canChangeRole("STAFF", "RIDER", "STAFF")).toBe(false);
    });
  });

  // ---- RIDER caller ----
  describe("RIDER caller", () => {
    it("cannot change any role", () => {
      expect(canChangeRole("RIDER", "STAFF", "MANAGER")).toBe(false);
      expect(canChangeRole("RIDER", "RIDER", "STAFF")).toBe(false);
    });
  });
});

describe("canDisableEmployee", () => {
  it("never allows self-disable", () => {
    expect(canDisableEmployee("MANAGER", "MANAGER", true)).toBe(false);
  });

  describe("MANAGER caller", () => {
    it("can disable STAFF and RIDER", () => {
      expect(canDisableEmployee("MANAGER", "STAFF", false)).toBe(true);
      expect(canDisableEmployee("MANAGER", "RIDER", false)).toBe(true);
    });

    it("cannot disable another MANAGER", () => {
      expect(canDisableEmployee("MANAGER", "MANAGER", false)).toBe(false);
    });
  });

  describe("STAFF / RIDER caller", () => {
    it("cannot disable anyone", () => {
      expect(canDisableEmployee("STAFF", "STAFF", false)).toBe(false);
      expect(canDisableEmployee("RIDER", "RIDER", false)).toBe(false);
    });
  });
});

describe("canResetEmployeePassword", () => {
  it("allows self-reset for any role", () => {
    expect(canResetEmployeePassword("MANAGER", "MANAGER", true)).toBe(true);
    expect(canResetEmployeePassword("STAFF", "STAFF", true)).toBe(true);
    expect(canResetEmployeePassword("RIDER", "RIDER", true)).toBe(true);
  });

  describe("MANAGER caller", () => {
    it("can reset password for STAFF and RIDER", () => {
      expect(canResetEmployeePassword("MANAGER", "STAFF", false)).toBe(true);
      expect(canResetEmployeePassword("MANAGER", "RIDER", false)).toBe(true);
    });

    it("cannot reset password for another MANAGER", () => {
      expect(canResetEmployeePassword("MANAGER", "MANAGER", false)).toBe(false);
    });
  });

  describe("STAFF / RIDER caller", () => {
    it("cannot reset anyone else's password", () => {
      expect(canResetEmployeePassword("STAFF", "STAFF", false)).toBe(false);
      expect(canResetEmployeePassword("RIDER", "RIDER", false)).toBe(false);
    });
  });
});


