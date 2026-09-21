"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitProductReview(
  orderId: string,
  productId: string,
  rating: number,
  comment?: string
) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be logged in to submit a review." };
  }

  // Check if a review already exists for this order and product
  const { data: existing } = await supabase
    .from("review")
    .select("review_id")
    .eq("order_id", orderId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    return { error: "You have already reviewed this product for this order." };
  }

  const { error } = await supabase.from("review").insert({
    customer_id: user.id,
    order_id: orderId,
    product_id: productId,
    rating,
    comment: comment || null,
  });

  if (error) {
    console.error("Error submitting review:", error);
    return { error: "Failed to submit review." };
  }

  return { success: true };
}


