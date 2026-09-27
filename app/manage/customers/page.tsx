"use client";

import { formatMobileNumber } from "@/lib/validation/phone";
import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { ManagePagination } from "@/components/manage/manage-pagination";
import { SortableHeader } from "@/components/manage/sortable-header";
import { CustomerModal, type CustomerData } from "@/components/manage/customers/customer-modal";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { getCustomersPaginated, deleteCustomer, type CustomerStats } from "@/lib/actions/admin";
import { CustomerFilterPopover } from "@/components/manage/customers/customer-filter-popover";
import { activeCustomerFilterCount, type CustomerFilters } from "@/lib/validation/customer-filters";

// Extend CustomerData to include lifetime stats for the table display
export type EnhancedCustomerData = CustomerData & {
  totalOrders: number;
  totalSpent: number;
};

/** "2026-09-01" → "Sep 1, 2026". */
function formatDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
  const [customers, setCustomers] = useState<EnhancedCustomerData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // UI State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCustomer, setSelectedCustomer] = useState<EnhancedCustomerData | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<EnhancedCustomerData | null>(null);
  
  // Sorting State
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Advanced filters: period for the totals, minimums, joined range, activity.
  const [filters, setFilters] = useState<CustomerFilters>({});
  const hasPeriod = !!(filters.from || filters.to);

  const handleSortChange = (column: string, direction: "asc" | "desc" | "none") => {
    if (direction === "none") {
      setSortColumn("created_at");
      setSortDirection("desc");
    } else {
      setSortColumn(column);
      setSortDirection(direction);
    }
    setCurrentPage(1);
  };

  // Fetch Customers
  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    const result = await getCustomersPaginated({
      page: currentPage,
      pageSize,
      search: debouncedSearchQuery,
      sortColumn,
      sortDirection,
      filters,
    });

    if (result.error) {
      showToast(`Failed to load customers: ${result.error}`, "error");
    } else if (result.data) {
      const mappedData = result.data.customers.map((c: CustomerStats) => ({
        id: c.customer_id,
        name: c.name || "Unknown User",
        firstName: c.first_name || "",
        lastName: c.last_name || "",
        dateOfBirth: c.date_of_birth ?? null,
        email: c.email || "No email",
        contact: formatMobileNumber(c.phone_number || "") || "No contact",
        customerSince: c.created_at ? new Date(c.created_at).toLocaleDateString() : "Unknown",
        imageUrl: c.profileImage_URL || undefined,
        totalOrders: c.total_orders,
        totalSpent: c.total_spent,
      }));
      setCustomers(mappedData);
      setTotalCount(result.data.totalCount);
    }
    setIsLoading(false);
  }, [currentPage, pageSize, debouncedSearchQuery, sortColumn, sortDirection, filters, showToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Execute Backend Deletion
  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    
    const result = await deleteCustomer(customerToDelete.id);
    
    if (result.error) {
      showToast(`Failed to delete customer: ${result.error}`, "error");
    } else {
      showToast("Customer account deleted successfully.", "success");
      setCustomerToDelete(null);
      setSelectedCustomer(null);
      loadCustomers(); // Reload page
    }
    
    setIsDeleting(false);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex flex-col h-full gap-4 md:gap-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-[10px] md:mb-8 gap-4 md:gap-0">
        <h1 className="font-display text-2xl md:text-3xl leading-normal text-foreground">
          CUSTOMER MANAGEMENT
        </h1>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-placeholder" />
            <input
              type="text"
              placeholder="Search name, email or phone..."
              aria-label="Search customers by name, email or phone"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-[360px] h-[45px] pl-11 pr-4 rounded-md border border-field-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-placeholder"
            />
          </div>
          <CustomerFilterPopover
            filters={filters}
            onFilterChange={(next) => {
              setFilters(next);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* What Orders / Spent mean right now, and what is filtered */}
      {activeCustomerFilterCount(filters) > 0 && (
        <p className="-mt-2 md:-mt-5 mb-3 text-sm text-muted-foreground">
          {hasPeriod
            ? `Orders and Spent: completed orders ${
                filters.from && filters.to
                  ? `from ${formatDay(filters.from)} to ${formatDay(filters.to)}`
                  : filters.from
                  ? `since ${formatDay(filters.from)}`
                  : `up to ${formatDay(filters.to!)}`
              }.`
            : "Orders and Spent: lifetime totals."}
          {" "}
          {totalCount} customer{totalCount === 1 ? "" : "s"} match.
        </p>
      )}

      {/* Table Container */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-md overflow-hidden flex flex-col min-h-0 border border-track shadow-[0_2px_10px_rgba(26,18,16,0.02)]">
          {/* Table Head - Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_0.8fr] px-8 py-5 border-b border-track bg-track text-xs font-bold text-muted-foreground uppercase tracking-[1px]">
            <SortableHeader 
              label="Name" 
              currentSort={sortColumn === "name" ? sortDirection : "none"} 
              onSortChange={(dir) => handleSortChange("name", dir)} 
            />
            <div className="flex items-center">Email</div>
            <div className="flex items-center">Contact</div>
            <SortableHeader 
              label="Since" 
              currentSort={sortColumn === "created_at" ? sortDirection : "none"} 
              onSortChange={(dir) => handleSortChange("created_at", dir)} 
            />
            <SortableHeader 
              label="Orders" 
              currentSort={sortColumn === "total_orders" ? sortDirection : "none"} 
              onSortChange={(dir) => handleSortChange("total_orders", dir)} 
            />
            <SortableHeader 
              label="Spent" 
              currentSort={sortColumn === "total_spent" ? sortDirection : "none"} 
              onSortChange={(dir) => handleSortChange("total_spent", dir)} 
            />
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col md:grid md:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_0.8fr] px-5 md:px-8 py-4 md:py-5 border-b border-track gap-2 md:gap-0 items-start md:items-center">
                    <div className="h-[18px] w-[140px] bg-track rounded-full animate-pulse" />
                    <div className="h-[18px] w-[180px] bg-track rounded-full animate-pulse" />
                    <div className="h-[18px] w-[120px] bg-track rounded-full animate-pulse" />
                    <div className="hidden md:block h-[18px] w-[80px] bg-track rounded-full animate-pulse" />
                    <div className="hidden md:block h-[18px] w-[60px] bg-track rounded-full animate-pulse" />
                    <div className="hidden md:block h-[18px] w-[80px] bg-track rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {activeCustomerFilterCount(filters) > 0
                  ? "No customers match these filters."
                  : "No customers found."}
              </div>
            ) : (
              customers.map((customer, index) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`flex flex-col md:grid md:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_0.8fr] px-5 md:px-8 py-4 md:py-5 cursor-pointer transition-colors hover:bg-background gap-1 md:gap-0 ${index !== customers.length - 1 ? "border-b border-track" : ""}`}
                >
                  <div className="font-bold text-foreground flex items-center justify-between text-base">
                    {customer.name}
                    <span className="md:hidden text-xs font-bold tracking-wide uppercase bg-highlight text-primary px-2 py-1 rounded-md">Since {customer.customerSince}</span>
                  </div>
                  <div className="text-muted-foreground md:font-bold md:text-foreground flex items-center text-sm md:text-base">{customer.email}</div>
                  <div className="text-muted-foreground md:font-bold md:text-foreground flex items-center text-sm md:text-base">{customer.contact}</div>
                  <div className="hidden md:flex font-bold text-foreground items-center text-base">{customer.customerSince}</div>
                  <div className="hidden md:flex font-bold text-foreground items-center text-base">{customer.totalOrders}</div>
                  <div className="hidden md:flex font-bold text-foreground items-center text-base">₱{Number(customer.totalSpent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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

      {/* Customer Detail Modal */}
      <CustomerModal
        isOpen={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onAction={(type, customer) => {
          if (type === "Delete") {
            setCustomerToDelete(customer as EnhancedCustomerData);
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
