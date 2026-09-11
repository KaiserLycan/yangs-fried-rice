import type { Metadata } from "next";
import { DashboardContent } from "@/components/manage/dashboard/dashboard-content";

/**
 * Admin dashboard page — "Today at a glance".
 *
 * This is a Server Component wrapper that renders the client-side
 * DashboardContent. The actual data fetching and UI logic lives in
 * the DashboardContent component.
 *
 * ============================================================
 * TODO: BACKEND INTEGRATION
 * ============================================================
 * When wiring real data, consider moving data fetching here
 * (since this is a Server Component) and passing the data as
 * props to DashboardContent. This would:
 *   - Eliminate the client-side loading simulation
 *   - Enable server-side caching
 *   - Reduce client bundle size
 *
 * Example:
 * ```ts
 * const supabase = createClient();
 * const stats = await fetchDashboardStats(supabase);
 * const weeklySales = await fetchWeeklySales(supabase);
 * // ...
 * return <DashboardContent stats={stats} weeklySales={weeklySales} />;
 * ```
 *
 * Also add a role check here:
 * ```ts
 * const employee = await getEmployeeRole(supabase, user.id);
 * if (employee.role === "STAFF") redirect("/manage/orders");
 * ```
 * ============================================================
 */

export const metadata: Metadata = {
  title: "Dashboard — Yang's Admin",
  description:
    "Today at a glance: sales, orders, top sellers, and top rated items.",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
