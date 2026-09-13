import { z } from "zod";
import { EMPLOYEE_ROLES, type EmployeeRole } from "@/lib/auth/roles";

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

export const createEmployeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Employee name is required.")
    .max(100, "Name must be 100 characters or fewer."),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address."),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters."),

  role: z.enum(EMPLOYEE_ROLES, {
    errorMap: () => ({
      message: `Role must be one of: ${EMPLOYEE_ROLES.join(", ")}.`,
    }),
  }),
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
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters."),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Update Customer
// ---------------------------------------------------------------------------

export const updateCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(100, "Name must be 100 characters or fewer.")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional(),

  phone_number: z
    .string()
    .trim()
    .optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
