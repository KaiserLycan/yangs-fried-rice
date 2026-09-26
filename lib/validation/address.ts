import { z } from "zod";

// Address validation

/**
 * These two messages are shown to customers, not logged. `/api/address/
 * validate` returns them verbatim as `error` on a 400, and
 * `AddressValidationNote` prints whatever comes back under the address
 * fields — so a signup form with a half-typed address was telling people
 * "Address must be at least 5 characters", a rule about a field they cannot
 * see (the form renders five address inputs, not one). They now say what to
 * do about it instead (issue #106).
 */
export const addressSchema = z.object({
  address: z
    .string()
    .trim()
    .min(5, "Add more of the address — at least a street and a city.")
    .max(500, "This address is too long. Shorten it to 500 characters or fewer."),
});

// Inferred TypeScript types

export type AddressInput = z.infer<typeof addressSchema>;
