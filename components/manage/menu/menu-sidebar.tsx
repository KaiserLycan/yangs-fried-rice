"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus, X, Check } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface MenuSidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddCategory: () => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (category: string) => Promise<string | void> | void;
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
  const [justAdded, setJustAdded] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCategoriesRef = useRef(categories);

  // Auto-enter edit mode for newly added categories.
  useEffect(() => {
    if (justAdded && categories.length > prevCategoriesRef.current.length) {
      // Find the specific category that was added, since alphabetical sorting means it might not be at the end.
      const newlyAdded = categories.find(c => !prevCategoriesRef.current.includes(c));
      
      if (newlyAdded) {
        setEditingCategory(newlyAdded);
        setEditValue(newlyAdded);
      }
      setJustAdded(false);
    }
    prevCategoriesRef.current = categories;
  }, [categories, justAdded]);

  const handleAddClick = () => {
    setJustAdded(true);
    setDeleteError(null);
    onAddCategory();
  };

  // Focus the input when entering edit mode.
  useEffect(() => {
    if (editingCategory !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingCategory]);

  const startEditing = (category: string) => {
    if (category === "All") return;
    setEditingCategory(category);
    setEditValue(category);
    setDeleteError(null);
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
    <div className="flex w-full md:w-[202px] shrink-0 flex-row md:flex-col gap-2 md:gap-[6px] overflow-x-auto md:overflow-hidden p-2 md:p-[10px] scrollbar-hide">
      {/* Header - Hidden on mobile to save horizontal space */}
      <div className="hidden md:flex w-full shrink-0 flex-col items-start justify-center rounded-md py-[5px]">
        <span className="text-sm font-bold text-muted-foreground">
          Categories
        </span>
      </div>

      {deleteError && (
        <Alert tone="error" className="mb-2 w-full max-w-[200px]">
          {deleteError}
        </Alert>
      )}

      {/* Categories List */}
      <div className="flex flex-row md:flex-col shrink-0 gap-2 md:gap-[6px]">
        {categories.map((category) => {
          const isAll = category === "All";
          const isEditing = editingCategory === category;

          if (isEditing) {
            return (
              <div
                key={category}
                className="flex shrink-0 items-center gap-1 rounded-md border border-status-preparing bg-white py-[6px] pl-[12px] pr-[8px]"
              >
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={commitRename}
                  className="min-w-[100px] flex-1 bg-transparent text-sm font-bold text-foreground outline-none"
                />
                <Button variant="unstyled"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={commitRename}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-success transition-colors hover:bg-success/10"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          }

          return (
            <div
              key={category}
              className={cn(
                "group flex shrink-0 items-center rounded-md transition-colors",
                selectedCategory === category
                  ? "bg-highlight text-primary"
                  : "text-muted-strong hover:bg-black/5"
              )}
            >
              <Button variant="unstyled"
                onClick={() => {
                  setDeleteError(null);
                  onSelectCategory(category);
                }}
                onDoubleClick={() => startEditing(category)}
                className="flex flex-1 items-start justify-start py-[8px] md:py-[10px] px-3 md:pl-[12px] md:pr-[4px] whitespace-nowrap"
              >
                <span className="text-sm font-bold">{category}</span>
              </Button>

              {!isAll && (
                <Button variant="unstyled"
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setDeleteError(null);
                    const err = await onDeleteCategory(category);
                    if (err) setDeleteError(err);
                  }}
                  className="mr-[8px] hidden md:flex h-5 w-5 shrink-0 items-center justify-center rounded-sm opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        })}

        {/* Add Category */}
        <Button variant="unstyled"
          onClick={handleAddClick}
          className="flex shrink-0 items-center gap-[6px] rounded-md border border-dashed border-field-border py-[8px] md:py-[10px] px-3 md:pl-[12px] md:pr-[16px] text-muted-foreground transition-colors hover:bg-black/5 hover:text-muted-strong whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-sm font-bold">Add Category</span>
        </Button>
      </div>
    </div>
  );
}