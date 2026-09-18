"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isEmployeeRole,
  isManager,
  canChangeRole,
  canDisableEmployee,
  canResetEmployeePassword,
  normalizeEmployeeRoleLabel,
  type EmployeeRole,
} from "@/lib/auth/roles";
import {
  createEmployeeSchema,
  changeRoleSchema,
  changePasswordSchema,
  updateCustomerSchema,
  type CreateEmployeeInput,
  type ChangeRoleInput,
  type ChangePasswordInput,
  type UpdateCustomerInput,
} from "@/lib/validation/admin";
import type { Tables } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

type Employee = Tables<"employee">;
type Customer = Tables<"customer">;

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

/**
 * Resolve the current session to an employee row, or null if the
 * caller isn't signed in as an employee.
 */
export async function getCurrentEmployee(): Promise<
  ActionResult<Employee>
> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const { data: employee, error } = await supabase
    .from("employee")
    .select("*")
    .eq("employee_id", user.id)
    .single();

  if (error || !employee) {
    return { data: null, error: "You are not registered as an employee." };
  }

  return { data: employee, error: null };
}

/**
 * Internal helper — resolves the caller and asserts their role is one
 * of the allowed roles. Returns the employee row or an error.
 */
async function requireRole(
  ...allowed: EmployeeRole[]
): Promise<ActionResult<Employee>> {
  const result = await getCurrentEmployee();
  if (!result.data) return result;

  const role = result.data.role;
  if (!role || !isEmployeeRole(role) || !allowed.includes(role)) {
    return {
      data: null,
      error: "You do not have permission to perform this action.",
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Employee CRUD
// ---------------------------------------------------------------------------

/**
 * List all employee accounts.
 * Requires: manager.
 */
export async function getAllEmployees(): Promise<ActionResult<Employee[]>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("employee")
    .select("*")
    .order("name");

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Create a new employee account.
 *
 * Creates a Supabase Auth user first, then inserts the employee row
 * using the Auth user's ID as employee_id — same pattern as customer
 * registration in registerCustomer().
 *
 * Requires: manager.
 */
export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<ActionResult<Employee>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const parsed = createEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const normalizedRole =
    normalizeEmployeeRoleLabel(parsed.data.role) ?? parsed.data.role;
  const {
    name,
    email,
    password,
    role: canonicalRole,
    scheduleShift,
    riderDetails,
  } = {
    ...parsed.data,
    role: normalizedRole,
  } as typeof parsed.data & { role: EmployeeRole };

  try {
    // Use the admin client to create the Auth user — the session-scoped
    // client can only sign up, not create users on behalf of others.
    const adminClient = createAdminClient();
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

    if (authError) {
      return { data: null, error: authError.message };
    }
    if (!authData.user) {
      return {
        data: null,
        error: "Could not create the employee account. Please try again.",
      };
    }

    const supabase = createClient();
    const employeeRow = {
      employee_id: authData.user.id,
      name,
      email,
      role: canonicalRole,
      schedule_shift: canonicalRole === "RIDER" ? null : scheduleShift ?? null,
    };

    const { data: employee, error: insertError } = await supabase
      .from("employee")
      .insert(employeeRow)
      .select()
      .single();

    if (insertError) {
      // Roll back the Auth user — we don't want an orphan.
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { data: null, error: insertError.message };
    }

    if (canonicalRole === "RIDER") {
      const riderPayload = {
        employee_id: employee.employee_id,
        vehicle_plate_number: riderDetails?.vehicle_plate_number ?? null,
        vehicle_make_model: riderDetails?.vehicle_make_model ?? null,
        driver_license_number: riderDetails?.driver_license_number ?? null,
        license_expiry_date: riderDetails?.license_expiry_date ?? null,
      };

      const { error: riderInsertError } = await supabase
        .from("rider")
        .insert(riderPayload);

      if (riderInsertError) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        await supabase.from("employee").delete().eq("employee_id", authData.user.id);
        return { data: null, error: riderInsertError.message };
      }
    }

    return { data: employee, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to create employee" };
  }
}

/**
 * Change an employee's role.
 *
 * Enforces hierarchy via canChangeRole():
 *  - manager → can change anyone to any role
 *  - staff/rider → never
 *
 * Requires: manager.
 */
export async function changeEmployeeRole(
  input: ChangeRoleInput,
): Promise<ActionResult<Employee>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { employee_id, new_role } = parsed.data;
  const callerRole = auth.data.role as EmployeeRole;

  // Look up the target employee's current role.
  const supabase = createClient();
  const { data: target, error: lookupError } = await supabase
    .from("employee")
    .select("*")
    .eq("employee_id", employee_id)
    .single();

  if (lookupError || !target) {
    return { data: null, error: "Employee not found." };
  }

  const targetCurrentRole = target.role as EmployeeRole;
  if (!isEmployeeRole(targetCurrentRole)) {
    return { data: null, error: "Target employee has an invalid role." };
  }

  if (!canChangeRole(callerRole, targetCurrentRole, new_role)) {
    return {
      data: null,
      error: "You do not have permission to make this role change.",
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("employee")
    .update({ role: new_role })
    .eq("employee_id", employee_id)
    .select()
    .single();

  if (updateError) return { data: null, error: updateError.message };
  return { data: updated, error: null };
}

/**
 * Enable or disable an employee account.
 * Enforces role hierarchy via canDisableEmployee:
 *  - Cannot disable self
 *  - MANAGER can disable STAFF and RIDER only
 * Requires: MANAGER.
 */
export async function toggleEmployeeDisabled(
  employeeId: string,
  disabled: boolean,
): Promise<ActionResult<Employee>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const callerRole = auth.data.role as EmployeeRole;
  const isSelf = auth.data.employee_id === employeeId;

  const supabase = createClient();
  const { data: target, error: lookupError } = await supabase
    .from("employee")
    .select("*")
    .eq("employee_id", employeeId)
    .single();

  if (lookupError || !target) {
    return { data: null, error: "Employee not found." };
  }

  const targetRole = target.role as EmployeeRole;
  if (!canDisableEmployee(callerRole, targetRole, isSelf)) {
    return {
      data: null,
      error: isSelf
        ? "You cannot disable your own account."
        : "You do not have permission to disable/enable this employee.",
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("employee")
    .update({ is_account_disabled: disabled })
    .eq("employee_id", employeeId)
    .select()
    .single();

  if (updateError) return { data: null, error: updateError.message };
  return { data: updated, error: null };
}

/**
 * Change the signed-in employee's own password.
 * Available to ALL roles: MANAGER, STAFF, RIDER.
 */
export async function changeOwnPassword(
  input: ChangePasswordInput,
): Promise<ActionResult<{ success: boolean }>> {
  const auth = await getCurrentEmployee();
  if (!auth.data) return { data: null, error: auth.error };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { success: true }, error: null };
}

/**
 * Reset/change another employee's password.
 * Enforces role hierarchy via canResetEmployeePassword:
 *  - Self: allowed
 *  - MANAGER: can change STAFF and RIDER passwords only
 *  - STAFF / RIDER: cannot change anyone else's password
 * Requires: MANAGER.
 */
export async function resetEmployeePassword(
  employeeId: string,
  input: ChangePasswordInput,
): Promise<ActionResult<{ employee_id: string }>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const callerRole = auth.data.role as EmployeeRole;
  const isSelf = auth.data.employee_id === employeeId;

  if (isSelf) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.new_password,
    });
    if (error) return { data: null, error: error.message };
    return { data: { employee_id: employeeId }, error: null };
  }

  const supabase = createClient();
  const { data: target, error: lookupError } = await supabase
    .from("employee")
    .select("*")
    .eq("employee_id", employeeId)
    .single();

  if (lookupError || !target) {
    return { data: null, error: "Employee not found." };
  }

  const targetRole = target.role as EmployeeRole;
  if (!canResetEmployeePassword(callerRole, targetRole, isSelf)) {
    return {
      data: null,
      error: "You do not have permission to change this employee's password.",
    };
  }

  try {
    const adminClient = createAdminClient();
    const { error: updateAuthError } =
      await adminClient.auth.admin.updateUserById(employeeId, {
        password: parsed.data.new_password,
      });

    if (updateAuthError) {
      return { data: null, error: updateAuthError.message };
    }

    return { data: { employee_id: employeeId }, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || "Failed to update employee password",
    };
  }
}
/**
 * Update an employee's role, scheduled shift, and password.
 * Requires: MANAGER.
 */
export async function updateEmployeeDetails(
  employeeId: string,
  input: { role?: string; shift?: string; password?: string }
): Promise<ActionResult<Employee>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();
  const adminClient = createAdminClient();

  // 1. Update Auth Password if a new one was provided
  if (input.password && input.password.trim() !== "") {
    const { error: authError } = await adminClient.auth.admin.updateUserById(employeeId, {
      password: input.password,
    });
    if (authError) return { data: null, error: authError.message };
  }

  // 2. Update Employee Table (Role and Shift)
  const updates: any = {};
  if (input.role) updates.role = input.role;
  if (input.shift) updates.schedule_shift = input.shift;

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from("employee")
      .update(updates)
      .eq("employee_id", employeeId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  // If only the password was updated, fetch and return the unmodified employee row
  // If only the password was updated, fetch and return the unmodified employee row
  const { data, error } = await supabase
    .from("employee")
    .select("*")
    .eq("employee_id", employeeId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };

}


/**
 * Delete an employee account and their Supabase Auth user.
 * Requires: manager only.
 */
export async function deleteEmployee(
  employeeId: string,
): Promise<ActionResult<{ employee_id: string }>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  // Prevent self-deletion.
  if (auth.data.employee_id === employeeId) {
    return { data: null, error: "You cannot delete your own account." };
  }

  const supabase = createClient();
  const { error: deleteError } = await supabase
    .from("employee")
    .delete()
    .eq("employee_id", employeeId);

  try {
    // Delete the Auth user so the email can be reused.
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(employeeId);
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to delete user" };
  }

  return { data: { employee_id: employeeId }, error: null };
}

// ---------------------------------------------------------------------------
// Customer management
// ---------------------------------------------------------------------------

/**
 * List all customer accounts.
 * Requires: manager.
 */
export async function getAllCustomers(): Promise<ActionResult<(Customer & { created_at?: string })[]>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();
  const { data: customers, error } = await supabase
    .from("customer")
    .select("*")
    .order("name");

  if (error) return { data: null, error: error.message };

  // Fetch created_at from auth.users
  const adminClient = createAdminClient();
  const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers();
  
  let enrichedCustomers = customers as (Customer & { created_at?: string })[];
  if (!authError && users) {
    enrichedCustomers = customers.map(c => {
      const authUser = users.find(u => u.id === c.customer_id);
      return {
        ...c,
        created_at: authUser?.created_at
      };
    });
  }

  return { data: enrichedCustomers, error: null };
}

/**
 * Update customer details.
 * Requires: manager.
 */
export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput,
): Promise<ActionResult<Customer>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const parsed = updateCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("customer")
    .update(parsed.data)
    .eq("customer_id", customerId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Enable or disable a customer account.
 * Requires: manager.
 */
export async function toggleCustomerDisabled(
  customerId: string,
  disabled: boolean,
): Promise<ActionResult<Customer>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("customer")
    .update({ is_account_disabled: disabled })
    .eq("customer_id", customerId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Delete a customer account and their Supabase Auth user.
 * Requires: manager only.
 */
export async function deleteCustomer(
  customerId: string,
): Promise<ActionResult<{ customer_id: string }>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();
  const { error: deleteError } = await supabase
    .from("customer")
    .delete()
    .eq("customer_id", customerId);

  if (deleteError) return { data: null, error: deleteError.message };

  try {
    // Delete the Auth user so the email can be reused.
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(customerId);
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to delete user" };
  }

  return { data: { customer_id: customerId }, error: null };
}
