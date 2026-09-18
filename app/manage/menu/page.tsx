"use client";

import { useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { MenuSidebar } from "@/components/manage/menu/menu-sidebar";
import { MenuGrid } from "@/components/manage/menu/menu-grid";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { MenuItemModal } from "@/components/manage/menu/menu-modals";
import { MenuItemDetailModal } from "@/components/manage/menu/menu-item-detail-modal";
import { useToast, ToastProvider } from "@/components/ui/toast";
import type { MenuItem } from "@/components/manage/menu/mock-menu";

// Import real backend Server Actions and Supabase client
import { 
  getMenuData, createCategory, updateCategory, deleteCategory,
  createProduct, updateProduct, deleteProduct 
} from "@/lib/actions/menu";
import { createClient } from "@/lib/supabase/client"; // Added for Storage uploads

export default function ManageMenuPage() {
  return (
    <ToastProvider>
      <ManageMenuInner />
    </ToastProvider>
  );
}

function ManageMenuInner() {
  const showToast = useToast();

  // Data State
  const [dbCategories, setDbCategories] = useState<{ category_id: string; category_name: string }[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI State
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Derived Category Strings for UI
  const categoryStrings = ["All", ...dbCategories.map(c => c.category_name)];

  // Fetch Initial Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getMenuData();

    if (res.error) {
      showToast(`Error loading menu data: ${res.error}`);
    } else if (res.data) {
      setDbCategories(res.data.categories);
      
      // Map database schema to UI schema
      const mapped: MenuItem[] = res.data.products.map((p: any) => ({
        id: p.product_id,
        name: p.product_name,
        description: p.product_details || "",
        price: p.product_price,
        rating: 5.0, // Backend doesn't have ratings yet
        category: p.categories?.category_name || "Uncategorized",
        // Map the real image_url from the database, fallback to a placeholder
        image: p.image_url || "/images/placeholder.jpg",
        available: p.is_available,
      }));
      setMenuItems(mapped);
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Category CRUD ---
  const handleAddCategory = async () => {
    setIsProcessing(true);
    let name = "New Category";
    let counter = 1;
    while (dbCategories.some(c => c.category_name === name)) {
      name = `New Category ${counter++}`;
    }
    
    const res = await createCategory({ category_name: name });
    if (res.error) showToast(`Failed: ${res.error}`);
    else {
      showToast("Category created.");
      await loadData();
      setSelectedCategory(name);
    }
    setIsProcessing(false);
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (dbCategories.some(c => c.category_name === newName)) return;
    const cat = dbCategories.find(c => c.category_name === oldName);
    if (!cat) return;

    setIsProcessing(true);
    const res = await updateCategory(cat.category_id, { category_name: newName });
    if (res.error) showToast(`Failed: ${res.error}`);
    else {
      await loadData();
      if (selectedCategory === oldName) setSelectedCategory(newName);
    }
    setIsProcessing(false);
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const cat = dbCategories.find(c => c.category_name === categoryName);
    if (!cat) return;

    setIsProcessing(true);
    const res = await deleteCategory(cat.category_id);
    if (res.error) showToast(`Failed: ${res.error}`);
    else {
      showToast("Category deleted.");
      await loadData();
      if (selectedCategory === categoryName) setSelectedCategory("All");
    }
    setIsProcessing(false);
  };

  // --- Product CRUD ---
  const handleSaveProduct = async (item: Partial<MenuItem>, imageFile?: File) => {
    setIsProcessing(true);
    let uploadedUrl = null;
    const supabase = createClient();

    // 1. Image Upload Pipeline
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, imageFile);

      if (uploadError) {
        showToast(`Image upload failed: ${uploadError.message}`);
        setIsProcessing(false);
        return;
      }

      // Grab the public URL for the newly uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);
        
      uploadedUrl = publicUrl;
    }

    // 2. Database Insertion
    const targetCat = dbCategories.find(c => c.category_name === item.category);
    
    const res = await createProduct({
      product_name: item.name || "Untitled",
      product_price: item.price || 0,
      product_details: item.description,
      category_id: targetCat?.category_id,
      is_available: item.available ?? true,
      image_url: uploadedUrl, // Send new URL to backend
    });

    if (res.error) showToast(`Failed to create item: ${res.error}`);
    else {
      showToast("Item created successfully.");
      await loadData();
      setIsAddModalOpen(false);
    }
    setIsProcessing(false);
  };

  const handleEditProduct = async (updatedItem: MenuItem, imageFile?: File) => {
    setIsProcessing(true);
    let uploadedUrl = null;
    const supabase = createClient();

    // 1. Image Upload Pipeline (Only triggers if a NEW image was selected)
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, imageFile);

      if (uploadError) {
        showToast(`Image upload failed: ${uploadError.message}`);
        setIsProcessing(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);
        
      uploadedUrl = publicUrl;
    }

    // 2. Database Update
    const targetCat = dbCategories.find(c => c.category_name === updatedItem.category);
    
    const updatePayload: Record<string, any> = {
      product_name: updatedItem.name,
      product_price: updatedItem.price,
      product_details: updatedItem.description,
      category_id: targetCat?.category_id,
      is_available: updatedItem.available,
    };

    // Only update the image column if a new image was actually uploaded
    if (uploadedUrl) {
      updatePayload.image_url = uploadedUrl;
    }

    const res = await updateProduct(updatedItem.id, updatePayload);

    if (res.error) showToast(`Failed to update item: ${res.error}`);
    else {
      showToast("Item updated successfully.");
      await loadData();
      setIsDetailModalOpen(false);
      setSelectedItem(null);
    }
    setIsProcessing(false);
  };

  const handleDeleteProduct = async (itemId: string) => {
    setIsProcessing(true);
    const res = await deleteProduct(itemId);
    
    if (res.error) showToast(`Failed to delete item: ${res.error}`);
    else {
      showToast("Item deleted.");
      await loadData();
      setIsDetailModalOpen(false);
      setSelectedItem(null);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex h-full flex-col gap-4 md:gap-0">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 pb-[10px]">
        <h1 className="font-display text-[24px] md:text-[30px] leading-normal text-[#1a1210]">
          MENU MANAGEMENT
        </h1>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-[20px]">
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
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            disabled={isProcessing}
            className="flex items-center justify-center rounded-[10px] bg-[#e8541f] px-[18px] py-[11px] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <span className="text-[13px] md:text-[15px] font-bold text-white whitespace-nowrap">
              + Add item
            </span>
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar + Grid */}
      <div className="flex flex-col md:flex-row flex-1 gap-4 md:gap-[10px] overflow-hidden pt-[10px]">
        <MenuSidebar 
          categories={categoryStrings}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddCategory={handleAddCategory}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
        />

        <MenuGrid 
          searchText={debouncedSearchText}
          selectedCategory={selectedCategory}
          items={menuItems}
          isLoading={isLoading}
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
        onSave={handleSaveProduct}
        categories={categoryStrings}
      />

      {selectedItem && (
        <MenuItemDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedItem(null);
          }}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          item={selectedItem}
          categories={categoryStrings}
        />
      )}
    </div>
  );
}