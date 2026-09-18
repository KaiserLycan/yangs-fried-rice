import { z } from "zod";

/**
 * Schema for registering a new rider from an existing employee.
 */
export const riderSchema = z.object({
  employee_id: z
    .string({ required_error: "Employee ID is required" })
    .uuid("Employee ID must be a valid UUID"),
  vehicle_plate_number: z
    .string()
    .min(1, "Vehicle plate number must not be empty")
    .optional(),
  vehicle_make_model: z.string().optional(),
  driver_license_number: z.string().optional(),
  license_expiry_date: z.string().optional(),
});

/**
 * Schema for updating rider details.
 */
export const riderUpdateSchema = z
  .object({
    vehicle_plate_number: z.string().min(1).optional(),
    vehicle_make_model: z.string().optional(),
    driver_license_number: z.string().optional(),
    license_expiry_date: z.string().optional(),
  })
  .refine(
    (data) =>
      data.vehicle_plate_number !== undefined ||
      data.vehicle_make_model !== undefined ||
      data.driver_license_number !== undefined ||
      data.license_expiry_date !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

export type RiderInput = z.infer<typeof riderSchema>;
export type RiderUpdateInput = z.infer<typeof riderUpdateSchema>;
