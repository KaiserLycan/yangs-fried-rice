import { describe, it, expect } from "vitest";
import { normalizeEmployeeRoleLabel } from "@/lib/auth/roles";
import {
  createEmployeeSchema,
  changeRoleSchema,
  changePasswordSchema,
  updateCustomerSchema,
} from "./admin";

describe("normalizeEmployeeRoleLabel", () => {
  it("maps delivery UI labels to rider database roles", () => {
    expect(normalizeEmployeeRoleLabel("Delivery")).toBe("RIDER");
    expect(normalizeEmployeeRoleLabel("Manager")).toBe("MANAGER");
    expect(normalizeEmployeeRoleLabel("Server")).toBe("STAFF");
    expect(normalizeEmployeeRoleLabel("Rider")).toBe("RIDER");
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

  it("requires rider details for a rider", () => {
    expect(createEmployeeSchema.safeParse({ ...valid, role: "RIDER" }).success).toBe(false);
    expect(
      createEmployeeSchema.safeParse({
        ...valid,
        role: "RIDER",
        riderDetails: {
          vehicle_make_model: "Honda Click 125i",
          vehicle_plate_number: "NBA 1234",
          driver_license_number: "N01-15-123456",
          license_expiry_date: "2099-01-01",
        },
      }).success,
    ).toBe(true);
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

  const riderDetails = {
    vehicle_make_model: "Toyota Hiace",
    vehicle_plate_number: "ABC 1234",
    driver_license_number: "N01-12-345678",
    license_expiry_date: "2099-05-30",
  };

  it.each(["MANAGER", "STAFF", "RIDER"] as const)(
    "accepts role '%s'",
    (role) => {
      expect(
        createEmployeeSchema.safeParse({
          ...valid,
          role,
          ...(role === "RIDER" ? { riderDetails } : {}),
        }).success,
      ).toBe(true);
    },
  );

  it("accepts rider-specific details for a delivery/rider employee", () => {
    const result = createEmployeeSchema.safeParse({
      ...valid,
      role: "RIDER",
      scheduleShift: null,
      riderDetails,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a licence number that isn't in the LTO format", () => {
    const result = createEmployeeSchema.safeParse({
      ...valid,
      role: "RIDER",
      riderDetails: { ...riderDetails, driver_license_number: "N01-1234567" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an expired licence", () => {
    const result = createEmployeeSchema.safeParse({
      ...valid,
      role: "RIDER",
      riderDetails: { ...riderDetails, license_expiry_date: "2001-01-01" },
    });
    expect(result.success).toBe(false);
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

