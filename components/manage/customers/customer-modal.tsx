import * as React from "react";
import { DialogRoot } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  contact: string;
  customerSince: string;
  totalOrders?: number;
  totalSpent?: number;
  imageUrl?: string;
}

interface CustomerModalProps {
  customer: CustomerData | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (type: 'Ban' | 'Delete', customer: CustomerData) => void;
}

function DisplayField({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-[6px] w-full">
      <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
        {label}
      </label>
      <div className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] w-full">
        <span className="text-[#1A1210] text-[15px] leading-normal">{value}</span>
      </div>
    </div>
  );
}

export function CustomerModal({ customer, isOpen, onClose, onAction }: CustomerModalProps) {
  if (!customer) return null;

  // Extract initials (e.g., "ROBERT DOWNEY JR." -> "RD") safely
  const nameParts = customer.name.split(' ');
  const initials = nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase() || "?";

  return (
    <DialogRoot
      open={isOpen}
      onClose={onClose}
      className={cn(
        "m-auto max-w-[480px] w-[calc(100%-2rem)] md:w-full overflow-hidden rounded-[20px] border-0 shadow-[0_30px_70px_rgba(26,18,16,0.26)]",
      )}
    >
      <div className="flex flex-col w-full bg-[#FBF6EC] max-h-[90vh]">
        
        {/* Avatar Section */}
        <div className="flex justify-center pt-[30px] pb-4 shrink-0">
          {customer.imageUrl ? (
            <div className="size-[140px] rounded-full overflow-hidden border-4 border-[#8C1C13]">
              <img 
                src={customer.imageUrl} 
                alt={customer.name}
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
        <div className="flex flex-col gap-[14px] px-[26px] pb-[26px] flex-1 overflow-y-auto">
          <DisplayField label="Customer Name" value={customer.name} />
          {/* Hardcoding Date of Birth placeholder to match design */}
          <DisplayField label="Date of Birth" value={"Sep 9, 2006"} />
          <DisplayField label="Mobile Number" value={customer.contact} />
          <DisplayField label="Email Address" value={customer.email} />
          <DisplayField label="Member Since" value={customer.customerSince} />
          
          {/* Actions */}
          <div className="flex gap-[10px] pt-3 shrink-0">
            <button 
              onClick={onClose}
              className="flex-1 border border-[#DDCDB8] rounded-[13px] py-[10px] font-bold text-[#7A6A60] text-[14px] hover:bg-black/5 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={() => onAction?.('Delete', customer)}
              className="flex-1 bg-[#E8541F] rounded-[13px] py-[10px] font-bold text-white text-[14px] hover:bg-[#E8541F]/90 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </DialogRoot>
  );
}