"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { ManagePagination } from "@/components/manage/manage-pagination";
import { CustomerModal, CustomerData } from "@/components/manage/customers/customer-modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const dummyCustomers: CustomerData[] = [
  { id: "1", name: "ALICE SMITH", email: "alice.smith@gmail.com", contact: "+639171234567", customerSince: "Jan 12, 2024", totalOrders: 14, totalSpent: 7500.00 },
  { id: "2", name: "ZENDAYA COLEMAN", email: "zendaya@gmail.com", contact: "+639171234568", customerSince: "Feb 14, 2024", totalOrders: 3, totalSpent: 1200.00 },
  { id: "3", name: "CHRIS EVANS", email: "cevans@gmail.com", contact: "+639171234569", customerSince: "Mar 15, 2024", totalOrders: 5, totalSpent: 2450.00 },
  { id: "4", name: "ROBERT DOWNEY JR.", email: "rdj@gmail.com", contact: "+6309872738456", customerSince: "Aug 15, 2025" },
  { id: "5", name: "SCARLETT JOHANSSON", email: "scarlett@gmail.com", contact: "+639171234571", customerSince: "Apr 20, 2025" },
  { id: "6", name: "MARK RUFFALO", email: "markr@gmail.com", contact: "+639171234572", customerSince: "May 21, 2025" },
  { id: "7", name: "CHRIS HEMSWORTH", email: "thor@gmail.com", contact: "+639171234573", customerSince: "Jun 22, 2025" },
  { id: "8", name: "JEREMY RENNER", email: "hawkeye@gmail.com", contact: "+639171234574", customerSince: "Jul 23, 2025" },
  { id: "9", name: "TOM HOLLAND", email: "spidey@gmail.com", contact: "+639171234575", customerSince: "Aug 24, 2025" },
  { id: "10", name: "PAUL RUDD", email: "antman@gmail.com", contact: "+639171234576", customerSince: "Sep 25, 2025" },
];

// TODO (Backend): Integration Checklist for Customer Management
// 1. Data Fetching: Replace `dummyCustomers` with real Supabase queries.
// 2. Search & Sort: Wire up `searchQuery` and `nameSort` to database queries (e.g., ilike and order) instead of client-side arrays.
// 3. Pagination: Modify the `ManagePagination` to fetch offset/limit chunks from the server.
// 4. Mutations: Wire the Dialog "Delete Account" action to the backend deletion endpoint.

/**
 * ManageCustomersPage
 * 
 * Added a fully responsive customer management table with:
 * - Search filtering by name, email, and contact.
 * - Interactive column sorting on Name (Asc/Desc/None).
 * - Pagination controls via ManagePagination.
 * - Integration with CustomerModal for viewing details and triggering account deletion.
 * - Deletion Confirmation using the shared Dialog component with danger tone.
 */
export default function ManageCustomersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCount, setShowCount] = useState(10);
  
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(null);
  const [nameSort, setNameSort] = useState<"asc" | "desc" | "none">("none");

  // Derive filtered and sorted customers
  let filteredCustomers = [...dummyCustomers];
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredCustomers = filteredCustomers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q) || 
      c.contact.includes(q)
    );
  }

  if (nameSort === "asc") {
    filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
  } else if (nameSort === "desc") {
    filteredCustomers.sort((a, b) => b.name.localeCompare(a.name));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-[10px] mb-8">
        <h1 className="font-display text-[30px] leading-normal text-[#1a1210]">
          CUSTOMER MANAGEMENT
        </h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#A2938A]" />
          <input 
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[442px] h-[45px] pl-11 pr-4 rounded-xl border border-[#DDCDB8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
          />
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
            <div className="flex items-center">Customer Since</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-[#7A6A60]">
                No customers found.
              </div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <div 
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`grid grid-cols-[1.5fr_1.5fr_1fr_1fr] px-8 py-5 cursor-pointer transition-colors hover:bg-[#FAF7F0] ${
                    index !== filteredCustomers.length - 1 ? "border-b border-[#F0E6D8]" : ""
                  }`}
                >
                  <div className="font-bold text-[#1A1210] flex items-center text-[15px]">{customer.name}</div>
                  <div className="font-bold text-[#1A1210] flex items-center text-[15px]">{customer.email}</div>
                  <div className="font-bold text-[#1A1210] flex items-center text-[15px]">{customer.contact}</div>
                  <div className="font-bold text-[#1A1210] flex items-center text-[15px]">{customer.customerSince}</div>
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

      {/* Customer Detail Modal */}
      <CustomerModal 
        isOpen={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onAction={(type, customer) => {
          if (type === "Delete") {
            setCustomerToDelete(customer);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={customerToDelete !== null}
        onClose={() => setCustomerToDelete(null)}
        title="Delete Customer Account?"
        description={`Are you sure you want to permanently delete ${customerToDelete?.name}'s account? This action cannot be undone.`}
        tone="danger"
        footer={
          <>
            <Button variant="outline" onClick={() => setCustomerToDelete(null)}>Cancel</Button>
            <Button 
              variant="confirm"
              onClick={() => {
                console.log("Deleting customer:", customerToDelete?.id);
                setCustomerToDelete(null);
                setSelectedCustomer(null);
              }}
            >
              Delete Account
            </Button>
          </>
        }
      />
    </div>
  );
}
