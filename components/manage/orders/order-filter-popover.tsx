import { useState, useRef, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type OrderFilterState = {
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
  payment_method?: string;
};

interface OrderFilterPopoverProps {
  filters: OrderFilterState;
  onFilterChange: (filters: OrderFilterState) => void;
}

export function OrderFilterPopover({ filters, onFilterChange }: OrderFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<OrderFilterState>(filters);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = () => {
    const cleaned = {
      customer_name: tempFilters.customer_name?.trim() || undefined,
      customer_phone: tempFilters.customer_phone?.trim() || undefined,
      customer_id: tempFilters.customer_id?.trim() || undefined,
      payment_method: tempFilters.payment_method && tempFilters.payment_method !== "all" 
        ? tempFilters.payment_method 
        : undefined,
    };
    onFilterChange(cleaned);
    setOpen(false);
  };

  const handleClear = () => {
    setTempFilters({});
    onFilterChange({});
    setOpen(false);
  };

  const activeCount = Object.values(filters).filter(v => v !== undefined && v !== "").length;

  return (
    <div className="relative" ref={containerRef}>
      <Button 
        variant="outline" 
        onClick={() => setOpen(!open)}
        className="h-[45px] gap-2 rounded-xl border-[#DDCDB8] text-[#1a1210]"
      >
        <Filter className="h-4 w-4" />
        Filter
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8541F] text-[11px] text-white">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-[320px] rounded-xl border border-[#DDCDB8] bg-white p-4 shadow-lg z-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-[#1a1210]">Filter Orders</h4>
              {activeCount > 0 && (
                <button 
                  onClick={handleClear} 
                  className="flex items-center text-sm text-[#bf4342] hover:underline"
                >
                  <X className="h-4 w-4 mr-1" /> Clear
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#7a6a60]">Customer Name</label>
              <Input 
                value={tempFilters.customer_name || ""} 
                onChange={e => setTempFilters({ ...tempFilters, customer_name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#7a6a60]">Customer Phone</label>
              <Input 
                value={tempFilters.customer_phone || ""} 
                onChange={e => setTempFilters({ ...tempFilters, customer_phone: e.target.value })}
                placeholder="e.g. 09123456789"
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#7a6a60]">Customer ID (UUID)</label>
              <Input 
                value={tempFilters.customer_id || ""} 
                onChange={e => setTempFilters({ ...tempFilters, customer_id: e.target.value })}
                placeholder="e.g. 123e4567..."
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#7a6a60]">Payment Method</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8541F]"
                value={tempFilters.payment_method || "all"}
                onChange={e => setTempFilters({ ...tempFilters, payment_method: e.target.value })}
              >
                <option value="all">Any Method</option>
                <option value="pay_in_store">Pay in Store</option>
                <option value="wallet">Digital Wallet (GCash/Maya)</option>
              </select>
            </div>

            <Button onClick={handleApply} variant="primary" className="w-full bg-[#CD7D39] hover:bg-orange-600 text-white">
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
