"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, Loader2 } from "lucide-react";
import { ManagePagination } from "@/components/manage/manage-pagination";
import { CustomerModal, CustomerData } from "@/components/manage/customers/customer-modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { getAllCustomers, deleteCustomer } from "@/lib/actions/admin";

// 1. Wrapper component to provide the Toast context
export default function ManageCustomersPage() {
  return (
    <ToastProvider>
      <ManageCustomersInner />
    </ToastProvider>
  );
}

// 2. The inner component that safely uses the hook
function ManageCustomersInner() {
  const showToast = useToast();
  
  // Real Data State
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // UI State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(null);
  const [nameSort, setNameSort] = useState<"asc" | "desc" | "none">("none");

  // Fetch Customers on Mount
  useEffect(() => {
    async function loadCustomers() {
      setIsLoading(true);
      const result = await getAllCustomers();
      
      if (result.error) {
        showToast(`Failed to load customers: ${result.error}`);
      } else if (result.data) {
        // Safely map backend data to our UI schema
        const mappedData: CustomerData[] = result.data.map((c: any) => ({
          id: c.customer_id,
          name: c.name || "Unknown User",
          email: c.email || "No email",
          contact: c.phone_number || "No contact",
          // Fallback to "Unknown" if created_at doesn't exist on the table yet
          customerSince: c.created_at ? new Date(c.created_at).toLocaleDateString() : "Unknown",
        }));
        setCustomers(mappedData);
      }
      setIsLoading(false);
    }
    
    loadCustomers();
  }, [showToast]);

  // Execute Backend Deletion
  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    
    const result = await deleteCustomer(customerToDelete.id);
    
    if (result.error) {
      showToast(`Failed to delete customer: ${result.error}`);
    } else {
      showToast("Customer account deleted successfully.");
      // Remove from local state instantly to update the UI
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      setCustomerToDelete(null);
      setSelectedCustomer(null);
    }
    
    setIsDeleting(false);
  };

  // Derive filtered and sorted customers client-side
  let filteredCustomers = [...customers];

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
    <div className="flex flex-col h-full gap-4 md:gap-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-[10px] md:mb-8 gap-4 md:gap-0">
        <h1 className="font-display text-[24px] md:text-[30px] leading-normal text-[#1a1210]">
          CUSTOMER MANAGEMENT
        </h1>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#A2938A]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-[442px] h-[45px] pl-11 pr-4 rounded-xl border border-[#DDCDB8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 flex flex-col min-h-0">

        <div className="bg-white rounded-[12px] overflow-hidden flex flex-col min-h-0 border border-[#F0E6D8] shadow-[0_2px_10px_rgba(26,18,16,0.02)]">
          {/* Table Head - Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_1fr] px-8 py-5 border-b border-[#F0E6D8] bg-[#EAE0D5] text-[12px] font-bold text-[#7A6A60] uppercase tracking-[1px]">
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
            {isLoading ? (
              <div className="flex items-center justify-center p-12 text-[#7A6A60]">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading customers...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-[#7A6A60]">
                No customers found.
              </div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`flex flex-col md:grid md:grid-cols-[1.5fr_1.5fr_1fr_1fr] px-5 md:px-8 py-4 md:py-5 cursor-pointer transition-colors hover:bg-[#FAF7F0] gap-1 md:gap-0 ${index !== filteredCustomers.length - 1 ? "border-b border-[#F0E6D8]" : ""
                    }`}
                >
                  <div className="font-bold text-[#1A1210] flex items-center justify-between text-[15px]">
                    {customer.name}
                    <span className="md:hidden text-[11px] font-bold tracking-wide uppercase bg-[#f6e9d9] text-[#8c1c13] px-2 py-1 rounded-md">Since {customer.customerSince}</span>
                  </div>
                  <div className="text-[#7A6A60] md:font-bold md:text-[#1A1210] flex items-center text-[13px] md:text-[15px]">{customer.email}</div>
                  <div className="text-[#7A6A60] md:font-bold md:text-[#1A1210] flex items-center text-[13px] md:text-[15px]">{customer.contact}</div>
                  <div className="hidden md:flex font-bold text-[#1A1210] items-center text-[15px]">{customer.customerSince}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 md:mt-8 mb-4 flex justify-center md:justify-end">
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
            <Button variant="outline" onClick={() => setCustomerToDelete(null)} disabled={isDeleting}>Cancel</Button>
            <Button
              variant="confirm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </>
        }
      />
    </div>
  );
}