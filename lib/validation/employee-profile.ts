import { z } from "zod";
import { EMPLOYEE_ROLES } from "@/lib/auth/roles";
import { optionalPhoneSchema } from "./phone";

/**
 * Employee profile update (AC2). All fields optional so one action
 * covers "update just my name" as well as "update everything."
 *
 * `department` is validated here so the request shape is already
 * correct the day a column for it exists — there isn't one on
 * `employee` yet, and the corresponding action does not persist it.
 * Same treatment as `dateOfBirth` on the customer side.
 *
 * `role` is included in the shape because a Manager legitimately needs
 * to be able to set it, but lib/actions/employee-profile.ts enforces
 * that only a caller who IS a Manager may actually change it — this
 * schema only checks that the value, if present, is a real role.
 */
export const employeeProfileUpdateSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(150).optional(),
  email: z.string().trim().email("Enter a valid email.").max(255).optional(),
  /** +63 followed by 10 digits, or blank. Same rule as every other screen. */
  mobile: optionalPhoneSchema.optional(),
  dateOfBirth: z.union([z.string().trim().max(20), z.literal("")]).optional(),
  department: z.string().trim().max(100).optional(),
  scheduleShift: z.string().trim().max(100).optional(),
  role: z.enum(EMPLOYEE_ROLES).optional(),
});

export type EmployeeProfileUpdateInput = z.infer<
  typeof employeeProfileUpdateSchema
>;

/**
 * Rider-specific details (vehicle, license) — a separate schema/action
 * from the general employee profile since these columns live on the
 * `rider` table, not `employee`, and only apply to callers who have a
 * rider row at all.
 */
export const riderDetailsUpdateSchema = z.object({
  vehicleMakeModel: z.string().trim().max(100).optional(),
  vehiclePlateNumber: z.string().trim().max(20).optional(),
  driverLicenseNumber: z.string().trim().max(50).optional(),
  /** ISO YYYY-MM-DD, matching what a native date input produces. */
  licenseExpiryDate: z.string().trim().max(20).optional(),
});

export type RiderDetailsUpdateInput = z.infer<typeof riderDetailsUpdateSchema>;