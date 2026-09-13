"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, Filter } from "lucide-react";
import { ManagePagination } from "@/components/manage/manage-pagination";
import { EmployeeModal } from "@/components/manage/employee/employee-modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type EmployeeData = {
  id: string;
  name: string;
  email: string;
  contact: string;
  role: string;
};

const dummyEmployees: EmployeeData[] = [
  { id: "1", name: "ROBERT DOWNEY JR.", email: "rdj@gmail.com", contact: "+6309872738456", role: "Manager" },
  { id: "2", name: "CHRIS EVANS", email: "cevans@gmail.com", contact: "+6309872738456", role: "Cashier" },
  { id: "3", name: "SCARLETT JOHANSSON", email: "scarlett@gmail.com", contact: "+6309872738456", role: "Cook" },
  { id: "4", name: "MARK RUFFALO", email: "markr@gmail.com", contact: "+6309872738456", role: "Delivery" },
  { id: "5", name: "CHRIS HEMSWORTH", email: "thor@gmail.com", contact: "+6309872738456", role: "Server" },
  { id: "6", name: "JEREMY RENNER", email: "hawkeye@gmail.com", contact: "+6309872738456", role: "Server" },
  { id: "7", name: "TOM HOLLAND", email: "spidey@gmail.com", contact: "+6309872738456", role: "Delivery" },
  { id: "8", name: "PAUL RUDD", email: "antman@gmail.com", contact: "+6309872738456", role: "Server" },
  { id: "9", name: "CHADWICK BOSEMAN", email: "tchalla@gmail.com", contact: "+6309872738456", role: "Manager" },
  { id: "10", name: "BENEDICT CUMBERBATCH", email: "strange@gmail.com", contact: "+6309872738456", role: "Cook" },
];

const ROLES = ["All Roles", "Manager", "Server", "Cook", "Cashier", "Delivery"];

// TODO (Backend): Integration Checklist for Employee Management
// 1. Data Fetching: Replace `dummyEmployees` with real Supabase queries.
// 2. Search & Sort: Wire up `searchQuery` and `nameSort` to database queries instead of client-side arrays.
// 3. Pagination: Modify the `ManagePagination` to fetch offset/limit chunks from the server.
// 4. Mutations: Implement the "Add Employee" modal and wire it to the backend endpoint.

/**
 * ManageEmployeePage
 * 
 * Added a fully responsive employee management table with:
 * - Search filtering by name, email, and contact.
 * - Interactive column sorting on Name (Asc/Desc/None).
 * - Pagination controls via ManagePagination.
 * - "+ Add Employee" stub button for adding new staff.
 */
export default function ManageEmployeePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [nameSort, setNameSort] = useState<"asc" | "desc" | "none">("none");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeData | null>(null);
  const [employeeToAdd, setEmployeeToAdd] = useState<any | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = useState<any | null>(null);

  // Derive filtered and sorted employees
  let filteredEmployees = [...dummyEmployees];
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredEmployees = filteredEmployees.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.email.toLowerCase().includes(q) || 
      e.contact.includes(q)
    );
  }

  if (roleFilter !== "All Roles") {
    filteredEmployees = filteredEmployees.filter(e => e.role === roleFilter);
  }

  if (nameSort === "asc") {
    filteredEmployees.sort((a, b) => a.name.localeCompare(b.name));
  } else if (nameSort === "desc") {
    filteredEmployees.sort((a, b) => b.name.localeCompare(a.name));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-[10px] mb-8 gap-4">
        <h1 className="font-display text-[30px] leading-normal text-[#1a1210]">
          EMPLOYEE MANAGEMENT
        </h1>
        <div className="flex items-center gap-[20px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#A2938A]" />
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[280px] h-[45px] pl-11 pr-4 rounded-xl border border-[#DDCDB8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
            />
          </div>
          
          {/* Role Filter */}
          <div className="relative">
            <button
              onClick={() => setRoleFilterOpen(!roleFilterOpen)}
              className="h-[45px] px-4 rounded-xl border border-[#DDCDB8] bg-white text-sm flex items-center gap-2 hover:bg-[#FAF5EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
            >
              <Filter className="w-[16px] h-[16px] text-[#A2938A]" />
              <span className="text-[#1A1210] font-medium min-w-[70px] text-left">{roleFilter}</span>
              <ChevronDown className="w-4 h-4 text-[#A2938A]" />
            </button>
            
            {roleFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRoleFilterOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[160px] bg-white border border-[#DDCDB8] rounded-xl p-1 shadow-[0_8px_20px_rgba(26,18,16,0.08)]">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        setRoleFilter(role);
                        setRoleFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                        roleFilter === role ? "bg-[#F6E9D9] font-bold text-[#8C1C13]" : "text-[#1A1210] hover:bg-[#FAF5EB]"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button 
            className="bg-[#E8541F] text-white font-bold text-[13px] px-[18px] py-[11px] rounded-[10px] hover:bg-[#E8541F]/90 transition-colors whitespace-nowrap"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 flex flex-col min-h-0">
        
        <div className="bg-white rounded-[12px] overflow-hidden flex flex-col min-h-0 border border-[#F0E6D8] shadow-[0_2px_10px_rgba(26,18,16,0.02)]">
          {/* Table Head */}
          <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] px-8 py-5 border-b border-[#F0E6D8] bg-[#EAE0D5] text-[12px] font-bold text-[#7A6A60] uppercase tracking-[1px]">
            <button 
              className="flex items-center gap-2 hover:text-[#4A3D36] transition-colors focus:outline-none w-fit"
              onClick={() => setNameSort(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none')}
            >
              Name
              {nameSort === 'asc' ? <ChevronUp className="h-[14px] w-[14px]" /> : nameSort === 'desc' ? <ChevronDown className="h-[14px] w-[14px]" /> : <ChevronsUpDown className="h-[14px] w-[14px]" />}
            </button>
            <div className="flex items-center">Email</div>
            <div className="flex items-center">Contact</div>
            <div className="flex items-center">Role</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-[#7A6A60]">
                No employees found.
              </div>
            ) : (
              filteredEmployees.map((employee, index) => (
                <div 
                  key={employee.id}
                  className={`grid grid-cols-[1.5fr_1.5fr_1fr_1fr] px-8 py-5 cursor-pointer transition-colors hover:bg-[#FAF7F0] ${
                    index !== filteredEmployees.length - 1 ? "border-b border-[#F0E6D8]" : ""
                  }`}
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="font-bold text-[#1A1210] flex items-center text-[15px]">{employee.name}</div>
                  <div className="font-bold text-[#1A1210] flex items-center text-[15px]">{employee.email}</div>
                  <div className="font-bold text-[#1A1210] flex items-center text-[15px]">{employee.contact}</div>
                  <div className="font-bold text-[#1A1210] flex items-center text-[15px]">{employee.role}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-8 mb-4 flex justify-end">
          <ManagePagination 
            currentPage={currentPage}
            totalPages={3}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <EmployeeModal 
        isOpen={isAddModalOpen || selectedEmployee !== null} 
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedEmployee(null);
        }} 
        employee={selectedEmployee}
        onSave={(data) => {
          if (selectedEmployee) {
            // Edit action (requires confirmation)
            setEmployeeToEdit(data);
          } else {
            // Add action (requires confirmation)
            setEmployeeToAdd(data);
          }
        }}
        onDelete={(data) => {
          setEmployeeToDelete(data);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={employeeToDelete !== null}
        onClose={() => setEmployeeToDelete(null)}
        title="Delete Employee?"
        description={`Are you sure you want to permanently delete ${employeeToDelete?.name}? This action cannot be undone.`}
        tone="danger"
        footer={
          <>
            <Button variant="outline" onClick={() => setEmployeeToDelete(null)}>Cancel</Button>
            <Button 
              variant="confirm"
              onClick={() => {
                console.log("Deleting employee:", employeeToDelete?.id);
                setEmployeeToDelete(null);
                setSelectedEmployee(null);
              }}
            >
              Delete Employee
            </Button>
          </>
        }
      />

      {/* Add Confirmation Dialog */}
      <Dialog
        open={employeeToAdd !== null}
        onClose={() => setEmployeeToAdd(null)}
        title="Add New Employee?"
        description={`Are you sure you want to add ${employeeToAdd?.name} as a new ${employeeToAdd?.role}?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEmployeeToAdd(null)}>Cancel</Button>
            <Button 
              variant="primary"
              onClick={() => {
                console.log("Adding employee:", employeeToAdd);
                setEmployeeToAdd(null);
                setIsAddModalOpen(false);
              }}
            >
              Add Employee
            </Button>
          </>
        }
      />

      {/* Edit Confirmation Dialog */}
      <Dialog
        open={employeeToEdit !== null}
        onClose={() => setEmployeeToEdit(null)}
        title="Edit Employee?"
        description={`Are you sure you want to save changes to ${employeeToEdit?.name}'s profile?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEmployeeToEdit(null)}>Cancel</Button>
            <Button 
              variant="primary"
              onClick={() => {
                console.log("Editing employee:", employeeToEdit);
                setEmployeeToEdit(null);
                setSelectedEmployee(null);
                setIsAddModalOpen(false);
              }}
            >
              Save Changes
            </Button>
          </>
        }
      />
    </div>
  );
}
