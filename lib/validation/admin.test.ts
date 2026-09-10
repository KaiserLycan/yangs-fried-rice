import { describe, it, expect } from "vitest";
import {
  createEmployeeSchema,
  changeRoleSchema,
  changePasswordSchema,
  updateCustomerSchema,
} from "./admin";

describe("createEmployeeSchema", () => {
  const valid = {
    name: "Juan Dela Cruz",
    email: "juan@yangsfr.com",
    password: "securepass1",
    role: "STAFF" as const,
  };

  it("accepts valid input", () => {
    expect(createEmployeeSchema.safeParse(valid).success).toBe(true);
  });

  it("trims name", () => {
    const result = createEmployeeSchema.safeParse({ ...valid, name: "  Juan  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Juan");
  });

  it("rejects empty name", () => {
    expect(
      createEmployeeSchema.safeParse({ ...valid, name: "" }).success,
    ).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    expect(
      createEmployeeSchema.safeParse({ ...valid, name: "A".repeat(101) })
        .success,
    ).toBe(false);
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

  it.each(["ADMIN", "MANAGER", "STAFF", "RIDER"] as const)(
    "accepts role '%s'",
    (role) => {
      expect(
        createEmployeeSchema.safeParse({ ...valid, role }).success,
      ).toBe(true);
    },
  );

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
    const result = updateCustomerSchema.safeParse({ name: "Maria" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name when provided", () => {
    expect(
      updateCustomerSchema.safeParse({ name: "" }).success,
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

