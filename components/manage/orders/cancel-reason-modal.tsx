import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OrderData } from "@/types/staff-order";
import { actionCopy } from "@/lib/orders/staff-actions";

export interface CancelReasonModalProps {
  order: OrderData | null;
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const PRESET_REASONS = [
  "Out of stock",
  "Store closing",
  "Customer request",
  "Duplicate order",
  "Other"
];

export function CancelReasonModal({ order, isOpen, isProcessing, onClose, onConfirm }: CancelReasonModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  const [showError, setShowError] = useState(false);

  // Reset state when order changes or modal opens
  if (!isOpen && (selectedPreset || otherReason || showError)) {
    setSelectedPreset("");
    setOtherReason("");
    setShowError(false);
  }

  // Confirm stays greyed out until there is a reason to send: a preset, or
  // typed text when "Other" is picked.
  const hasReason =
    selectedPreset !== "" &&
    (selectedPreset !== "Other" || otherReason.trim() !== "");

  const handleConfirm = () => {
    if (!selectedPreset) {
      setShowError(true);
      return;
    }
    
    const finalReason = selectedPreset === "Other" ? otherReason.trim() : selectedPreset;
    
    if (selectedPreset === "Other" && !finalReason) {
      setShowError(true);
      return;
    }
    
    onConfirm(finalReason);
  };

  if (!order) return null;

  return (
    <Dialog 
      open={isOpen}
      onClose={onClose}
      title={actionCopy("Cancel", order.orderNumber).title}
      description={actionCopy("Cancel", order.orderNumber).description}
      tone="default"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Back
          </Button>
          <Button 
            variant="confirm"
            onClick={handleConfirm}
            disabled={isProcessing || !hasReason}
          >
            {isProcessing ? "Processing..." : actionCopy("Cancel", order.orderNumber).confirm}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 mt-4">
        <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
          Reason <span className="text-red-500">*</span>
        </label>
        
        <div className="flex flex-col gap-2">
          {PRESET_REASONS.map((preset) => (
            <label 
              key={preset} 
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50",
                selectedPreset === preset ? "border-[#E8541F] bg-[#fffaf5]" : "border-gray-200"
              )}
            >
              <input 
                type="radio" 
                name="cancel-reason" 
                value={preset}
                checked={selectedPreset === preset}
                onChange={() => {
                  setSelectedPreset(preset);
                  setShowError(false);
                }}
                className="w-4 h-4 text-[#E8541F] focus:ring-[#E8541F]"
              />
              <span className="text-sm font-medium text-gray-900">{preset}</span>
            </label>
          ))}
        </div>

        {selectedPreset === "Other" && (
          <div className="mt-2">
            <textarea 
              placeholder="Please specify the reason..."
              value={otherReason}
              onChange={(e) => {
                setOtherReason(e.target.value);
                if (e.target.value.trim()) setShowError(false);
              }}
              className={cn(
                "w-full min-h-[80px] p-3 rounded-lg border bg-white text-sm text-foreground focus:outline-none focus:ring-2 placeholder:text-[#A2938A] resize-none transition-colors",
                showError && !otherReason.trim() ? "border-red-500 focus:ring-red-500" : "border-[#DDCDB8] focus:ring-[#E8541F]"
              )}
            />
          </div>
        )}
        
        {showError && (
          <span className="text-[13px] text-red-500 font-medium mt-1">
            {selectedPreset === "Other" 
              ? "Please type a specific reason for cancellation." 
              : "Please select a reason for cancellation."}
          </span>
        )}
      </div>
    </Dialog>
  );
}
