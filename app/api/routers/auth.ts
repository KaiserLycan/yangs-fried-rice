import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/actions/admin";
import {
  checkLoginAllowed,
  clearLoginFailures,
  clientIpFrom,
  lockedOutMessage,
  recordLoginFailure,
} from "@/lib/auth/login-rate-limit";

/**
 * Shared by both login routes: refuse with 429 while the email or IP is
 * locked out, and otherwise hand back the IP for recording the outcome.
 * The same limiter guards the sign-in forms' server actions, so the API is
 * not a way around it.
 */
async function loginGate(request: Request, email: string) {
  const ip = clientIpFrom(request.headers.get("x-forwarded-for"));
  const gate = await checkLoginAllowed(email, ip);
  if (gate.allowed) return { ip, refusal: null };
  return {
    ip,
    refusal: NextResponse.json(
      { error: lockedOutMessage(gate) },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterMinutes * 60) } },
    ),
  };
}

/**
 * POST /api/auth/employee-login
 * Authenticate as an employee and set session cookies.
 * Body: { email, password }
 */
export async function employeeLogin(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const { email, password } = (body ?? {}) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const { ip, refusal } = await loginGate(request, email);
  if (refusal) return refusal;

  const supabase = createClient();
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    await recordLoginFailure(email, ip);
    return NextResponse.json(
      { error: authError?.message || "Invalid credentials." },
      { status: 401 }
    );
  }
  await clearLoginFailures(email);

  // Verify the user exists in the employee table.
  const { data: employee, error: employeeError } = await supabase
    .from("employee")
    .select("employee_id, name, email, role, is_account_disabled")
    .eq("employee_id", authData.user.id)
    .single();

  if (employeeError || !employee) {
    // Authenticated in Auth, but not an employee.
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "This account is not registered as an employee." },
      { status: 403 }
    );
  }

  if (employee.is_account_disabled) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Your account has been disabled. Please contact an administrator." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: "Logged in successfully as employee",
    data: {
      employee_id: employee.employee_id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
    },
  });
}

/**
 * POST /api/auth/customer-login
 * Authenticate as a customer and set session cookies.
 * Body: { email, password }
 */
export async function customerLogin(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const { email, password } = (body ?? {}) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const { ip, refusal } = await loginGate(request, email);
  if (refusal) return refusal;

  const supabase = createClient();
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    await recordLoginFailure(email, ip);
    return NextResponse.json(
      { error: authError?.message || "Invalid credentials." },
      { status: 401 }
    );
  }
  await clearLoginFailures(email);

  // Verify the user exists in the customer table.
  const { data: customer, error: customerError } = await supabase
    .from("customer")
    .select("customer_id, name, email, phone_number, is_account_disabled")
    .eq("customer_id", authData.user.id)
    .single();

  if (customerError || !customer) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "This account is not registered as a customer." },
      { status: 403 }
    );
  }

  if (customer.is_account_disabled) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Your account has been disabled. Please contact support." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: "Logged in successfully as customer",
    data: {
      customer_id: customer.customer_id,
      name: customer.name,
      email: customer.email,
      phone_number: customer.phone_number,
    },
  });
}

/**
 * POST /api/auth/logout
 * Sign out of the current session and clear auth cookies.
 */
export async function employeeLogout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { error: "Could not log out. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Logged out successfully",
  });
}

/**
 * GET /api/auth/me
 * Get current employee session info.
 */
export async function getMe() {
  const result = await getCurrentEmployee();
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error || "Not signed in" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    data: result.data,
  });
}

/**
 * POST /api/auth/change-password
 * Change current employee's own password.
 * Body: { new_password: string }
 * Available to ALL roles: MANAGER, STAFF, RIDER.
 */
export async function changeOwnPassword(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const { changeOwnPassword: changeOwnPasswordAction } = await import(
    "@/lib/actions/admin"
  );
  const result = await changeOwnPasswordAction(body as any);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.includes("signed in") ? 401 : 400 }
    );
  }

  return NextResponse.json({
    message: "Password changed successfully",
  });
}

