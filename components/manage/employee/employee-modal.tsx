import { useState, useEffect } from "react";
import { DialogRoot } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";

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
    contact?: string;
    shift?: string;
    lastAccessLog?: string;
  } | null;
}

const ROLES = ["Manager", "Server", "Cook", "Cashier", "Delivery"];
const SHIFTS = ["MWF – 12-3PM", "TThS – 9-5PM", "Weekends – 10-10PM", "Mon-Fri – 8-4PM"];

export function EmployeeModal({ isOpen, onClose, onSave, onDelete, employee }: EmployeeModalProps) {
  const isEditMode = !!employee;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[1]);
  const [shift, setShift] = useState(SHIFTS[0]);
  const [password, setPassword] = useState("");
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

  const isRiderRole = role === "Delivery" || role === "Rider" || role === "RIDER";

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setName(employee.name);
        setEmail(employee.email);
        setRole(employee.role || ROLES[1]);
        setShift(employee.shift || SHIFTS[0]); 
        setPassword(""); // Admin shouldn't see passwords. Leave blank unless changing it.
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
        setRole(ROLES[1]);
        setShift(SHIFTS[0]);
        setPassword("");
        setLastAccessLog("");
        setRiderDetails({
          vehicle_make_model: "",
          vehicle_plate_number: "",
          driver_license_number: "",
          license_expiry_date: "",
        });
      }
    }
  }, [isOpen, employee]);

  if (!isOpen) return null;

  const displayName = isEditMode ? employee.name : name;
  const initials = displayName 
    ? displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'LR';

  const handleSave = () => {
    onSave?.({
      name,
      email,
      role,
      shift: isRiderRole ? null : shift,
      password,
      lastAccessLog,
      riderDetails: isRiderRole ? riderDetails : null,
    });

    setName("");
    setEmail("");
    setRole(ROLES[1]);
    setShift(SHIFTS[0]);
    setPassword("");
    setLastAccessLog("");
    setRiderDetails({
      vehicle_make_model: "",
      vehicle_plate_number: "",
      driver_license_number: "",
      license_expiry_date: "",
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
          <div className="bg-[#8C1C13] flex items-center justify-center rounded-full size-[140px]">
            <span className="font-display text-[#FBF6EC] text-[60px] leading-none mt-2">
              {initials}
            </span>
          </div>
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
              className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
            />
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
              className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
            />
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

          {!isRiderRole && (
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
                Rider Details
              </div>

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
                placeholder={isEditMode ? "Leave blank to keep unchanged" : "Enter secure password"}
                className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] pr-[40px] w-full text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A2938A] hover:text-[#7A6A60] transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

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
                className="flex-1 bg-[#E8541F] rounded-[13px] py-[10px] font-bold text-white text-[14px] hover:bg-[#E8541F]/90 transition-colors"
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