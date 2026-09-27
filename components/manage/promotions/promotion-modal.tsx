"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export function PromotionModal({
  isOpen,
  onClose,
  promotion,
  onSave,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  promotion: any | null;
  onSave: (data: any) => void;
  onDelete: (data: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (promotion) {
        setTitle(promotion.title);
        setDescription(promotion.description || "");
        setStartsAt(promotion.starts_at.substring(0, 16));
        setEndsAt(promotion.ends_at.substring(0, 16));
        setIsActive(promotion.is_active);
      } else {
        setTitle("");
        setDescription("");
        setStartsAt(new Date().toISOString().substring(0, 16));
        setEndsAt("");
        setIsActive(true);
      }
      setImageFile(null);
    }
  }, [isOpen, promotion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      starts_at: startsAt,
      ends_at: endsAt,
      is_active: isActive,
      imageFile,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={promotion ? "Edit Promotion" : "New Promotion"}
      description={promotion ? "Update this promotion's details." : "Create a new promotion."}
      footer={
        <div className="flex items-center justify-between w-full">
          {promotion ? (
            <Button
              type="button"
              variant="outline"
              className="text-destructive border-error-surface hover:bg-error-surface/90"
              onClick={() => onDelete(promotion)}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="promo-form" variant="primary">
              Save
            </Button>
          </div>
        </div>
      }
    >
      <form id="promo-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date/Time</label>
            <Input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date/Time</label>
            <Input type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Image (Optional on edit)</label>
          <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required={!promotion} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="is-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="is-active" className="text-sm font-medium">Active (Visible if within dates)</label>
        </div>
      </form>
    </Dialog>
  );
}
