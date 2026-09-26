import { z } from "zod";
import { EMPLOYEE_ROLES } from "@/lib/auth/roles";
import { optionalPhoneSchema } from "./phone";
import { employeeDateOfBirthSchema } from "./date-of-birth";
import {
  emailSchema,
  firstNameSchema,
  lastNameSchema,
} from "./fields";

/**
 * Employee profile update (AC2). All fields optional so one action
 * covers "update just my name" as well as "update everything."
 *
 * `role` is included in the shape because a Manager legitimately needs
 * to be able to set it, but lib/actions/employee-profile.ts enforces
 * that only a caller who IS a Manager may actually change it — this
 * schema only checks that the value, if present, is a real role.
 */
export const employeeProfileUpdateSchema = z.object({
  firstName: firstNameSchema.optional(),
  lastName: lastNameSchema.optional(),
  email: emailSchema.optional(),
  /** +63 followed by 10 digits, or blank. Same rule as every other screen. */
  mobile: optionalPhoneSchema.optional(),
  dateOfBirth: employeeDateOfBirthSchema.optional(),
  department: z.string().trim().max(100).optional(),
  scheduleShift: z.string().trim().max(100).optional(),
  role: z.enum(EMPLOYEE_ROLES).optional(),
});

export type EmployeeProfileUpdateInput = z.infer<
  typeof employeeProfileUpdateSchema
>;

/** The employee personal-details card: both names required, DOB optional. */
export const employeePersonalDetailsSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  dateOfBirth: employeeDateOfBirthSchema,
});
