"use client";

import { useState, useRef, useEffect } from "react";
import { MenuItem, MenuCategory, MOCK_CATEGORIES } from "@/components/manage/menu/mock-menu";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ChevronDown, ChevronRight } from "lucide-react";
import { compressImage } from "@/lib/image/compress";

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

  const selectableCategories = (categories ?? MOCK_CATEGORIES).filter(
    (c) => c !== "All"
  );

  // Confirmation dialog state
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync form state when the selected item changes.
  useEffect(() => {
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description);
    setPrice(item.price.toFixed(2));
    setAvailable(item.available);
    setImagePreview(null);
    setSelectedFile(null);
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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1210]/40 p-4">
        {/* Click outside */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal card */}
        <div className="relative z-10 flex w-full max-w-[440px] flex-col overflow-hidden rounded-[20px] bg-[#fbf6ec] shadow-[0px_30px_35px_rgba(26,18,16,0.26)]">
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
          <div className="flex max-h-[calc(100vh-320px)] flex-col gap-[18px] overflow-y-auto p-[26px]">
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
                disabled={!name.trim() || !price || parseFloat(price) <= 0}
                className="flex flex-1 items-center justify-center rounded-[12px] bg-[#ca762d] px-[14px] py-[15px] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-[14px] font-bold leading-none text-white">
                  Edit
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
