"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { useValidatedValues } from "@/lib/forms/use-live-validation";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
import { DROPDOWN_FOCUS_RING, useDropdown } from "@/lib/hooks/use-dropdown";
import { FIELD_LIMITS, lengthProps } from "@/lib/validation/fields";
import { addOnFormSchema, menuItemFormSchema } from "@/components/manage/menu/menu-modals";
import type { MenuItem, MenuCategory } from "@/types/menu";
import { Dialog, DialogDismiss, DialogRoot } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { createAddOn, deleteAddOn } from "@/lib/actions/menu";
import { useToast } from "@/components/ui/toast";
import { PrepMinutesField } from "@/components/manage/menu/prep-minutes-field";

// ---------------------------------------------------------------------------
// Menu Item Detail Modal
// ---------------------------------------------------------------------------
interface MenuItemDetailModalProps {
  isManager?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: MenuItem, file?: File) => void;
  onDelete: (itemId: string) => void;
  item: MenuItem;
  categories?: string[];
}

export function MenuItemDetailModal({
  isManager = false,
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
  const [prepMinutes, setPrepMinutes] = useState(item.prepMinutes ?? 10);
  const [available, setAvailable] = useState(item.available);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryMenu = useDropdown({ open: categoryOpen, onOpenChange: setCategoryOpen });

  const [addOns, setAddOns] = useState(item.add_ons || []);
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const [isProcessingAddOn, setIsProcessingAddOn] = useState(false);
  const showToast = useToast();

  const selectableCategories = (categories ?? []).filter(
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
                  prepMinutes !== (item.prepMinutes ?? 10) ||
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
    setPrepMinutes(item.prepMinutes ?? 10);
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
      prepMinutes,
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
      showToast(`Failed to add add-on: ${res.error}`, "error");
    } else if (res.data) {
      setAddOns([...addOns, res.data]);
      setNewAddonName("");
      setNewAddonPrice("");
      showToast("Add-on added.", "success");
    }
    setIsProcessingAddOn(false);
  };

  const handleDeleteAddOn = async (addonId: string) => {
    setIsProcessingAddOn(true);
    const res = await deleteAddOn(addonId);
    if (res.error) {
      showToast(`Failed to delete add-on: ${res.error}`, "error");
    } else {
      setAddOns(addOns.filter(a => a.addon_id !== addonId));
      showToast("Add-on removed.", "success");
    }
    setIsProcessingAddOn(false);
  };

  return (
    <>
      {/* A native dialog, like the Add Item one, rather than the fixed div it
          used to be: that gives Escape, a focus trap and an inert page, and
          lets `isDirty` — computed above for the Save button — also guard
          against closing with unsaved edits. A half-typed add-on counts too,
          since closing would lose it. */}
      <DialogRoot
        open={isOpen}
        onClose={onClose}
        dirty={isDirty || newAddonName !== "" || newAddonPrice !== ""}
        className="w-[calc(100%-2rem)] max-w-[440px] md:max-w-3xl overflow-hidden rounded-lg bg-background shadow-[0px_30px_35px_rgba(26,18,16,0.26)]"
      >
        {/* Modal card */}
        <div className="relative flex w-full flex-col">
          <div className="flex flex-col md:flex-row w-full md:h-[650px] max-h-[90vh] overflow-y-auto md:overflow-hidden">
            {/* LEFT COLUMN */}
            <div className="flex w-full md:w-1/2 flex-col md:border-r border-field-border md:overflow-y-auto">
              {/* ──────────────────────────────────────────────────────── Image */}
          <div className="group relative w-full">
            <div className="relative h-[220px] w-full overflow-hidden bg-highlight">
              {(imagePreview || item.image) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview || item.image}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-highlight">
                  <span className="text-sm text-placeholder">No image</span>
                </div>
              )}

              {/* Hover overlay */}
              <Button variant="unstyled"
                type="button"
                onClick={handleImageClick}
                className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/0 transition-colors duration-200 group-hover:bg-black/40"
              >
                <Camera className="h-8 w-8 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <span className="text-sm font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Update Photo
                </span>
              </Button>
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
              <label className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
                Product Name <span className="text-destructive">*</span>
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
                    "w-full rounded-md border bg-white px-4 py-3 text-base text-foreground outline-none placeholder:text-placeholder",
                    !isManager ? "bg-track cursor-not-allowed opacity-70" : "",
                  itemForm.errors.name ? "border-destructive" : "border-field-border",
                )}
              />
              {itemForm.errors.name ? <p className="text-xs text-destructive">{itemForm.errors.name}</p> : null}
            </div>

            {/* Category */}
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
                  <span>{category}</span>
                  {categoryOpen ? (
                    <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform" />
                  ) : (
                    <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform" />
                  )}
                </Button>

                {/* Dropdown list — dismissed by Escape or an outside press. */}
                {categoryOpen && (
                  <div {...categoryMenu.listProps} className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-md border border-field-border bg-white p-[5px] shadow-[0px_8px_20px_rgba(26,18,16,0.12)]">
                    {selectableCategories.map((cat) => (
                      <Button variant="unstyled"
                        key={cat}
                        {...categoryMenu.optionProps(category === cat)}
                        onClick={() => {
                          setCategory(cat as MenuCategory);
                          categoryMenu.close();
                        }}
                        className={`flex w-full items-center rounded-sm px-3 py-2.5 text-left text-sm transition-colors ${DROPDOWN_FOCUS_RING} ${
                          category === cat
                            ? "bg-highlight font-bold text-primary"
                            : "text-foreground hover:bg-background"
                        }`}
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
              <label className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
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
                  "w-full resize-none rounded-md border bg-white px-4 py-3 text-base leading-[22px] text-foreground outline-none placeholder:text-placeholder",
                  itemForm.errors.description ? "border-destructive" : "border-field-border",
                )}
              />
              <p className={cn("text-xs", itemForm.errors.description ? "text-destructive" : "text-placeholder")}>
                {itemForm.errors.description ?? `Optional. ${(description ?? "").length}/${FIELD_LIMITS.productDetails.max} characters.`}
              </p>
            </div>

            {/* Price */}
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
                  disabled={!isManager}
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
                  "w-full rounded-md border bg-white px-4 py-3 text-base text-foreground outline-none placeholder:text-placeholder",
                  itemForm.errors.price ? "border-destructive" : "border-field-border",
                )}
              />
              {itemForm.errors.price ? <p className="text-xs text-destructive">{itemForm.errors.price}</p> : null}
            </div>

            <PrepMinutesField id={`prep-${item.id}`} value={prepMinutes} onChange={setPrepMinutes} />

            {/* Available toggle */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
                Available?
              </label>
              <Switch checked={available} onChange={setAvailable} />
            </div>

            {/* Add-ons Section */}
            <div className="flex flex-col gap-2 rounded-md border border-field-border bg-background p-[16px]">
              <label className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
                Add-ons
              </label>
              <p className="text-xs text-muted-foreground leading-snug">
                Define add-ons available specifically for this item (e.g. Extra Egg).
              </p>

              <div className="flex flex-col gap-2 h-[150px] overflow-y-auto pr-1 mt-2">
                {addOns.map((addon) => (
                  <div key={addon.addon_id} className="flex items-center justify-between rounded-sm bg-white p-3 shadow-sm">
                    <span className="text-sm font-medium text-foreground">{addon.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">₱{Number(addon.price).toFixed(2)}</span>
                      <Button variant="unstyled"
                        type="button"
                        onClick={() => handleDeleteAddOn(addon.addon_id)}
                        disabled={isProcessingAddOn}
                        className="text-destructive hover:bg-error-surface p-1 rounded-sm transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {addOns.length === 0 && (
                  <div className="text-sm text-placeholder italic px-1">No add-ons currently.</div>
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
                    "flex-1 min-w-0 rounded-md border bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-placeholder",
                    addOnForm.errors.addonName ? "border-destructive" : "border-field-border",
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
                    "w-[70px] shrink-0 rounded-md border bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-placeholder",
                      !isManager ? "bg-track cursor-not-allowed opacity-70" : "",
                    addOnForm.errors.addonPrice ? "border-destructive" : "border-field-border",
                  )}
                />
                <Tooltip content={addOnForm.isValid ? "Add this add-on to the item" : "Enter an add-on name and price first"}>
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleAddAddOn}
                    disabled={!addOnForm.isValid || isProcessingAddOn}
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

            {/* ──────────────────────────────────────── Action buttons */}
            <div className="flex gap-[10px] pt-[6px]">
              <DialogDismiss fallback={onClose}>
                {(requestClose) => (
                  <Button variant="unstyled"
                    type="button"
                    onClick={requestClose}
                    className="flex flex-1 items-center justify-center rounded-md border border-field-border bg-transparent p-[14px] transition-colors hover:bg-black/5"
                  >
                    <span className="text-sm font-bold leading-none text-foreground">
                      Cancel
                    </span>
                  </Button>
                )}
              </DialogDismiss>
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
                <Button variant="unstyled"
                  type="button"
                  onClick={() => setShowEditConfirm(true)}
                  disabled={!canSave}
                  className="flex w-full flex-1 items-center justify-center rounded-md bg-status-preparing px-[14px] py-[15px] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-bold leading-none text-white">
                    Save
                  </span>
                </Button>
              </Tooltip>
            </div>

            {/* Delete */}
            <Button variant="unstyled"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center rounded-md bg-destructive px-[14px] py-[15px] transition-opacity hover:opacity-90"
            >
              <span className="text-sm font-bold leading-none text-white">
                Delete
              </span>
            </Button>
            </div>
          </div>
        </div>
      </DialogRoot>

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
