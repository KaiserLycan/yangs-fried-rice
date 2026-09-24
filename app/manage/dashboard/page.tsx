import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/manage/dashboard/dashboard-content";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole, resolveEmployeeRole } from "@/lib/auth/roles";
import {
  getDashboardStats,
  getWeeklySales,
  getTopSellers,
} from "@/lib/actions/dashboard";

/**
 * Admin dashboard page — "Today at a glance".
 *
 * This is a Server Component wrapper that renders the client-side
 * DashboardContent. The data fetching and UI logic lives here, passing
 * the data down as props.
 */
export const metadata: Metadata = {
  title: "Dashboard — Yang's Admin",
  description:
    "Today at a glance: sales, orders, and top sellers.",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const { data: employee } = await supabase
    .from("employee")
    .select("role, name, employee_id")
    .eq("employee_id", user.id)
    .single();

  // Manager-only. Middleware already turns STAFF away; this is the second
  // check for a request that reaches the page some other way.
  const role = resolveEmployeeRole(employee?.role);
  if (role !== "MANAGER") {
    redirect(homePathForRole(role));
  }

  // Get start and end of today
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  const [stats, weeklySales, topSellers] = await Promise.all([
    getDashboardStats(),
    getWeeklySales(),
    getTopSellers(undefined, startOfDay, endOfDay),
  ]);

  // Branch mock for now until multi-branch support
  const branchName = "Malate branch";
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <DashboardContent
      stats={stats}
      weeklySales={weeklySales}
      topSellers={topSellers}
      dateStr={dateStr}
      branchName={branchName}
    />
  );
}
