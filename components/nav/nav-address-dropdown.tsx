"use client";

import * as React from "react";
import { setActiveAddress } from "@/lib/actions/address";
import type { CustomerAddress } from "@/lib/profile/customer-profile";
import { cn } from "@/lib/utils";
import { DROPDOWN_FOCUS_RING, useDropdown } from "@/lib/hooks/use-dropdown";

export function NavAddressDropdown({ 
  addresses, 
  activeAddressId 
}: { 
  addresses: CustomerAddress[];
  activeAddressId: string | null;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menu = useDropdown({ open: isOpen, onOpenChange: setIsOpen });
  const activeAddress = addresses.find(a => a.id === activeAddressId) ?? addresses[0];

  if (!activeAddress) return null;

  return (
    <div className="relative">
      <button
        {...menu.triggerProps}
        // Named by its own text — "Deliver to <address>" — so no separate label.
        aria-labelledby={undefined}
        className="flex flex-col items-end gap-px rounded-[6px] text-right hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
      >
        <span className="text-[11px] text-background/[0.72]">
          Deliver to
        </span>
        <span className="text-[11px] font-bold text-white max-w-[200px] truncate">
          {activeAddress.label || activeAddress.addressDetails} <span aria-hidden="true">&#9662;</span>
        </span>
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 top-[calc(100%+4px)] w-[280px] z-50 rounded-[12px] border border-[#ddcdb8] bg-white p-[5px] shadow-[0px_8px_20px_rgba(26,18,16,0.12)]">
            <div
              {...menu.listProps}
              aria-labelledby={undefined}
              aria-label="Delivery address"
              className="max-h-[300px] overflow-y-auto"
            >
              {addresses.map(address => (
                <button
                  key={address.id}
                  {...menu.optionProps(address.id === activeAddress.id)}
                  onClick={async () => {
                    menu.close();
                    await setActiveAddress(address.id);
                  }}
                  className={cn(
                    "flex w-full flex-col rounded-[8px] px-3 py-2.5 text-left transition-colors",
                    DROPDOWN_FOCUS_RING,
                    address.id === activeAddress.id
                      ? "bg-[#f6e9d9] font-bold text-[#8c1c13]"
                      : "text-[#1a1210] hover:bg-[#faf5eb]"
                  )}
                >
                  {address.label ? (
                    <span className="text-[13px] font-bold">{address.label}</span>
                  ) : null}
                  <span className="text-[14px] truncate">{address.addressDetails}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
