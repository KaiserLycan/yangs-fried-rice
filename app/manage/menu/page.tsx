"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { MenuSidebar } from "@/components/manage/menu/menu-sidebar";
import { MenuGrid } from "@/components/manage/menu/menu-grid";
import { MenuCategory, MOCK_CATEGORIES, MenuItem } from "@/components/manage/menu/mock-menu";
import { ConfirmationModal, MenuItemModal } from "@/components/manage/menu/menu-modals";

export default function ManageMenuPage() {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("All");
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItemToUpdate, setSelectedItemToUpdate] = useState<MenuItem | null>(null);

  return (
    <div className="flex h-full flex-col">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-[10px]">
        <h1 className="font-display text-[30px] leading-normal text-[#1a1210]">
          MENU MANAGEMENT
        </h1>
        
        <div className="flex items-center gap-[20px]">
          {/* Search Input */}
          <div className="flex w-[442px] items-center gap-[10px] rounded-[10px] border border-[#ddcdb8] bg-white px-[14px] py-[10px]">
            <Search className="h-4 w-4 text-[#7a6a60]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-transparent text-[13px] text-[#7a6a60] outline-none placeholder:text-[#7a6a60]"
            />
          </div>
          
          {/* Add Item Button */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center rounded-[10px] bg-[#e8541f] px-[18px] py-[11px] transition-opacity hover:opacity-90"
          >
            <span className="text-[13px] font-bold text-white">
              + Add item
            </span>
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar + Grid */}
      <div className="flex flex-1 gap-[10px] overflow-hidden pt-[10px]">
        {/* Sidebar */}
        <MenuSidebar 
          categories={MOCK_CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Product Grid */}
        <MenuGrid 
          searchText={searchText}
          selectedCategory={selectedCategory}
          onEditItem={(item) => {
            setSelectedItemToUpdate(item);
            setIsUpdateModalOpen(true);
          }}
        />
      </div>

      {/* Modals */}
      <MenuItemModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(item) => {
          console.log("Saved item:", item);
          // In real implementation, this would trigger a re-fetch or state update
        }}
      />

      <ConfirmationModal 
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedItemToUpdate(null);
        }}
        onConfirm={() => {
          console.log("Updated item:", selectedItemToUpdate);
        }}
        productName={selectedItemToUpdate?.name || "this item"}
      />
    </div>
  );
}
