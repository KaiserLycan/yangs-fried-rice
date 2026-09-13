"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus, X, Check } from "lucide-react";

interface MenuSidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddCategory: () => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (category: string) => void;
}

export function MenuSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: MenuSidebarProps) {
  // CHANGED: Added local state and refs to support inline category renaming.
  // WHY: Allows the user to rename categories directly in the sidebar without a separate modal.
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const prevLengthRef = useRef(categories.length);

  // CHANGED: Added an effect to auto-enter edit mode for newly added categories.
  // WHY: Provides a seamless UX where clicking "Add Category" immediately focuses the input to name it.
  useEffect(() => {
    if (categories.length > prevLengthRef.current) {
      const newCategory = categories[categories.length - 1];
      setEditingCategory(newCategory);
      setEditValue(newCategory);
    }
    prevLengthRef.current = categories.length;
  }, [categories]);

  // Focus the input when entering edit mode.
  useEffect(() => {
    if (editingCategory !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingCategory]);

  const startEditing = (category: string) => {
    // "All" is a virtual filter — it can't be renamed.
    if (category === "All") return;
    setEditingCategory(category);
    setEditValue(category);
  };

  const commitRename = () => {
    if (!editingCategory) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== editingCategory) {
      onRenameCategory(editingCategory, trimmed);
    }
    setEditingCategory(null);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  return (
    <div className="flex w-[202px] shrink-0 flex-col gap-[6px] overflow-hidden p-[10px]">
      {/* Header */}
      <div className="flex w-full shrink-0 flex-col items-start justify-center rounded-[10px] py-[5px]">
        <span className="text-[13px] font-bold text-[#7a6a60]">
          Categories
        </span>
      </div>

      {/* Categories List */}
      <div className="flex shrink-0 flex-col gap-[6px]">
        {categories.map((category) => {
          const isAll = category === "All";
          const isEditing = editingCategory === category;

          if (isEditing) {
            return (
              <div
                key={category}
                className="flex shrink-0 items-center gap-1 rounded-[10px] border border-[#ca762d] bg-white py-[6px] pl-[12px] pr-[8px]"
              >
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={commitRename}
                  className="min-w-0 flex-1 bg-transparent text-[13px] font-bold text-[#1a1210] outline-none"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={commitRename}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#3f6b4a] transition-colors hover:bg-[#3f6b4a]/10"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={category}
              className={cn(
                "group flex shrink-0 items-center rounded-[10px] transition-colors",
                selectedCategory === category
                  ? "bg-[#f6e9d9] text-[#8c1c13]"
                  : "text-[#5a4a42] hover:bg-black/5"
              )}
            >
              <button
                onClick={() => onSelectCategory(category)}
                onDoubleClick={() => startEditing(category)}
                className="flex flex-1 items-start justify-start py-[10px] pl-[12px] pr-[4px]"
              >
                <span className="text-[13px] font-bold">{category}</span>
              </button>

              {/* Delete button — hidden for "All", shown on hover for others */}
              {!isAll && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCategory(category);
                  }}
                  className="mr-[8px] flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 text-[#7a6a60] hover:text-[#bf4342] hover:bg-[#bf4342]/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Category */}
        <button
          onClick={onAddCategory}
          className="flex shrink-0 items-center gap-[6px] rounded-[10px] border border-dashed border-[#ddcdb8] py-[10px] pl-[12px] pr-[16px] text-[#7a6a60] transition-colors hover:bg-black/5 hover:text-[#5a4a42]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-[13px] font-bold">Add Category</span>
        </button>
      </div>
    </div>
  );
}
