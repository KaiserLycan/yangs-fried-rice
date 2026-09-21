import { useState, useEffect } from "react";
import { DialogRoot } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { roleDisplayLabel } from "@/lib/auth/roles";
import { getEmployeeForEdit } from "@/lib/actions/admin";
import { dateOfBirthSchema, earliestBirthdate, latestBirthdateForMinAge } from "@/lib/validation/date-of-birth";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  PH_MOBILE_EXAMPLE,
  isValidPhMobile,
  phoneDigitsOf,
  toInternationalMobile,
} from "@/lib/validation/phone";

/**
 * EmployeeModal
 * 
 * What's Added/Changed:
 * - Fixed `useEffect` state overrides: Password now clears securely in edit mode instead of passing literal asterisks.
 * - Updated prop types to accept `shift` and `lastAccessLog` to prevent hardcoded resets.
 * 
 * TODO (Backend Integration & Improvements):
 * - [ ] Connect role and shift dropdowns to fetch live data from the backend.
 * - [ ] Validate required fields before allowing the "Add Employee" or "Edit" submission.
 * - [ ] Handle file uploading for a real employee avatar (replace "LR" initials).
 */

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (employeeData: any) => void;
  onDelete?: (employeeData: any) => void;
  employee?: {
    id: string;
    name: string;
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

// The three roles the back office uses. Server / Cook / Cashier are all just
// "Staff" — see `roleDisplayLabel` / `normalizeEmployeeRoleLabel`.
const ROLES = ["Manager", "Staff", "Delivery"];
const DEFAULT_ROLE = "Staff";

type FieldErrors = Partial<Record<"name" | "email" | "password" | "phone" | "dateOfBirth" | "rider", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SHIFTS = ["MWF – 12-3PM", "TThS – 9-5PM", "Weekends – 10-10PM", "Mon-Fri – 8-4PM"];

export function EmployeeModal({ isOpen, onClose, onSave, onDelete, employee }: EmployeeModalProps) {
  const isEditMode = !!employee;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [shift, setShift] = useState(SHIFTS[0]);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [loadingRider, setLoadingRider] = useState(false);
  const [lastAccessLog, setLastAccessLog] = useState("");
  const [riderDetails, setRiderDetails] = useState({
    vehicle_make_model: "",
    vehicle_plate_number: "",
    driver_license_number: "",
    license_expiry_date: "",
  });

  const [roleOpen, setRoleOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const isRiderRole = roleDisplayLabel(role) === "Delivery";

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setName(employee.name);
        setEmail(employee.email);
        setRole(roleDisplayLabel(employee.role));
        setShift(employee.shift || SHIFTS[0]); 
        setPassword(""); // Admin shouldn't see passwords. Leave blank unless changing it.
        setPhone(phoneDigitsOf(employee.phone));
        setDateOfBirth(employee.dateOfBirth ?? "");
        setIsDisabled(Boolean(employee.isDisabled));
        setLastAccessLog(employee.lastAccessLog || "No login history"); 
        setRiderDetails({
          vehicle_make_model: "",
          vehicle_plate_number: "",
          driver_license_number: "",
          license_expiry_date: "",
        });
      } else {
        setName("");
        setEmail("");
        setRole(DEFAULT_ROLE);
        setShift(SHIFTS[0]);
        setPassword("");
        setPhone("");
        setDateOfBirth("");
        setIsDisabled(false);
        setLastAccessLog("");
        setRiderDetails({
          vehicle_make_model: "",
          vehicle_plate_number: "",
          driver_license_number: "",
          license_expiry_date: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, employee]);

  // Editing an existing rider: load their vehicle / licence row so the form
  // shows (and can change) what is actually stored, instead of empty boxes.
  useEffect(() => {
    if (!isOpen || !employee?.id) return;
    let cancelled = false;
    setLoadingRider(true);
    getEmployeeForEdit(employee.id)
      .then((result) => {
        if (cancelled || !result.data) return;
        const rider = result.data.rider;
        if (rider) {
          setRiderDetails({
            vehicle_make_model: rider.vehicle_make_model ?? "",
            vehicle_plate_number: rider.vehicle_plate_number ?? "",
            driver_license_number: rider.driver_license_number ?? "",
            license_expiry_date: rider.license_expiry_date ?? "",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRider(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, employee?.id]);

  if (!isOpen) return null;

  const displayName = isEditMode ? employee.name : name;
  const initials = displayName 
    ? displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'LR';

  // Validate BEFORE handing off to the confirm dialog, and never clear the
  // form here. The old handler wiped every field the moment "Save" was
  // pressed, so a validation error, a cancelled confirmation or a failed save
  // all left the manager staring at an empty form. The parent closes the
  // modal on success, and the effect above resets the fields the next time it
  // opens.
  const handleSave = () => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Enter the employee's name.";
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter a valid email address.";
    if (!isEditMode && password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    } else if (isEditMode && password && password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }

    // The field can only hold digits, so this catches a short or half-typed
    // number (and one that doesn't start with 9).
    if (phone && !isValidPhMobile(phone)) {
      next.phone = `Enter 10 digits after +63, e.g. ${PH_MOBILE_EXAMPLE}.`;
    }
    const dobResult = dateOfBirthSchema.safeParse(dateOfBirth);
    if (!dobResult.success) {
      next.dateOfBirth = dobResult.error.issues[0]?.message ?? "Enter a valid date of birth.";
    }
    if (isRiderRole) {
      const filled = Object.values(riderDetails).filter((v) => v.trim() !== "").length;
      if (filled > 0 && filled < 4) {
        next.rider = "Fill in all four rider details, or leave them all blank.";
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave?.({
      name: name.trim(),
      email: email.trim(),
      role,
      shift,
      password,
      phone: toInternationalMobile(phone),
      dateOfBirth,
      isAccountDisabled: isDisabled,
      lastAccessLog,
      riderDetails: isRiderRole ? riderDetails : null,
    });
  };

  return (
    <DialogRoot
      open={isOpen}
      onClose={onClose}
      className="m-auto max-w-[480px] w-[calc(100%-2rem)] md:w-full overflow-hidden rounded-[20px] bg-[#FBF6EC] shadow-[0_30px_70px_rgba(26,18,16,0.26)] border-0 p-0"
    >
      <div className="flex flex-col w-full max-h-[90vh]">
        
        {/* Avatar Section */}
        <div className="flex justify-center pt-[30px] shrink-0">
          {employee?.imageUrl ? (
            <div className="size-[140px] rounded-full overflow-hidden border-4 border-[#8C1C13]">
              <img 
                src={employee.imageUrl} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="bg-[#8C1C13] flex items-center justify-center rounded-full size-[140px]">
              <span className="font-display text-[#FBF6EC] text-[60px] leading-none mt-2">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-[14px] px-[26px] pb-[26px] pt-[25px] overflow-y-auto">
          
          {/* Name */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Name
            </label>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alice Smith"
              aria-invalid={errors.name ? true : undefined}
              className={cn(
                "bg-white border rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]",
                errors.name ? "border-[#C0392B]" : "border-[#DDCDB8]",
              )}
            />
            {errors.name && <p className="text-[12px] text-[#C0392B]">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Email Address
            </label>
            <input 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. alice@gmail.com"
              type="email"
              aria-invalid={errors.email ? true : undefined}
              className={cn(
                "bg-white border rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]",
                errors.email ? "border-[#C0392B]" : "border-[#DDCDB8]",
              )}
            />
            {errors.email && <p className="text-[12px] text-[#C0392B]">{errors.email}</p>}
          </div>

          {/* Mobile number */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Mobile Number
            </label>
            <PhoneInput
              value={phone}
              onValueChange={setPhone}
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
              <p className="text-[12px] text-[#A2938A]">Format: {PH_MOBILE_EXAMPLE}</p>
            )}
          </div>

          {/* Date of birth */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Date of Birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              min={earliestBirthdate()}
              max={latestBirthdateForMinAge()}
              aria-invalid={errors.dateOfBirth ? true : undefined}
              className={cn(
                "bg-white border rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F]",
                errors.dateOfBirth ? "border-[#C0392B]" : "border-[#DDCDB8]",
              )}
            />
            {errors.dateOfBirth && <p className="text-[12px] text-[#C0392B]">{errors.dateOfBirth}</p>}
          </div>

          {/* Role Dropdown */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Role
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleOpen(!roleOpen)}
                className="flex w-full items-center justify-between bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] transition-colors hover:bg-[#FAF5EB] focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
              >
                <span>{role}</span>
                {roleOpen ? <ChevronDown className="w-6 h-6 text-[#1A1210]" /> : <ChevronRight className="w-6 h-6 text-[#1A1210]" />}
              </button>
              {roleOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-white border border-[#DDCDB8] rounded-[12px] p-1 shadow-lg max-h-[160px] overflow-y-auto">
                    {ROLES.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setRole(r); setRoleOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-colors",
                          role === r ? "bg-[#F6E9D9] font-bold text-[#8C1C13]" : "text-[#1A1210] hover:bg-[#FAF5EB]"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {(
            <div className="flex flex-col gap-1.5 w-full">
              <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
                Scheduled Shift
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShiftOpen(!shiftOpen)}
                  className="flex w-full items-center justify-between bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] transition-colors hover:bg-[#FAF5EB] focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
                >
                  <span>{shift}</span>
                  {shiftOpen ? <ChevronDown className="w-6 h-6 text-[#1A1210]" /> : <ChevronRight className="w-6 h-6 text-[#1A1210]" />}
                </button>
                {shiftOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShiftOpen(false)} />
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-white border border-[#DDCDB8] rounded-[12px] p-1 shadow-lg max-h-[160px] overflow-y-auto">
                      {SHIFTS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setShift(s); setShiftOpen(false); }}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-colors",
                            shift === s ? "bg-[#F6E9D9] font-bold text-[#8C1C13]" : "text-[#1A1210] hover:bg-[#FAF5EB]"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {isRiderRole && (
            <div className="flex flex-col gap-3 w-full rounded-[12px] border border-[#DDCDB8] bg-[#F8F1E6] p-3">
              <div className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
                Rider Details{loadingRider ? " — loading…" : ""}
              </div>
              {errors.rider && <p className="text-[12px] text-[#C0392B]">{errors.rider}</p>}

              <div className="flex flex-col gap-1.5 w-full">
                <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
                  Driver License Number
                </label>
                <input
                  value={riderDetails.driver_license_number}
                  onChange={e => setRiderDetails(prev => ({ ...prev, driver_license_number: e.target.value }))}
                  placeholder="e.g. N01-1234567"
                  className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
                  Vehicle Make / Model
                </label>
                <input
                  value={riderDetails.vehicle_make_model}
                  onChange={e => setRiderDetails(prev => ({ ...prev, vehicle_make_model: e.target.value }))}
                  placeholder="e.g. Toyota Hiace"
                  className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
                  Vehicle Plate Number
                </label>
                <input
                  value={riderDetails.vehicle_plate_number}
                  onChange={e => setRiderDetails(prev => ({ ...prev, vehicle_plate_number: e.target.value }))}
                  placeholder="e.g. ABC 1234"
                  className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
                  License Expiry Date
                </label>
                <input
                  type="date"
                  value={riderDetails.license_expiry_date}
                  onChange={e => setRiderDetails(prev => ({ ...prev, license_expiry_date: e.target.value }))}
                  className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEditMode ? "Leave blank to keep unchanged" : "At least 8 characters"}
                aria-invalid={errors.password ? true : undefined}
                className={cn(
                  "bg-white border rounded-[12px] p-[14px] pr-[40px] w-full text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]",
                  errors.password ? "border-[#C0392B]" : "border-[#DDCDB8]",
                )}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A2938A] hover:text-[#7A6A60] transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-[12px] text-[#C0392B]">{errors.password}</p>}
          </div>

          {/* Account status — only for an existing employee */}
          {isEditMode && (
            <label className="flex items-center justify-between gap-3 rounded-[12px] border border-[#DDCDB8] bg-white p-[14px]">
              <span className="flex flex-col">
                <span className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
                  Account
                </span>
                <span className="text-[13px] text-[#1A1210]">
                  {isDisabled ? "Disabled — they can't sign in" : "Active"}
                </span>
              </span>
              <input
                type="checkbox"
                checked={!isDisabled}
                onChange={e => setIsDisabled(!e.target.checked)}
                aria-label="Account active"
                className="h-5 w-5 accent-[#E8541F]"
              />
            </label>
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
              <button 
                onClick={onClose}
                className="flex-1 border border-[#DDCDB8] rounded-[13px] py-[10px] font-bold text-[#7A6A60] text-[14px] hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                // Not while the rider's stored details are still loading — saving
                // the still-empty boxes would overwrite them.
                disabled={loadingRider}
                className="flex-1 bg-[#E8541F] rounded-[13px] py-[10px] font-bold text-white text-[14px] hover:bg-[#E8541F]/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
              >
                {isEditMode ? "Save Changes" : "Add Employee"}
              </button>
            </div>
            
            {isEditMode && (
              <button 
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