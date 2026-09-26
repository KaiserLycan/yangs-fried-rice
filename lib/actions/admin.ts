"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ACCOUNT_DISABLED_CODE,
  EMPLOYEE_ACCOUNT_DISABLED_MESSAGE,
} from "@/lib/auth/account-status";
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
import {
  emailSchema,
  firstNameSchema,
  joinFullName,
  lastNameSchema,
  passwordSchema,
} from "@/lib/validation/fields";
import {
  fieldErrorFromDbError,
  fieldErrorsFromIssues,
  type FieldErrors,
} from "@/lib/validation/field-errors";
import type { Tables, TablesUpdate } from "@/types/database.types";
import {
  IMAGE_BUCKETS,
  imageExtensionFor,
  imageUploadProblem,
} from "@/lib/storage/stored-image";
import { removeStoredImage } from "@/lib/storage/remove-stored-image";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/**
 * `fieldErrors` names the form field a rejection is about (`firstName`,
 * `email`, …) so the manager's dialog can show it under that input.
 */
type ActionResult<T> =
  | { data: T; error: null; fieldErrors?: undefined }
  | { data: null; error: string; fieldErrors?: FieldErrors; code?: string };

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

  // The session cookie outlives a manager disabling the account, so the
  // flag is re-read on every call (issue #114).
  if (employee.is_account_disabled) {
    return {
      data: null,
      error: EMPLOYEE_ACCOUNT_DISABLED_MESSAGE,
      code: ACCOUNT_DISABLED_CODE,
    };
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
    return {
      data: null,
      error: parsed.error.errors[0].message,
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const normalizedRole =
    normalizeEmployeeRoleLabel(parsed.data.role) ?? parsed.data.role;
  const {
    firstName,
    lastName,
    email,
    password,
    role: canonicalRole,
    scheduleShift,
    phone,
    dateOfBirth,
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
        user_metadata: { name: joinFullName(firstName, lastName) },
      });

    if (authError) {
      return {
        data: null,
        error: authError.message,
        fieldErrors: /email|registered/i.test(authError.message)
          ? { email: authError.message }
          : /password/i.test(authError.message)
            ? { password: authError.message }
            : undefined,
      };
    }
    if (!authData.user) {
      return {
        data: null,
        error: "Could not create the employee account. Please try again.",
      };
    }

    const employeeRow = {
      employee_id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      role: canonicalRole,
      schedule_shift: scheduleShift ?? null,
      phone_number: phone ? toInternationalMobile(phone) : null,
      date_of_birth: dateOfBirth ? dateOfBirth : null,
    };

    // Service role, like the Auth user above: `employee` has RLS on and no
    // INSERT policy (20260925000001), so the manager's own session cannot
    // write the row. The caller was verified as a manager at the top.
    const { data: employee, error: insertError } = await adminClient
      .from("employee")
      .insert(employeeRow)
      .select()
      .single();

    if (insertError) {
      // Roll back the Auth user — we don't want an orphan.
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return {
        data: null,
        error: insertError.message,
        fieldErrors: fieldErrorFromDbError(insertError) ?? undefined,
      };
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
 *  - staff → never
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
 *  - MANAGER can disable STAFF only
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
 * Available to ALL roles: MANAGER, STAFF.
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
 *  - MANAGER: can change STAFF passwords only
 *  - STAFF: cannot change anyone else's password
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
 * form.
 * Requires: MANAGER.
 */
export async function getEmployeeForEdit(employeeId: string): Promise<
  ActionResult<{
    employee: Employee;
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

  return { data: { employee }, error: null };
}

type EmployeeEditInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  shift?: string | null;
  phone?: string;
  dateOfBirth?: string;
  isAccountDisabled?: boolean;
};

/**
 * Update any detail of an employee — name, email, password, role, shift,
 * mobile, date of birth and active/disabled. Only the fields that are passed
 * are changed.
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
  // Every field is checked (not just the first failure) so the dialog can
  // mark each one that needs fixing.
  const fieldErrors: FieldErrors = {};
  const check = <T,>(field: string, schema: z.ZodType<T>, value: unknown): T | undefined => {
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    fieldErrors[field] = result.error.issues[0]?.message ?? "Check this field.";
    return undefined;
  };

  const firstName =
    input.firstName !== undefined ? check("firstName", firstNameSchema, input.firstName) : undefined;
  const lastName =
    input.lastName !== undefined ? check("lastName", lastNameSchema, input.lastName) : undefined;

  const newPassword = input.password?.trim() ?? "";
  if (newPassword) check("password", passwordSchema, newPassword);

  const newEmail = input.email?.trim() ?? "";
  if (newEmail) check("email", emailSchema, newEmail);

  let phone: string | null | undefined;
  if (input.phone !== undefined) {
    if (input.phone.trim() === "") {
      phone = null;
    } else if (!isValidPhMobile(input.phone)) {
      fieldErrors.phone = "Enter a valid Philippine mobile number, e.g. +63 917 123 4567.";
    } else {
      phone = toInternationalMobile(input.phone);
    }
  }

  let dateOfBirth: string | null | undefined;
  if (input.dateOfBirth !== undefined) {
    if (check("dateOfBirth", dateOfBirthSchema, input.dateOfBirth) !== undefined) {
      dateOfBirth = input.dateOfBirth === "" ? null : input.dateOfBirth;
    }
  }

  const requestedRole = input.role ? resolveEmployeeRole(input.role) : null;
  if (input.role && !requestedRole) {
    fieldErrors.role = "Role must be Manager or Staff.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      data: null,
      error: Object.values(fieldErrors)[0],
      fieldErrors,
    };
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
    // A former rider's stored role no longer resolves (pickup-only, issue
    // #114), so the role being assigned in this same save decides — that is
    // how a manager re-enables one as Staff in one step. It grants nothing
    // new: a manager could already change the role first, then enable.
    const targetRole = currentRole ?? requestedRole;
    if (!targetRole || !canDisableEmployee(callerRole, targetRole, isSelf)) {
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
  if (firstName) updates.first_name = firstName;
  if (lastName) updates.last_name = lastName;
  if (emailChanged) updates.email = newEmail;
  if (requestedRole) updates.role = requestedRole;
  if (input.shift !== undefined) updates.schedule_shift = input.shift || null;
  if (phone !== undefined) updates.phone_number = phone;
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
      return {
        data: null,
        error: error.message,
        fieldErrors: fieldErrorFromDbError(error) ?? undefined,
      };
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

  // Service role: `employee` has no DELETE policy, so a session delete would
  // match zero rows and the Auth user below would be removed from under a
  // row that is still there. The caller was verified as a manager above.
  const admin = createAdminClient();
  const { data: photoRow } = await admin
    .from("employee")
    .select("profileImage_URL")
    .eq("employee_id", employeeId)
    .maybeSingle();

  const { error: deleteError } = await admin
    .from("employee")
    .delete()
    .eq("employee_id", employeeId);

  if (deleteError) {
    return { data: null, error: deleteError.message };
  }

  await removeStoredImage(IMAGE_BUCKETS.employeeAvatar, photoRow?.profileImage_URL);

  try {
    // Delete the Auth user so the email can be reused.
    await admin.auth.admin.deleteUser(employeeId);
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to delete user" };
  }

  return { data: { employee_id: employeeId }, error: null };
}

/**
 * Set an employee's profile photo.
 *
 * Requires: the employee themselves, or a manager. It is the one upload path
 * for staff photos — the profile screen's avatar and the manager's employee
 * dialog both call it — so validation and cleanup live in one place.
 *
 * Runs on the server with the service role, after the check above, because
 * a manager writing into another employee's photo is exactly the case bucket
 * policies scoped to "your own file" would refuse. The previous photo is
 * removed once the new URL is saved; each upload gets a unique name, so the
 * old file was otherwise left in the bucket for good.
 */
export async function setEmployeePhoto(
  employeeId: string,
  formData: FormData,
): Promise<ActionResult<{ imageUrl: string }>> {
  const caller = await getCurrentEmployee();
  if (!caller.data) return { data: null, error: caller.error };

  const callerRole = resolveEmployeeRole(caller.data.role);
  const isSelf = caller.data.employee_id === employeeId;
  if (!isSelf && !(callerRole && isManager(callerRole))) {
    return { data: null, error: "You do not have permission to perform this action." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { data: null, error: "Choose a photo to upload." };
  }
  const problem = imageUploadProblem(file);
  if (problem) return { data: null, error: problem };

  const admin = createAdminClient();
  const { data: before, error: readError } = await admin
    .from("employee")
    .select("profileImage_URL")
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (readError) return { data: null, error: readError.message };
  if (!before) return { data: null, error: "Employee not found." };

  const filePath = `employee-${employeeId}-${Date.now()}.${imageExtensionFor(file)}`;
  const { error: uploadError } = await admin.storage
    .from(IMAGE_BUCKETS.employeeAvatar)
    .upload(filePath, file, { contentType: file.type });
  if (uploadError) return { data: null, error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from(IMAGE_BUCKETS.employeeAvatar).getPublicUrl(filePath);

  const { error: updateError } = await admin
    .from("employee")
    .update({ profileImage_URL: publicUrl })
    .eq("employee_id", employeeId);
  if (updateError) {
    await removeStoredImage(IMAGE_BUCKETS.employeeAvatar, publicUrl);
    return { data: null, error: updateError.message };
  }

  await removeStoredImage(IMAGE_BUCKETS.employeeAvatar, before.profileImage_URL);
  return { data: { imageUrl: publicUrl }, error: null };
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
    return {
      data: null,
      error: parsed.error.errors[0].message,
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const { firstName, lastName, email, phone_number } = parsed.data;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customer")
    .update({
      ...(firstName !== undefined ? { first_name: firstName } : {}),
      ...(lastName !== undefined ? { last_name: lastName } : {}),
      ...(email !== undefined ? { email } : {}),
      // One canonical stored shape, same as every other screen.
      ...(phone_number !== undefined
        ? { phone_number: toInternationalMobile(phone_number) || null }
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
  const { data: photoRow } = await supabase
    .from("customer")
    .select("profileImage_URL")
    .eq("customer_id", customerId)
    .maybeSingle();

  const { error: deleteError } = await supabase
    .from("customer")
    .delete()
    .eq("customer_id", customerId);

  if (deleteError) return { data: null, error: deleteError.message };
  await removeStoredImage(IMAGE_BUCKETS.customerAvatar, photoRow?.profileImage_URL);

  try {
    // Delete the Auth user so the email can be reused.
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(customerId);
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to delete user" };
  }

  return { data: { customer_id: customerId }, error: null };
}
