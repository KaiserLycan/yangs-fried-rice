import { describe, it, expect } from "vitest";
import { normalizeEmployeeRoleLabel } from "@/lib/auth/roles";
import {
  createEmployeeSchema,
  changeRoleSchema,
  changePasswordSchema,
  updateCustomerSchema,
} from "./admin";

describe("normalizeEmployeeRoleLabel", () => {
  it("maps UI labels to database roles", () => {
    expect(normalizeEmployeeRoleLabel("Manager")).toBe("MANAGER");
    expect(normalizeEmployeeRoleLabel("Server")).toBe("STAFF");
  });

  // Pickup-only (issue #114): the rider labels no longer name a role.
  it("does not map the retired rider labels", () => {
    expect(normalizeEmployeeRoleLabel("Delivery")).toBeNull();
    expect(normalizeEmployeeRoleLabel("Rider")).toBeNull();
  });
});

describe("createEmployeeSchema", () => {
  const valid = {
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan@yangsfr.com",
    password: "securepass1",
    role: "STAFF" as const,
  };

  it("accepts valid input", () => {
    expect(createEmployeeSchema.safeParse(valid).success).toBe(true);
  });

  it("trims both name parts", () => {
    const result = createEmployeeSchema.safeParse({ ...valid, firstName: "  Juan  ", lastName: " Dela Cruz " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("Juan");
      expect(result.data.lastName).toBe("Dela Cruz");
    }
  });

  it("rejects an empty first or last name", () => {
    expect(createEmployeeSchema.safeParse({ ...valid, firstName: "" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, lastName: "" }).success).toBe(false);
  });

  it("rejects a name part over 50 chars or under 2", () => {
    expect(createEmployeeSchema.safeParse({ ...valid, firstName: "A".repeat(51) }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...valid, lastName: "C" }).success).toBe(false);
  });

  it("rejects digits in a name", () => {
    expect(createEmployeeSchema.safeParse({ ...valid, firstName: "Juan2" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(
      createEmployeeSchema.safeParse({ ...valid, email: "not-email" }).success,
    ).toBe(false);
  });

  it("rejects password under 8 chars", () => {
    expect(
      createEmployeeSchema.safeParse({ ...valid, password: "short" }).success,
    ).toBe(false);
  });

  it.each(["MANAGER", "STAFF"] as const)("accepts role '%s'", (role) => {
    expect(createEmployeeSchema.safeParse({ ...valid, role }).success).toBe(true);
  });

  it("rejects the retired RIDER role", () => {
    expect(createEmployeeSchema.safeParse({ ...valid, role: "RIDER" }).success).toBe(false);
  });

  it("rejects unknown role", () => {
    expect(
      createEmployeeSchema.safeParse({ ...valid, role: "superadmin" }).success,
    ).toBe(false);
  });
});

describe("changeRoleSchema", () => {
  const valid = {
    employee_id: "550e8400-e29b-41d4-a716-446655440000",
    new_role: "MANAGER" as const,
  };

  it("accepts valid input", () => {
    expect(changeRoleSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-UUID employee_id", () => {
    expect(
      changeRoleSchema.safeParse({ ...valid, employee_id: "not-a-uuid" })
        .success,
    ).toBe(false);
  });

  it("rejects unknown role", () => {
    expect(
      changeRoleSchema.safeParse({ ...valid, new_role: "ceo" }).success,
    ).toBe(false);
  });
});

describe("updateCustomerSchema", () => {
  it("accepts all optional fields", () => {
    expect(updateCustomerSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update", () => {
    const result = updateCustomerSchema.safeParse({ firstName: "Maria" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name when provided", () => {
    expect(
      updateCustomerSchema.safeParse({ lastName: "" }).success,
    ).toBe(false);
  });

  it("rejects invalid email when provided", () => {
    expect(
      updateCustomerSchema.safeParse({ email: "bad" }).success,
    ).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts valid password (>= 8 chars)", () => {
    expect(
      changePasswordSchema.safeParse({ new_password: "securepassword123" })
        .success,
    ).toBe(true);
  });

  it("rejects password shorter than 8 chars", () => {
    expect(
      changePasswordSchema.safeParse({ new_password: "short" }).success,
    ).toBe(false);
  });

  it("rejects missing new_password", () => {
    expect(changePasswordSchema.safeParse({}).success).toBe(false);
  });
});

