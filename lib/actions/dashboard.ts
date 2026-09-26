"use server";

import { createClient } from "@/lib/supabase/server";
export interface DailySales {
  day: string;
  amount: number;
  label: string;
  isHighlight: boolean;
}

export interface RankedProduct {
  name: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  salesToday: { amount: string; trend: string; trendTone: TrendTone };
  orders: { total: number; breakdown: string };
  cancelled: { total: number; note: string };
}

/** How the sales trend line should read — up, down, or nothing to compare. */
export type TrendTone = "green" | "red" | "muted";

/** Local midnight-to-midnight bounds for the day `offsetDays` before today. */
function dayBounds(offsetDays: number): { start: string; end: string } {
  const now = new Date();
  const day = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - offsetDays,
  );
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return { start: day.toISOString(), end: end.toISOString() };
}

/**
 * Total takings for one day: every non-cancelled order's items plus its
 * delivery fee. The same sum the "Sales today" card shows, so the comparison
 * figure cannot be computed a different way from the headline.
 */
async function salesForDay(
  supabase: ReturnType<typeof createClient>,
  offsetDays: number,
): Promise<number> {
  const { start, end } = dayBounds(offsetDays);

  const { data: orders, error } = await supabase
    .from("order")
    .select("order_id, delivery_fee")
    .gte("created_at", start)
    .lte("created_at", end)
    .neq("order_status", "cancelled");

  if (error || !orders || orders.length === 0) return 0;

  const { data: items } = await supabase
    .from("order_item")
    .select("subtotal")
    .in(
      "order_id",
      orders.map((o) => o.order_id),
    );

  const itemTotal = (items ?? []).reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0,
  );
  const feeTotal = orders.reduce(
    (sum, order) => sum + (order.delivery_fee || 0),
    0,
  );

  return itemTotal + feeTotal;
}

/**
 * The sales line under the headline figure.
 *
 * Compared against the *same weekday* last week rather than yesterday: a
 * restaurant's Saturday has nothing to say about its Monday, so "vs last
 * Sat" is the comparison that means something — which is what the StatCard's
 * own example subtitle assumes.
 *
 * This line used to be the hardcoded string "Data not available", shown on
 * every successful load and sitting directly beneath a real peso figure,
 * which read as a bug (issue #106). When there genuinely is nothing to
 * compare against it now says so in those words, and only then.
 */
function salesTrend(
  today: number,
  lastWeek: number,
  weekdayLabel: string,
): { trend: string; trendTone: TrendTone } {
  if (lastWeek <= 0) {
    return {
      trend:
        today > 0
          ? `No sales last ${weekdayLabel} to compare`
          : `Nothing sold yet · no sales last ${weekdayLabel}`,
      trendTone: "muted",
    };
  }

  const change = ((today - lastWeek) / lastWeek) * 100;
  const rounded = Math.round(change);

  if (rounded === 0) {
    return { trend: `Level with last ${weekdayLabel}`, trendTone: "muted" };
  }

  const sign = rounded > 0 ? "+" : "−";
  return {
    trend: `${sign}${Math.abs(rounded)}% vs last ${weekdayLabel}`,
    trendTone: rounded > 0 ? "green" : "red",
  };
}

/**
 * The three "Today at a glance" figures.
 *
 * - Sales today: items plus delivery fees on every non-cancelled order.
 * - Orders: how many, split delivery vs pickup.
 * - Cancelled: how many were called off.
 */
export async function getDashboardStats(branchId?: string): Promise<DashboardStats> {
  const supabase = createClient();

  const { start: startOfDay, end: endOfDay } = dayBounds(0);
  const weekdayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
  });

  // 1. Get today's orders
  const { data: todayOrders, error } = await supabase
    .from("order")
    .select("order_id, order_status, order_type, delivery_fee")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  if (error) {
    console.error("Error fetching today orders:", error);
    return {
      // The failure branch used to claim "0%", which reads as a real
      // comparison against a real zero. Nothing was read, so nothing is
      // claimed.
      salesToday: {
        amount: "₱0",
        trend: "Couldn’t load today’s sales",
        trendTone: "muted",
      },
      orders: { total: 0, breakdown: "0 delivery · 0 pickup" },
      cancelled: { total: 0, note: "0" },
    };
  }

  const cancelledOrders = todayOrders.filter(o => o.order_status === "cancelled");
  const validOrders = todayOrders.filter(o => o.order_status !== "cancelled");

  const deliveryCount = validOrders.filter(o => o.order_type === "delivery").length;
  // submitCart stores pickup as "take_out" (see lib/checkout/fulfilment-param.ts);
  // "pickup" is kept for older rows.
  const pickupCount = validOrders.filter(o => o.order_type === "take_out" || o.order_type === "pickup").length;

  let totalSales = 0;

  if (validOrders.length > 0) {
    const validOrderIds = validOrders.map(o => o.order_id);
    const { data: orderItems } = await supabase
      .from("order_item")
      .select("subtotal")
      .in("order_id", validOrderIds);

    if (orderItems) {
      totalSales = orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    }

    // Add delivery fees
    totalSales += validOrders.reduce((sum, order) => sum + (order.delivery_fee || 0), 0);
  }

  const lastWeekSales = await salesForDay(supabase, 7);
  const { trend, trendTone } = salesTrend(totalSales, lastWeekSales, weekdayLabel);

  // Formatting amount
  const amountStr = `₱${totalSales.toLocaleString()}`;

  return {
    salesToday: {
      amount: amountStr,
      trend,
      trendTone,
    },
    orders: {
      total: validOrders.length,
      breakdown: `${deliveryCount} delivery · ${pickupCount} pickup`,
    },
    cancelled: {
      total: cancelledOrders.length,
      note: "Cancelled orders today",
    },
  };
}

/**
 * Get weekly sales for the last 7 days.
 */
export async function getWeeklySales(branchId?: string): Promise<DailySales[]> {
  const supabase = createClient();
  const now = new Date();

  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  endOfToday.setHours(23, 59, 59, 999);

  const { data: orders } = await supabase
    .from("order")
    .select("order_id, created_at, delivery_fee")
    .gte("created_at", sevenDaysAgo.toISOString())
    // Bounded at both ends. Without an upper bound a row dated ahead of the
    // clock lands in the week's takings.
    .lte("created_at", endOfToday.toISOString())
    .neq("order_status", "cancelled");

  const results: DailySales[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Keyed by calendar date, not by weekday name. Names are only unique while
  // the window happens to be exactly seven days — widen it and "Mon" would
  // silently collect two Mondays into one bar.
  const salesMap = new Map<string, number>();

  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (orders && orders.length > 0) {
    const orderIds = orders.map(o => o.order_id);
    const { data: items } = await supabase
      .from("order_item")
      .select("order_id, subtotal")
      .in("order_id", orderIds);

    const itemMap = new Map<string, number>();
    if (items) {
      items.forEach(item => {
        const orderId = item.order_id;
        if (orderId) {
          itemMap.set(orderId, (itemMap.get(orderId) || 0) + item.subtotal);
        }
      });
    }

    orders.forEach(order => {
      if (!order.created_at) return;

      const key = dateKey(new Date(order.created_at));

      const itemsSubtotal = itemMap.get(order.order_id) || 0;
      const orderTotal = itemsSubtotal + (order.delivery_fee || 0);

      salesMap.set(key, (salesMap.get(key) || 0) + orderTotal);
    });
  }

  // Populate last 7 days in order
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dayName = dayNames[d.getDay()];
    const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;

    const amount = salesMap.get(dateKey(d)) || 0;

    results.push({
      day: dayName,
      amount,
      label: `₱${(amount / 1000).toFixed(1)}k`,
      isHighlight: isWeekend,
    });
  }

  return results;
}

export async function getTopSellers(
  branchId?: string,
  startDate?: string,
  endDate?: string
): Promise<RankedProduct[]> {
  const supabase = createClient();
  const now = new Date();
  
  let start = startDate;
  let end = endDate;

  if (!start) {
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    start = sevenDaysAgo.toISOString();
  }

  let query = supabase
    .from("order")
    .select("order_id")
    .gte("created_at", start)
    .neq("order_status", "cancelled");

  if (end) {
    query = query.lte("created_at", end);
  }

  const { data: orders } = await query;

  if (!orders || orders.length === 0) return [];
  
  const orderIds = orders.map(o => o.order_id);
  
  const { data: orderItems } = await supabase
    .from("order_item")
    .select("product_id, quantity, product(product_name)")
    .in("order_id", orderIds);
    
  if (!orderItems) return [];
  
  const productCount = new Map<string, { name: string, count: number }>();
  
  orderItems.forEach(item => {
    if (!item.product_id || !item.product) return;
    const name = Array.isArray(item.product) ? item.product[0].product_name : item.product.product_name;
    
    const existing = productCount.get(item.product_id) || { name, count: 0 };
    existing.count += item.quantity;
    productCount.set(item.product_id, existing);
  });
  
  const sorted = Array.from(productCount.values()).sort((a, b) => b.count - a.count).slice(0, 4);
  const maxCount = sorted.length > 0 ? sorted[0].count : 1;
  
  return sorted.map(item => ({
    name: item.name,
    count: item.count,
    percentage: Math.round((item.count / maxCount) * 100)
  }));
}
