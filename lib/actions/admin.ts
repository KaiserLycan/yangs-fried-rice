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
  resolveEmployeeRole,
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
import { z } from "zod";
import { isValidPhMobile, toInternationalMobile } from "@/lib/validation/phone";
import { dateOfBirthSchema } from "@/lib/validation/date-of-birth";
import type { Tables, TablesUpdate } from "@/types/database.types";

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

  // Stored roles are not guaranteed to be upper-case ("Manager", "manager"),
  // so compare the normalised role. A strict === on the raw column is what
  // locked valid managers out of every admin action.
  const role = resolveEmployeeRole(result.data.role);
  if (!role || !allowed.includes(role)) {
    return {
      data: null,
      error: "You do not have permission to perform this action.",
    };
  }

  return { data: { ...result.data, role }, error: null };
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
    phone,
    dateOfBirth,
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
      schedule_shift: scheduleShift ?? null,
      "phone-num": phone ? toInternationalMobile(phone) : null,
      date_of_birth: dateOfBirth ? dateOfBirth : null,
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

  const targetCurrentRole = resolveEmployeeRole(target.role);
  if (!targetCurrentRole) {
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

  const targetRole = resolveEmployeeRole(target.role);
  if (!targetRole || !canDisableEmployee(callerRole, targetRole, isSelf)) {
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

  const targetRole = resolveEmployeeRole(target.role);
  if (!targetRole || !canResetEmployeePassword(callerRole, targetRole, isSelf)) {
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
 * Everything a manager can change about an employee, read back for the edit
 * form: the employee row plus, for riders, the vehicle/licence row.
 * Requires: MANAGER.
 */
export async function getEmployeeForEdit(employeeId: string): Promise<
  ActionResult<{
    employee: Employee;
    rider: {
      vehicle_make_model: string | null;
      vehicle_plate_number: string | null;
      driver_license_number: string | null;
      license_expiry_date: string | null;
    } | null;
  }>
> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { data: employee, error } = await adminClient
    .from("employee")
    .select("*")
    .eq("employee_id", employeeId)
    .single();
  if (error || !employee) return { data: null, error: "Employee not found." };

  const { data: rider } = await adminClient
    .from("rider")
    .select("vehicle_make_model, vehicle_plate_number, driver_license_number, license_expiry_date")
    .eq("employee_id", employeeId)
    .maybeSingle();

  return { data: { employee, rider: rider ?? null }, error: null };
}

type EmployeeEditInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  shift?: string | null;
  phone?: string;
  dateOfBirth?: string;
  isAccountDisabled?: boolean;
  riderDetails?: {
    vehicle_make_model?: string;
    vehicle_plate_number?: string;
    driver_license_number?: string;
    license_expiry_date?: string;
  } | null;
};

/**
 * Update any detail of an employee — name, email, password, role, shift,
 * mobile, date of birth, active/disabled, and (for riders) vehicle and
 * licence. Only the fields that are passed are changed.
 * Requires: MANAGER.
 *
 * Email lives in two places — the Supabase Auth user (what they sign in
 * with) and `employee.email` — so both are written, and the Auth change is
 * rolled back if the row update fails. Leaving them out of step would leave
 * someone unable to log in with the address the directory shows.
 *
 * Writes use the service role *after* the caller is verified as a manager, so
 * a manager whose own row is stored as "Manager" (not "MANAGER") is not
 * silently blocked by the row-level policies that compare the literal string.
 * Two safety rules: a manager cannot change their own role or disable their
 * own account (that is how an organisation ends up with no manager).
 */
export async function updateEmployeeDetails(
  employeeId: string,
  input: EmployeeEditInput,
): Promise<ActionResult<Employee>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };

  const callerRole = auth.data.role as EmployeeRole;
  const isSelf = auth.data.employee_id === employeeId;
  const adminClient = createAdminClient();

  // ---- validate what was sent ----
  const name = input.name?.trim();
  if (input.name !== undefined && !name) {
    return { data: null, error: "Employee name is required." };
  }
  if (name && name.length > 100) {
    return { data: null, error: "Name must be 100 characters or fewer." };
  }

  const newPassword = input.password?.trim() ?? "";
  if (newPassword && newPassword.length < 8) {
    return { data: null, error: "Password must be at least 8 characters." };
  }

  const newEmail = input.email?.trim() ?? "";
  if (newEmail && !z.string().email().safeParse(newEmail).success) {
    return { data: null, error: "Enter a valid email address." };
  }

  let phone: string | null | undefined;
  if (input.phone !== undefined) {
    if (input.phone.trim() === "") {
      phone = null;
    } else if (!isValidPhMobile(input.phone)) {
      return { data: null, error: "Enter a valid Philippine mobile number, e.g. +63 9871230456." };
    } else {
      phone = toInternationalMobile(input.phone);
    }
  }

  let dateOfBirth: string | null | undefined;
  if (input.dateOfBirth !== undefined) {
    const parsedDob = dateOfBirthSchema.safeParse(input.dateOfBirth);
    if (!parsedDob.success) {
      return { data: null, error: parsedDob.error.issues[0]?.message ?? "Enter a valid date of birth." };
    }
    dateOfBirth = input.dateOfBirth === "" ? null : input.dateOfBirth;
  }

  const requestedRole = input.role ? resolveEmployeeRole(input.role) : null;
  if (input.role && !requestedRole) {
    return { data: null, error: "Role must be Manager, Staff or Delivery." };
  }

  const rider = input.riderDetails ?? null;
  if (rider) {
    const filled = Object.values(rider).filter((v) => v !== undefined && v !== null && String(v).trim() !== "");
    if (filled.length > 0 && filled.length < 4) {
      return { data: null, error: "Rider details must include vehicle make/model, plate number, licence number and licence expiry." };
    }
  }

  // ---- current state ----
  const { data: current, error: lookupError } = await adminClient
    .from("employee")
    .select("employee_id, email, role, is_account_disabled")
    .eq("employee_id", employeeId)
    .single();

  if (lookupError || !current) {
    return { data: null, error: "Employee not found." };
  }

  const currentRole = resolveEmployeeRole(current.role);

  if (isSelf && requestedRole && requestedRole !== currentRole) {
    return { data: null, error: "You can't change your own role." };
  }

  if (
    input.isAccountDisabled !== undefined &&
    input.isAccountDisabled !== Boolean(current.is_account_disabled)
  ) {
    if (!currentRole || !canDisableEmployee(callerRole, currentRole, isSelf)) {
      return {
        data: null,
        error: isSelf
          ? "You cannot disable your own account."
          : "You do not have permission to disable/enable this employee.",
      };
    }
  }

  // ---- 1. Auth: password, then email (only when it changed) ----
  if (newPassword) {
    const { error: authError } = await adminClient.auth.admin.updateUserById(employeeId, {
      password: newPassword,
    });
    if (authError) return { data: null, error: authError.message };
  }

  const emailChanged =
    newEmail !== "" && newEmail.toLowerCase() !== (current.email ?? "").toLowerCase();
  if (emailChanged) {
    const { error: emailError } = await adminClient.auth.admin.updateUserById(employeeId, {
      email: newEmail,
      email_confirm: true,
    });
    if (emailError) return { data: null, error: emailError.message };
  }

  // ---- 2. Employee row ----
  const updates: TablesUpdate<"employee"> = {};
  if (name) updates.name = name;
  if (emailChanged) updates.email = newEmail;
  if (requestedRole) updates.role = requestedRole;
  if (input.shift !== undefined) updates.schedule_shift = input.shift || null;
  if (phone !== undefined) (updates as Record<string, unknown>)["phone-num"] = phone;
  if (dateOfBirth !== undefined) (updates as Record<string, unknown>).date_of_birth = dateOfBirth;
  if (input.isAccountDisabled !== undefined) updates.is_account_disabled = input.isAccountDisabled;

  if (Object.keys(updates).length > 0) {
    const { error } = await adminClient
      .from("employee")
      .update(updates)
      .eq("employee_id", employeeId);

    if (error) {
      if (emailChanged) {
        // Put the Auth email back so login and directory still agree.
        await adminClient.auth.admin.updateUserById(employeeId, {
          email: current.email ?? undefined,
          email_confirm: true,
        });
      }
      return { data: null, error: error.message };
    }
  }

  // ---- 3. Rider row (vehicle / licence) ----
  const finalRole = requestedRole ?? currentRole;
  if (finalRole === "RIDER") {
    const { data: riderRow } = await adminClient
      .from("rider")
      .select("rider_id")
      .eq("employee_id", employeeId)
      .maybeSingle();

    const riderFields = rider
      ? {
          vehicle_make_model: rider.vehicle_make_model?.trim() || null,
          vehicle_plate_number: rider.vehicle_plate_number?.trim() || null,
          driver_license_number: rider.driver_license_number?.trim() || null,
          license_expiry_date: rider.license_expiry_date?.trim() || null,
        }
      : null;

    if (riderRow && riderFields) {
      const { error: riderError } = await adminClient
        .from("rider")
        .update(riderFields)
        .eq("employee_id", employeeId);
      if (riderError) return { data: null, error: riderError.message };
    } else if (!riderRow) {
      // A rider needs a rider row to appear in the delivery queue.
      const { error: riderError } = await adminClient
        .from("rider")
        .insert({ employee_id: employeeId, ...(riderFields ?? {}) });
      if (riderError) return { data: null, error: riderError.message };
    }
  }

  const { data, error } = await adminClient
    .from("employee")
    .select("*")
    .eq("employee_id", employeeId)
    .single();

  if (error || !data) return { data: null, error: error?.message ?? "Employee not found." };
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
    .update({
      ...parsed.data,
      // One canonical stored shape, same as every other screen.
      ...(parsed.data.phone_number !== undefined
        ? { phone_number: toInternationalMobile(parsed.data.phone_number) || null }
        : {}),
    })
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
