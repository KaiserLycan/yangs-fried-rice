import { NextResponse } from "next/server";
import {
  getAllEmployees as getEmployeesAction,
  createEmployee as createEmployeeAction,
  changeEmployeeRole as changeRoleAction,
  deleteEmployee as deleteEmployeeAction,
  toggleEmployeeDisabled as toggleEmployeeDisabledAction,
  resetEmployeePassword as resetEmployeePasswordAction,
  getAllCustomers as getCustomersAction,
  updateCustomer as updateCustomerAction,
  toggleCustomerDisabled as toggleCustomerDisabledAction,
  deleteCustomer as deleteCustomerAction,
} from "@/lib/actions/admin";

interface RouteParams {
  params: {
    id: string;
  };
}

function errorToStatus(error: string): number {
  if (error.includes("must be signed in") || error.includes("not registered")) {
    return 401;
  }
  if (
    error.includes("permission") ||
    error.includes("cannot delete your own account")
  ) {
    return 403;
  }
  if (error.toLowerCase().includes("not found")) {
    return 404;
  }
  return 400;
}

// ---------------------------------------------------------------------------
// Employee endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/employees
 * List all employee accounts.
 * Requires: admin or manager.
 */
export async function getEmployees() {
  const result = await getEmployeesAction();
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    count: result.data.length,
    data: result.data,
  });
}

/**
 * POST /api/admin/employees
 * Create a new employee account.
 * Body: { name, email, password, role }
 * Requires: admin or manager.
 */
export async function createEmployee(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const result = await createEmployeeAction(body as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json(
    { message: "Employee created successfully", data: result.data },
    { status: 201 }
  );
}

/**
 * PATCH /api/admin/employees/[id]/role
 * Update employee role.
 * Body: { new_role }
 * Requires: admin or manager (hierarchy enforced).
 */
export async function changeEmployeeRole(
  request: Request,
  { params }: RouteParams
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const payload = {
    employee_id: params.id,
    new_role: (body as any)?.new_role,
  };

  const result = await changeRoleAction(payload as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    message: "Employee role updated successfully",
    data: result.data,
  });
}

/**
 * DELETE /api/admin/employees/[id]
 * Delete employee account.
 * Requires: admin only.
 */
export async function deleteEmployee(
  _request: Request,
  { params }: RouteParams
) {
  const result = await deleteEmployeeAction(params.id);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    message: "Employee deleted successfully",
    data: result.data,
  });
}

/**
 * PATCH /api/admin/employees/[id]/disable
 * Enable or disable an employee account.
 * Body: { is_account_disabled: boolean }
 * Requires: ADMIN or MANAGER (hierarchy enforced).
 */
export async function toggleEmployeeDisabled(
  request: Request,
  { params }: RouteParams
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const disabled = (body as any)?.is_account_disabled;
  if (typeof disabled !== "boolean") {
    return NextResponse.json(
      { error: "Field 'is_account_disabled' (boolean) is required." },
      { status: 400 }
    );
  }

  const result = await toggleEmployeeDisabledAction(params.id, disabled);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    message: `Employee account ${disabled ? "disabled" : "enabled"} successfully`,
    data: result.data,
  });
}

/**
 * PATCH /api/admin/employees/[id]/password
 * Reset another employee's password.
 * Body: { new_password: string }
 * Requires: ADMIN or MANAGER (hierarchy enforced).
 */
export async function resetEmployeePassword(
  request: Request,
  { params }: RouteParams
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const result = await resetEmployeePasswordAction(params.id, body as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    message: "Employee password updated successfully",
    data: result.data,
  });
}



// ---------------------------------------------------------------------------
// Customer endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/customers
 * List all customer accounts.
 * Requires: admin or manager.
 */
export async function getCustomers() {
  const result = await getCustomersAction();
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    count: result.data.length,
    data: result.data,
  });
}

/**
 * PATCH /api/admin/customers/[id]
 * Update customer details or toggle disabled status.
 * Body: { name?, email?, phone_number?, is_account_disabled? }
 * Requires: admin or manager.
 */
export async function updateCustomer(
  request: Request,
  { params }: RouteParams
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const payload = (body ?? {}) as Record<string, unknown>;

  // If is_account_disabled is present and only toggle is specified:
  if (
    typeof payload.is_account_disabled === "boolean" &&
    Object.keys(payload).length === 1
  ) {
    const result = await toggleCustomerDisabledAction(
      params.id,
      payload.is_account_disabled
    );
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error },
        { status: errorToStatus(result.error || "") }
      );
    }
    return NextResponse.json({
      message: "Customer status updated successfully",
      data: result.data,
    });
  }

  const result = await updateCustomerAction(params.id, payload as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    message: "Customer updated successfully",
    data: result.data,
  });
}

/**
 * DELETE /api/admin/customers/[id]
 * Delete customer account and Auth user.
 * Requires: admin only.
 */
export async function deleteCustomer(
  _request: Request,
  { params }: RouteParams
) {
  const result = await deleteCustomerAction(params.id);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    message: "Customer deleted successfully",
    data: result.data,
  });
}
