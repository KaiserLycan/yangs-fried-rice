"use server";

import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth/require-manager";
import { formatOrderNumber } from "@/lib/orders/order-number";

/**
 * The latest order ratings, as the manager dashboard lists them (FINALE
 * 9.3): the scores and comment beside the order they are about and the
 * customer's phone, so following up on a bad one is a call, not a search.
 */

export type RecentReview = {
  reviewId: string;
  orderId: string | null;
  orderNumber: string | null;
  /** `review.rating` — the food score on an order-level review. */
  food: number;
  service: number | null;
  comment: string | null;
  customerName: string;
  customerPhone: string | null;
  createdAt: string | null;
};

/** How many the dashboard shows. */
const RECENT_REVIEWS = 8;

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getRecentReviews(): Promise<RecentReview[]> {
  const supabase = createClient();
  if (await requireManager(supabase)) return [];

  // Order-level rows only: a per-dish row repeats the order it belongs to.
  const { data, error } = await supabase
    .from("review")
    .select(
      "review_id, order_id, rating, service_rating, comment, created_at, customer:customer_id ( name, phone_number ), order:order_id ( order_number )",
    )
    .is("product_id", null)
    .not("order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(RECENT_REVIEWS);

  if (error) {
    console.error("getRecentReviews:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const customer = first(row.customer as { name: string | null; phone_number: string | null } | null);
    const order = first(row.order as { order_number: number | null } | null);
    return {
      reviewId: row.review_id,
      orderId: row.order_id,
      orderNumber: row.order_id ? formatOrderNumber(order?.order_number, row.order_id) : null,
      food: row.rating ?? 0,
      service: row.service_rating ?? null,
      comment: row.comment,
      customerName: customer?.name ?? "Deleted customer",
      customerPhone: customer?.phone_number ?? null,
      createdAt: row.created_at,
    };
  });
}
