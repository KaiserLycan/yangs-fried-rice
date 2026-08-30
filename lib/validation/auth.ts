import { z } from "zod";

// register using name, email, password, and delivery address. Matches the Customer_Address entity from the ERD (label + address_details).
export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone_number: z.string().optional(),
  address: z.object({
    label: z.string().min(1, "Address label is required").max(50), // e.g. "Home", "Work"
    address_details: z.string().min(1, "Address details are required"),
  }),
});

// Login with email and password
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;