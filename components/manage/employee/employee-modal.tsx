import { useState, useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { DialogDismiss, DialogRoot } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Camera, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { ALLOWED_IMAGE_TYPES, imageUploadProblem } from "@/lib/storage/stored-image";
import { roleDisplayLabel } from "@/lib/auth/roles";
import { getEmployeeForEdit } from "@/lib/actions/admin";
import {
  EMPLOYEE_MIN_AGE_YEARS,
  earliestBirthdate,
  employeeDateOfBirthSchema,
  latestBirthdateForMinAge,
} from "@/lib/validation/date-of-birth";
import { PhoneInput } from "@/components/ui/phone-input";
import { useValidatedValues } from "@/lib/forms/use-live-validation";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
import { DROPDOWN_FOCUS_RING, useDropdown } from "@/lib/hooks/use-dropdown";
import {
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  lengthProps,
  newPasswordSchema,
  splitFullName,
  type LimitedField,
} from "@/lib/validation/fields";
import type { FieldErrors } from "@/lib/validation/field-errors";
import {
  PH_MOBILE_EXAMPLE,
  optionalPhoneSchema,
  phoneDigitsOf,
  toInternationalMobile,
} from "@/lib/validation/phone";

/**
 * EmployeeModal — the manager's add / edit employee dialog.
 *
 * First and last name are separate fields (stored in their own columns).
 * Every field is validated as it is typed and when it is left; the error
 * shows under the field, and "Add Employee" / "Save Changes" stays disabled
 * until the whole form is valid. A rejection from the server comes back in
 * `serverErrors` and is shown under the field it names. Ctrl/⌘+Enter saves.
 *
 * The avatar is a photo picker. The chosen file is compressed here and handed
 * to `onSave` as `photoFile`; the page uploads it with `setEmployeePhoto`
 * once the employee row exists, which for a new hire is only after the save.
 */

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (employeeData: any) => void;
  onDelete?: (employeeData: any) => void;
  /** Field errors from the last failed save, keyed by form field. */
  serverErrors?: FieldErrors | null;
  employee?: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
    shift?: string;
    lastAccessLog?: string;
    imageUrl?: string;
    phone?: string;
    dateOfBirth?: string;
    isDisabled?: boolean;
  } | null;
}

// The two roles the back office uses (pickup-only since issue #114 — there
// are no riders). Server / Cook / Cashier are all just "Staff" — see
// `roleDisplayLabel` / `normalizeEmployeeRoleLabel`.
const ROLES = ["Manager", "Staff"];
const DEFAULT_ROLE = "Staff";
const SHIFTS = ["MWF – 12-3PM", "TThS – 9-5PM", "Weekends – 10-10PM", "Mon-Fri – 8-4PM"];

function employeeFormSchema(isEditMode: boolean) {
  return z.object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    // Required for a new account; on edit, blank means "leave unchanged".
    password: isEditMode ? z.union([z.literal(""), newPasswordSchema]) : newPasswordSchema,
    phone: optionalPhoneSchema,
    dateOfBirth: employeeDateOfBirthSchema,
  });
}

/** Every value the dialog can edit, for the unsaved-changes comparison. */
type FormSnapshot = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  shift: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  isDisabled: boolean;
};

/** A blank new-employee form, overlaid with whatever is known. */
function snapshotFields(values: Partial<FormSnapshot>): FormSnapshot {
  return {
    firstName: "",
    lastName: "",
    email: "",
    role: DEFAULT_ROLE,
    shift: SHIFTS[0],
    password: "",
    phone: "",
    dateOfBirth: "",
    isDisabled: false,
    ...values,
  };
}

/** Key order is fixed by `snapshotFields`, so equal forms serialise equally. */
function snapshotOf(values: Partial<FormSnapshot>): string {
  return JSON.stringify(snapshotFields(values));
}

const inputClass = (invalid: boolean) =>
  cn(
    "bg-white border rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]",
    invalid ? "border-[#C0392B]" : "border-[#DDCDB8]",
  );

export function EmployeeModal({ isOpen, onClose, onSave, onDelete, employee, serverErrors }: EmployeeModalProps) {
  const isEditMode = !!employee;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [shift, setShift] = useState(SHIFTS[0]);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [lastAccessLog, setLastAccessLog] = useState("");

  const [roleOpen, setRoleOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const roleMenu = useDropdown({ open: roleOpen, onOpenChange: setRoleOpen });
  const shiftMenu = useDropdown({ open: shiftOpen, onOpenChange: setShiftOpen });
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  // What the form held when it opened (and once the stored details arrived),
  // serialised, so "has anything changed?" is one comparison.
  const [baseline, setBaseline] = useState("");

  const schema = useMemo(() => employeeFormSchema(isEditMode), [isEditMode]);
  const values = useMemo(
    () => ({
      firstName,
      lastName,
      email,
      password,
      phone: phone ? toInternationalMobile(phone) : "",
      dateOfBirth,
    }),
    [firstName, lastName, email, password, phone, dateOfBirth],
  );
  const form = useValidatedValues(schema, values);
  const { errors, touch } = form;
  const { reset: resetValidation, setServerErrors } = form;

  useEffect(() => {
    setServerErrors(serverErrors);
  }, [serverErrors, setServerErrors]);

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        const split = splitFullName(employee.name);
        setFirstName(employee.firstName ?? split.firstName);
        setLastName(employee.lastName ?? split.lastName);
        setEmail(employee.email);
        setRole(roleDisplayLabel(employee.role));
        setShift(employee.shift || SHIFTS[0]);
        setPassword(""); // Admin shouldn't see passwords. Leave blank unless changing it.
        setPhone(phoneDigitsOf(employee.phone));
        setDateOfBirth(employee.dateOfBirth ?? "");
        setIsDisabled(Boolean(employee.isDisabled));
        setLastAccessLog(employee.lastAccessLog || "No login history");
      } else {
        setFirstName("");
        setLastName("");
        setEmail("");
        setRole(DEFAULT_ROLE);
        setShift(SHIFTS[0]);
        setPassword("");
        setPhone("");
        setDateOfBirth("");
        setIsDisabled(false);
        setLastAccessLog("");
      }
      setBaseline(
        snapshotOf(
          employee
            ? {
                firstName: employee.firstName ?? splitFullName(employee.name).firstName,
                lastName: employee.lastName ?? splitFullName(employee.name).lastName,
                email: employee.email,
                role: roleDisplayLabel(employee.role),
                shift: employee.shift || SHIFTS[0],
                phone: phoneDigitsOf(employee.phone),
                dateOfBirth: employee.dateOfBirth ?? "",
                isDisabled: Boolean(employee.isDisabled),
              }
            : {},
        ),
      );
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoError(null);
      resetValidation();
    }
  }, [isOpen, employee, resetValidation]);

  // Release the preview's object URL when it is replaced or the modal closes.
  useEffect(() => {
    if (!photoPreview) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // Checked on the original, before compressing (P31).
    const problem = imageUploadProblem(file);
    if (problem) {
      setPhotoError(problem);
      return;
    }
    try {
      const compressed = await compressImage(file, 400);
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
      setPhotoError(null);
    } catch {
      setPhotoError("Could not read that photo. Try a JPEG, PNG, or WebP image.");
    }
  };

  // Editing an existing employee: load their stored row so the name fields
  // show what is actually stored.
  useEffect(() => {
    if (!isOpen || !employee?.id) return;
    let cancelled = false;
    setLoadingDetails(true);
    getEmployeeForEdit(employee.id)
      .then((result) => {
        if (cancelled || !result.data) return;
        const row = result.data.employee;
        if (row.first_name) setFirstName(row.first_name);
        if (row.last_name) setLastName(row.last_name);
        // The stored values are the starting point, not an edit.
        setBaseline((prev) => {
          const base = prev ? (JSON.parse(prev) as FormSnapshot) : snapshotFields({});
          return snapshotOf({
            ...base,
            ...(row.first_name ? { firstName: row.first_name } : {}),
            ...(row.last_name ? { lastName: row.last_name } : {}),
          });
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingDetails(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, employee?.id]);

  const canSave = form.isValid && !loadingDetails;

  const isDirty =
    photoFile !== null ||
    (baseline !== "" &&
      baseline !==
        snapshotOf({
          firstName,
          lastName,
          email,
          role,
          shift,
          password,
          phone,
          dateOfBirth,
          isDisabled,
        }));

  // Validate BEFORE handing off to the confirm dialog, and never clear the
  // form here: a validation error, a cancelled confirmation or a failed save
  // must leave the manager's typing in place. The parent closes the modal on
  // success, and the effect above resets the fields the next time it opens.
  const handleSave = () => {
    form.attemptSubmit();
    if (!canSave || !form.parsed) return;

    onSave?.({
      firstName: form.parsed.firstName,
      lastName: form.parsed.lastName,
      name: `${form.parsed.firstName} ${form.parsed.lastName}`,
      email: form.parsed.email,
      role,
      shift,
      password,
      phone: form.parsed.phone,
      dateOfBirth,
      isAccountDisabled: isDisabled,
      lastAccessLog,
      photoFile,
    });
  };

  useShortcut(SHORTCUTS.submitForm.combo, handleSave, { enabled: isOpen });

  if (!isOpen) return null;

  const displayName = `${firstName} ${lastName}`.trim() || employee?.name || "";
  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "LR";
  const shownPhoto = photoPreview ?? employee?.imageUrl ?? null;

  /** A labelled text input that validates as it is typed and when it is left. */
  const textField = (
    name: string,
    label: string,
    value: string,
    setValue: (value: string) => void,
    limit: LimitedField,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={`employee-${name}`} className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
        {label}
      </label>
      <input
        id={`employee-${name}`}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          touch(name);
        }}
        onBlur={() => touch(name)}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `employee-${name}-error` : undefined}
        {...lengthProps(limit)}
        {...extra}
        className={inputClass(Boolean(errors[name]))}
      />
      {errors[name] ? (
        <p id={`employee-${name}-error`} aria-live="polite" className="text-[12px] text-[#C0392B]">
          {errors[name]}
        </p>
      ) : null}
    </div>
  );


  return (
    <DialogRoot
      open={isOpen}
      onClose={onClose}
      dirty={isDirty}
      className="m-auto max-w-[480px] w-[calc(100%-2rem)] md:w-full overflow-hidden rounded-[20px] bg-[#FBF6EC] shadow-[0_30px_70px_rgba(26,18,16,0.26)] border-0 p-0"
    >
      <div className="flex flex-col w-full max-h-[90vh]">

        {/* Avatar Section — doubles as the photo picker. */}
        <div className="flex flex-col items-center gap-2 pt-[30px] shrink-0">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            aria-label={shownPhoto ? "Change photo" : "Add photo"}
            className="group relative size-[140px] shrink-0 overflow-hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8541F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF6EC]"
          >
            {shownPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={shownPhoto}
                alt={displayName}
                className="w-full h-full object-cover rounded-full border-4 border-[#8C1C13]"
              />
            ) : (
              <span className="bg-[#8C1C13] flex size-full items-center justify-center rounded-full">
                <span className="font-display text-[#FBF6EC] text-[60px] leading-none mt-2">
                  {initials}
                </span>
              </span>
            )}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/45 text-[12px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-6" aria-hidden="true" />
              {shownPhoto ? "Change photo" : "Add photo"}
            </span>
          </button>
          {photoError ? (
            <p role="alert" className="text-[12px] text-[#C0392B]">{photoError}</p>
          ) : (
            <p className="text-[12px] text-[#A2938A]">
              {photoFile ? "New photo — saved with the employee." : "Optional. JPEG, PNG, or WebP, up to 5MB."}
            </p>
          )}
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-[14px] px-[26px] pb-[26px] pt-[25px] overflow-y-auto">

          <div className="flex flex-col gap-[14px] md:flex-row">
            {textField("firstName", "First Name", firstName, setFirstName, "firstName", {
              placeholder: "e.g. Alice",
              autoComplete: "off",
            })}
            {textField("lastName", "Last Name", lastName, setLastName, "lastName", {
              placeholder: "e.g. Smith",
              autoComplete: "off",
            })}
          </div>

          {textField("email", "Email Address", email, setEmail, "email", {
            placeholder: "e.g. alice@yangs.ph",
            type: "email",
            autoComplete: "off",
          })}

          {/* Mobile number */}
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="employee-phone" className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Mobile Number
            </label>
            <PhoneInput
              id="employee-phone"
              value={phone}
              onValueChange={(digits) => {
                setPhone(digits);
                touch("phone");
              }}
              onBlur={() => touch("phone")}
              invalid={Boolean(errors.phone)}
              className={cn(
                "rounded-[12px] border bg-white focus-within:ring-2 focus-within:ring-[#E8541F]",
                errors.phone ? "border-[#C0392B]" : "border-[#DDCDB8]",
              )}
              prefixClassName="pl-[14px] text-[15px] text-[#7A6A60]"
              inputClassName="px-[6px] py-[14px] text-[15px] text-[#1A1210] placeholder:text-[#A2938A]"
            />
            {errors.phone ? (
              <p className="text-[12px] text-[#C0392B]">{errors.phone}</p>
            ) : (
              <p className="text-[12px] text-[#A2938A]">Optional. Format: {PH_MOBILE_EXAMPLE}</p>
            )}
          </div>

          {/* Date of birth */}
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="employee-dateOfBirth" className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Date of Birth
            </label>
            <input
              id="employee-dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={e => {
                setDateOfBirth(e.target.value);
                touch("dateOfBirth");
              }}
              onBlur={() => touch("dateOfBirth")}
              min={earliestBirthdate()}
              max={latestBirthdateForMinAge(EMPLOYEE_MIN_AGE_YEARS)}
              aria-invalid={errors.dateOfBirth ? true : undefined}
              className={inputClass(Boolean(errors.dateOfBirth))}
            />
            {errors.dateOfBirth && <p className="text-[12px] text-[#C0392B]">{errors.dateOfBirth}</p>}
          </div>

          {/* Role Dropdown */}
          <div className="flex flex-col gap-1.5 w-full">
            <label {...roleMenu.labelProps} className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Role
            </label>
            <div className="relative">
              <button
                {...roleMenu.triggerProps}
                className="flex w-full items-center justify-between bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] transition-colors hover:bg-[#FAF5EB] focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
              >
                <span>{role}</span>
                {roleOpen ? <ChevronDown aria-hidden="true" className="w-6 h-6 text-[#1A1210]" /> : <ChevronRight aria-hidden="true" className="w-6 h-6 text-[#1A1210]" />}
              </button>
              {roleOpen && (
                <div {...roleMenu.listProps} className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-white border border-[#DDCDB8] rounded-[12px] p-1 shadow-lg max-h-[160px] overflow-y-auto">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      {...roleMenu.optionProps(role === r)}
                      onClick={() => { setRole(r); roleMenu.close(); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-colors",
                        DROPDOWN_FOCUS_RING,
                        role === r ? "bg-[#F6E9D9] font-bold text-[#8C1C13]" : "text-[#1A1210] hover:bg-[#FAF5EB]"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label {...shiftMenu.labelProps} className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Scheduled Shift
            </label>
            <div className="relative">
              <button
                {...shiftMenu.triggerProps}
                className="flex w-full items-center justify-between bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] transition-colors hover:bg-[#FAF5EB] focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
              >
                <span>{shift}</span>
                {shiftOpen ? <ChevronDown aria-hidden="true" className="w-6 h-6 text-[#1A1210]" /> : <ChevronRight aria-hidden="true" className="w-6 h-6 text-[#1A1210]" />}
              </button>
              {shiftOpen && (
                <div {...shiftMenu.listProps} className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-white border border-[#DDCDB8] rounded-[12px] p-1 shadow-lg max-h-[160px] overflow-y-auto">
                  {SHIFTS.map(s => (
                    <button
                      key={s}
                      {...shiftMenu.optionProps(shift === s)}
                      onClick={() => { setShift(s); shiftMenu.close(); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-colors",
                        DROPDOWN_FOCUS_RING,
                        shift === s ? "bg-[#F6E9D9] font-bold text-[#8C1C13]" : "text-[#1A1210] hover:bg-[#FAF5EB]"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="employee-password" className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Password
            </label>
            <div className="relative">
              <input
                id="employee-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  touch("password");
                }}
                onBlur={() => touch("password")}
                placeholder={isEditMode ? "Leave blank to keep unchanged" : "8 to 72 characters"}
                autoComplete="new-password"
                maxLength={lengthProps("password").maxLength}
                aria-invalid={errors.password ? true : undefined}
                className={cn(inputClass(Boolean(errors.password)), "pr-[40px] w-full")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A2938A] hover:text-[#7A6A60] transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-[12px] text-[#C0392B]">{errors.password}</p>}
          </div>

          {/* Account status — only for an existing employee.

              QA asked for a toggle here; PRs #102/#103 shipped a pair of
              radio buttons, which issue #106 flagged as the wrong control.
              This is the same `Switch` the menu modals use, so there is one
              on/off control in the app rather than three lookalikes. The
              wording is JM's from the issue screenshot. */}
          {isEditMode && (
            <div className="flex flex-col gap-1.5 w-full">
              <label
                id="employee-account-status-label"
                className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase"
              >
                Account Status
              </label>
              <div className="flex items-center justify-between rounded-[12px] border border-[#DDCDB8] bg-white p-[14px]">
                <span className="text-[14px] font-bold text-[#1A1210]">
                  {isDisabled ? "Disabled — they can’t sign in" : "Active"}
                </span>
                <Switch
                  checked={!isDisabled}
                  onChange={(next) => setIsDisabled(!next)}
                  labelledBy="employee-account-status-label"
                />
              </div>
            </div>
          )}

          {/* Last Access Log */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Last Access Log
            </label>
            <input
              readOnly
              value={lastAccessLog}
              className="bg-[#FAF5EB] border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#7A6A60] focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-[10px] pt-[10px] shrink-0">
            <div className="flex gap-[10px] w-full">
              <DialogDismiss fallback={onClose}>
                {(requestClose) => (
                  <button
                    type="button"
                    onClick={requestClose}
                    className="flex-1 border border-[#DDCDB8] rounded-[13px] py-[10px] font-bold text-[#7A6A60] text-[14px] hover:bg-black/5 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </DialogDismiss>
              <Tooltip
                content={
                  canSave
                    ? isEditMode ? "Save this employee's changes" : "Create this employee's account"
                    : loadingDetails
                      ? "Loading the employee's stored details…"
                      : "Complete the highlighted fields to continue."
                }
                shortcut={canSave ? SHORTCUTS.submitForm.combo : undefined}
                className="flex-1"
              >
                <button
                  type="button"
                  onClick={handleSave}
                  // Not while the stored details are still loading — saving the
                  // still-empty boxes would overwrite them — nor while any field
                  // is invalid.
                  disabled={!canSave}
                  className="w-full bg-[#E8541F] rounded-[13px] py-[10px] font-bold text-white text-[14px] hover:bg-[#E8541F]/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isEditMode ? "Save Changes" : "Add Employee"}
                </button>
              </Tooltip>
            </div>

            {isEditMode && (
              <button
                type="button"
                onClick={() => {
                  onDelete?.(employee);
                }}
                className="w-full bg-[#B8352A] rounded-[13px] py-[10px] font-bold text-white text-[14px] hover:bg-[#B8352A]/90 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

        </div>
      </div>
    </DialogRoot>
  );
}
