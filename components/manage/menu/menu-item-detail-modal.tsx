"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { useValidatedValues } from "@/lib/forms/use-live-validation";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
import { FIELD_LIMITS, lengthProps } from "@/lib/validation/fields";
import { addOnFormSchema, menuItemFormSchema } from "@/components/manage/menu/menu-modals";
import { MenuItem, MenuCategory, MOCK_CATEGORIES } from "@/components/manage/menu/mock-menu";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { createAddOn, deleteAddOn } from "@/lib/actions/menu";
import { useToast } from "@/components/ui/toast";

// ---------------------------------------------------------------------------
// Menu Item Detail Modal
// ---------------------------------------------------------------------------
interface MenuItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: MenuItem, file?: File) => void;
  onDelete: (itemId: string) => void;
  item: MenuItem;
  categories?: string[];
}

export function MenuItemDetailModal({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  item,
  categories,
}: MenuItemDetailModalProps) {
  // CHANGED: Created this detailed modal to replace the legacy confirmation modal.
  // WHY: To implement the Figma design (node 2102-5252) which requires full editing capabilities and image updates.
  // Form state — initialised from the item that was passed in.
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<MenuCategory>(item.category);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(item.price.toFixed(2));
  const [available, setAvailable] = useState(item.available);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [addOns, setAddOns] = useState(item.add_ons || []);
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const [isProcessingAddOn, setIsProcessingAddOn] = useState(false);
  const showToast = useToast();

  const selectableCategories = (categories ?? MOCK_CATEGORIES).filter(
    (c) => c !== "All"
  );

  // Confirmation dialog state
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = name !== item.name ||
                  category !== item.category ||
                  description !== item.description ||
                  price !== item.price.toFixed(2) ||
                  available !== item.available ||
                  selectedFile !== null;

  // Live validation — the same rules as the Add Item dialog.
  const itemValues = useMemo(() => ({ name, price, description }), [name, price, description]);
  const itemForm = useValidatedValues(menuItemFormSchema, itemValues);
  const addOnValues = useMemo(
    () => ({ addonName: newAddonName, addonPrice: newAddonPrice }),
    [newAddonName, newAddonPrice],
  );
  const addOnForm = useValidatedValues(addOnFormSchema, addOnValues);
  const canSave = itemForm.isValid && isDirty;

  // Ctrl/⌘+Enter asks to save, exactly as the Save button would.
  useShortcut(SHORTCUTS.submitForm.combo, () => {
    if (canSave) setShowEditConfirm(true);
    else itemForm.attemptSubmit();
  }, { enabled: isOpen && !showEditConfirm && !showDeleteConfirm });

  // Re-sync form state when the selected item changes.
  useEffect(() => {
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description);
    setPrice(item.price.toFixed(2));
    setAvailable(item.available);
    setImagePreview(null);
    setSelectedFile(null);
    setAddOns(item.add_ons || []);
    setNewAddonName("");
    setNewAddonPrice("");
  }, [item]);

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
        const url = URL.createObjectURL(compressed);
        setImagePreview(url);
      } catch {
        // Fallback to uncompressed if compression fails
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
      }
    }
  };

  const handleEditConfirm = (e: React.MouseEvent) => {
    e.preventDefault();

    onEdit({
    ...item,
    name,
    category,
      description,
      price: parseFloat(price) || 0,
      available,
    }, selectedFile || undefined);

    setShowEditConfirm(false); // Safe to keep: this just closes the small confirmation popup
  };

  const handleDeleteConfirm = () => {
    onDelete(item.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleAddAddOn = async () => {
    if (!newAddonName || !newAddonPrice) return;
    setIsProcessingAddOn(true);
    const res = await createAddOn(item.id, newAddonName, parseFloat(newAddonPrice));
    if (res.error) {
      showToast(`Failed to add add-on: ${res.error}`);
    } else if (res.data) {
      setAddOns([...addOns, res.data]);
      setNewAddonName("");
      setNewAddonPrice("");
      showToast("Add-on added.");
    }
    setIsProcessingAddOn(false);
  };

  const handleDeleteAddOn = async (addonId: string) => {
    setIsProcessingAddOn(true);
    const res = await deleteAddOn(addonId);
    if (res.error) {
      showToast(`Failed to delete add-on: ${res.error}`);
    } else {
      setAddOns(addOns.filter(a => a.addon_id !== addonId));
      showToast("Add-on removed.");
    }
    setIsProcessingAddOn(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1210]/40 p-4">
        {/* Click outside */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal card */}
        <div className="relative z-10 flex w-full max-w-[440px] md:max-w-3xl flex-col overflow-hidden rounded-[20px] bg-[#fbf6ec] shadow-[0px_30px_35px_rgba(26,18,16,0.26)]">
          <div className="flex flex-col md:flex-row w-full md:h-[650px] max-h-[90vh] overflow-y-auto md:overflow-hidden">
            {/* LEFT COLUMN */}
            <div className="flex w-full md:w-1/2 flex-col md:border-r border-[#ddcdb8] md:overflow-y-auto">
              {/* ──────────────────────────────────────────────────────── Image */}
          <div className="group relative w-full">
            <div className="relative h-[220px] w-full overflow-hidden bg-[#f6e9d9]">
              {(imagePreview || item.image) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview || item.image}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f6e9d9]">
                  <span className="text-[13px] text-[#a2938a]">No image</span>
                </div>
              )}

              {/* Hover overlay */}
              <button
                type="button"
                onClick={handleImageClick}
                className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/0 transition-colors duration-200 group-hover:bg-black/40"
              >
                <Camera className="h-8 w-8 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <span className="text-[13px] font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Update Photo
                </span>
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* ──────────────────────────────────────── Scrollable form area */}
          <div className="flex flex-col gap-[18px] p-[26px]">
            {/* Product Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
                Product Name <span className="text-[#bf4342]">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  itemForm.touch("name");
                }}
                onBlur={() => itemForm.touch("name")}
                placeholder="e.g. Yangzhou Special"
                {...lengthProps("productName")}
                aria-invalid={itemForm.errors.name ? true : undefined}
                className={cn(
                  "w-full rounded-[12px] border bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]",
                  itemForm.errors.name ? "border-[#bf4342]" : "border-[#ddcdb8]",
                )}
              />
              {itemForm.errors.name ? <p className="text-[12px] text-[#bf4342]">{itemForm.errors.name}</p> : null}
            </div>

            {/* Category */}
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
                  <span>{category}</span>
                  {categoryOpen ? (
                    <ChevronDown className="h-4 w-4 text-[#7a6a60] transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#7a6a60] transition-transform" />
                  )}
                </button>

                {/* Dropdown list */}
                {categoryOpen && (
                  <>
                    {/* Invisible backdrop to close dropdown on outside click */}
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
                            setCategory(cat as MenuCategory);
                            setCategoryOpen(false);
                          }}
                          className={`flex w-full items-center rounded-[8px] px-3 py-2.5 text-left text-[14px] transition-colors ${
                            category === cat
                              ? "bg-[#f6e9d9] font-bold text-[#8c1c13]"
                              : "text-[#1a1210] hover:bg-[#faf5eb]"
                          }`}
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
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
                Product Details
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  itemForm.touch("description");
                }}
                placeholder="Describe this menu item..."
                rows={4}
                maxLength={FIELD_LIMITS.productDetails.max}
                aria-invalid={itemForm.errors.description ? true : undefined}
                className={cn(
                  "w-full resize-none rounded-[12px] border bg-white px-4 py-3 text-[15px] leading-[22px] text-[#1a1210] outline-none placeholder:text-[#a2938a]",
                  itemForm.errors.description ? "border-[#bf4342]" : "border-[#ddcdb8]",
                )}
              />
              <p className={cn("text-[12px]", itemForm.errors.description ? "text-[#bf4342]" : "text-[#a2938a]")}>
                {itemForm.errors.description ?? `Optional. ${(description ?? "").length}/${FIELD_LIMITS.productDetails.max} characters.`}
              </p>
            </div>

            {/* Price */}
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
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d{0,5}(\.\d{0,2})?$/.test(val)) {
                    setPrice(val);
                    itemForm.touch("price");
                  }
                }}
                onBlur={() => itemForm.touch("price")}
                placeholder="0.00"
                aria-invalid={itemForm.errors.price ? true : undefined}
                className={cn(
                  "w-full rounded-[12px] border bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]",
                  itemForm.errors.price ? "border-[#bf4342]" : "border-[#ddcdb8]",
                )}
              />
              {itemForm.errors.price ? <p className="text-[12px] text-[#bf4342]">{itemForm.errors.price}</p> : null}
            </div>

            {/* Available toggle */}
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
                Available?
              </label>
              <Switch checked={available} onChange={setAvailable} />
            </div>

            {/* Add-ons Section */}
            <div className="flex flex-col gap-2 rounded-[12px] border border-[#ddcdb8] bg-[#fbf6ec] p-[16px]">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
                Add-ons
              </label>
              <p className="text-[12px] text-[#7a6a60] leading-snug">
                Define add-ons available specifically for this item (e.g. Extra Egg).
              </p>

              <div className="flex flex-col gap-2 h-[150px] overflow-y-auto pr-1 mt-2">
                {addOns.map((addon) => (
                  <div key={addon.addon_id} className="flex items-center justify-between rounded-[8px] bg-white p-3 shadow-sm">
                    <span className="text-[14px] font-medium text-[#1a1210]">{addon.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] text-[#7a6a60]">₱{Number(addon.price).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddOn(addon.addon_id)}
                        disabled={isProcessingAddOn}
                        className="text-[#bf4342] hover:bg-[#fceeed] p-1 rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {addOns.length === 0 && (
                  <div className="text-[13px] text-[#a2938a] italic px-1">No add-ons currently.</div>
                )}
              </div>

              {/* Add New Add-on */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  placeholder="New add-on name..."
                  value={newAddonName}
                  onChange={(e) => {
                    setNewAddonName(e.target.value);
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
                  value={newAddonPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d{0,4}(\.\d{0,2})?$/.test(val)) {
                      setNewAddonPrice(val);
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
                    disabled={!addOnForm.isValid || isProcessingAddOn}
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

            {/* ──────────────────────────────────────── Action buttons */}
            <div className="flex gap-[10px] pt-[6px]">
              <button
                onClick={onClose}
                className="flex flex-1 items-center justify-center rounded-[12px] border border-[#ddcdb8] bg-transparent p-[14px] transition-colors hover:bg-black/5"
              >
                <span className="text-[14px] font-bold leading-none text-[#1a1210]">
                  Cancel
                </span>
              </button>
              <Tooltip
                content={
                  canSave
                    ? "Save changes to this menu item"
                    : !isDirty
                      ? "Nothing has changed yet."
                      : "Complete the highlighted fields to continue."
                }
                shortcut={canSave ? SHORTCUTS.submitForm.combo : undefined}
                className="flex-1"
              >
                <button
                  type="button"
                  onClick={() => setShowEditConfirm(true)}
                  disabled={!canSave}
                  className="flex w-full flex-1 items-center justify-center rounded-[12px] bg-[#ca762d] px-[14px] py-[15px] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-[14px] font-bold leading-none text-white">
                    Save
                  </span>
                </button>
              </Tooltip>
            </div>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center rounded-[12px] bg-[#bf4342] px-[14px] py-[15px] transition-opacity hover:opacity-90"
            >
              <span className="text-[14px] font-bold leading-none text-white">
                Delete
              </span>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────── Edit confirmation dialog */}
      <Dialog
        open={showEditConfirm}
        onClose={() => setShowEditConfirm(false)}
        title="Are you sure?"
        description={`Updating ${name} from the menu will instantly reflect to customers. Meanwhile, ongoing orders with ${name} will remain unchanged. Do you want to update it?`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowEditConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="confirm" onClick={handleEditConfirm}>
              Update
            </Button>
          </>
        }
      />

      {/* ──────────────────────────────── Delete confirmation dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Are you sure?"
        tone="danger"
        description={`Removing ${name} from the menu will instantly reflect to customers. Meanwhile, ongoing orders with ${name} will remain unchanged. Do you want to delete it?`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="confirm" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </>
        }
      />
    </>
  );
}
