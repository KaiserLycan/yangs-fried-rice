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
import { Button } from "@/components/ui/button";

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
    "bg-white border rounded-md p-[14px] text-base text-foreground focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-placeholder",
    invalid ? "border-error-border" : "border-field-border",
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
    }),
    [firstName, lastName, email, password, phone],
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
      <label htmlFor={`employee-${name}`} className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
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
        <p id={`employee-${name}-error`} aria-live="polite" className="text-xs text-error-border">
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
      className="m-auto max-w-[480px] w-[calc(100%-2rem)] md:w-full overflow-hidden rounded-lg bg-background shadow-[0_30px_70px_rgba(26,18,16,0.26)] border-0 p-0"
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
          <Button variant="unstyled"
            type="button"
            onClick={() => photoInputRef.current?.click()}
            aria-label={shownPhoto ? "Change photo" : "Add photo"}
            className="group relative size-[140px] shrink-0 overflow-hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {shownPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={shownPhoto}
                alt={displayName}
                className="w-full h-full object-cover rounded-full border-4 border-primary"
              />
            ) : (
              <span className="bg-primary flex size-full items-center justify-center rounded-full">
                <span className="font-display text-background text-6xl leading-none mt-2">
                  {initials}
                </span>
              </span>
            )}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/45 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-6" aria-hidden="true" />
              {shownPhoto ? "Change photo" : "Add photo"}
            </span>
          </Button>
          {photoError ? (
            <p role="alert" className="text-xs text-error-border">{photoError}</p>
          ) : (
            <p className="text-xs text-placeholder">
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
            <label htmlFor="employee-phone" className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
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
                "rounded-md border bg-white focus-within:ring-2 focus-within:ring-accent",
                errors.phone ? "border-error-border" : "border-field-border",
              )}
              prefixClassName="pl-[14px] text-base text-muted-foreground"
              inputClassName="px-[6px] py-[14px] text-base text-foreground placeholder:text-placeholder"
            />
            {errors.phone ? (
              <p className="text-xs text-error-border">{errors.phone}</p>
            ) : (
              <p className="text-xs text-placeholder">Optional. Format: {PH_MOBILE_EXAMPLE}</p>
            )}
          </div>

          {/* Role Dropdown */}
          <div className="flex flex-col gap-1.5 w-full">
            <label {...roleMenu.labelProps} className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
              Role
            </label>
            <div className="relative">
              <Button variant="unstyled"
                {...roleMenu.triggerProps}
                className="flex w-full items-center justify-between bg-white border border-field-border rounded-md p-[14px] text-base text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <span>{role}</span>
                {roleOpen ? <ChevronDown aria-hidden="true" className="w-6 h-6 text-foreground" /> : <ChevronRight aria-hidden="true" className="w-6 h-6 text-foreground" />}
              </Button>
              {roleOpen && (
                <div {...roleMenu.listProps} className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-white border border-field-border rounded-md p-1 shadow-lg max-h-[160px] overflow-y-auto">
                  {ROLES.map(r => (
                    <Button variant="unstyled"
                      key={r}
                      {...roleMenu.optionProps(role === r)}
                      onClick={() => { setRole(r); roleMenu.close(); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                        DROPDOWN_FOCUS_RING,
                        role === r ? "bg-highlight font-bold text-primary" : "text-foreground hover:bg-background"
                      )}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label {...shiftMenu.labelProps} className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
              Scheduled Shift
            </label>
            <div className="relative">
              <Button variant="unstyled"
                {...shiftMenu.triggerProps}
                className="flex w-full items-center justify-between bg-white border border-field-border rounded-md p-[14px] text-base text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <span>{shift}</span>
                {shiftOpen ? <ChevronDown aria-hidden="true" className="w-6 h-6 text-foreground" /> : <ChevronRight aria-hidden="true" className="w-6 h-6 text-foreground" />}
              </Button>
              {shiftOpen && (
                <div {...shiftMenu.listProps} className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-white border border-field-border rounded-md p-1 shadow-lg max-h-[160px] overflow-y-auto">
                  {SHIFTS.map(s => (
                    <Button variant="unstyled"
                      key={s}
                      {...shiftMenu.optionProps(shift === s)}
                      onClick={() => { setShift(s); shiftMenu.close(); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                        DROPDOWN_FOCUS_RING,
                        shift === s ? "bg-highlight font-bold text-primary" : "text-foreground hover:bg-background"
                      )}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="employee-password" className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
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
              <Button variant="unstyled"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-placeholder hover:text-muted-foreground transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
            {errors.password && <p className="text-xs text-error-border">{errors.password}</p>}
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
                className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase"
              >
                Account Status
              </label>
              <div className="flex items-center justify-between rounded-md border border-field-border bg-white p-[14px]">
                <span className="text-sm font-bold text-foreground">
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
            <label className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
              Last Access Log
            </label>
            <input
              readOnly
              value={lastAccessLog}
              className="bg-background border border-field-border rounded-md p-[14px] text-base text-muted-foreground focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-[10px] pt-[10px] shrink-0">
            <div className="flex gap-[10px] w-full">
              <DialogDismiss fallback={onClose}>
                {(requestClose) => (
                  <Button variant="unstyled"
                    type="button"
                    onClick={requestClose}
                    className="flex-1 border border-field-border rounded-md py-[10px] font-bold text-muted-foreground text-sm hover:bg-black/5 transition-colors"
                  >
                    Cancel
                  </Button>
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
                <Button variant="unstyled"
                  type="button"
                  onClick={handleSave}
                  // Not while the stored details are still loading — saving the
                  // still-empty boxes would overwrite them — nor while any field
                  // is invalid.
                  disabled={!canSave}
                  className="w-full bg-accent rounded-md py-[10px] font-bold text-white text-sm hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isEditMode ? "Save Changes" : "Add Employee"}
                </Button>
              </Tooltip>
            </div>

            {isEditMode && (
              <Button variant="unstyled"
                type="button"
                onClick={() => {
                  onDelete?.(employee);
                }}
                className="w-full bg-backoffice rounded-md py-[10px] font-bold text-white text-sm hover:bg-backoffice/90 transition-colors"
              >
                Delete
              </Button>
            )}
          </div>

        </div>
      </div>
    </DialogRoot>
  );
}
