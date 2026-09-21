import { z } from "zod";

/**
 * Review-submission validation schema.
 *
 * Used by the `submitReview` server action to validate client input
 * before forwarding it to the `submit_order_review` RPC.
 */

// ---------------------------------------------------------------------------
// Review submission
// ---------------------------------------------------------------------------

export const reviewSubmissionSchema = z.object({
  rating: z
    .number({ required_error: "Rating is required." })
    .int("Rating must be a whole number.")
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating must be at most 5."),
  comment: z
    .string()
    .max(1000, "Comment must be 1 000 characters or fewer.")
    .optional()
    .nullable(),
  productId: z.string().uuid("Invalid product ID format").optional(),
});

export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;
