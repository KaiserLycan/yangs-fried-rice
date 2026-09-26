"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createSession, deleteSession } from "@/lib/auth/session";
import {
  checkLoginAllowed,
  clearLoginFailures,
  clientIpFrom,
  lockedOutMessage,
  recordLoginFailure,
} from "@/lib/auth/login-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { homePathForRole, resolveEmployeeRole } from "@/lib/auth/roles";
import { addressForGeocoding, validateNcrAddress } from "@/lib/address/validate-ncr";
import { addressRowFromParts } from "@/lib/address/format";
import { joinFullName } from "@/lib/validation/fields";
import {
  fieldErrorFromDbError,
  fieldErrorsFromIssues,
  type FieldErrors,
} from "@/lib/validation/field-errors";
import { toInternationalMobile } from "@/lib/validation/phone";
import {
  signupSchema,
  DEFAULT_ADDRESS_LABEL,
  type SignupValues,
} from "@/lib/validation/signup";
import { loginSchema, type LoginValues } from "@/lib/validation/login";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from "@/lib/validation/password-reset";
import {
  employeeLoginSchema,
  EMPLOYEE_SIGN_IN_FAILED,
  type EmployeeLoginValues,
} from "@/lib/validation/employee-login";

/**
 * `fieldErrors` names the field a rejection is about, so the form can show
 * it under that input rather than only in the banner.
 */
type ActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: FieldErrors };

/**
 * `signedIn: false` means the account exists but has no session yet — the
 * normal case while Supabase's "Confirm email" setting is on. The form sends
 * the person to /login with a green "check your email" notice instead of
 * showing the old red error.
 */
type RegisterResult =
  | { success: true; signedIn?: boolean }
  | { success: false; error: string; fieldErrors?: FieldErrors };

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
): Promise<RegisterResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Some fields need fixing before we can create your account.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }
  const { firstName, lastName, email, phone, dateOfBirth, password, buildingNo, street, barangay, city, zip } = parsed.data;

  // Kept in the auth user's metadata as a display fallback only; the
  // customer row stores the two parts.
  const name = joinFullName(firstName, lastName);
  // What the map can actually find: street, barangay, city, ZIP. The building
  // number is a lot/unit inside a subdivision and only makes the lookup miss.
  const essentialAddress = addressForGeocoding({ street, barangay, city, zip });

  // Enforce delivery boundary: customer address must be within NCR
  const ncrCheck = await validateNcrAddress(essentialAddress);
  if (!ncrCheck.valid) {
    const message =
      ncrCheck.message ??
      "Delivery is currently restricted to Metro Manila (NCR). Please provide an address within NCR.";
    return { success: false, error: message, fieldErrors: { street: message } };
  }

  const supabase = createClient();

  // Send the confirmation link back to the site the person signed up on
  // (localhost or Vercel) instead of the dashboard's Site URL. Supabase only
  // honours it if it matches Authentication → URL Configuration → Redirect URLs.
  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = requestHeaders.get("origin") ?? (host ? `${protocol}://${host}` : undefined);

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      ...(origin && { emailRedirectTo: `${origin}/login` }),
    },
  });

  if (authError) {
    const isEmail = /email/i.test(authError.message);
    const isPassword = /password/i.test(authError.message);
    return {
      success: false,
      error: authError.message,
      fieldErrors: isEmail
        ? { email: authError.message }
        : isPassword
          ? { password: authError.message }
          : undefined,
    };
  }
  if (!authData.user) {
    return {
      success: false,
      error: "Could not create your account. Please try again.",
    };
  }

  // Supabase returns a user with an empty identities array if the email already
  // exists and email confirmations are enabled (to prevent email enumeration).
  if (authData.user.identities && authData.user.identities.length === 0) {
    return {
      success: false,
      error: "An account with this email already exists. Please log in instead.",
      fieldErrors: { email: "An account with this email already exists." },
    };
  }

  const customerId = authData.user.id;

  // The profile rows are written with the service role. While "Confirm email"
  // is on, signUp() returns NO session, so the session-scoped client is still
  // anonymous and RLS (`auth.uid() = customer_id`) rejects the insert — which
  // is how people ended up with an auth account but no profile. The id being
  // written is the one Supabase Auth just handed back, so nothing here can be
  // pointed at someone else's row. Falls back to the session client if the
  // service key isn't configured.
  let writer: typeof supabase = supabase;
  try {
    writer = createAdminClient() as unknown as typeof supabase;
  } catch {
    // no service key configured — use the session client
  }

  // customer.customer_id is the Supabase Auth user id (FK to auth.users).
  const { error: customerError } = await writer.from("customer").insert({
    customer_id: customerId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone_number: toInternationalMobile(phone),
    date_of_birth: dateOfBirth ? dateOfBirth : null,
  });
  if (customerError) {
    // Without a customer row the account can't sign in to the customer
    // portal at all (loginCustomer refuses it), so don't leave it half-made.
    try {
      await createAdminClient().auth.admin.deleteUser(customerId);
    } catch {
      // no service key — nothing more we can undo from here
    }
    return {
      success: false,
      error: "We couldn't save your details. Check the highlighted fields and try again.",
      fieldErrors: fieldErrorFromDbError(customerError) ?? undefined,
    };
  }

  const { error: addressError } = await writer
    .from("customer_address")
    .insert({
      customer_id: customerId,
      label: DEFAULT_ADDRESS_LABEL,
      ...addressRowFromParts({ buildingNo, street, barangay, city, zip }),
    });
  if (addressError) {
    return {
      success: false,
      error:
        "Your account was created, but we couldn't save your address. Please add it from your profile page.",
      fieldErrors: fieldErrorFromDbError(addressError) ?? undefined,
    };
  }

  // With email confirmation on, signing in fails until the address is
  // confirmed. That is not an error — the account exists — so report it as a
  // success without a session and let the form send them to the login page.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return { success: true, signedIn: false };
  }

  return { success: true, signedIn: true };
}

/**
 * Deliberately identical to the wrong-password message.
 *
 * It used to say "This account isn't a customer account. Staff and
 * administrators sign in at the employee login." — which told anyone who
 * asked two things they should not learn from a login form: that the address
 * is registered, and that it belongs to staff. That turns this form into a
 * way to enumerate accounts and then pick out the privileged ones, which is
 * the opposite of what the generic wrong-password message a few lines down
 * is for (issue #106).
 *
 * /login carries no link to /employee/login either (P29): a customer should
 * not learn that a separate staff door exists. Employees are given that URL
 * directly.
 */
const CUSTOMER_ONLY_MESSAGE = "Incorrect email or password.";

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

  // Checked before the password is tried, so a locked email gets no answer
  // about whether this guess was right.
  const ip = clientIpFrom(headers().get("x-forwarded-for"));
  const gate = await checkLoginAllowed(email, ip);
  if (!gate.allowed) {
    return { success: false, error: lockedOutMessage(gate) };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    await recordLoginFailure(email, ip);
    // Same generic message either way — don't reveal whether the email
    // exists.
    return { success: false, error: "Incorrect email or password." };
  }
  // The password was right, whatever happens next.
  await clearLoginFailures(email);

  // A valid Supabase login is not enough: the customer portal is for
  // accounts with a `customer` row. Managers and staff have auth
  // accounts too, and without this check they could sign in here and act as
  // a customer with no customer record behind them. Sign the session back
  // out so no half-authenticated cookie is left behind.
  const { data: customer } = await supabase
    .from("customer")
    .select("customer_id, is_account_disabled")
    .eq("customer_id", data.user.id)
    .maybeSingle();

  if (!customer) {
    await supabase.auth.signOut();
    return { success: false, error: CUSTOMER_ONLY_MESSAGE };
  }

  if (customer.is_account_disabled) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your account has been disabled. Please contact support.",
    };
  }

  // A stale employee session cookie from an earlier staff sign-in on this
  // browser must not ride along with a customer session.
  deleteSession();

  return { success: true };
}

/**
 * Send a password-reset link.
 *
 * Issue #106: the customer "Forgot password?" link pointed back at /login and
 * did nothing, and employees had no way back in at all. One action serves
 * both — Supabase Auth holds a single password per account, so the reset is
 * identical whether the address belongs to a customer or an employee.
 *
 * Always reports success. A "no account with that email" reply here would
 * turn this form into a way to find out which addresses are registered, and
 * the redirect lands on /reset-password, which `middleware.ts` has to let
 * through while signed out.
 */
export async function requestPasswordReset(
  values: ForgotPasswordValues,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Enter a valid email address.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const origin = headers().get("origin");
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    origin ? { redirectTo: `${origin}/reset-password` } : undefined,
  );

  // Logged, not shown: a transport failure is ours, not the customer's, and
  // saying so would still leak whether the address exists.
  if (error) {
    console.error("requestPasswordReset: could not send reset email:", error);
  }

  return { success: true };
}

/**
 * Set a new password from the link in the reset email.
 *
 * By the time this runs the recovery token in the URL has already been
 * exchanged for a session by the Supabase client on the reset page, so this
 * is an ordinary `updateUser` against that session — the same call the
 * profile's change-password card makes. Without a session the update fails,
 * which is what stops this being a way to change a stranger's password.
 */
export async function resetPassword(
  values: ResetPasswordValues,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Enter a valid password.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error:
        "That reset link has expired or has already been used. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Resetting is the documented way out of a sign-in lockout, so the new
  // password works straight away instead of after the window expires.
  if (user.email) await clearLoginFailures(user.email);

  // The recovery session is a way in that was mailed to an inbox. Once the
  // password is set, end it so the new one has to be typed — and so a shared
  // or forwarded email does not leave someone signed in.
  await supabase.auth.signOut();
  deleteSession();

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
 * SAS1: authenticate an employee (Manager or Staff).
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
 */
export async function loginEmployee(
  values: EmployeeLoginValues
): Promise<EmployeeLoginResult> {
  const parsed = employeeLoginSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: EMPLOYEE_SIGN_IN_FAILED };
  }
  const { identifier, password } = parsed.data;

  const ip = clientIpFrom(headers().get("x-forwarded-for"));
  const gate = await checkLoginAllowed(identifier, ip);
  if (!gate.allowed) {
    return { success: false, error: lockedOutMessage(gate) };
  }

  const supabase = createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email: identifier, password });

  if (authError || !authData.user) {
    await recordLoginFailure(identifier, ip);
    return { success: false, error: EMPLOYEE_SIGN_IN_FAILED };
  }
  await clearLoginFailures(identifier);

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

  await supabase
    .from("employee")
    .update({ last_access_log: new Date().toISOString() })
    .eq("employee_id", authData.user.id);

  if (employee.is_account_disabled) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your account has been disabled. Please contact an administrator.",
    };
  }

  // Normalise the stored role ("Manager", "manager", "Server", …) so the
  // redirect and the session cookie agree with the permission checks. A role
  // the app no longer has — RIDER, since the shop went pickup-only — has no
  // page to land on, so it is refused here rather than sent somewhere that
  // would only bounce it back.
  const role = resolveEmployeeRole(employee.role);
  if (!role) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your account doesn't have access to the back office. Please contact your manager.",
    };
  }
  const redirectTo = homePathForRole(role);

  // Create the fast local session cookie for middleware
  await createSession(authData.user.id, role);

  return { success: true, redirectTo };
}