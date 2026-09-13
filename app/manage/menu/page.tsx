"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { MenuSidebar } from "@/components/manage/menu/menu-sidebar";
import { MenuGrid } from "@/components/manage/menu/menu-grid";
import { MOCK_CATEGORIES, MenuItem } from "@/components/manage/menu/mock-menu";
import { MenuItemModal } from "@/components/manage/menu/menu-modals";
import { MenuItemDetailModal } from "@/components/manage/menu/menu-item-detail-modal";

export default function ManageMenuPage() {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // CHANGED: Categories are now dynamic state initialized from MOCK_CATEGORIES.
  // WHY: Allows the user to add, rename, and delete categories in the UI.
  // TODO (Backend): Fetch categories from the backend database (e.g., Supabase `menu_categories` table) instead of mock data.
  const [categories, setCategories] = useState<string[]>([...MOCK_CATEGORIES]);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // CHANGED: Added category management handlers (handleAddCategory, handleRenameCategory, handleDeleteCategory).
  // WHY: To support the new CRUD operations in the sidebar.
  // TODO (Backend): 
  // - handleAddCategory: Make a POST request to create a new category in the DB.
  // - handleRenameCategory: Make a PUT/PATCH request to update the category name in the DB.
  // - handleDeleteCategory: Make a DELETE request to remove the category from the DB.
  const handleAddCategory = useCallback(() => {
    let name = "New Category";
    let counter = 1;
    // Avoid duplicate names
    while (categories.includes(name)) {
      name = `New Category ${counter}`;
      counter++;
    }
    setCategories((prev) => [...prev, name]);
    setSelectedCategory(name);
  }, [categories]);

  const handleRenameCategory = useCallback(
    (oldName: string, newName: string) => {
      if (categories.includes(newName)) return; // prevent duplicates
      setCategories((prev) =>
        prev.map((c) => (c === oldName ? newName : c))
      );
      // Keep selection in sync
      if (selectedCategory === oldName) {
        setSelectedCategory(newName);
      }
    },
    [categories, selectedCategory]
  );

  const handleDeleteCategory = useCallback(
    (category: string) => {
      setCategories((prev) => prev.filter((c) => c !== category));
      // If the deleted category was selected, fall back to "All"
      if (selectedCategory === category) {
        setSelectedCategory("All");
      }
    },
    [selectedCategory]
  );

  return (
    <div className="flex h-full flex-col gap-4 md:gap-0">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 pb-[10px]">
        <h1 className="font-display text-[24px] md:text-[30px] leading-normal text-[#1a1210]">
          MENU MANAGEMENT
        </h1>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-[20px]">
          {/* Search Input */}
          <div className="flex w-full md:w-[442px] items-center gap-[10px] rounded-[10px] border border-[#ddcdb8] bg-white px-[14px] py-[10px]">
            <Search className="h-4 w-4 text-[#7a6a60]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-transparent text-[13px] md:text-[15px] text-[#7a6a60] outline-none placeholder:text-[#7a6a60]"
            />
          </div>
          
          {/* Add Item Button */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center rounded-[10px] bg-[#e8541f] px-[18px] py-[11px] transition-opacity hover:opacity-90"
          >
            <span className="text-[13px] md:text-[15px] font-bold text-white whitespace-nowrap">
              + Add item
            </span>
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar + Grid */}
      <div className="flex flex-col md:flex-row flex-1 gap-4 md:gap-[10px] overflow-hidden pt-[10px]">
        {/* Sidebar */}
        <MenuSidebar 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddCategory={handleAddCategory}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
        />

        {/* Product Grid */}
        <MenuGrid 
          searchText={searchText}
          selectedCategory={selectedCategory}
          onEditItem={(item) => {
            setSelectedItem(item);
            setIsDetailModalOpen(true);
          }}
        />
      </div>

      {/* Modals */}
      <MenuItemModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(item) => {
          console.log("Saved item:", item);
          // TODO (Backend): 
          // 1. If an image is selected, upload it to storage (e.g., Supabase Storage) first.
          // 2. Make a POST request to save the new item data (including the image URL) to the DB.
          // 3. Update local state or trigger a re-fetch to show the new item.
        }}
        categories={categories}
      />

      {selectedItem && (
        <MenuItemDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedItem(null);
          }}
          onEdit={(updatedItem) => {
            console.log("Updated item:", updatedItem);
            // TODO (Backend):
            // 1. If a new image was selected, upload it to storage and get the new URL.
            // 2. Make a PUT/PATCH request to update the item's record in the DB.
            // 3. Update local state or trigger a re-fetch.
          }}
          onDelete={(itemId) => {
            console.log("Deleted item:", itemId);
            // TODO (Backend):
            // 1. Make a DELETE request to remove the item from the DB.
            // 2. Optionally delete the associated image from storage.
            // 3. Update local state to remove the item from the UI.
          }}
          item={selectedItem}
        />
      )}
    </div>
  );
}