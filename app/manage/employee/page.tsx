"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, Filter, Loader2 } from "lucide-react";
import { ManagePagination } from "@/components/manage/manage-pagination";
import { SortableHeader } from "@/components/manage/sortable-header";
import { EmployeeModal } from "@/components/manage/employee/employee-modal";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatMobileNumber } from "@/lib/validation/phone";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
import { DROPDOWN_FOCUS_RING, useDropdown } from "@/lib/hooks/use-dropdown";
import type { FieldErrors } from "@/lib/validation/field-errors";
import { 
  getAllEmployees, 
  createEmployee, 
  updateEmployeeDetails,
  setEmployeePhoto,
} from "@/lib/actions/admin";
import { normalizeEmployeeRoleLabel, resolveEmployeeRole, roleDisplayLabel, type EmployeeRole } from "@/lib/auth/roles";

export type EmployeeData = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  role: string;
  /** Canonical role — what the filter compares, so it can never disagree with what is displayed. */
  roleKey: EmployeeRole | null;
  shift?: string;
  lastAccessLog?: string;
  imageUrl?: string;
  phone?: string;
  isDisabled?: boolean;
};

// Server / Cook / Cashier are all Staff — the directory shows and filters three roles.
const ROLES = ["All Roles", "Manager", "Staff"];

// 1. Wrapper component to provide the Toast context
export default function ManageEmployeePage() {
  // No ToastProvider here: the root layout already mounts one. A second,
  // nested provider gives this page its own toast list and its own live
  // region, so toasts raised here stack in a different place from every
  // other screen's.
  return <ManageEmployeeInner />;
}

// 2. The inner component that handles data logic
function ManageEmployeeInner() {
  const showToast = useToast();

  // Real Data State
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const roleFilterMenu = useDropdown({ open: roleFilterOpen, onOpenChange: setRoleFilterOpen });
  const [nameSort, setNameSort] = useState<"asc" | "desc" | "none">("none");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [recentFirst, setRecentFirst] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  const [employeeToAdd, setEmployeeToAdd] = useState<any | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = useState<any | null>(null);
  // Field errors from the last failed add/edit, shown inside the dialog.
  const [modalFieldErrors, setModalFieldErrors] = useState<FieldErrors | null>(null);

  // Shift+N opens "Add Employee" (listed in the ? shortcuts overlay).
  useShortcut(SHORTCUTS.newItem.combo, () => {
    setModalFieldErrors(null);
    setIsAddModalOpen(true);
  }, { enabled: !isAddModalOpen && selectedEmployee === null });

  // Fetch Employees on Mount
  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    const result = await getAllEmployees();
    
    if (result.error) {
      showToast(`Failed to load employees: ${result.error}`, "error");
    } else if (result.data) {
      // Safely map backend data to our UI schema
      // Safely map backend data to our UI schema
      const mappedData: EmployeeData[] = result.data.map((e: any) => ({
        id: e.employee_id,
        name: e.name || "Unknown User",
        firstName: e.first_name || "",
        lastName: e.last_name || "",
        email: e.email || "No email",
        contact: formatMobileNumber(e.phone_number) || "N/A",
        role: roleDisplayLabel(e.role),
        roleKey: resolveEmployeeRole(e.role) ?? "STAFF",
        // Map the new columns exactly as they are spelled in the database image
        shift: e.schedule_shift || "MWF – 12-3PM", 
        lastAccessLog: e.last_access_log 
          ? new Date(e.last_access_log).toLocaleString() 
          : "No login history",
        imageUrl: e.profileImage_URL || undefined,
        phone: e.phone_number || "",
        isDisabled: Boolean(e.is_account_disabled),
      }));
      setEmployees(mappedData);
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  /**
   * Upload the photo picked in the modal, after the employee row is saved —
   * a new hire has no id to attach it to before then. A failure here is
   * reported but does not undo the save: the details are in, and the photo
   * can be picked again.
   */
  const uploadPickedPhoto = async (employeeId: string, photoFile: File | null | undefined) => {
    if (!photoFile) return true;
    const formData = new FormData();
    formData.append("file", photoFile);
    const result = await setEmployeePhoto(employeeId, formData);
    if (result.error !== null) {
      showToast(`Saved, but the photo didn't upload: ${result.error}`, "error");
      return false;
    }
    return true;
  };

  // Execute Backend Mutations
  const handleAddConfirm = async () => {
    if (!employeeToAdd) return;
    setIsProcessing(true);

    const dbRole = normalizeEmployeeRoleLabel(employeeToAdd.role ?? "Staff") ?? "STAFF";

    const result = await createEmployee({
      firstName: employeeToAdd.firstName,
      lastName: employeeToAdd.lastName,
      email: employeeToAdd.email,
      password: employeeToAdd.password,
      role: dbRole as any,
      scheduleShift: employeeToAdd.shift ?? null,
      phone: employeeToAdd.phone ?? "",
    });

    if (result.error) {
      showToast(`Failed to add employee: ${result.error}`, "error");
      // Back to the form, with each rejected field marked.
      setModalFieldErrors(result.fieldErrors ?? null);
      setEmployeeToAdd(null);
    } else {
      setModalFieldErrors(null);
      const photoSaved = result.data
        ? await uploadPickedPhoto(result.data.employee_id, employeeToAdd.photoFile)
        : true;
      if (photoSaved) showToast("Employee added successfully.", "success");
      await loadEmployees(); // Refresh the list from the DB
      setEmployeeToAdd(null);
      setIsAddModalOpen(false);
    }
    setIsProcessing(false);
  };

  const handleEditConfirm = async () => {
    if (!employeeToEdit || !selectedEmployee) return;
    setIsProcessing(true);

    const dbRole = normalizeEmployeeRoleLabel(employeeToEdit.role ?? "Staff") ?? "STAFF";

    const result = await updateEmployeeDetails(selectedEmployee.id, {
      firstName: employeeToEdit.firstName,
      lastName: employeeToEdit.lastName,
      email: employeeToEdit.email,
      role: dbRole,
      shift: employeeToEdit.shift,
      password: employeeToEdit.password,
      phone: employeeToEdit.phone,
      isAccountDisabled: employeeToEdit.isAccountDisabled,
    });

    if (result.error) {
      showToast(`Failed to update employee: ${result.error}`, "error");
      setModalFieldErrors(result.fieldErrors ?? null);
      setEmployeeToEdit(null);
    } else {
      setModalFieldErrors(null);
      const photoSaved = await uploadPickedPhoto(selectedEmployee.id, employeeToEdit.photoFile);
      if (photoSaved) showToast("Employee details updated successfully.", "success");
      await loadEmployees();
      setEmployeeToEdit(null);
      setSelectedEmployee(null);
      setIsAddModalOpen(false);
    }
    setIsProcessing(false);
  };

  // Derive filtered and sorted employees client-side
  let filteredEmployees = [...employees];
  
  if (debouncedSearchQuery) {
    const q = debouncedSearchQuery.toLowerCase();
    filteredEmployees = filteredEmployees.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.email.toLowerCase().includes(q) || 
      e.contact.includes(q)
    );
  }

  if (roleFilter !== "All Roles") {
    // Exact match on the canonical role, so "Manager" shows managers and
    // nothing else (no fallback-to-STAFF, no raw-string comparison).
    const filterMapped = resolveEmployeeRole(roleFilter);
    filteredEmployees = filteredEmployees.filter((e) => e.roleKey === filterMapped);
  }

  if (statusFilter !== "all") {
    filteredEmployees = filteredEmployees.filter((e) => (statusFilter === "disabled") === Boolean(e.isDisabled));
  }

  // Most recently signed in first — who has actually been working lately.
  if (recentFirst) {
    filteredEmployees.sort(
      (a, b) => (b.lastAccessLog ? Date.parse(b.lastAccessLog) : 0) - (a.lastAccessLog ? Date.parse(a.lastAccessLog) : 0),
    );
  } else if (nameSort === "asc") {
    filteredEmployees.sort((a, b) => a.name.localeCompare(b.name));
  } else if (nameSort === "desc") {
    filteredEmployees.sort((a, b) => b.name.localeCompare(a.name));
  }

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));

  // Ensure current page is valid after filtering
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="flex flex-col h-full gap-4 md:gap-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-[10px] md:mb-8 gap-4 md:gap-4">
        <h1 className="font-display text-2xl md:text-3xl leading-normal text-foreground">
          EMPLOYEE MANAGEMENT
        </h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-[20px]">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-placeholder" />
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-[280px] h-[45px] pl-11 pr-4 rounded-md border border-field-border bg-white text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-placeholder"
            />
          </div>
          
          {/* Role Filter */}
          <div className="relative w-full sm:w-auto">
            <span {...roleFilterMenu.labelProps} className="sr-only">
              Filter by role
            </span>
            <Button variant="unstyled"
              {...roleFilterMenu.triggerProps}
              className="w-full sm:w-auto h-[45px] px-4 rounded-md border border-field-border bg-white text-sm leading-5 flex items-center justify-between sm:justify-start gap-2 hover:bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <div className="flex items-center gap-2">
                <Filter aria-hidden="true" className="w-[16px] h-[16px] text-placeholder" />
                <span className="text-foreground font-medium min-w-[70px] text-left">{roleFilter}</span>
              </div>
              <ChevronDown aria-hidden="true" className="w-4 h-4 text-placeholder" />
            </Button>

            {roleFilterOpen && (
              <div {...roleFilterMenu.listProps} className="absolute left-0 sm:left-auto sm:right-0 top-[calc(100%+8px)] z-20 w-full sm:w-[160px] bg-white border border-field-border rounded-md p-1 shadow-[0_8px_20px_rgba(26,18,16,0.08)]">
                {ROLES.map(role => (
                  <Button variant="unstyled"
                    key={role}
                    {...roleFilterMenu.optionProps(roleFilter === role)}
                    onClick={() => {
                      setRoleFilter(role);
                      roleFilterMenu.close();
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${DROPDOWN_FOCUS_RING} ${
                      roleFilter === role ? "bg-highlight font-bold text-primary" : "text-foreground hover:bg-background"
                    }`}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <select
            aria-label="Filter by account status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "disabled");
              setCurrentPage(1);
            }}
            className="h-[42px] w-full sm:w-auto rounded-md border border-field-border bg-white px-3 text-sm text-foreground"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-foreground whitespace-nowrap">
            <input type="checkbox" checked={recentFirst} onChange={(e) => setRecentFirst(e.target.checked)} />
            Recently active first
          </label>
          <Tooltip
            content="Create a new staff or manager account"
            shortcut={SHORTCUTS.newItem.combo}
            side="bottom"
            className="w-full sm:w-auto"
          >
          <Button variant="unstyled"
            type="button"
            className="w-full sm:w-auto bg-accent text-white font-bold text-sm px-[18px] py-[11px] rounded-md hover:bg-accent/90 transition-colors whitespace-nowrap"
            onClick={() => {
              setModalFieldErrors(null);
              setIsAddModalOpen(true);
            }}
          >
            + Add Employee
          </Button>
          </Tooltip>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-md overflow-hidden flex flex-col min-h-0 border border-track shadow-[0_2px_10px_rgba(26,18,16,0.02)]">
          {/* Table Head - Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr] px-8 py-5 border-b border-track bg-track text-xs font-bold text-muted-foreground uppercase tracking-[1px]">
            <SortableHeader 
              label="Name" 
              currentSort={nameSort} 
              onSortChange={setNameSort} 
            />
            <div className="flex items-center">Email</div>
            <div className="flex items-center">Role</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col md:grid md:grid-cols-[1.5fr_1.5fr_1fr] px-5 md:px-8 py-4 md:py-5 border-b border-track gap-2 md:gap-0 items-start md:items-center">
                    <div className="h-[18px] w-[140px] bg-track rounded-full animate-pulse" />
                    <div className="h-[18px] w-[180px] bg-track rounded-full animate-pulse" />
                    <div className="hidden md:block h-[18px] w-[100px] bg-track rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : paginatedEmployees.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No employees found.
              </div>
            ) : (
              paginatedEmployees.map((employee, index) => (
                <div 
                  key={employee.id}
                  className={`flex flex-col md:grid md:grid-cols-[1.5fr_1.5fr_1fr] px-5 md:px-8 py-4 md:py-5 cursor-pointer transition-colors hover:bg-background gap-1 md:gap-0 ${
                    index !== paginatedEmployees.length - 1 ? "border-b border-track" : ""
                  }`}
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="font-bold text-foreground flex items-center justify-between text-base">
                    {employee.name}
                    <span className="md:hidden text-xs font-bold tracking-wide uppercase bg-highlight text-primary px-2 py-1 rounded-md">{employee.role}</span>
                  </div>
                  <div className="text-muted-foreground md:font-bold md:text-foreground flex items-center text-sm md:text-base">{employee.email}</div>
                  <div className="hidden md:flex font-bold text-foreground items-center text-base">{employee.role}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 md:mt-8 mb-4 flex justify-center md:justify-end">
          <ManagePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <EmployeeModal 
        isOpen={isAddModalOpen || selectedEmployee !== null} 
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedEmployee(null);
          setModalFieldErrors(null);
        }}
        employee={selectedEmployee}
        serverErrors={modalFieldErrors}
        onSave={(data) => {
          if (selectedEmployee) {
            setEmployeeToEdit(data);
          } else {
            setEmployeeToAdd(data);
          }
        }}
      />

      {/* Add Confirmation Dialog */}
      <Dialog
        open={employeeToAdd !== null}
        onClose={() => setEmployeeToAdd(null)}
        title="Add New Employee?"
        description={`Are you sure you want to add ${employeeToAdd?.name} as a new ${employeeToAdd?.role}?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEmployeeToAdd(null)} disabled={isProcessing}>Cancel</Button>
            <Button 
              variant="primary"
              onClick={handleAddConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? "Adding..." : "Add Employee"}
            </Button>
          </>
        }
      />

      {/* Edit Confirmation Dialog */}
      <Dialog
        open={employeeToEdit !== null}
        onClose={() => setEmployeeToEdit(null)}
        title="Save changes?"
        description={`Are you sure you want to update ${employeeToEdit?.name}'s details?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEmployeeToEdit(null)} disabled={isProcessing}>Cancel</Button>
            <Button 
              variant="primary"
              onClick={handleEditConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      />
    </div>
  );
}