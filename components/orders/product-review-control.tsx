"use client";

import * as React from "react";
import { useState } from "react";
import { Star } from "lucide-react";
import { submitProductReview } from "@/lib/actions/reviews";
import type { TrackedOrder } from "@/lib/orders/read-tracked-order";
import { Button } from "@/components/ui/button";

export function ProductReviewControl({ order }: { order: TrackedOrder }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!order.items || order.items.length === 0) return null;

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full mt-4"
        variant="outline"
      >
        Rate your items
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-display mb-4">Rate Your Items</h2>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {order.items.map(item => (
                <ReviewItem 
                  key={item.productId} 
                  orderId={order.orderId} 
                  item={item} 
                />
              ))}
            </div>
            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button onClick={() => setIsOpen(false)} variant="ghost">Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewItem({ orderId, item }: { orderId: string, item: { productId: string, name: string } }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setError(null);
    const result = await submitProductReview(orderId, item.productId, rating);
    if (result.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="space-y-2">
      <div className="font-medium">{item.name}</div>
      {submitted ? (
        <div className="text-green-600 text-sm">Thank you for your rating!</div>
      ) : (
        <>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                className={`focus:outline-none transition-colors ${
                  (hovered || rating) >= star ? "text-yellow-400" : "text-muted"
                }`}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
          </div>
          {error && <div className="text-red-500 text-xs">{error}</div>}
          <Button 
            onClick={handleSubmit} 
            disabled={rating === 0} 
            size="sm" 
            className="mt-2"
          >
            Submit
          </Button>
        </>
      )}
    </div>
  );
}
