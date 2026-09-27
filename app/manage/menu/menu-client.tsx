"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
import { useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { MenuSidebar } from "@/components/manage/menu/menu-sidebar";
import { MenuGrid } from "@/components/manage/menu/menu-grid";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { MenuItemModal } from "@/components/manage/menu/menu-modals";
import { MenuItemDetailModal } from "@/components/manage/menu/menu-item-detail-modal";
import { useToast, ToastProvider } from "@/components/ui/toast";
import type { MenuItem, MenuItemReview } from "@/types/menu";
import { formatOrderNumber } from "@/lib/orders/order-number";

// Import real backend Server Actions and Supabase client
import {
  getMenuData, createCategory, updateCategory, deleteCategory,
  createProduct, updateProduct, deleteProduct, createAddOn,
  discardUnsavedMenuImage,
} from "@/lib/actions/menu";
import { createClient } from "@/lib/supabase/client"; // Added for Storage uploads
import { IMAGE_BUCKETS, imageExtensionFor } from "@/lib/storage/stored-image";

import { Button } from "@/components/ui/button";
import { QuickStats, type QuickStat } from "@/components/manage/quick-stats";
import type { MenuAvailabilityFilter, MenuSort } from "@/components/manage/menu/menu-grid";
/**
 * Put a menu photo in the bucket and return its public URL.
 *
 * The extension follows the file's real type — the modals hand over
 * `compressImage` output, which is always WebP whatever the original was
 * called. The name is still unique per upload, so replacing a photo never
 * overwrites one a cached page may still be showing; `updateProduct` removes
 * the previous file once the new URL is saved.
 */
async function uploadMenuImage(
  imageFile: File,
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  const supabase = createClient();
  const fileName = `${Date.now()}.${imageExtensionFor(imageFile)}`;

  const { error } = await supabase.storage
    .from(IMAGE_BUCKETS.menu)
    .upload(fileName, imageFile, { contentType: imageFile.type || undefined });
  if (error) return { url: null, error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(IMAGE_BUCKETS.menu).getPublicUrl(fileName);
  return { url: publicUrl, error: null };
}

export default function ManageMenuPage({ isManager = false }: { isManager?: boolean }) {
  return (
    <ToastProvider>
      <ManageMenuInner isManager={isManager} />
    </ToastProvider>
  );
}

function ManageMenuInner({ isManager }: { isManager?: boolean }) {
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
  const [availability, setAvailability] = useState<MenuAvailabilityFilter>("all");
  const [sort, setSort] = useState<MenuSort>("name");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Shift+N opens "Add item" (listed in the ? shortcuts overlay).
  useShortcut(SHORTCUTS.newItem.combo, () => setIsAddModalOpen(true), {
    enabled: !!isManager && !isAddModalOpen && !isDetailModalOpen && !isProcessing,
  });

  // Derived Category Strings for UI
  const categoryStrings = ["All", ...dbCategories.map(c => c.category_name)];

  // Fetch Initial Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getMenuData();

    if (res.error) {
      showToast(`Error loading menu data: ${res.error}`, "error");
    } else if (res.data) {
      setDbCategories(res.data.categories);

      // Map database schema to UI schema
      const mapped: MenuItem[] = res.data.products.map((p: any) => {
        const mappedReviews: MenuItemReview[] = (p.review || [])
          .map((r: any) => ({
            id: r.review_id,
            rating: r.rating || 0,
            comment: r.comment || "",
            customerName: r.customer?.name || "Deleted customer",
            customerPhone: r.customer?.phone_number ?? null,
            orderNumber: r.order_id
              ? formatOrderNumber(r.order?.order_number, r.order_id)
              : null,
            createdAt: r.created_at || new Date().toISOString(),
          }))
          .sort((a: MenuItemReview, b: MenuItemReview) => b.createdAt.localeCompare(a.createdAt));

        const validRatings = mappedReviews.filter((r: any) => r.rating > 0);
        const avgRating = validRatings.length > 0
          ? validRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / validRatings.length
          : 0;

        return {
          id: p.product_id,
          name: p.product_name,
          description: p.product_details || "",
          price: p.product_price,
          rating: avgRating,
          category: p.categories?.category_name || "Uncategorized",
        // Map the real image_url from the database, fallback to empty string so components can show placeholders
        image: p.image_url || "",
        available: p.is_available,
        prepMinutes: p.prep_minutes ?? 10,
        add_ons: p.add_on || [],
        reviews: mappedReviews,
      };
      });
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
    if (res.error) showToast(`Failed: ${res.error}`, "error");
    else {
      showToast("Category created.", "success");
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
    if (res.error) showToast(`Failed: ${res.error}`, "error");
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
    setIsProcessing(false);
    
    if (res.error) {
      return res.error;
    } else {
      showToast("Category deleted.", "success");
      await loadData();
      if (selectedCategory === categoryName) setSelectedCategory("All");
    }
  };

  // --- Product CRUD ---
  const handleSaveProduct = async (item: Partial<MenuItem>, addOns: { name: string; price: number }[], imageFile?: File) => {
    setIsProcessing(true);
    let uploadedUrl: string | null = null;

    // 1. Image Upload Pipeline
    if (imageFile) {
      const upload = await uploadMenuImage(imageFile);
      if (upload.error !== null) {
        showToast(`Image upload failed: ${upload.error}`, "error");
        setIsProcessing(false);
        return;
      }
      uploadedUrl = upload.url;
    }

    // 2. Database Insertion
    const targetCat = dbCategories.find(c => c.category_name === item.category);

    const res = await createProduct({
      product_name: item.name || "Untitled",
      product_price: item.price || 0,
      product_details: item.description,
      category_id: targetCat?.category_id,
      is_available: item.available ?? true,
      // New dishes start off the featured shelf; the star on the card sets it.
      is_featured: false,
      prep_minutes: item.prepMinutes ?? 10,
      image_url: uploadedUrl, // Send new URL to backend
    });

    if (res.error) {
      // The photo is already in the bucket, but no product points at it.
      if (uploadedUrl) void discardUnsavedMenuImage(uploadedUrl);
      showToast(`Failed to create item: ${res.error}`, "error");
    } else {
      // 3. Insert Add-ons if provided
      if (res.data?.product_id && addOns.length > 0) {
        await Promise.all(addOns.map(addon => createAddOn(res.data.product_id, addon.name, addon.price)));
      }

      showToast("Item created successfully.", "success");
      await loadData();
      setIsAddModalOpen(false);
    }
    setIsProcessing(false);
  };

  const handleEditProduct = async (updatedItem: MenuItem, imageFile?: File) => {
    setIsProcessing(true);
    let uploadedUrl: string | null = null;

    // 1. Image Upload Pipeline (Only triggers if a NEW image was selected)
    if (imageFile) {
      const upload = await uploadMenuImage(imageFile);
      if (upload.error !== null) {
        showToast(`Image upload failed: ${upload.error}`, "error");
        setIsProcessing(false);
        return;
      }
      uploadedUrl = upload.url;
    }

    // 2. Database Update
    const targetCat = dbCategories.find(c => c.category_name === updatedItem.category);

    const updatePayload: Record<string, any> = {
      product_name: updatedItem.name,
      product_price: updatedItem.price,
      product_details: updatedItem.description,
      category_id: targetCat?.category_id,
      is_available: updatedItem.available,
      prep_minutes: updatedItem.prepMinutes ?? 10,
    };

    // Only update the image column if a new image was actually uploaded
    if (uploadedUrl) {
      updatePayload.image_url = uploadedUrl;
    }

    const res = await updateProduct(updatedItem.id, updatePayload);

    if (res.error) {
      if (uploadedUrl) void discardUnsavedMenuImage(uploadedUrl);
      showToast(`Failed to update item: ${res.error}`, "error");
    } else {
      showToast("Item updated successfully.", "success");
      await loadData();
      setIsDetailModalOpen(false);
      setSelectedItem(null);
    }
    setIsProcessing(false);
  };

  const handleDeleteProduct = async (itemId: string) => {
    setIsProcessing(true);
    const res = await deleteProduct(itemId);

    if (res.error) showToast(`Failed to delete item: ${res.error}`, "error");
    else {
      showToast("Item deleted.", "success");
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
        <h1 className="font-display text-2xl md:text-3xl leading-normal text-foreground">
          MENU MANAGEMENT
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-[20px]">
          <div className="flex w-full md:w-[442px] items-center gap-[10px] rounded-md border border-field-border bg-white px-[14px] py-[10px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-transparent text-sm md:text-base text-muted-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* A new dish comes with a price, and prices are manager-only. */}
          {isManager && (
            <Tooltip
              content="Add a new dish to the menu"
              shortcut={SHORTCUTS.newItem.combo}
              side="bottom"
            >
              <Button variant="unstyled"
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                disabled={isProcessing}
                className="flex items-center justify-center rounded-md bg-accent px-[18px] py-[11px] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <span className="text-sm md:text-base font-bold text-white whitespace-nowrap">
                  + Add item
                </span>
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* At a glance (FINALE: quick statistics on menu management) */}
      <div className="pb-3">
        <QuickStats label="Menu at a glance" isLoading={isLoading} stats={menuStats(menuItems, categoryStrings.length)} />
      </div>

      {/* Filter and sort */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Show
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as MenuAvailabilityFilter)}
            className="h-10 rounded-md border border-field-border bg-white px-3 text-sm text-foreground"
          >
            <option value="all">All dishes</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as MenuSort)}
            className="h-10 rounded-md border border-field-border bg-white px-3 text-sm text-foreground"
          >
            <option value="name">Name (A–Z)</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Rating: highest first</option>
            <option value="prep">Prep time: longest first</option>
          </select>
        </label>
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
          availability={availability}
          sort={sort}
          items={menuItems}
          isLoading={isLoading}
          onEditItem={(item) => {
            setSelectedItem(item);
            setIsDetailModalOpen(true);
          }}
        />
      </div>

      {/* Modals */}
      <MenuItemModal isManager={isManager}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveProduct}
        categories={categoryStrings}
        isProcessing={isProcessing}
      />

      {selectedItem && (
        <MenuItemDetailModal isManager={isManager}
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
/** The numbers across the top of the menu screen (FINALE: quick statistics). */
function menuStats(items: MenuItem[], categoryCount: number): QuickStat[] {
  const available = items.filter((i) => i.available).length;
  const rated = items.filter((i) => i.rating > 0);
  const average = rated.length ? rated.reduce((sum, i) => sum + i.rating, 0) / rated.length : 0;
  const prices = items.map((i) => i.price);
  return [
    { label: "Dishes", value: items.length, hint: `${categoryCount} categories` },
    { label: "Available", value: available, tone: "good" },
    { label: "Unavailable", value: items.length - available, tone: items.length - available > 0 ? "warn" : "default" },
    { label: "Avg rating", value: rated.length ? average.toFixed(1) : "—", hint: `${rated.length} rated` },
    { label: "No reviews yet", value: items.length - rated.length },
    { label: "Price range", value: prices.length ? `₱${Math.min(...prices)}–${Math.max(...prices)}` : "—" },
  ];
}
