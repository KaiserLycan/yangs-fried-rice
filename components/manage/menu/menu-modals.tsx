import { useState, useRef, useMemo, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import type { MenuItem, MenuCategory } from "@/types/menu";
import { cn } from "@/lib/utils";
import { Camera, ChevronDown, ChevronRight, Trash2, Plus, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { Dialog, DialogDismiss, DialogRoot } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useValidatedValues } from "@/lib/forms/use-live-validation";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
import { DROPDOWN_FOCUS_RING, useDropdown } from "@/lib/hooks/use-dropdown";
import { FIELD_LIMITS, lengthProps } from "@/lib/validation/fields";

/**
 * The menu item form's rules — the same bounds as `productSchema` and the
 * product CHECK constraints: name 2–80, details up to 300, price above ₱0
 * and at most ₱99,999.99.
 */
export const menuItemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter the product name.")
    .min(FIELD_LIMITS.productName.min, `Product name must be at least ${FIELD_LIMITS.productName.min} characters.`)
    .max(FIELD_LIMITS.productName.max, `Product name must be ${FIELD_LIMITS.productName.max} characters or fewer.`),
  price: z
    .string()
    .min(1, "Enter the price.")
    .refine((value) => Number(value) > 0, "Price must be more than ₱0.")
    .refine((value) => Number(value) <= 99999.99, "Price can't exceed ₱99,999.99."),
  description: z
    .string()
    .max(FIELD_LIMITS.productDetails.max, `Details must be ${FIELD_LIMITS.productDetails.max} characters or fewer.`),
});

/** A new add-on row: name 2–60, price ₱0–₱9,999.99 (₱0 is a free add-on). */
export const addOnFormSchema = z.object({
  addonName: z
    .string()
    .trim()
    .min(FIELD_LIMITS.addonName.min, `Add-on name must be at least ${FIELD_LIMITS.addonName.min} characters.`)
    .max(FIELD_LIMITS.addonName.max, `Add-on name must be ${FIELD_LIMITS.addonName.max} characters or fewer.`),
  addonPrice: z
    .string()
    .min(1, "Enter the add-on price.")
    .refine((value) => Number(value) >= 0 && Number(value) <= 9999.99, "Price must be ₱0 to ₱9,999.99."),
});

// 1. Update Confirmation Modal
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
}: ConfirmationModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Are you sure?"
      description={`Updating this ${productName} from the menu will instantly reflect to customers. Meanwhile, ongoing orders with ${productName} will remain unchanged. Do you want to update it?`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Update
          </Button>
        </>
      }
    />
  );
}

// 2. Add New Item Modal — matches Figma node 2102-5225
interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<MenuItem>, addOns: { name: string; price: number }[], file?: File) => void;
  categories?: string[];
  isProcessing?: boolean;
}

export function MenuItemModal({
  isOpen,
  onClose,
  onSave,
  categories,
  isProcessing,
}: MenuItemModalProps) {
  // Redesigned the modal to match the Figma design (node 2102-5225).
  // Needed image upload, custom category dropdown, and availability toggle for new items.
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryMenu = useDropdown({ open: categoryOpen, onOpenChange: setCategoryOpen });
  const [newAddOns, setNewAddOns] = useState<{ name: string; price: number }[]>([]);
  const [tempAddonName, setTempAddonName] = useState("");
  const [tempAddonPrice, setTempAddonPrice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemValues = useMemo(() => ({ name, price, description }), [name, price, description]);
  const itemForm = useValidatedValues(menuItemFormSchema, itemValues);
  const addOnValues = useMemo(
    () => ({ addonName: tempAddonName, addonPrice: tempAddonPrice }),
    [tempAddonName, tempAddonPrice],
  );
  const addOnForm = useValidatedValues(addOnFormSchema, addOnValues);
  const itemErrors = itemForm.errors;

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setPrice("");
      setCategory("");
      setDescription("");
      setAvailable(false);
      setImagePreview(null);
      setSelectedFile(null);
      setCategoryOpen(false);
      setNewAddOns([]);
      setTempAddonName("");
      setTempAddonPrice("");
    }
  }, [isOpen]);

  // Ctrl/⌘+Enter adds the item, exactly as the Add button would.
  useShortcut(SHORTCUTS.submitForm.combo, () => {
    if (itemForm.isValid) submitItem();
    else itemForm.attemptSubmit();
  }, { enabled: isOpen });

  // Derive the list of selectable categories (exclude "All").
  const selectableCategories = (categories ?? []).filter(
    (c) => c !== "All"
  );

  if (!isOpen) return null;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800);
        setSelectedFile(compressed);
        setImagePreview(URL.createObjectURL(compressed));
      } catch {
        // Fallback to uncompressed if compression fails
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    submitItem();
  };

  function submitItem() {
    itemForm.attemptSubmit();
    if (!itemForm.isValid) return;
    onSave({
      name,
      price: parseFloat(price) || 0,
      // Added a safe fallback string before the cast so TS knows it's never undefined
      category: (category || selectableCategories[0] || "Uncategorized") as MenuCategory,
      description,
      available,
    }, newAddOns, selectedFile || undefined);
  }

  const handleAddAddOn = () => {
    addOnForm.attemptSubmit();
    if (!addOnForm.isValid) return;
    setNewAddOns([...newAddOns, { name: tempAddonName.trim(), price: parseFloat(tempAddonPrice) }]);
    setTempAddonName("");
    setTempAddonPrice("");
    addOnForm.reset();
  };

  // Safe fallback for the display label as well
  const displayCategory = category || selectableCategories[0] || "Select";

  // Anything typed or picked counts: closing would throw it away.
  const isDirty =
    name !== "" ||
    price !== "" ||
    category !== "" ||
    description !== "" ||
    available ||
    selectedFile !== null ||
    newAddOns.length > 0 ||
    tempAddonName !== "" ||
    tempAddonPrice !== "";

  return (
    <DialogRoot
      open={isOpen}
      onClose={onClose}
      dirty={isDirty && !isProcessing}
      className="w-full max-w-[440px] md:max-w-3xl overflow-hidden rounded-lg bg-background shadow-[0px_30px_35px_rgba(26,18,16,0.26)]"
    >
      <div className="flex flex-col md:flex-row w-full md:h-[650px] max-h-[90vh] overflow-y-auto md:overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex w-full md:w-1/2 flex-col md:border-r border-field-border md:overflow-y-auto">
          {/* ──────────────────────────────────── Image upload area */}
        <div className="group relative w-full">
          <div className="relative h-[220px] w-full overflow-hidden bg-secondary">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <Button variant="unstyled"
                type="button"
                onClick={handleImageClick}
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2"
              >
                <Camera className="h-10 w-10 text-placeholder" />
                <span className="text-sm font-bold text-muted-foreground">
                  Upload Image
                </span>
              </Button>
            )}

            {/* Hover overlay — only when an image is already picked */}
            {imagePreview && (
              <Button variant="unstyled"
                type="button"
                onClick={handleImageClick}
                className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/0 transition-colors duration-200 group-hover:bg-black/40"
              >
                <Camera className="h-8 w-8 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <span className="text-sm font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Change Photo
                </span>
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* ──────────────────────────────────── Scrollable form */}
        <div className="flex flex-col gap-[18px] p-[26px]">
          {/* Product Name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
                Product Name <span className="text-destructive">*</span>
              </label>
              <span className="text-xs text-placeholder">{name.length}/{FIELD_LIMITS.productName.max}</span>
            </div>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                itemForm.touch("name");
              }}
              onBlur={() => itemForm.touch("name")}
              placeholder="e.g. Yang Chow Fried Rice"
              {...lengthProps("productName")}
              aria-invalid={itemErrors.name ? true : undefined}
              className={cn(
                "w-full rounded-md border bg-white px-4 py-3 text-base text-foreground outline-none placeholder:text-placeholder",
                itemErrors.name ? "border-destructive" : "border-field-border",
              )}
            />
            {itemErrors.name ? <p className="text-xs text-destructive">{itemErrors.name}</p> : null}
          </div>

          {/* Category — custom dropdown */}
          <div className="flex flex-col gap-1.5">
            <label {...categoryMenu.labelProps} className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
              Category <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Button variant="unstyled"
                {...categoryMenu.triggerProps}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border border-field-border bg-white px-4 py-3 text-base text-foreground transition-colors hover:bg-background",
                  DROPDOWN_FOCUS_RING,
                )}
              >
                <span>{displayCategory}</span>
                {categoryOpen ? (
                  <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform" />
                ) : (
                  <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform" />
                )}
              </Button>

              {categoryOpen && (
                <div {...categoryMenu.listProps} className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-md border border-field-border bg-white p-[5px] shadow-[0px_8px_20px_rgba(26,18,16,0.12)]">
                  {selectableCategories.map((cat) => (
                    <Button variant="unstyled"
                      key={cat}
                      {...categoryMenu.optionProps(displayCategory === cat)}
                      onClick={() => {
                        setCategory(cat);
                        categoryMenu.close();
                      }}
                      className={cn(
                        "flex w-full items-center rounded-sm px-3 py-2.5 text-left text-sm transition-colors",
                        DROPDOWN_FOCUS_RING,
                        displayCategory === cat
                          ? "bg-highlight font-bold text-primary"
                          : "text-foreground hover:bg-background"
                      )}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
                Product Details
              </label>
              <span className="text-xs text-placeholder">{description.length}/{FIELD_LIMITS.productDetails.max}</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                itemForm.touch("description");
              }}
              placeholder="What's in it, how spicy, how big"
              rows={4}
              maxLength={FIELD_LIMITS.productDetails.max}
              aria-invalid={itemErrors.description ? true : undefined}
              className={cn(
                "w-full resize-none rounded-md border bg-white px-4 py-3 text-base leading-[22px] text-foreground outline-none placeholder:text-placeholder",
                itemErrors.description ? "border-destructive" : "border-field-border",
              )}
            />
            <p className={cn("text-xs", itemErrors.description ? "text-destructive" : "text-placeholder")}>
              {itemErrors.description ?? `Optional. ${description.length}/${FIELD_LIMITS.productDetails.max} characters.`}
            </p>
          </div>

          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex w-full md:w-1/2 flex-col gap-[18px] p-[26px] md:overflow-y-auto border-t md:border-t-0 border-field-border">
          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
              Price ₱ <span className="text-destructive">*</span>
            </label>
            <input
              type="text" // Changed from "number" to prevent browser default 'e' and '-' characters
              inputMode="decimal"
              value={price}
              onChange={(e) => {
                const val = e.target.value;
                // Only allow numbers and a single decimal point with up to 2 decimal places
                if (val === "" || /^\d{0,5}(\.\d{0,2})?$/.test(val)) {
                  setPrice(val);
                  itemForm.touch("price");
                }
              }}
              onBlur={() => itemForm.touch("price")}
              placeholder="0.00"
              aria-invalid={itemErrors.price ? true : undefined}
              className={cn(
                "w-full rounded-md border bg-white px-4 py-3 text-base text-foreground outline-none placeholder:text-placeholder",
                itemErrors.price ? "border-destructive" : "border-field-border",
              )}
            />
            {itemErrors.price ? <p className="text-xs text-destructive">{itemErrors.price}</p> : null}
          </div>

          {/* Add-ons Configuration */}
          <div className="flex flex-col gap-2 rounded-md border border-field-border bg-background p-[16px]">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
                Add-ons
              </label>
              <span className="text-xs text-placeholder">{tempAddonName.length}/100</span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              Define add-ons available specifically for this item (e.g. Extra Egg).
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex flex-col gap-2 h-[150px] overflow-y-auto pr-1">
                {newAddOns.map((addon, index) => (
                <div key={index} className="flex items-center justify-between rounded-sm bg-white p-3 shadow-sm">
                  <span className="text-sm font-medium text-foreground">{addon.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">+₱{addon.price.toFixed(2)}</span>
                    <Button variant="unstyled"
                      type="button"
                      onClick={() => setNewAddOns(newAddOns.filter((_, i) => i !== index))}
                      className="text-destructive hover:bg-error-surface p-1 rounded-sm transition-colors"
                      aria-label="Remove add-on"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  placeholder="New add-on name..."
                  value={tempAddonName}
                  onChange={(e) => {
                    setTempAddonName(e.target.value);
                    addOnForm.touch("addonName");
                  }}
                  {...lengthProps("addonName")}
                  aria-invalid={addOnForm.errors.addonName ? true : undefined}
                  className={cn(
                    "flex-1 min-w-0 rounded-md border bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-placeholder",
                    addOnForm.errors.addonName ? "border-destructive" : "border-field-border",
                  )}
                />
                <input
                  placeholder="₱ 0.00"
                  type="text"
                  inputMode="decimal"
                  value={tempAddonPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d{0,4}(\.\d{0,2})?$/.test(val)) {
                      setTempAddonPrice(val);
                      addOnForm.touch("addonPrice");
                    }
                  }}
                  aria-invalid={addOnForm.errors.addonPrice ? true : undefined}
                  className={cn(
                    "w-[70px] shrink-0 rounded-md border bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-placeholder",
                    addOnForm.errors.addonPrice ? "border-destructive" : "border-field-border",
                  )}
                />
                <Tooltip content={addOnForm.isValid ? "Add this add-on to the item" : "Enter an add-on name and price first"}>
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleAddAddOn}
                    disabled={!addOnForm.isValid}
                    aria-label="Add add-on"
                    className="flex shrink-0 items-center justify-center rounded-md bg-success px-3 py-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-5 w-5 text-white" />
                  </Button>
                </Tooltip>
              </div>
              {addOnForm.errors.addonName || addOnForm.errors.addonPrice ? (
                <p className="text-xs text-destructive">
                  {addOnForm.errors.addonName ?? addOnForm.errors.addonPrice}
                </p>
              ) : null}
            </div>
          </div>

          {/* Available toggle */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
              Available?
            </label>
            <Switch
              checked={available}
              onChange={setAvailable}
              label="Available?"
            />
          </div>

          {/* ──────────────────────────────────── Action buttons */}
          <div className="flex gap-[10px] pt-[6px]">
            {/* The form resets itself in the `isOpen` effect above once the
                dialog is closed, so Cancel only has to ask to close. */}
            <DialogDismiss fallback={onClose}>
              {(requestClose) => (
                <Button variant="unstyled"
                  type="button"
                  onClick={() => {
                    if (!isProcessing) requestClose();
                  }}
                  disabled={isProcessing}
                  className="flex flex-1 items-center justify-center rounded-md border border-field-border bg-transparent p-[14px] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-bold leading-none text-foreground">
                    Cancel
                  </span>
                </Button>
              )}
            </DialogDismiss>
            <Tooltip
              content={itemForm.isValid ? "Add this item to the menu" : "Complete the highlighted fields to continue."}
              shortcut={itemForm.isValid ? SHORTCUTS.submitForm.combo : undefined}
              className="flex-1"
            >
              <Button variant="unstyled"
                type="button"
                onClick={handleSave}
                disabled={isProcessing || !itemForm.isValid}
                className="flex w-full flex-1 items-center justify-center gap-2 rounded-md bg-accent px-[14px] py-[15px] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                <span className="text-sm font-bold leading-none text-white">
                  {isProcessing ? "Saving..." : "Add"}
                </span>
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </DialogRoot>
  );
}

