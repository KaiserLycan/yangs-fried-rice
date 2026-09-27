"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import { ManagePagination } from "@/components/manage/manage-pagination";
import { SortableHeader } from "@/components/manage/sortable-header";
import { PromotionModal } from "@/components/manage/promotions/promotion-modal";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "@/lib/actions/promotions";
import Image from "next/image";

export default function ManagePromotionsPage() {
  const showToast = useToast();

  const [promotions, setPromotions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortField, setSortField] = useState<"title" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any | null>(null);
  const [promotionToDelete, setPromotionToDelete] = useState<any | null>(null);
  const [promotionToAdd, setPromotionToAdd] = useState<any | null>(null);
  const [promotionToEdit, setPromotionToEdit] = useState<any | null>(null);

  useShortcut(SHORTCUTS.newItem.combo, () => {
    setIsAddModalOpen(true);
  }, { enabled: !isAddModalOpen && selectedPromotion === null });

  const loadPromotions = useCallback(async () => {
    setIsLoading(true);
    const result = await getAllPromotions();
    if (result.error) {
      showToast(`Failed to load promotions: ${result.error}`, "error");
    } else {
      setPromotions(result.data || []);
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleAddConfirm = async () => {
    if (!promotionToAdd) return;
    setIsProcessing(true);

    const formData = new FormData();
    if (promotionToAdd.imageFile) {
      formData.append("file", promotionToAdd.imageFile);
    }
    
    const result = await createPromotion({
      title: promotionToAdd.title,
      description: promotionToAdd.description,
      starts_at: promotionToAdd.starts_at,
      ends_at: promotionToAdd.ends_at,
      is_active: promotionToAdd.is_active,
    }, formData);

    if (result.error) {
      showToast(`Failed to create promotion: ${result.error}`, "error");
    } else {
      showToast("Promotion created successfully.", "success");
      await loadPromotions();
      setIsAddModalOpen(false);
      setPromotionToAdd(null);
    }
    setIsProcessing(false);
  };

  const handleEditConfirm = async () => {
    if (!promotionToEdit || !selectedPromotion) return;
    setIsProcessing(true);

    const formData = new FormData();
    if (promotionToEdit.imageFile) {
      formData.append("file", promotionToEdit.imageFile);
    }

    const result = await updatePromotion(selectedPromotion.id, {
      title: promotionToEdit.title,
      description: promotionToEdit.description,
      starts_at: promotionToEdit.starts_at,
      ends_at: promotionToEdit.ends_at,
      is_active: promotionToEdit.is_active,
    }, promotionToEdit.imageFile ? formData : undefined);

    if (result.error) {
      showToast(`Failed to update promotion: ${result.error}`, "error");
    } else {
      showToast("Promotion updated successfully.", "success");
      await loadPromotions();
      setSelectedPromotion(null);
      setPromotionToEdit(null);
    }
    setIsProcessing(false);
  };

  const handleDeleteConfirm = async () => {
    if (!promotionToDelete) return;
    setIsProcessing(true);
    
    const result = await deletePromotion(promotionToDelete.id);
    if (result.error) {
      showToast(`Failed to delete promotion: ${result.error}`, "error");
    } else {
      showToast("Promotion deleted successfully.", "success");
      await loadPromotions();
      setPromotionToDelete(null);
      setSelectedPromotion(null);
    }
    setIsProcessing(false);
  };

  let filteredPromotions = [...promotions];
  if (debouncedSearchQuery) {
    const q = debouncedSearchQuery.toLowerCase();
    filteredPromotions = filteredPromotions.filter(p => p.title.toLowerCase().includes(q));
  }

  if (sortField === "title") {
    filteredPromotions.sort((a, b) => sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
  } else {
    filteredPromotions.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / pageSize));
  if (currentPage > totalPages) setCurrentPage(totalPages);
  const paginatedPromotions = filteredPromotions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col h-full gap-4 md:gap-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-[10px] md:mb-8 gap-4 md:gap-4">
        <h1 className="font-display text-2xl md:text-3xl leading-normal text-foreground">PROMOTIONS</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-[20px]">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-placeholder" />
            <input 
              type="text"
              placeholder="Search promotions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-[280px] h-[45px] pl-11 pr-4 rounded-md border border-field-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Tooltip content="Create a new promotion" shortcut={SHORTCUTS.newItem.combo} side="bottom">
            <Button variant="unstyled" className="bg-accent text-white font-bold text-sm px-[18px] py-[11px] rounded-md hover:bg-accent/90 whitespace-nowrap" onClick={() => setIsAddModalOpen(true)}>
              + New Promotion
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-md overflow-hidden flex flex-col min-h-0 border border-track shadow-sm">
          <div className="hidden md:grid grid-cols-[3fr_2fr_1fr] px-8 py-5 border-b border-track bg-track text-xs font-bold text-muted-foreground uppercase tracking-[1px]">
            <SortableHeader label="Title" currentSort={sortField === "title" ? sortOrder : "none"} onSortChange={(s) => { setSortField("title"); setSortOrder(s === "none" ? "asc" : s); }} />
            <div className="flex items-center">Duration</div>
            <div className="flex items-center">Status</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : paginatedPromotions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No promotions found.</div>
            ) : (
              paginatedPromotions.map((promo, idx) => (
                <div key={promo.id} className={`flex flex-col md:grid md:grid-cols-[3fr_2fr_1fr] px-5 md:px-8 py-4 cursor-pointer hover:bg-background gap-2 md:gap-0 ${idx !== paginatedPromotions.length - 1 ? "border-b border-track" : ""}`} onClick={() => setSelectedPromotion(promo)}>
                  <div className="font-bold text-base flex items-center gap-4">
                    {promo.image_url && <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted"><Image src={promo.image_url} alt={promo.title} fill className="object-cover" /></div>}
                    <div>
                       {promo.title}
                       <p className="text-xs text-muted-foreground font-normal line-clamp-1">{promo.description}</p>
                    </div>
                  </div>
                  <div className="text-sm md:flex md:items-center">
                    {new Date(promo.starts_at).toLocaleDateString()} - {new Date(promo.ends_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm md:flex md:items-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {promo.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="mt-4 md:mt-8 mb-4 flex justify-center md:justify-end">
          <ManagePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        </div>
      </div>

      <PromotionModal 
        isOpen={isAddModalOpen || selectedPromotion !== null} 
        onClose={() => { setIsAddModalOpen(false); setSelectedPromotion(null); }}
        promotion={selectedPromotion}
        onSave={(data) => selectedPromotion ? setPromotionToEdit(data) : setPromotionToAdd(data)}
        onDelete={(data) => setPromotionToDelete(data)}
      />

      <Dialog
        open={promotionToDelete !== null}
        onClose={() => setPromotionToDelete(null)}
        title="Delete Promotion?"
        description={`Are you sure you want to permanently delete "${promotionToDelete?.title}"?`}
        tone="danger"
        footer={
          <>
            <Button variant="outline" onClick={() => setPromotionToDelete(null)} disabled={isProcessing}>Cancel</Button>
            <Button variant="confirm" onClick={handleDeleteConfirm} disabled={isProcessing}>{isProcessing ? "Deleting..." : "Delete"}</Button>
          </>
        }
      />

      <Dialog
        open={promotionToAdd !== null}
        onClose={() => setPromotionToAdd(null)}
        title="Create Promotion?"
        description="Are you sure you want to create this promotion?"
        footer={
          <>
            <Button variant="outline" onClick={() => setPromotionToAdd(null)} disabled={isProcessing}>Cancel</Button>
            <Button variant="primary" onClick={handleAddConfirm} disabled={isProcessing}>{isProcessing ? "Saving..." : "Create"}</Button>
          </>
        }
      />

      <Dialog
        open={promotionToEdit !== null}
        onClose={() => setPromotionToEdit(null)}
        title="Save Changes?"
        description="Are you sure you want to save changes to this promotion?"
        footer={
          <>
            <Button variant="outline" onClick={() => setPromotionToEdit(null)} disabled={isProcessing}>Cancel</Button>
            <Button variant="primary" onClick={handleEditConfirm} disabled={isProcessing}>{isProcessing ? "Saving..." : "Save"}</Button>
          </>
        }
      />
    </div>
  );
}
