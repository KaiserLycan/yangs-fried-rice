"use client";

import * as React from "react";
import { QuantityStepper } from "@/components/menu/quantity-stepper";
import { ProductPhotoPlaceholder } from "@/components/menu/product-photo-placeholder";
import { useToast } from "@/components/ui/toast";
import { formatPeso, type ProductListing } from "@/lib/menu/product-listing";
import { MIN_QUANTITY } from "@/lib/menu/quantity";

const ADD_TO_CART_TOAST =
  "Adding to your cart isn’t available yet. We’re still building it.";

const SPECIAL_INSTRUCTIONS_PLACEHOLDER = "e.g. extra chili, no egg";

/**
 * Item detail — desktop modal (`133:1012`) and mobile full-screen sheet
 * (`132:273`), one component because they share every piece of state
 * (quantity, special instructions) even though the two layouts don't share
 * much markup.
 *
 * Built on the native `<dialog>` element, the same reasoning as
 * `components/ui/dialog.tsx`: Escape-to-close, focus moved in on open and
 * back to the trigger on close, and the rest of the page made inert, all for
 * free. Not reusing that component directly — its shape (title, description,
 * centred footer, 440px max width) is built for a confirmation prompt, not a
 * two-column item view with a photo panel.
 *
 * The mobile frame draws this inside a phone mockup with its own 46px corner
 * radius and a drop shadow. Both are the mockup's canvas presentation, not
 * app UI — "full-screen sheet" is the ticket's own description, and a sheet
 * that covers the whole viewport has no edge for a shadow to fall against.
 * Only the desktop composition keeps the rounding and the shadow, because it
 * is genuinely a floating panel over the menu behind it.
 *
 * No star rating renders, for the reason `ProductCard`'s comment gives:
 * `review` rows attach to an order, not a product, so there is no per-dish
 * number to show. Ticket 03's own "dish's real name, description, price and
 * rating" acceptance criterion is stale on that point — decided in ticket 02,
 * carried over here rather than re-litigated.
 */
export function ItemDetailModal({
  product,
  onClose,
}: {
  /** `null` closes the dialog — there is no separate `open` boolean to keep
   * in sync with which product it is showing. */
  product: ProductListing | null;
  onClose: () => void;
}) {
  const showToast = useToast();
  const ref = React.useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = React.useState(MIN_QUANTITY);
  const [instructions, setInstructions] = React.useState("");

  const open = product !== null;

  // Resets on every open, including reopening the same dish a second time —
  // the acceptance criterion is "dismissing and reopening resets", not "a
  // different dish resets". Keying off `open` rather than `product.id` is
  // what catches the same-dish case.
  React.useEffect(() => {
    if (open) {
      setQuantity(MIN_QUANTITY);
      setInstructions("");
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!product) {
    // Still rendered (as a closed <dialog>) rather than unmounted, so the
    // close transition and focus return the browser gives `<dialog>` are not
    // skipped by React tearing the element down first.
    return (
      <dialog ref={ref} className="hidden" onCancel={(e) => e.preventDefault()} />
    );
  }

  const lineTotal = formatPeso(product.price * quantity);

  function handleAddToCart() {
    showToast(ADD_TO_CART_TOAST);
    onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="item-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      // No height override here at any breakpoint — that's what makes
      // desktop centering work. The browser's native top-layer centering for
      // `<dialog>` (the same mechanism components/ui/dialog.tsx relies on)
      // sizes the element from its content and centers it with the UA
      // stylesheet's own top:0/bottom:0 plus this m-auto; setting our own
      // height or max-height directly on the `<dialog>` fights that and pins
      // it to the top instead. Any height limit and scrolling belongs to the
      // panel *inside* it, not to this element — see the two wrapper divs
      // below.
      className="m-0 w-full max-w-none overflow-visible bg-transparent p-0 backdrop:bg-foreground/40 md:m-auto md:w-[calc(100%-4rem)] md:max-w-[720px]"
    >
      {/* Mobile: full-screen sheet, no rounding, no shadow — see the
          component comment for why. `min-h-screen` here, not a height on the
          `<dialog>` itself, is what makes this fill the viewport: the
          dialog's own box is always auto-sized to its content, so growing
          the content to viewport height grows the dialog to match, without
          ever touching the property the centering trick needs untouched. */}
      <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-background md:hidden">
        <div className="relative h-[240px] shrink-0">
          <ProductPhotoPlaceholder className="size-full" />
          <button
            type="button"
            aria-label="Back to menu"
            onClick={onClose}
            className="absolute left-[16px] top-[16px] flex size-[38px] items-center justify-center rounded-pill bg-background text-[16px] font-bold text-foreground"
          >
            ←
          </button>
        </div>

        <div className="flex flex-col gap-[14px] px-[20px] pb-[26px] pt-[17px]">
          <ItemSummary
            product={product}
            titleClassName="text-[27px]"
            titleId="item-detail-title"
          />

          <div className="h-px w-full bg-field-border" />

          <LabelledSection label="Quantity">
            <QuantityStepper value={quantity} onChange={setQuantity} size="mobile" />
          </LabelledSection>

          <LabelledSection label="Special instructions">
            <InstructionsField
              value={instructions}
              onChange={setInstructions}
              placeholder={SPECIAL_INSTRUCTIONS_PLACEHOLDER}
            />
          </LabelledSection>

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex items-center justify-between rounded-[14px] bg-accent p-[17px] text-[15px] font-bold text-white"
          >
            <span>Add to cart</span>
            <span>{lineTotal}</span>
          </button>
        </div>
      </div>

      {/* Desktop: floating modal, photo panel on the left. The height cap and
          scroll live here, not on the `<dialog>` element — same reason as
          the mobile wrapper's comment above. */}
      <div className="hidden max-h-[calc(100vh-4rem)] overflow-x-hidden overflow-y-auto rounded-[20px] bg-background shadow-[0_30px_70px_rgba(26,18,16,0.26)] md:flex">
        <ProductPhotoPlaceholder className="h-full w-[300px] shrink-0" />

        <div className="flex w-[420px] flex-col gap-[14px] px-[26px] pb-[26px] pt-[25px]">
          <ItemSummary product={product} titleClassName="text-[28px]" />

          <QuantityStepper value={quantity} onChange={setQuantity} size="desktop" />

          {/* No separate label on desktop — the frame folds it into the
              field's own placeholder text instead of drawing one above it,
              unlike the mobile composition. */}
          <InstructionsField
            value={instructions}
            onChange={setInstructions}
            placeholder={`Special instructions — ${SPECIAL_INSTRUCTIONS_PLACEHOLDER}`}
          />

          <div className="grid grid-cols-[1fr_2fr] gap-[14px]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[13px] border border-field-border p-[15px] text-[14px] font-bold text-muted-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex items-center justify-between rounded-[13px] bg-accent p-[15px] text-[14px] font-bold text-white"
            >
              <span>Add to cart</span>
              <span>{lineTotal}</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function ItemSummary({
  product,
  titleClassName,
  titleId,
}: {
  product: ProductListing;
  titleClassName: string;
  titleId?: string;
}) {
  return (
    <div className="flex flex-col gap-[5px]">
      <h2 id={titleId} className={`font-display text-foreground ${titleClassName}`}>
        {product.name}
      </h2>
      <p className="text-[13px] text-muted-foreground">{product.description}</p>
      <p className="pt-[5px] font-display text-[24px] text-primary">
        {formatPeso(product.price)}
      </p>
    </div>
  );
}

function LabelledSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[12px] font-bold uppercase tracking-[1.44px] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function InstructionsField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={2}
      className="min-h-[76px] w-full resize-none rounded-[13px] border border-field-border bg-card px-[14px] py-[12px] text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    />
  );
}
