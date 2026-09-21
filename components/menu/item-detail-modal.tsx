"use client";

import * as React from "react";
import { QuantityStepper } from "@/components/menu/quantity-stepper";
import { ProductPhotoPlaceholder } from "@/components/menu/product-photo-placeholder";
import { addCartItem } from "@/lib/actions/cart";
import { useCartAction } from "@/lib/cart/use-cart-action";
import { formatPeso, type ProductListing } from "@/lib/menu/product-listing";
import { MIN_QUANTITY } from "@/lib/menu/quantity";

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
  onAdd,
}: {
  /** `null` closes the dialog — there is no separate `open` boolean to keep
   * in sync with which product it is showing. */
  product: ProductListing | null;
  onClose: () => void;
  onAdd?: (quantity: number, instructions: string) => void;
}) {
  const { run, pending } = useCartAction();
  const ref = React.useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = React.useState(MIN_QUANTITY);
  const [instructions, setInstructions] = React.useState("");
  const [selectedAddOns, setSelectedAddOns] = React.useState<Set<string>>(new Set());

  const open = product !== null;

  // Resets on every open, including reopening the same dish a second time —
  // the acceptance criterion is "dismissing and reopening resets", not "a
  // different dish resets". Keying off `open` rather than `product.id` is
  // what catches the same-dish case.
  React.useEffect(() => {
    if (open) {
      setQuantity(MIN_QUANTITY);
      setInstructions("");
      setSelectedAddOns(new Set());
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

  const addOnsTotal = Array.from(selectedAddOns).reduce((sum, id) => {
    const addon = product?.add_ons?.find(a => a.addon_id === id);
    return sum + (addon?.price ?? 0);
  }, 0);

  const lineTotal = formatPeso((product.price + addOnsTotal) * quantity);

  // Optimistic UI requested by user: The modal closes immediately and updates the cart 
  // without waiting for the server roundtrip, making the interaction feel instantaneous.
  function handleAddToCart() {
    if (!product) return;
    const { id: product_id } = product;
    const qty = quantity;
    const inst = instructions.trim();
    
    onAdd?.(qty, inst);
    onClose();

    run(
      () =>
        addCartItem({
          product_id,
          quantity: qty,
          special_instructions: inst || null,
          add_on_ids: Array.from(selectedAddOns),
        })
    );
  }

  function toggleAddOn(addonId: string) {
    const next = new Set(selectedAddOns);
    if (next.has(addonId)) {
      next.delete(addonId);
    } else {
      next.add(addonId);
    }
    setSelectedAddOns(next);
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
      className="m-0 w-full max-w-none overflow-visible bg-transparent p-0 backdrop:bg-foreground/40 md:m-auto md:w-[calc(100%-4rem)] md:max-w-4xl"
    >
      {/* Mobile: full-screen sheet, no rounding, no shadow — see the
          component comment for why. `min-h-screen` here, not a height on the
          `<dialog>` itself, is what makes this fill the viewport: the
          dialog's own box is always auto-sized to its content, so growing
          the content to viewport height grows the dialog to match, without
          ever touching the property the centering trick needs untouched. */}
      <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-background md:hidden">
        <div className="relative h-[240px] shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="size-full object-cover"
            />
          ) : (
            <ProductPhotoPlaceholder className="size-full" />
          )}
          <button
            type="button"
            aria-label="Back to menu"
            onClick={onClose}
            disabled={pending}
            className="absolute left-[16px] top-[16px] flex size-[38px] items-center justify-center rounded-pill bg-background text-[16px] font-bold text-foreground disabled:opacity-60"
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

          <AddOnsSection
            addOns={product.add_ons}
            selectedAddOns={selectedAddOns}
            onToggle={toggleAddOn}
          />

          <LabelledSection label="Special instructions">
            <InstructionsField
              value={instructions}
              onChange={setInstructions}
              placeholder={SPECIAL_INSTRUCTIONS_PLACEHOLDER}
            />
          </LabelledSection>

          <ReviewsSection reviews={product.reviews} />

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={pending || !product.isAvailable}
            className="flex items-center justify-between rounded-[14px] bg-accent p-[17px] text-[15px] font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{product.isAvailable ? 'Add to cart' : 'Unavailable'}</span>
            <span>{lineTotal}</span>
          </button>
        </div>
      </div>

      {/* Desktop: floating modal, photo panel on the left. */}
      <div className="hidden md:h-[650px] max-h-[calc(100vh-4rem)] overflow-hidden rounded-[20px] bg-background shadow-[0_30px_70px_rgba(26,18,16,0.26)] md:flex">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-[350px] lg:w-[450px] h-full shrink-0 object-cover"
          />
        ) : (
          <ProductPhotoPlaceholder className="w-[350px] lg:w-[450px] h-full shrink-0" />
        )}

        <div className="flex flex-1 flex-col gap-[14px] px-[26px] pb-[26px] pt-[25px] overflow-y-auto">
          <ItemSummary product={product} titleClassName="text-[28px]" />

          <QuantityStepper value={quantity} onChange={setQuantity} size="desktop" />

          <AddOnsSection
            addOns={product.add_ons}
            selectedAddOns={selectedAddOns}
            onToggle={toggleAddOn}
          />

          {/* No separate label on desktop — the frame folds it into the
              field's own placeholder text instead of drawing one above it,
              unlike the mobile composition. */}
          <InstructionsField
            value={instructions}
            onChange={setInstructions}
            placeholder={`Special instructions — ${SPECIAL_INSTRUCTIONS_PLACEHOLDER}`}
          />

          <ReviewsSection reviews={product.reviews} />

          <div className="grid grid-cols-[1fr_2fr] gap-[14px]">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-[13px] border border-field-border p-[15px] text-[14px] font-bold text-muted-foreground disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={pending || !product.isAvailable}
              className="flex items-center justify-between rounded-[13px] bg-accent p-[15px] text-[14px] font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{product.isAvailable ? 'Add to cart' : 'Unavailable'}</span>
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
  const rating = product.reviews && product.reviews.length > 0 
    ? product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length 
    : 0;
    
  return (
    <div className="flex flex-col gap-[5px]">
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className={`font-display text-foreground ${titleClassName}`}>
          {product.name}
        </h2>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2 py-1">
          <span className="text-[14px] font-bold text-accent">★ {rating > 0 ? rating.toFixed(1) : "0.0"}</span>
          <span className="text-[12px] text-muted-foreground">({product.reviews?.length || 0})</span>
        </div>
      </div>
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

export function AddOnsSection({
  addOns,
  selectedAddOns,
  onToggle,
}: {
  addOns?: { addon_id: string; name: string; price: number }[];
  selectedAddOns: Set<string>;
  onToggle: (addonId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[12px] font-bold uppercase tracking-[1.44px] text-muted-foreground">
        Add-ons
      </span>
      <div className="flex flex-col gap-[8px] max-h-[150px] overflow-y-auto pr-1">
        {!addOns || addOns.length === 0 ? (
          <div className="text-[13px] text-muted-foreground italic px-1 py-2">No add-ons currently.</div>
        ) : (
          addOns.map((addon) => (
            <label key={addon.addon_id} className="flex cursor-pointer items-center justify-between rounded-[12px] border border-field-border bg-card p-[14px]">
              <div className="flex items-center gap-[12px]">
                <input 
                  type="checkbox" 
                  checked={selectedAddOns.has(addon.addon_id)}
                  onChange={() => onToggle(addon.addon_id)}
                  className="h-[18px] w-[18px] rounded-[4px] border-field-border text-primary focus:ring-primary accent-primary"
                />
                <span className="text-[14px] text-foreground">{addon.name}</span>
              </div>
              <span className="text-[14px] text-muted-foreground">+{formatPeso(addon.price)}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export function ReviewsSection({
  reviews,
}: {
  reviews?: { id: string; rating: number; comment: string; customerName: string; createdAt: string }[];
}) {
  if (!reviews || reviews.length === 0) return null;
  
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[12px] font-bold uppercase tracking-[1.44px] text-muted-foreground">
        Reviews
      </span>
      <div className="flex flex-col gap-[12px] rounded-[13px] border border-field-border bg-card p-[14px]">
        {reviews.slice(0, 5).map((rev) => (
          <div key={rev.id} className="flex flex-col gap-1 border-b border-field-border pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-foreground">{rev.customerName}</span>
              <span className="text-[12px] text-accent font-bold">★ {rev.rating}</span>
            </div>
            {rev.comment && <p className="text-[13px] text-muted-foreground leading-snug">"{rev.comment}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
