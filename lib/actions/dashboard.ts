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
  salesToday: { amount: string; trend: string };
  orders: { total: number; breakdown: string };
  cancelled: { total: number; note: string };
}

/**
 * Replace the MOCK_STATS query with actual Supabase queries.
 *
 * Requirements:
 * - Sales today: sum of order_item.subtotal + order.delivery_fee for orders created today (not cancelled).
 * - Orders: count of non-cancelled orders today, and breakdown of delivery vs pickup.
 * - Cancelled: count of cancelled orders today.
 */
export async function getDashboardStats(branchId?: string): Promise<DashboardStats> {
  const supabase = createClient();
  
  // Get start and end of today
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  // We could do this in a single RPC, but for simplicity, we'll run a few queries.
  // 1. Get today's orders
  const { data: todayOrders, error } = await supabase
    .from("order")
    .select("order_id, order_status, order_type, delivery_fee")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  if (error) {
    console.error("Error fetching today orders:", error);
    return {
      salesToday: { amount: "₱0", trend: "0%" },
      orders: { total: 0, breakdown: "0 delivery · 0 pickup" },
      cancelled: { total: 0, note: "0" },
    };
  }

  const cancelledOrders = todayOrders.filter(o => o.order_status === "cancelled");
  const validOrders = todayOrders.filter(o => o.order_status !== "cancelled");
  
  const deliveryCount = validOrders.filter(o => o.order_type === "delivery").length;
  const pickupCount = validOrders.filter(o => o.order_type === "pickup").length;

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

  // Formatting amount
  const amountStr = `₱${totalSales.toLocaleString()}`;

  return {
    salesToday: {
      amount: amountStr,
      trend: "Data not available", // To do: compare with last week
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

  const { data: orders } = await supabase
    .from("order")
    .select("order_id, created_at, delivery_fee")
    .gte("created_at", sevenDaysAgo.toISOString())
    .neq("order_status", "cancelled");

  const results: DailySales[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const salesMap = new Map<string, number>();

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
      
      const date = new Date(order.created_at);
      const dayName = dayNames[date.getDay()];
      
      const itemsSubtotal = itemMap.get(order.order_id) || 0;
      const orderTotal = itemsSubtotal + (order.delivery_fee || 0);
      
      salesMap.set(dayName, (salesMap.get(dayName) || 0) + orderTotal);
    });
  }

  // Populate last 7 days in order
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dayName = dayNames[d.getDay()];
    const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
    
    const amount = salesMap.get(dayName) || 0;
    
    results.push({
      day: dayName,
      amount,
      label: `₱${(amount / 1000).toFixed(1)}k`,
      isHighlight: isWeekend,
    });
  }

  return results;
}

/**
 * Get top sellers for the last 7 days and today.
 */
export async function getTopSellers(branchId?: string): Promise<RankedProduct[]> {
  const supabase = createClient();
  const now = new Date();
  
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from("order")
    .select("order_id")
    .gte("created_at", sevenDaysAgo.toISOString())
    .neq("order_status", "cancelled");

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
