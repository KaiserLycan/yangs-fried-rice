import { useState } from "react";
import { MenuItem, MenuCategory, MOCK_CATEGORIES } from "@/components/manage/menu/mock-menu";
import { cn } from "@/lib/utils";

// Shared Modal Backdrop
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1210]/40 p-4">
      {/* Click outside to close (optional, but good UX) */}
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[440px]">
        {children}
      </div>
    </div>
  );
}

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
  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex w-full flex-col gap-[12px] rounded-[20px] bg-[#fbf6ec] p-[26px] shadow-[0px_30px_35px_rgba(26,18,16,0.26)]">
        {/* Header */}
        <div className="w-full">
          <h2 className="font-display text-[26px] leading-none text-[#1a1210]">
            Are you sure?
          </h2>
        </div>

        {/* Message */}
        <div className="w-full">
          <p className="whitespace-pre-wrap font-sans text-[13px] leading-[19.5px] text-[#6a5348]">
            {`Updating this ${productName} from the menu will instantly reflect to customers. Meanwhile, ongoing orders with ${productName} will remain unchanged. Do you want to update it?`}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-[6px] flex w-full justify-center gap-[10px]">
          <button
            onClick={onClose}
            className="flex w-full flex-1 flex-col items-center justify-center rounded-[12px] border border-[#ddcdb8] bg-transparent p-[14px] transition-colors hover:bg-black/5"
          >
            <span className="font-sans text-[14px] font-bold leading-none text-[#1a1210]">
              Cancel
            </span>
          </button>
          
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex w-full flex-1 flex-col items-center justify-center rounded-[12px] bg-[#ca762d] px-[14px] py-[15px] transition-opacity hover:opacity-90"
          >
            <span className="font-sans text-[14px] font-bold leading-none text-white">
              Update
            </span>
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// 2. Add / Edit Item Modal (Extrapolated Design)
interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<MenuItem>) => void;
  initialData?: MenuItem; // If provided, it's Edit mode. If not, Add mode.
}

export function MenuItemModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: MenuItemModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [category, setCategory] = useState<MenuCategory>(initialData?.category || "Fried Rice");
  const [description, setDescription] = useState(initialData?.description || "");

  if (!isOpen) return null;

  const isEdit = !!initialData;
  const title = isEdit ? "Edit Menu Item" : "Add New Item";
  const actionText = isEdit ? "Save Changes" : "Add Item";

  const handleSave = () => {
    onSave({
      name,
      price: parseFloat(price) || 0,
      category,
      description,
    });
    onClose();
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex w-full max-w-[500px] flex-col gap-[20px] rounded-[20px] bg-[#fbf6ec] p-[26px] shadow-[0px_30px_35px_rgba(26,18,16,0.26)]">
        {/* Header */}
        <div className="w-full border-b border-[#ddcdb8] pb-4">
          <h2 className="font-display text-[26px] leading-none text-[#1a1210]">
            {title}
          </h2>
        </div>

        {/* Form Fields */}
        <div className="flex w-full flex-col gap-[16px]">
          {/* Image Upload Placeholder */}
          <div className="flex w-full flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[#ddcdb8] bg-white p-6">
            <span className="text-[13px] font-bold text-[#7a6a60]">Upload Image</span>
            <span className="text-[11px] text-[#a2938a]">PNG, JPG up to 5MB</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">Item Name</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yangzhou Special"
              className="w-full rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">Price (₱)</label>
              <input 
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as MenuCategory)}
                className="w-full rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none"
              >
                {MOCK_CATEGORIES.filter(c => c !== "All").map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the item..."
              rows={3}
              className="w-full resize-none rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[15px] text-[#1a1210] outline-none placeholder:text-[#a2938a]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 flex w-full justify-center gap-[10px]">
          <button
            onClick={onClose}
            className="flex flex-1 flex-col items-center justify-center rounded-[12px] border border-[#ddcdb8] bg-transparent p-[14px] transition-colors hover:bg-black/5"
          >
            <span className="font-sans text-[14px] font-bold leading-none text-[#1a1210]">
              Cancel
            </span>
          </button>
          
          <button
            onClick={handleSave}
            className="flex flex-1 flex-col items-center justify-center rounded-[12px] bg-[#e8541f] px-[14px] py-[15px] transition-opacity hover:opacity-90"
          >
            <span className="font-sans text-[14px] font-bold leading-none text-white">
              {actionText}
            </span>
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
