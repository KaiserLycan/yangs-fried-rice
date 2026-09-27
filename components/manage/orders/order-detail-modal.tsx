import * as React from "react";
import { Eye, Loader2 } from "lucide-react";
import type { OrderData } from "@/types/staff-order";
import { canCancel, primaryActionFor, statusLabelFor, type StaffAction } from "@/lib/orders/staff-actions";
import { cn } from "@/lib/utils";
import { DialogRoot } from "@/components/ui/dialog";
import { FulfillmentBadge } from "@/components/manage/orders/fulfillment-badge";
import { getSeniorPwdIdPhotoUrl } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { PickupFollowup } from "@/components/manage/orders/pickup-followup";
import { changeDue } from "@/lib/checkout/order-rules";
import { paymongoPaymentUrl } from "@/lib/checkout/paymongo-dashboard";

interface OrderDetailModalProps {
  order: OrderData | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (type: StaffAction, order: OrderData) => void;
  /** After a no-show or an undo, so the list can refetch. */
  onChanged?: () => void;
}

const statusConfig = {
  UNPAID: {
    headerBg: "bg-status-unpaid",
    label: "UNPAID",
  },
  QUEUE: {
    headerBg: "bg-status-received",
  },
  PREP: {
    headerBg: "bg-status-preparing",
  },
  DELIVERY: {
    headerBg: "bg-status-ready",
  },
  COMPLETED: {
    headerBg: "bg-status-done",
  },
  CANCELED: {
    headerBg: "bg-status-cancelled",
  },
};

export function OrderDetailModal({ order, isOpen, onClose, onAction, onChanged }: OrderDetailModalProps) {
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = React.useState(false);
  const [photoError, setPhotoError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPhotoUrl(null);
    setIsLoadingPhoto(false);
    setPhotoError(null);
  }, [order?.id, isOpen]);

  if (!order) return null;

  const config = statusConfig[order.status];
  const primary = primaryActionFor(order);
  const statusLabel = statusLabelFor(order);

  const handleFetchPhoto = async () => {
    if (!order) return;
    setIsLoadingPhoto(true);
    setPhotoError(null);
    try {
      const res = await getSeniorPwdIdPhotoUrl(order.id);
      if (res.error || !res.data?.url) {
        setPhotoError(res.error ?? "ID photo unavailable.");
      } else {
        setPhotoUrl(res.data.url);
      }
    } catch {
      setPhotoError("Failed to fetch photo.");
    } finally {
      setIsLoadingPhoto(false);
    }
  };

  return (
    // We use DialogRoot from components/ui/dialog.tsx to ensure consistent backdrop,
    // ESC key handling, and click-outside behavior across the entire app.
    // The inner content still uses custom padding and full-bleed layout.
    <DialogRoot
      open={isOpen}
      onClose={onClose}
      className={cn(
        "max-w-[420px] overflow-hidden rounded-lg border-0 shadow-[0_30px_35px_rgba(26,18,16,0.26)]",
        // DialogRoot already supplies standard m-auto, w-full, p-0, and backdrop classes
      )}
    >
      <div className="flex flex-col w-full h-full bg-background">
        
        {/* Header (Same as Card) */}
        <div className={cn("flex justify-between items-start p-4 text-white shrink-0", config.headerBg)}>
          <div>
            {/* The same eight characters the customer sees since issue
                #106 — this used to be the id's first four. */}
            <div className="text-lg font-bold tracking-wider leading-none mb-1">
              #{order.orderNumber}
            </div>
            <div className="text-xs font-medium tracking-wide opacity-90">{order.time}</div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="text-xs font-bold uppercase tracking-widest leading-none mb-1">
              {statusLabel}
            </div>
            {order.timer && (
              <div className="text-lg font-bold tracking-wider leading-none">
                {order.timer}
              </div>
            )}
          </div>
        </div>

        {/* Who collects it: the customer or their courier */}
        <div className="px-5 pt-3 shrink-0">
          <FulfillmentBadge method={order.fulfillmentMethod} />
        </div>

        {/* Scrollable Body */}
        <div className="p-5 flex-1 overflow-y-auto max-h-[60vh]">
          {order.refund ? <RefundNotice refund={order.refund} /> : null}

          {/* Senior Citizen / PWD Verification */}
          {order.seniorPwd && (
            <div className="mb-6 rounded-md border border-warning/60 bg-warning-surface/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-warning-text tracking-wider uppercase flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-warning animate-pulse" />
                  Verify ID — {order.seniorPwd.type === "senior_citizen" ? "Senior Citizen" : "PWD"}
                </h4>
                <span className="text-xs font-bold text-warning-text">
                  Discount: −₱{order.seniorPwd.discount.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <span className="font-bold text-foreground shrink-0">Name on ID:</span>
                  <span className="text-right text-foreground font-medium">{order.seniorPwd.nameOnId}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="font-bold text-foreground shrink-0">ID Number:</span>
                  <span className="text-right text-foreground font-mono font-medium">{order.seniorPwd.idNumber}</span>
                </div>
              </div>

              {order.seniorPwd.hasPhoto ? (
                <div className="mt-3 pt-3 border-t border-warning-surface">
                  {!photoUrl && !isLoadingPhoto && (
                    <Button variant="unstyled"
                      type="button"
                      onClick={handleFetchPhoto}
                      className="inline-flex min-h-[36px] items-center gap-2 rounded-lg bg-warning-surface/90 hover:bg-warning/60 px-3 py-2 text-xs font-bold text-warning-text transition-colors"
                    >
                      <Eye className="size-3.5" />
                      <span>View ID Photo</span>
                    </Button>
                  )}
                  {isLoadingPhoto && (
                    <div className="flex items-center gap-2 text-xs text-warning-text">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Loading signed ID photo…</span>
                    </div>
                  )}
                  {photoError && (
                    <p className="text-xs text-destructive mt-1">{photoError}</p>
                  )}
                  {photoUrl && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-warning-text">ID Photo Preview:</span>
                        <Button variant="unstyled"
                          type="button"
                          onClick={() => setPhotoUrl(null)}
                          className="text-xs text-warning-text underline hover:text-warning-text"
                        >
                          Hide
                        </Button>
                      </div>
                      <img
                        src={photoUrl}
                        alt="Senior Citizen or PWD ID photo"
                        className="max-h-60 w-auto rounded-lg border border-warning/60 object-contain shadow-sm bg-white"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs italic text-muted-foreground">
                  ID photo deleted (order completed or cancelled).
                </p>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-placeholder tracking-wider uppercase mb-3">
              Contact Information
            </h4>
            {/* Increased the body text size from text-sm to text-base to improve readability based on user request. */}
            <div className="flex flex-col gap-3 text-base">
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-foreground shrink-0">Name:</span>
                <span className="text-right text-foreground">{order.contactInfo.name}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-foreground shrink-0">Phone:</span>
                <span className="text-right text-foreground">{order.contactInfo.phone}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-track w-full mb-6" />

          {/* Order Information */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-placeholder tracking-wider uppercase mb-3">
              Order Information
            </h4>
            <div className="flex flex-col gap-3 text-base">
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-foreground shrink-0">Order Type:</span>
                <span className="text-right text-foreground">{order.orderInfo.type}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-foreground shrink-0">Status:</span>
                <span className="text-right text-foreground capitalize">{statusLabel.toLowerCase()}</span>
              </div>
              {order.orderInfo.specialInstructions && (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="font-bold text-foreground">Order note:</span>
                  <span className="text-foreground leading-relaxed">
                    {order.orderInfo.specialInstructions}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-track w-full mb-6" />

          {/* Order Items */}
          <div>
            <h4 className="text-xs font-bold text-placeholder tracking-wider uppercase mb-3">
              Order Items
            </h4>
            <div className="flex flex-col gap-3 text-base">
              {/* Every line's own add-ons and note, under that line — the
                  modal used to show one line's note as the order's (P30). */}
              {order.items.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-bold text-foreground shrink-0">{item.quantity}x</span>
                    <span className="flex-1 font-semibold text-foreground">{item.name}</span>
                    <span className="shrink-0 text-foreground">₱{item.price.toFixed(2)}</span>
                  </div>
                  {item.addons && (
                    <span className="pl-7 text-sm italic text-status-received">+ {item.addons}</span>
                  )}
                  {item.instructions && (
                    <span className="pl-7 text-sm text-foreground">
                      <span className="font-bold">Note:</span> {item.instructions}
                    </span>
                  )}
                </div>
              ))}
              
              {/* Pickup-only: a fee line only for a legacy delivery order. */}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between items-start gap-4 mt-2">
                  <span className="font-bold text-foreground">Delivery Fee</span>
                  <span className="shrink-0 text-foreground">₱{order.deliveryFee.toFixed(2)}</span>
                </div>
              )}

              {order.seniorPwd && (
                <div className="flex justify-between items-start gap-4 mt-1 text-status-done">
                  <span className="font-bold">
                    Discount ({order.seniorPwd.type === "senior_citizen" ? "Senior" : "PWD"})
                  </span>
                  <span className="shrink-0 font-bold">−₱{order.seniorPwd.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-start gap-4 mt-2 pt-2 border-t border-track">
                <span className="font-bold text-foreground text-base">Total</span>
                <span className="font-bold text-foreground text-base">₱{order.total.toFixed(2)}</span>
              </div>

              {(order.tip ?? 0) > 0 && (
                <div className="flex justify-between items-start gap-4 text-sm text-muted-strong">
                  <span>Tip for the staff (on top)</span>
                  <span className="shrink-0 font-bold">₱{(order.tip ?? 0).toFixed(2)}</span>
                </div>
              )}

              {order.cashTendered != null && (
                <div className="mt-2 rounded-md bg-warning-surface px-3 py-2 text-sm text-warning-text">
                  Paying with <strong>₱{order.cashTendered.toFixed(2)}</strong> — have{" "}
                  <strong>₱{(changeDue(order.total + (order.tip ?? 0), order.cashTendered) ?? 0).toFixed(2)}</strong> change ready.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col w-full shrink-0">
          <PickupFollowup order={order} onChanged={() => { onChanged?.(); onClose(); }} />
          {(canCancel(order) || primary) && (
            <div className="flex w-full">
              {canCancel(order) && (
                <Button variant="unstyled" 
                  onClick={() => onAction?.("Cancel", order)}
                  className="flex-1 py-4 bg-status-received hover:bg-destructive/90 transition-colors text-white text-sm font-bold text-center"
                >
                  Cancel
                </Button>
              )}
              {primary && (
                <Button variant="unstyled" 
                  onClick={() => onAction?.(primary.type, order)}
                  className="flex-1 py-4 bg-status-done hover:bg-success/90 transition-colors text-white text-sm font-bold text-center"
                >
                  {primary.label}
                </Button>
              )}
            </div>
          )}
          <Button variant="unstyled" 
            onClick={onClose}
            className="w-full py-3 bg-status-cancelled hover:bg-status-cancelled/90 transition-colors text-white text-sm font-semibold text-center"
          >
            Close
          </Button>
        </div>
      </div>
    </DialogRoot>
  );
}

/**
 * The refund on a cancelled paid order, on the order itself (FINALE 9.4):
 * staff no longer have to remember a second step in PayMongo. A failed one
 * links straight to the payment there.
 */
function RefundNotice({ refund }: { refund: NonNullable<OrderData["refund"]> }) {
  const amount = `₱${refund.amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  if (refund.status === "refunded") {
    return (
      <p className="mb-6 rounded-md bg-success/10 p-4 text-sm font-bold text-success">
        Refunded {amount} to the customer.
      </p>
    );
  }
  if (refund.status === "refund_pending") {
    return (
      <p className="mb-6 rounded-md bg-warning-surface p-4 text-sm text-warning-text">
        <strong>Refund of {amount} is on its way.</strong> It is sent to PayMongo
        automatically within 5 minutes — nothing to do here.
      </p>
    );
  }
  return (
    <div role="alert" className="mb-6 flex flex-col gap-2 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-foreground">
      <p>
        <strong className="text-destructive">Refund failed — {amount} still owed.</strong>{" "}
        {refund.error ? `PayMongo said: ${refund.error}. ` : ""}
        Refund it by hand in PayMongo, then mark it refunded on the dashboard.
      </p>
      <a
        href={paymongoPaymentUrl(refund.paymentId)}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start rounded-md bg-destructive px-3 py-2 text-sm font-bold text-white"
      >
        Open in PayMongo
      </a>
    </div>
  );
}
