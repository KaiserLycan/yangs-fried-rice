import { z } from "zod";

/**
 * Schema for updating delivery status or assigning a rider.
 */
export const deliveryUpdateSchema = z
  .object({
    delivery_status: z
      .enum(["pending", "dispatched", "in_transit", "delivered", "failed"], {
        errorMap: () => ({
          message:
            "Delivery status must be one of: pending, dispatched, in_transit, delivered, failed",
        }),
      })
      .optional(),
    rider_id: z.string().uuid("Rider ID must be a valid UUID").optional(),
    estimated_time: z.string().optional(),
  })
  .refine(
    (data) =>
      data.delivery_status !== undefined ||
      data.rider_id !== undefined ||
      data.estimated_time !== undefined,
    {
      message:
        "At least one field (delivery_status, rider_id, or estimated_time) must be provided",
    }
  );

export type DeliveryUpdateInput = z.infer<typeof deliveryUpdateSchema>;
