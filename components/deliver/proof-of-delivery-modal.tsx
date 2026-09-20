"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image/compress";
import { useRouter } from "next/navigation";
import { markDelivered } from "@/lib/actions/delivery";

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: string;
  customerName: string;
  proofImageUrl?: string | null;
  isReadOnly?: boolean;
  deliverySummary?: {
    id?: string;
    customer?: string;
    address?: string;
    phone?: string;
    paymentMethod?: string;
    total?: number | string;
    items?: { qty: number; name: string }[];
  };
}

export function ProofOfDeliveryModal({
  isOpen,
  onClose,
  deliveryId,
  customerName,
  proofImageUrl,
  isReadOnly = false,
  deliverySummary,
}: ProofOfDeliveryModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [proofPreview, setProofPreview] = useState<string | null>(proofImageUrl ?? null);
  const [isCashCollected, setIsCashCollected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);

  useEffect(() => {
    setProofPreview(proofImageUrl ?? null);
  }, [proofImageUrl]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800);
        setProofPreview(URL.createObjectURL(compressed));
        setSelectedFile(compressed);
      } catch {
        // Fallback to uncompressed if compression fails
        setProofPreview(URL.createObjectURL(file));
        setSelectedFile(file);
      }
      setError(null);
    }
  };

  const handleComplete = async () => {
    if (isReadOnly) return;

    if (!selectedFile) {
      setError("Proof photo is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("proof", selectedFile);
    formData.append("proofPhoto", selectedFile);
    formData.append("isCashCollected", String(isCashCollected));

    const result = await markDelivered(deliveryId, formData);

    setIsSubmitting(false);

    if (result.success) {
      onClose();
      window.dispatchEvent(new CustomEvent("delivery-updated"));
      router.push("/deliver");
      router.refresh();
    } else {
      setError(result.error || "Failed to mark as delivered. Please try again.");
    }
  };

  const displayItems = deliverySummary?.items ?? [];

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => { e.preventDefault(); if(!isSubmitting) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-[560px] overflow-visible bg-transparent p-0 backdrop:bg-black/40"
    >
      <div className="flex flex-col w-full max-h-[90vh] bg-white rounded-[24px] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-[24px] pt-[24px] pb-[16px]">
          <div>
            <h2 className="font-display text-[24px] text-[#1A1210] leading-none mb-1">
              {isReadOnly ? "DELIVERED" : "PROOF OF DELIVERY"}
            </h2>
            <p className="text-[14px] text-[#7A6A60]">
              Order #{deliveryId} · {customerName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-bold tracking-[1.2px] uppercase text-[#7A6A60] hover:text-[#1A1210]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[24px] pb-[24px] flex flex-col gap-5">
          {isReadOnly && (
            <div className="w-full aspect-[4/3] bg-[#FAF5EB] rounded-[16px] overflow-hidden border border-[#DDCDB8]">
              {proofPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={proofPreview} alt="Delivery proof" className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[#7A6A60] text-sm font-medium">
                  No delivery proof attached.
                </div>
              )}
            </div>
          )}

          {!isReadOnly && (
            <>
              <div className="flex flex-col gap-1">
                <div
                  onClick={() => !isSubmitting && fileInputRef.current?.click()}
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
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={proofPreview} alt="Proof" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-[#A2938A] group-hover:text-[#E8541F] transition-colors">
                      <Camera className="w-10 h-10 mb-3" />
                      <span className="font-bold tracking-widest text-[13px] uppercase">Take Photo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="font-bold text-[#7A6A60] text-[11px] tracking-[1.32px] uppercase">
                  Received by
                </label>
                <input
                  defaultValue={customerName}
                  disabled={isSubmitting}
                  className="bg-white border border-[#DDCDB8] rounded-[12px] p-[14px] text-[15px] text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
                />
              </div>

              {deliverySummary?.paymentMethod === "cash_on_delivery" && (
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-[6px] border-2 flex items-center justify-center transition-colors ${isCashCollected ? 'bg-[#E8541F] border-[#E8541F]' : 'border-[#DDCDB8] bg-white group-hover:border-[#E8541F]'}`}>
                    {isCashCollected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                  <input
                    type="checkbox"
                    checked={isCashCollected}
                    disabled={isSubmitting}
                    onChange={(e) => setIsCashCollected(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-[15px] font-medium text-[#1A1210] select-none">
                    Cash payment collected
                  </span>
                </label>
              )}

              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

              <div className="pt-2">
                <Button
                  className="w-full py-6 text-[16px] bg-[#1A1210] hover:bg-[#2c1f1c] text-white"
                  onClick={handleComplete}
                  disabled={!proofPreview || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Complete delivery"
                  )}
                </Button>
              </div>
            </>
          )}

          {isReadOnly && (
            <div className="space-y-4">
              <div className="bg-[#FAF5EB] p-4 rounded-[12px]">
                <p className="text-[12px] font-bold text-[#7A6A60] uppercase tracking-widest mb-2">
                  Customer
                </p>
                <p className="text-[15px] text-[#1A1210] font-medium">{deliverySummary?.customer || customerName}</p>
                <p className="text-[14px] text-[#7A6A60] mt-1">{deliverySummary?.phone || "No phone provided"}</p>
              </div>

              <div className="bg-[#FAF5EB] p-4 rounded-[12px]">
                <p className="text-[12px] font-bold text-[#7A6A60] uppercase tracking-widest mb-2">
                  Delivery Address
                </p>
                <p className="text-[15px] text-[#1A1210] leading-snug">{deliverySummary?.address || "Address unavailable"}</p>
              </div>

              {displayItems.length > 0 && (
                <div className="bg-[#FAF5EB] p-4 rounded-[12px]">
                  <p className="text-[12px] font-bold text-[#7A6A60] uppercase tracking-widest mb-2">
                    Order Summary
                  </p>
                  <div className="space-y-2">
                    {displayItems.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-[14px] text-[#1A1210]">
                        <span>
                          <span className="font-bold text-[#E8541F]">{item.qty}x</span> {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-[12px] border border-[#F2E8D9] px-4 py-3 text-[14px] text-[#1A1210]">
                <span>{deliverySummary?.paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : deliverySummary?.paymentMethod === "paymongo" ? "Paid Online" : deliverySummary?.paymentMethod || "Standard"}</span>
                <span className="font-display text-[18px] text-[#1A1210]">
                  ₱{Number(deliverySummary?.total ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}