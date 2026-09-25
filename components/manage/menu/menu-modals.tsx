import { useState, useRef, useMemo, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { MenuItem, MenuCategory, MOCK_CATEGORIES } from "@/components/manage/menu/mock-menu";
import { cn } from "@/lib/utils";
import { Camera, ChevronDown, ChevronRight, Trash2, Plus, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { Dialog, DialogRoot } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useValidatedValues } from "@/lib/forms/use-live-validation";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
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
  const selectableCategories = (categories ?? MOCK_CATEGORIES).filter(
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

  return (
    <DialogRoot
      open={isOpen}
      onClose={onClose}
      className="w-full max-w-[440px] md:max-w-3xl overflow-hidden rounded-[20px] bg-[#fbf6ec] shadow-[0px_30px_35px_rgba(26,18,16,0.26)]"
    >
      <div className="flex flex-col md:flex-row w-full md:h-[650px] max-h-[90vh] overflow-y-auto md:overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex w-full md:w-1/2 flex-col md:border-r border-[#ddcdb8] md:overflow-y-auto">
          {/* ──────────────────────────────────── Image upload area */}
        <div className="group relative w-full">
          <div className="relative h-[220px] w-full overflow-hidden bg-[#e7d7c1]">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <button
                type="button"
                onClick={handleImageClick}
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2"
              >
                <Camera className="h-10 w-10 text-[#a2938a]" />
                <span className="text-[14px] font-bold text-[#7a6a60]">
                  Upload Image
                </span>
              </button>
            )}

            {/* Hover overlay — only when an image is already picked */}
            {imagePreview && (
              <button
                type="button"
                onClick={handleImageClick}
                className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/0 transition-colors duration-200 group-hover:bg-black/40"
              >
                <Camera className="h-8 w-8 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <span className="text-[13px] font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Change Photo
                </span>
              </button>
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
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
                Product Name <span className="text-[#bf4342]">*</span>
              </label>
              <span className="text-[11px] text-[#a2938a]">{name.length}/{FIELD_LIMITS.productName.max}</span>
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
                "w-full rounded-[12px] border bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]",
                itemErrors.name ? "border-[#bf4342]" : "border-[#ddcdb8]",
              )}
            />
            {itemErrors.name ? <p className="text-[12px] text-[#bf4342]">{itemErrors.name}</p> : null}
          </div>

          {/* Category — custom dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
              Category <span className="text-[#bf4342]">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none transition-colors hover:bg-[#faf5eb]"
              >
                <span>{displayCategory}</span>
                {categoryOpen ? (
                  <ChevronDown className="h-4 w-4 text-[#7a6a60] transition-transform" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#7a6a60] transition-transform" />
                )}
              </button>

              {categoryOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setCategoryOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-[12px] border border-[#ddcdb8] bg-white p-[5px] shadow-[0px_8px_20px_rgba(26,18,16,0.12)]">
                    {selectableCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          setCategoryOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center rounded-[8px] px-3 py-2.5 text-left text-[14px] transition-colors",
                          displayCategory === cat
                            ? "bg-[#f6e9d9] font-bold text-[#8c1c13]"
                            : "text-[#1a1210] hover:bg-[#faf5eb]"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
                Product Details
              </label>
              <span className="text-[11px] text-[#a2938a]">{description.length}/{FIELD_LIMITS.productDetails.max}</span>
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
                "w-full resize-none rounded-[12px] border bg-white px-4 py-3 text-[15px] leading-[22px] text-[#1a1210] outline-none placeholder:text-[#a2938a]",
                itemErrors.description ? "border-[#bf4342]" : "border-[#ddcdb8]",
              )}
            />
            <p className={cn("text-[12px]", itemErrors.description ? "text-[#bf4342]" : "text-[#a2938a]")}>
              {itemErrors.description ?? `Optional. ${description.length}/${FIELD_LIMITS.productDetails.max} characters.`}
            </p>
          </div>

          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex w-full md:w-1/2 flex-col gap-[18px] p-[26px] md:overflow-y-auto border-t md:border-t-0 border-[#ddcdb8]">
          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
              Price ₱ <span className="text-[#bf4342]">*</span>
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
                "w-full rounded-[12px] border bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]",
                itemErrors.price ? "border-[#bf4342]" : "border-[#ddcdb8]",
              )}
            />
            {itemErrors.price ? <p className="text-[12px] text-[#bf4342]">{itemErrors.price}</p> : null}
          </div>

          {/* Add-ons Configuration */}
          <div className="flex flex-col gap-2 rounded-[12px] border border-[#ddcdb8] bg-[#fbf6ec] p-[16px]">
            <div className="flex justify-between items-end">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
                Add-ons
              </label>
              <span className="text-[11px] text-[#a2938a]">{tempAddonName.length}/100</span>
            </div>
            <p className="text-[12px] text-[#7a6a60] leading-snug">
              Define add-ons available specifically for this item (e.g. Extra Egg).
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex flex-col gap-2 h-[150px] overflow-y-auto pr-1">
                {newAddOns.map((addon, index) => (
                <div key={index} className="flex items-center justify-between rounded-[8px] bg-white p-3 shadow-sm">
                  <span className="text-[14px] font-medium text-[#1a1210]">{addon.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] text-[#7a6a60]">+₱{addon.price.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => setNewAddOns(newAddOns.filter((_, i) => i !== index))}
                      className="text-[#bf4342] hover:bg-[#fceeed] p-1 rounded transition-colors"
                      aria-label="Remove add-on"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                    "flex-1 min-w-0 rounded-[10px] border bg-white px-3 py-2 text-[14px] text-[#1a1210] outline-none placeholder:text-[#a2938a]",
                    addOnForm.errors.addonName ? "border-[#bf4342]" : "border-[#ddcdb8]",
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
                    "w-[70px] shrink-0 rounded-[10px] border bg-white px-3 py-2 text-[14px] text-[#1a1210] outline-none placeholder:text-[#a2938a]",
                    addOnForm.errors.addonPrice ? "border-[#bf4342]" : "border-[#ddcdb8]",
                  )}
                />
                <Tooltip content={addOnForm.isValid ? "Add this add-on to the item" : "Enter an add-on name and price first"}>
                  <button
                    type="button"
                    onClick={handleAddAddOn}
                    disabled={!addOnForm.isValid}
                    aria-label="Add add-on"
                    className="flex shrink-0 items-center justify-center rounded-[10px] bg-[#3f6b4a] px-3 py-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-5 w-5 text-white" />
                  </button>
                </Tooltip>
              </div>
              {addOnForm.errors.addonName || addOnForm.errors.addonPrice ? (
                <p className="text-[12px] text-[#bf4342]">
                  {addOnForm.errors.addonName ?? addOnForm.errors.addonPrice}
                </p>
              ) : null}
            </div>
          </div>

          {/* Available toggle */}
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
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
            <button
              onClick={() => {
                if (!isProcessing) {
                  // Explicitly reset form in case onClose doesn't trigger effect soon enough
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
                  onClose();
                }
              }}
              disabled={isProcessing}
              className="flex flex-1 items-center justify-center rounded-[12px] border border-[#ddcdb8] bg-transparent p-[14px] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-[14px] font-bold leading-none text-[#1a1210]">
                Cancel
              </span>
            </button>
            <Tooltip
              content={itemForm.isValid ? "Add this item to the menu" : "Complete the highlighted fields to continue."}
              shortcut={itemForm.isValid ? SHORTCUTS.submitForm.combo : undefined}
              className="flex-1"
            >
              <button
                type="button"
                onClick={handleSave}
                disabled={isProcessing || !itemForm.isValid}
                className="flex w-full flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#e8541f] px-[14px] py-[15px] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                <span className="text-[14px] font-bold leading-none text-white">
                  {isProcessing ? "Saving..." : "Add"}
                </span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </DialogRoot>
  );
}

