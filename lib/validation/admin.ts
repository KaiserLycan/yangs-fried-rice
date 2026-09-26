import { z } from "zod";
import { EMPLOYEE_ROLES, type EmployeeRole } from "@/lib/auth/roles";
import { optionalPhoneSchema } from "./phone";
import { employeeDateOfBirthSchema } from "./date-of-birth";
import {
  driverLicenseNumberSchema,
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  licenseExpiryDateSchema,
  passwordSchema,
  vehicleMakeModelSchema,
  vehiclePlateNumberSchema,
} from "./fields";

/**
 * Admin validation schemas — employee creation and role management.
 *
 * These schemas validate inputs for the server actions in
 * `lib/actions/admin.ts`. They do NOT enforce authorisation (who is
 * allowed to call); that lives in the action itself.
 */

// ---------------------------------------------------------------------------
// Create Employee
// ---------------------------------------------------------------------------

/** A rider's four vehicle/licence fields — all required when the role is Rider. */
export const riderDetailsSchema = z.object({
  vehicle_make_model: vehicleMakeModelSchema,
  vehicle_plate_number: vehiclePlateNumberSchema,
  driver_license_number: driverLicenseNumberSchema,
  license_expiry_date: licenseExpiryDateSchema,
});

export type RiderDetailsInput = z.infer<typeof riderDetailsSchema>;

export const createEmployeeSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,

  email: emailSchema,

  password: passwordSchema,

  role: z.enum(EMPLOYEE_ROLES, {
    errorMap: () => ({
      message: `Role must be one of: ${EMPLOYEE_ROLES.join(", ")}.`,
    }),
  }),

  scheduleShift: z.string().nullable().optional(),

  /** Optional Philippine mobile; blank is fine. Stored as +63XXXXXXXXXX. */
  phone: optionalPhoneSchema.optional(),

  /** Optional ISO date, not in the future. */
  dateOfBirth: employeeDateOfBirthSchema.optional(),

  riderDetails: riderDetailsSchema.optional(),
}).superRefine((values, ctx) => {
  if (values.role === "RIDER" && !values.riderDetails) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["riderDetails"],
      message: "A rider needs a licence number, vehicle and plate number.",
    });
  }
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// ---------------------------------------------------------------------------
// Change Role
// ---------------------------------------------------------------------------

export const changeRoleSchema = z.object({
  employee_id: z
    .string()
    .uuid("Employee ID must be a valid UUID."),

  new_role: z.enum(EMPLOYEE_ROLES, {
    errorMap: () => ({
      message: `Role must be one of: ${EMPLOYEE_ROLES.join(", ")}.`,
    }),
  }),
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

// ---------------------------------------------------------------------------
// Change / Reset Password
// ---------------------------------------------------------------------------

export const changePasswordSchema = z.object({
  new_password: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Update Customer
// ---------------------------------------------------------------------------

export const updateCustomerSchema = z.object({
  firstName: firstNameSchema.optional(),
  lastName: lastNameSchema.optional(),

  email: emailSchema.optional(),

  /** +63 followed by 10 digits, or blank. */
  phone_number: optionalPhoneSchema.optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
