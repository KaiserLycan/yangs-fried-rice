"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { fieldErrorsFromIssues, type FieldErrors } from "@/lib/validation/field-errors";
import {
  PROMO_CODE_MAX,
  PROMO_LIMITS,
  normalisePromoCode,
  promotionCodeTermsSchema,
  type PromoDiscountType,
} from "@/lib/validation/promo-code";

export type PromotionScopeOptions = {
  categories: { id: string; name: string }[];
  products: { id: string; name: string }[];
};

/** "all", "category:<id>" or "product:<id>" — one select for what a code applies to. */
type Scope = string;

function scopeOf(promotion: any | null): Scope {
  if (promotion?.product_id) return `product:${promotion.product_id}`;
  if (promotion?.category_id) return `category:${promotion.category_id}`;
  return "all";
}

function numberOrBlank(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

/** A blank field is "not set", which the schema reads as null. */
function toNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

const labelClass = "block text-sm font-medium mb-1";
const errorClass = "mt-1 text-sm text-primary";

export function PromotionModal({
  isOpen,
  onClose,
  promotion,
  onSave,
  onDelete,
  scopeOptions = { categories: [], products: [] },
}: {
  isOpen: boolean;
  onClose: () => void;
  promotion: any | null;
  onSave: (data: any) => void;
  onDelete: (data: any) => void;
  scopeOptions?: PromotionScopeOptions;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scope, setScope] = useState<Scope>("all");
  // Promo code
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<PromoDiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perCustomer, setPerCustomer] = useState("1");
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (promotion) {
        setTitle(promotion.title);
        setDescription(promotion.description || "");
        setStartsAt(promotion.starts_at.substring(0, 16));
        setEndsAt(promotion.ends_at.substring(0, 16));
        setIsActive(promotion.is_active);
        setScope(scopeOf(promotion));
        setCode(promotion.code ?? "");
        setDiscountType(promotion.discount_type === "fixed" ? "fixed" : "percent");
        setDiscountValue(numberOrBlank(promotion.discount_value));
        setMaxDiscount(numberOrBlank(promotion.max_discount));
        setMinSpend(promotion.min_spend ? String(promotion.min_spend) : "");
        setUsageLimit(numberOrBlank(promotion.usage_limit));
        setPerCustomer(numberOrBlank(promotion.per_customer_limit ?? 1));
      } else {
        setTitle("");
        setDescription("");
        setStartsAt(new Date().toISOString().substring(0, 16));
        setEndsAt("");
        setIsActive(true);
        setScope("all");
        setCode("");
        setDiscountType("percent");
        setDiscountValue("");
        setMaxDiscount("");
        setMinSpend("");
        setUsageLimit("");
        setPerCustomer("1");
      }
      setImageFile(null);
      setErrors({});
    }
  }, [isOpen, promotion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (endsAt && startsAt && endsAt <= startsAt) {
      nextErrors.ends_at = "The end must be after the start.";
    }
    const terms = promotionCodeTermsSchema.safeParse({
      code,
      discount_type: discountType,
      discount_value: toNumber(discountValue),
      min_spend: toNumber(minSpend),
      max_discount: toNumber(maxDiscount),
      usage_limit: toNumber(usageLimit),
      per_customer_limit: toNumber(perCustomer),
    });
    if (!terms.success) Object.assign(nextErrors, fieldErrorsFromIssues(terms.error.issues));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !terms.success) return;

    const [kind, id] = scope.split(":");
    onSave({
      title,
      description,
      starts_at: startsAt,
      ends_at: endsAt,
      is_active: isActive,
      imageFile,
      product_id: kind === "product" ? id : null,
      category_id: kind === "category" ? id : null,
      terms: terms.data,
    });
  };

  const hasCode = code.length > 0;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={promotion ? "Edit Promotion" : "New Promotion"}
      description={promotion ? "Update this promotion's details." : "Create a new promotion."}
      footer={
        <div className="flex items-center justify-between w-full">
          {promotion ? (
            <Button
              type="button"
              variant="outline"
              className="text-destructive border-error-surface hover:bg-error-surface/90"
              onClick={() => onDelete(promotion)}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="promo-form" variant="primary">
              Save
            </Button>
          </div>
        </div>
      }
    >
      <form id="promo-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="promo-title" className={labelClass}>Title</label>
          <Input id="promo-title" required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="promo-description" className={labelClass}>Description</label>
          <Input id="promo-description" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="promo-starts" className={labelClass}>Start Date/Time</label>
            <Input id="promo-starts" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <label htmlFor="promo-ends" className={labelClass}>End Date/Time</label>
            <Input
              id="promo-ends"
              type="datetime-local"
              required
              value={endsAt}
              min={startsAt || undefined}
              onChange={(e) => setEndsAt(e.target.value)}
              invalid={Boolean(errors.ends_at)}
            />
            {errors.ends_at && <p className={errorClass}>{errors.ends_at}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="promo-scope" className={labelClass}>Links to / applies to</label>
          <select
            id="promo-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full rounded-md border border-field-border bg-white px-[14px] py-[13px] text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="all">Whole menu / whole order</option>
            {scopeOptions.categories.length > 0 && (
              <optgroup label="Category">
                {scopeOptions.categories.map((c) => (
                  <option key={c.id} value={`category:${c.id}`}>{c.name}</option>
                ))}
              </optgroup>
            )}
            {scopeOptions.products.length > 0 && (
              <optgroup label="Dish">
                {scopeOptions.products.map((p) => (
                  <option key={p.id} value={`product:${p.id}`}>{p.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <p className="mt-1 text-sm text-muted-foreground">
            Where the banner&apos;s &ldquo;Order now&rdquo; goes, and what a promo code discounts.
          </p>
        </div>
        <div>
          <label htmlFor="promo-image" className={labelClass}>Image (Optional on edit)</label>
          <Input id="promo-image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required={!promotion} />
        </div>

        <fieldset className="space-y-4 rounded-md border border-rule p-4">
          <legend className="px-1 text-sm font-bold">Promo code (optional)</legend>
          <p className="text-sm text-muted-foreground">
            Leave the code blank for a banner only. With a code, customers type it at checkout and the discount comes
            off when the order is placed. It can&apos;t be combined with the Senior Citizen / PWD discount.
          </p>
          <div>
            <label htmlFor="promo-code-input" className={labelClass}>Code</label>
            <Input
              id="promo-code-input"
              value={code}
              onChange={(e) => setCode(normalisePromoCode(e.target.value).slice(0, PROMO_CODE_MAX))}
              maxLength={PROMO_CODE_MAX}
              placeholder="e.g. YANGS20"
              autoComplete="off"
              className="font-mono uppercase"
              invalid={Boolean(errors.code)}
            />
            {errors.code && <p className={errorClass}>{errors.code}</p>}
          </div>

          {hasCode && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-discount-type" className={labelClass}>Discount</label>
                  <select
                    id="promo-discount-type"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as PromoDiscountType)}
                    className="w-full rounded-md border border-field-border bg-white px-[14px] py-[13px] text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <option value="percent">Percent off</option>
                    <option value="fixed">Pesos off</option>
                  </select>
                  {errors.discount_type && <p className={errorClass}>{errors.discount_type}</p>}
                </div>
                <div>
                  <label htmlFor="promo-discount-value" className={labelClass}>
                    {discountType === "percent" ? "Percent (1–100)" : "Pesos off"}
                  </label>
                  <Input
                    id="promo-discount-value"
                    type="number"
                    inputMode="decimal"
                    min={0.01}
                    max={discountType === "percent" ? PROMO_LIMITS.percentMax : PROMO_LIMITS.fixedMax}
                    step={0.01}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    invalid={Boolean(errors.discount_value)}
                  />
                  {errors.discount_value && <p className={errorClass}>{errors.discount_value}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-min-spend" className={labelClass}>Minimum spend (₱)</label>
                  <Input
                    id="promo-min-spend"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={PROMO_LIMITS.minSpendMax}
                    step={0.01}
                    placeholder="None"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    invalid={Boolean(errors.min_spend)}
                  />
                  {errors.min_spend && <p className={errorClass}>{errors.min_spend}</p>}
                </div>
                {discountType === "percent" && (
                  <div>
                    <label htmlFor="promo-max-discount" className={labelClass}>Cap (₱)</label>
                    <Input
                      id="promo-max-discount"
                      type="number"
                      inputMode="decimal"
                      min={0.01}
                      max={PROMO_LIMITS.maxDiscountMax}
                      step={0.01}
                      placeholder="No cap"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      invalid={Boolean(errors.max_discount)}
                    />
                    {errors.max_discount && <p className={errorClass}>{errors.max_discount}</p>}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-usage-limit" className={labelClass}>Total uses</label>
                  <Input
                    id="promo-usage-limit"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={PROMO_LIMITS.usageLimitMax}
                    step={1}
                    placeholder="Unlimited"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    invalid={Boolean(errors.usage_limit)}
                  />
                  {errors.usage_limit && <p className={errorClass}>{errors.usage_limit}</p>}
                </div>
                <div>
                  <label htmlFor="promo-per-customer" className={labelClass}>Uses per customer</label>
                  <Input
                    id="promo-per-customer"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={PROMO_LIMITS.perCustomerMax}
                    step={1}
                    value={perCustomer}
                    onChange={(e) => setPerCustomer(e.target.value)}
                    invalid={Boolean(errors.per_customer_limit)}
                  />
                  {errors.per_customer_limit && <p className={errorClass}>{errors.per_customer_limit}</p>}
                </div>
              </div>
            </>
          )}
        </fieldset>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="is-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="is-active" className="text-sm font-medium">Active (Visible if within dates)</label>
        </div>
      </form>
    </Dialog>
  );
}
