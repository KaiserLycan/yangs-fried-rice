/**
 * Mock data for the admin dashboard.
 *
 * ============================================================
 * TODO: BACKEND INTEGRATION
 * ============================================================
 * Every export in this file is a placeholder. During backend
 * integration, each should be replaced by a real data fetch
 * (Supabase query, server action, or API route).
 *
 * The comments on each export describe:
 *   1. What real data source it maps to
 *   2. The expected shape of the response
 *   3. Any transformations needed
 * ============================================================
 */

// ---------------------------------------------------------------------------
// Types — keep these; the real API responses should conform to them
// ---------------------------------------------------------------------------

export interface DailySales {
  day: string; // e.g. "Mon", "Tue"
  amount: number; // raw peso amount, e.g. 18400
  label: string; // formatted, e.g. "₱18.4k"
  /** true for the most recent days (Fri–Sun), styled darker in the chart */
  isHighlight: boolean;
}

export interface RankedProduct {
  name: string;
  count: number; // units sold or rating count
  /** 0–100, represents the bar fill percentage relative to the top item */
  percentage: number;
}

export interface DashboardStats {
  salesToday: {
    amount: string; // formatted, e.g. "₱31,200"
    trend: string; // e.g. "+18% vs last Sat"
  };
  orders: {
    total: number;
    breakdown: string; // e.g. "62 delivery · 24 pickup"
  };
  cancelled: {
    total: number;
    note: string; // e.g. "all before confirmation"
  };
}

export interface DashboardUser {
  initials: string;
  displayName: string;
}

// ---------------------------------------------------------------------------
// Mock values
// ---------------------------------------------------------------------------

/**
 * TODO: BACKEND INTEGRATION — Replace with a Supabase query:
 *
 * ```ts
 * const { data } = await supabase
 *   .from("order")
 *   .select("total_price")
 *   .gte("created_at", todayStart)
 *   .lte("created_at", todayEnd)
 *   .eq("branch_id", currentBranchId)
 *   .neq("status", "cancelled");
 * ```
 *
 * Then sum `total_price` for salesToday, count rows for orders.total,
 * and group by `order_type` for the delivery/pickup breakdown.
 *
 * The trend percentage should compare today's sum to the same weekday
 * last week.
 */
export const MOCK_STATS: DashboardStats = {
  salesToday: {
    amount: "₱31,200",
    trend: "+18% vs last Sat",
  },
  orders: {
    total: 86,
    breakdown: "62 delivery · 24 pickup",
  },
  cancelled: {
    total: 3,
    note: "all before confirmation",
  },
};

/**
 * TODO: BACKEND INTEGRATION — Replace with a Supabase query:
 *
 * ```ts
 * const { data } = await supabase
 *   .from("order")
 *   .select("created_at, total_price")
 *   .gte("created_at", sevenDaysAgo)
 *   .eq("branch_id", currentBranchId)
 *   .neq("status", "cancelled");
 * ```
 *
 * Group by day-of-week, sum total_price per day.
 * Format labels as "₱XX.Xk". Mark Fri/Sat/Sun as isHighlight.
 */
export const MOCK_WEEKLY_SALES: DailySales[] = [
  { day: "Mon", amount: 18400, label: "₱18.4k", isHighlight: false },
  { day: "Tue", amount: 16100, label: "₱16.1k", isHighlight: false },
  { day: "Wed", amount: 21300, label: "₱21.3k", isHighlight: false },
  { day: "Thu", amount: 19800, label: "₱19.8k", isHighlight: false },
  { day: "Fri", amount: 27600, label: "₱27.6k", isHighlight: true },
  { day: "Sat", amount: 31200, label: "₱31.2k", isHighlight: true },
  { day: "Sun", amount: 24900, label: "₱24.9k", isHighlight: true },
];

/**
 * TODO: BACKEND INTEGRATION — Replace with a Supabase query:
 *
 * ```ts
 * const { data } = await supabase
 *   .from("order_item")
 *   .select("menu_item_id, quantity, menu_item(name)")
 *   .eq("order.branch_id", currentBranchId)
 *   .gte("order.created_at", todayStart)
 *   .order("quantity", { ascending: false })
 *   .limit(4);
 * ```
 *
 * Group by menu_item_id, sum quantities, compute percentages
 * relative to the highest-selling item.
 */
export const MOCK_TOP_SELLERS: RankedProduct[] = [
  { name: "Yangzhou Special", count: 142, percentage: 100 },
  { name: "Fried Chicken (3pc)", count: 118, percentage: 83 },
  { name: "Chili Garlic Fried Rice", count: 96, percentage: 68 },
  { name: "Lumpia (5pc)", count: 71, percentage: 50 },
];

/**
 * TODO: BACKEND INTEGRATION — Replace with a Supabase query:
 *
 * ```ts
 * const { data } = await supabase
 *   .from("menu_item")
 *   .select("name, average_rating, total_ratings")
 *   .eq("branch_id", currentBranchId)
 *   .order("average_rating", { ascending: false })
 *   .limit(4);
 * ```
 *
 * Note: the design uses "sold" as the unit for both top sellers
 * and top rated. Confirm with PM whether top rated should show
 * rating count or sales count. Using sales count in mockup.
 */
export const MOCK_TOP_RATED: RankedProduct[] = [
  { name: "Yangzhou Special", count: 142, percentage: 100 },
  { name: "Fried Chicken (3pc)", count: 118, percentage: 83 },
  { name: "Chili Garlic Fried Rice", count: 96, percentage: 68 },
  { name: "Lumpia (5pc)", count: 71, percentage: 50 },
];

/**
 * TODO: BACKEND INTEGRATION — Replace with the authenticated user's data:
 *
 * ```ts
 * const { data: { user } } = await supabase.auth.getUser();
 * const { data: employee } = await supabase
 *   .from("employee")
 *   .select("first_name, last_name")
 *   .eq("employee_id", user.id)
 *   .single();
 * ```
 *
 * Compute initials from first_name + last_name.
 */
export const MOCK_USER: DashboardUser = {
  initials: "LR",
  displayName: "Lazy Ryan",
};

/**
 * TODO: BACKEND INTEGRATION — Replace with the current branch context:
 *
 * The branch name should come from the employee's assigned branch
 * or a branch selector if multi-branch support is implemented.
 *
 * ```ts
 * const { data: branch } = await supabase
 *   .from("branch")
 *   .select("name")
 *   .eq("branch_id", employee.branch_id)
 *   .single();
 * ```
 */
export const MOCK_BRANCH = "Malate branch";

/**
 * TODO: BACKEND INTEGRATION — Replace with the server's current date:
 *
 * Format the current date as "Saturday, Aug 30" using Intl.DateTimeFormat
 * or a date library. The mock value is static.
 */
export const MOCK_DATE = "Saturday, Aug 30";
