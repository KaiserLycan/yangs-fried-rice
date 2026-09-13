"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: string;
  customerName: string;
}

export function ProofOfDeliveryModal({ isOpen, onClose, deliveryId, customerName }: ProofOfDeliveryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isCashCollected, setIsCashCollected] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleComplete = () => {
    // TODO: Send proof photo, cash collected status to backend, mark order complete
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-[480px] overflow-visible bg-transparent p-0 backdrop:bg-black/40"
    >
      <div className="flex flex-col w-full max-h-[90vh] bg-white rounded-[24px] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-[24px] pt-[24px] pb-[16px]">
          <h2 className="font-display text-[24px] text-[#1A1210] leading-none mb-1">
            PROOF OF DELIVERY
          </h2>
          <p className="text-[14px] text-[#7A6A60]">
            Order #{deliveryId} · {customerName}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-[24px] pb-[24px] flex flex-col gap-6">
          
          {/* Photo Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] bg-[#FAF5EB] rounded-[16px] border-2 border-dashed border-[#DDCDB8] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-colors hover:border-[#E8541F] hover:bg-[#F2E8D9]"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            {proofPreview ? (
              <img src={proofPreview} alt="Proof" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-[#A2938A] group-hover:text-[#E8541F] transition-colors">
                <Camera className="w-10 h-10 mb-3" />
                <span className="font-bold tracking-widest text-[13px] uppercase">Take Photo</span>
              </div>
            )}
          </div>

          {/* Received By */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
              Received by
            </label>
            <input 
              defaultValue={customerName}
              placeholder="e.g. Liza Reyes"
              className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
            />
          </div>

          {/* Cash Payment Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-6 h-6 rounded-[6px] border-2 flex items-center justify-center transition-colors ${isCashCollected ? 'bg-[#E8541F] border-[#E8541F]' : 'border-[#DDCDB8] bg-white group-hover:border-[#E8541F]'}`}>
              {isCashCollected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
            </div>
            <input 
              type="checkbox" 
              checked={isCashCollected} 
              onChange={(e) => setIsCashCollected(e.target.checked)} 
              className="hidden" 
            />
            <span className="text-[15px] font-medium text-[#1A1210] select-none">
              Cash payment collected
            </span>
          </label>

          {/* Action */}
          <div className="pt-2">
            <Button 
              className="w-full py-6 text-[16px]" 
              size="lg"
              onClick={handleComplete}
              disabled={!proofPreview}
            >
              Complete delivery
            </Button>
          </div>
        </div>

      </div>
    </dialog>
  );
}
