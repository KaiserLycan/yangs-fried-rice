import { describe, it, expect } from "vitest";
import {
  canChangeRole,
  canAccessManage,
  canAccessAdminOnly,
  isAdminOrManager,
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
  });

  it("rejects non-strings", () => {
    expect(isEmployeeRole(null)).toBe(false);
    expect(isEmployeeRole(undefined)).toBe(false);
    expect(isEmployeeRole(42)).toBe(false);
  });
});

describe("ROLE_HIERARCHY ordering", () => {
  it("ADMIN > MANAGER > STAFF > RIDER", () => {
    expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.MANAGER);
    expect(ROLE_HIERARCHY.MANAGER).toBeGreaterThan(ROLE_HIERARCHY.STAFF);
    expect(ROLE_HIERARCHY.STAFF).toBeGreaterThan(ROLE_HIERARCHY.RIDER);
  });
});

describe("isAdminOrManager", () => {
  it("returns true for ADMIN", () => {
    expect(isAdminOrManager("ADMIN")).toBe(true);
  });

  it("returns true for MANAGER", () => {
    expect(isAdminOrManager("MANAGER")).toBe(true);
  });

  it("returns false for STAFF", () => {
    expect(isAdminOrManager("STAFF")).toBe(false);
  });

  it("returns false for RIDER", () => {
    expect(isAdminOrManager("RIDER")).toBe(false);
  });
});

describe("canAccessManage", () => {
  it("allows ADMIN, MANAGER, STAFF", () => {
    expect(canAccessManage("ADMIN")).toBe(true);
    expect(canAccessManage("MANAGER")).toBe(true);
    expect(canAccessManage("STAFF")).toBe(true);
  });

  it("denies RIDER", () => {
    expect(canAccessManage("RIDER")).toBe(false);
  });
});

describe("canAccessAdminOnly", () => {
  it("allows ADMIN, MANAGER", () => {
    expect(canAccessAdminOnly("ADMIN")).toBe(true);
    expect(canAccessAdminOnly("MANAGER")).toBe(true);
  });

  it("denies STAFF, RIDER", () => {
    expect(canAccessAdminOnly("STAFF")).toBe(false);
    expect(canAccessAdminOnly("RIDER")).toBe(false);
  });
});

describe("canChangeRole", () => {
  // ---- ADMIN caller ----
  describe("ADMIN caller", () => {
    it("can promote STAFF to MANAGER", () => {
      expect(canChangeRole("ADMIN", "STAFF", "MANAGER")).toBe(true);
    });

    it("can promote STAFF to ADMIN", () => {
      expect(canChangeRole("ADMIN", "STAFF", "ADMIN")).toBe(true);
    });

    it("can demote MANAGER to STAFF", () => {
      expect(canChangeRole("ADMIN", "MANAGER", "STAFF")).toBe(true);
    });

    it("can change another ADMIN's role", () => {
      expect(canChangeRole("ADMIN", "ADMIN", "STAFF")).toBe(true);
    });

    it("can change RIDER to STAFF", () => {
      expect(canChangeRole("ADMIN", "RIDER", "STAFF")).toBe(true);
    });
  });

  // ---- MANAGER caller ----
  describe("MANAGER caller", () => {
    it("can promote STAFF to MANAGER", () => {
      expect(canChangeRole("MANAGER", "STAFF", "MANAGER")).toBe(true);
    });

    it("can demote MANAGER to STAFF", () => {
      expect(canChangeRole("MANAGER", "MANAGER", "STAFF")).toBe(true);
    });

    it("can change RIDER to STAFF", () => {
      expect(canChangeRole("MANAGER", "RIDER", "STAFF")).toBe(true);
    });

    it("cannot promote anyone to ADMIN", () => {
      expect(canChangeRole("MANAGER", "STAFF", "ADMIN")).toBe(false);
      expect(canChangeRole("MANAGER", "MANAGER", "ADMIN")).toBe(false);
    });

    it("cannot change an ADMIN's role", () => {
      expect(canChangeRole("MANAGER", "ADMIN", "STAFF")).toBe(false);
      expect(canChangeRole("MANAGER", "ADMIN", "MANAGER")).toBe(false);
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
    expect(canDisableEmployee("ADMIN", "ADMIN", true)).toBe(false);
    expect(canDisableEmployee("MANAGER", "MANAGER", true)).toBe(false);
  });

  describe("ADMIN caller", () => {
    it("can disable any other employee", () => {
      expect(canDisableEmployee("ADMIN", "ADMIN", false)).toBe(true);
      expect(canDisableEmployee("ADMIN", "MANAGER", false)).toBe(true);
      expect(canDisableEmployee("ADMIN", "STAFF", false)).toBe(true);
      expect(canDisableEmployee("ADMIN", "RIDER", false)).toBe(true);
    });
  });

  describe("MANAGER caller", () => {
    it("can disable STAFF and RIDER", () => {
      expect(canDisableEmployee("MANAGER", "STAFF", false)).toBe(true);
      expect(canDisableEmployee("MANAGER", "RIDER", false)).toBe(true);
    });

    it("cannot disable MANAGER or ADMIN", () => {
      expect(canDisableEmployee("MANAGER", "MANAGER", false)).toBe(false);
      expect(canDisableEmployee("MANAGER", "ADMIN", false)).toBe(false);
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
    expect(canResetEmployeePassword("ADMIN", "ADMIN", true)).toBe(true);
    expect(canResetEmployeePassword("MANAGER", "MANAGER", true)).toBe(true);
    expect(canResetEmployeePassword("STAFF", "STAFF", true)).toBe(true);
    expect(canResetEmployeePassword("RIDER", "RIDER", true)).toBe(true);
  });

  describe("ADMIN caller", () => {
    it("can reset password for any employee", () => {
      expect(canResetEmployeePassword("ADMIN", "ADMIN", false)).toBe(true);
      expect(canResetEmployeePassword("ADMIN", "MANAGER", false)).toBe(true);
      expect(canResetEmployeePassword("ADMIN", "STAFF", false)).toBe(true);
      expect(canResetEmployeePassword("ADMIN", "RIDER", false)).toBe(true);
    });
  });

  describe("MANAGER caller", () => {
    it("can reset password for STAFF and RIDER", () => {
      expect(canResetEmployeePassword("MANAGER", "STAFF", false)).toBe(true);
      expect(canResetEmployeePassword("MANAGER", "RIDER", false)).toBe(true);
    });

    it("cannot reset password for MANAGER or ADMIN", () => {
      expect(canResetEmployeePassword("MANAGER", "MANAGER", false)).toBe(false);
      expect(canResetEmployeePassword("MANAGER", "ADMIN", false)).toBe(false);
    });
  });

  describe("STAFF / RIDER caller", () => {
    it("cannot reset anyone else's password", () => {
      expect(canResetEmployeePassword("STAFF", "STAFF", false)).toBe(false);
      expect(canResetEmployeePassword("RIDER", "RIDER", false)).toBe(false);
    });
  });
});


