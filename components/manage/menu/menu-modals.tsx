import { useState, useRef } from "react";
import { MenuItem, MenuCategory, MOCK_CATEGORIES } from "@/components/manage/menu/mock-menu";
import { cn } from "@/lib/utils";
import { Camera, ChevronDown, ChevronRight } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { Dialog, DialogRoot } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  onSave: (item: Partial<MenuItem>, file?: File) => void;
  categories?: string[];
}

export function MenuItemModal({
  isOpen,
  onClose,
  onSave,
  categories,
}: MenuItemModalProps) {
  // Redesigned the modal to match the Figma design (node 2102-5225).
  // Needed image upload, custom category dropdown, and availability toggle for new items.
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setImagePreview(URL.createObjectURL(compressed));
      } catch {
        // Fallback to uncompressed if compression fails
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    
    onSave({
      name,
      price: parseFloat(price) || 0,
      // Added a safe fallback string before the cast so TS knows it's never undefined
      category: (category || selectableCategories[0] || "Uncategorized") as MenuCategory,
      description,
      available,
    }, file);
  };

  // Safe fallback for the display label as well
  const displayCategory = category || selectableCategories[0] || "Select";

  return (
    <DialogRoot
      open={isOpen}
      onClose={onClose}
      className="max-w-[440px] overflow-hidden rounded-[20px] bg-[#fbf6ec] shadow-[0px_30px_35px_rgba(26,18,16,0.26)]"
    >
      <div className="flex w-full flex-col">
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
        <div className="flex max-h-[calc(100vh-320px)] flex-col gap-[18px] overflow-y-auto p-[26px]">
          {/* Product Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
              Product Name <span className="text-[#bf4342]">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product Name"
              className="w-full rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]"
            />
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
            <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
              Product Details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="placeholder"
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
              type="text" // Changed from "number" to prevent browser default 'e' and '-' characters
              inputMode="decimal"
              value={price}
              onChange={(e) => {
                const val = e.target.value;
                // Only allow numbers and a single decimal point with up to 2 decimal places
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
            <button
              type="button"
              role="switch"
              aria-checked={available}
              onClick={() => setAvailable(!available)}
              className="relative inline-flex h-[26px] w-[48px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
              style={{ backgroundColor: available ? "#3f6b4a" : "#ddcdb8" }}
            >
              <span
                className="pointer-events-none inline-block h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{
                  transform: available
                    ? "translateX(24px)"
                    : "translateX(4px)",
                }}
              />
            </button>
          </div>

          {/* ──────────────────────────────────── Action buttons */}
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
              type="button"
              onClick={handleSave}
              disabled={!name.trim() || !price || parseFloat(price) <= 0}
              className="flex flex-1 items-center justify-center rounded-[12px] bg-[#e8541f] px-[14px] py-[15px] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-[14px] font-bold leading-none text-white">
                Add
              </span>
            </button>
          </div>
        </div>
      </div>
    </DialogRoot>
  );
}

