import * as React from "react";
import { DialogRoot } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDateOfBirth } from "@/lib/profile/identity";
import { CustomerOrderHistory } from "./customer-order-history";

import { Button } from "@/components/ui/button";
export interface CustomerData {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
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
      <label className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
        {label}
      </label>
      <div className="bg-white border border-field-border rounded-md p-[14px] w-full">
        <span className="text-foreground text-base leading-normal">{value}</span>
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
        "m-auto max-w-[480px] w-[calc(100%-2rem)] md:w-full overflow-hidden rounded-lg border-0 shadow-[0_30px_70px_rgba(26,18,16,0.26)]",
      )}
    >
      <div className="flex flex-col w-full bg-background max-h-[90vh]">
        
        {/* Avatar Section */}
        <div className="flex justify-center pt-[30px] pb-4 shrink-0">
          {customer.imageUrl ? (
            <div className="size-[140px] rounded-full overflow-hidden border-4 border-primary">
              <img 
                src={customer.imageUrl} 
                alt={customer.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="bg-primary flex items-center justify-center rounded-full size-[140px]">
              <span className="font-display text-background text-6xl leading-none mt-2">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-[14px] px-[26px] pb-[26px] flex-1 overflow-y-auto">
          <div className="flex flex-col gap-[14px] md:flex-row">
            <DisplayField label="First Name" value={customer.firstName || "—"} />
            <DisplayField label="Last Name" value={customer.lastName || "—"} />
          </div>
          <DisplayField
            label="Date of Birth"
            value={formatDateOfBirth(customer.dateOfBirth) || "Not provided"}
          />
          <DisplayField label="Mobile Number" value={customer.contact} />
          <DisplayField label="Email Address" value={customer.email} />
          <DisplayField label="Member Since" value={customer.customerSince} />
          
          <CustomerOrderHistory customerId={customer.id} />

          {/* Actions */}
          <div className="flex gap-[10px] pt-3 shrink-0">
            <Button variant="unstyled" 
              onClick={onClose}
              className="flex-1 border border-field-border rounded-md py-[10px] font-bold text-muted-foreground text-sm hover:bg-black/5 transition-colors"
            >
              Back
            </Button>
            <Button variant="unstyled" 
              onClick={() => onAction?.('Delete', customer)}
              className="flex-1 bg-accent rounded-md py-[10px] font-bold text-white text-sm hover:bg-accent/90 transition-colors"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </DialogRoot>
  );
}