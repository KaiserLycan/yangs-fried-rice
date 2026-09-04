import { z } from "zod";

// Address validation

export const addressSchema = z.object({
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must be 500 characters or fewer"),
});

// Inferred TypeScript types

export type AddressInput = z.infer<typeof addressSchema>;
