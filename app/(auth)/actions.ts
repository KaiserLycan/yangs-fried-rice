"use server";

import { createClient } from "@/lib/supabase/server";
import { createSession, deleteSession } from "@/lib/auth/session";
import { validateNcrAddress } from "@/lib/address/validate-ncr";
import {
  signupSchema,
  DEFAULT_ADDRESS_LABEL,
  type SignupValues,
} from "@/lib/validation/signup";
import { loginSchema, type LoginValues } from "@/lib/validation/login";
import {
  employeeLoginSchema,
  EMPLOYEE_SIGN_IN_FAILED,
  type EmployeeLoginValues,
} from "@/lib/validation/employee-login";

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

  // Enforce delivery boundary: customer address must be within NCR
  const ncrCheck = await validateNcrAddress(address);
  if (!ncrCheck.valid) {
    return {
      success: false,
      error:
        ncrCheck.message ??
        "Delivery is currently restricted to Metro Manila (NCR). Please provide an address within NCR.",
    };
  }

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
 * Cust3: securely terminate the current session. Shared by both customer
 * and employee sessions — auth.signOut() ends whichever session cookie
 * is present, regardless of which login flow created it.
 */
export async function logout(): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: "Could not log out. Please try again." };
  }

  // Clear the custom JWT session too
  deleteSession();

  return { success: true };
}

type EmployeeLoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

/**
 * Confirmed Employee.role values and their post-login destinations.
 *
 * Hierarchy: manager > staff > rider
 *  - manager and staff all land in /manage (the back office)
 *  - rider lands in /deliver (the delivery queue)
 */
/**
 * TODO: BACKEND INTEGRATION — Role-based redirects after employee login.
 *
 * MANAGER (Business Owner) → /manage/dashboard (full back-office access)
 * STAFF (server, kitchen, etc.) → /manage/orders (no dashboard access)
 * RIDER → /deliver (delivery queue, separate app area)
 *
 * If additional roles are added, register their redirect here.
 */
const EMPLOYEE_ROLE_REDIRECTS: Record<string, string> = {
  MANAGER: "/manage/dashboard",
  STAFF: "/manage/orders",
  RIDER: "/deliver",
  manager: "/manage/dashboard",
  staff: "/manage/orders",
  rider: "/deliver",
};
const DEFAULT_EMPLOYEE_REDIRECT = "/manage/dashboard";

/**
 * SAS1: authenticate an employee (Staff, Business Owner, or Rider).
 *
 * Mirrors the customer login pattern per PM direction — employees get
 * their own Supabase Auth accounts, linked via employee.employee_id =
 * auth user id, same as customer.customer_id.
 *
 * SCHEMA DEPENDENCY: employee.email doesn't exist in the generated types
 * yet — the PM has confirmed it's being added. Until that column exists
 * AND `npm run supabase:types` is re-run, this will show real TypeScript
 * errors on the .from("employee") calls below. That's expected this
 * time — not the earlier never[] bug.
 *
 * Staff-ID sign-in (e.g. "YFR-0142") is validated client-side by
 * employeeLoginSchema but not wired here — there's no staff_id column on
 * employee, and unlike email, the PM hasn't confirmed one's coming.
 * Guessing at that lookup would either error or, worse, silently match
 * the wrong person, so staff-ID attempts get turned away with a clear
 * message instead.
 */
export async function loginEmployee(
  values: EmployeeLoginValues
): Promise<EmployeeLoginResult> {
  const parsed = employeeLoginSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: EMPLOYEE_SIGN_IN_FAILED };
  }
  const { identifier, password } = parsed.data;

  if (!identifier.includes("@")) {
    return {
      success: false,
      error:
        "Staff ID sign-in isn't set up yet — please sign in with your work email for now.",
    };
  }

  const supabase = createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email: identifier, password });

  if (authError || !authData.user) {
    return { success: false, error: EMPLOYEE_SIGN_IN_FAILED };
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employee")
    .select("role, is_account_disabled")
    .eq("employee_id", authData.user.id)
    .single();

  if (employeeError || !employee) {
    // Authenticated against Supabase, but no matching employee row — not
    // actually an employee account (e.g. someone tried a customer email
    // here). Sign them back out rather than leaving a half-authenticated
    // session with nowhere valid to go.
    await supabase.auth.signOut();
    return { success: false, error: EMPLOYEE_SIGN_IN_FAILED };
  }

  if (employee.is_account_disabled) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your account has been disabled. Please contact an administrator.",
    };
  }

  const redirectTo =
    EMPLOYEE_ROLE_REDIRECTS[employee.role ?? ""] ?? DEFAULT_EMPLOYEE_REDIRECT;

  // Create the fast local session cookie for middleware
  await createSession(authData.user.id, employee.role ?? "");

  return { success: true, redirectTo };
}