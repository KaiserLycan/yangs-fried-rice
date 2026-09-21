"use client";

import { useState, useRef, useEffect } from "react";
import { MenuItem, MenuCategory, MOCK_CATEGORIES } from "@/components/manage/menu/mock-menu";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { createAddOn, deleteAddOn } from "@/lib/actions/menu";
import { useToast } from "@/components/ui/toast";

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-[26px] w-[48px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? "#3f6b4a" : "#ddcdb8" }}
    >
      <span
        className="pointer-events-none inline-block h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          transform: checked ? "translateX(24px)" : "translateX(4px)",
        }}
      />
    </button>
  );
}

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
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Yangzhou Special"
                className="w-full rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]"
              />
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this menu item..."
                rows={4}
                className="w-full resize-none rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[15px] leading-[22px] text-[#1a1210] outline-none placeholder:text-[#a2938a]"
              />
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
                  if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                    setPrice(val);
                  }
                }}
                placeholder="0.00"
                className="w-full rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]"
              />
            </div>

            {/* Available toggle */}
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
                Available?
              </label>
              <ToggleSwitch checked={available} onChange={setAvailable} />
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
                  onChange={(e) => setNewAddonName(e.target.value)}
                  className="flex-1 rounded-[10px] border border-[#ddcdb8] bg-white px-3 py-2 text-[14px] text-[#1a1210] outline-none placeholder:text-[#a2938a]"
                />
                <input
                  placeholder="₱ 0.00"
                  type="text"
                  inputMode="decimal"
                  value={newAddonPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                      setNewAddonPrice(val);
                    }
                  }}
                  className="w-[80px] rounded-[10px] border border-[#ddcdb8] bg-white px-3 py-2 text-[14px] text-[#1a1210] outline-none placeholder:text-[#a2938a]"
                />
                <button
                  type="button"
                  onClick={handleAddAddOn}
                  disabled={!newAddonName.trim() || !newAddonPrice || parseFloat(newAddonPrice) < 0 || isProcessingAddOn}
                  className="flex shrink-0 items-center justify-center rounded-[10px] bg-[#3f6b4a] px-3 py-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Reviews */}
            <div className="flex flex-col gap-2 rounded-[12px] border border-[#ddcdb8] bg-[#fbf6ec] p-[16px]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
                  Reviews
                </label>
                {item.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-bold text-[#e8541f]">★ {item.rating.toFixed(1)}</span>
                    <span className="text-[12px] text-[#a2938a]">({item.reviews?.length || 0})</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3 mt-2">
                {(!item.reviews || item.reviews.length === 0) ? (
                  <p className="text-[13px] text-[#a2938a] italic">No reviews yet.</p>
                ) : (
                  item.reviews.slice(0, 5).map((rev) => (
                    <div key={rev.id} className="flex flex-col gap-1 border-b border-[#ddcdb8] pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#1a1210]">{rev.customerName}</span>
                        <span className="text-[12px] text-[#e8541f]">★ {rev.rating}</span>
                      </div>
                      {rev.comment && <p className="text-[12px] text-[#7a6a60] leading-snug">"{rev.comment}"</p>}
                    </div>
                  ))
                )}
              </div>
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
              <button
                onClick={() => setShowEditConfirm(true)}
                disabled={!name.trim() || !price || parseFloat(price) <= 0 || !isDirty}
                className="flex flex-1 items-center justify-center rounded-[12px] bg-[#ca762d] px-[14px] py-[15px] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-[14px] font-bold leading-none text-white">
                  Save
                </span>
              </button>
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
