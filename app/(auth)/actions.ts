"use server";

import { createClient } from "@/lib/supabase/server";
import {
  signupSchema,
  DEFAULT_ADDRESS_LABEL,
  type SignupValues,
} from "@/lib/validation/signup";
import { loginSchema, type LoginValues } from "@/lib/validation/login";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Cust1: register a new customer account.
 *
 * Re-validates with the same signupSchema the form already checked
 * client-side — this action can be called directly, so the server can't
 * trust that client-side validation actually ran.
 *
 * Per the signup form's TODO: on success, signs the new customer straight
 * in rather than sending them to a separate login step, since sign-up is
 * reached from a blocked add-to-cart and losing that context would be
 * worse than skipping the "log in after registering" ceremony.
 */
export async function registerCustomer(
  values: SignupValues
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Some fields need fixing before we can create your account.",
    };
  }
  const { name, email, phone, password, address } = parsed.data;

  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }
  if (!authData.user) {
    return {
      success: false,
      error: "Could not create your account. Please try again.",
    };
  }

  const customerId = authData.user.id;

  // customer.customer_id is set to the Supabase Auth user id — there's no
  // DB-level FK enforcing this (confirmed against the generated types), so
  // this app-layer link is what keeps them in sync.
  const { error: customerError } = await supabase.from("customer").insert({
    customer_id: customerId,
    name,
    email,
    phone_number: phone,
  });
  if (customerError) {
    return {
      success: false,
      error:
        "Your account was created, but we couldn't save your profile. Please try updating it from your profile page.",
    };
  }

  const { error: addressError } = await supabase
    .from("customer_address")
    .insert({
      customer_id: customerId,
      label: DEFAULT_ADDRESS_LABEL,
      address_details: address,
    });
  if (addressError) {
    return {
      success: false,
      error:
        "Your account was created, but we couldn't save your address. Please add it from your profile page.",
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return {
      success: false,
      error: "Your account was created — please log in.",
    };
  }

  return { success: true };
}

/**
 * Cust2: authenticate an existing customer via Supabase.
 */
export async function loginCustomer(
  values: LoginValues
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Same generic message either way — don't reveal whether the email
    // exists.
    return { success: false, error: "Incorrect email or password." };
  }

  return { success: true };
}

/**
 * Cust3: securely terminate the current session.
 */
export async function logoutCustomer(): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: "Could not log out. Please try again." };
  }

  return { success: true };
}