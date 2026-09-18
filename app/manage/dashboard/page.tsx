import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/manage/dashboard/dashboard-content";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardStats,
  getWeeklySales,
  getTopSellers,
  getTopRatedProducts,
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
    "Today at a glance: sales, orders, top sellers, and top rated items.",
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

  if (employee?.role === "STAFF") {
    redirect("/manage/orders");
  }

  const [stats, weeklySales, topSellers, topRated] = await Promise.all([
    getDashboardStats(),
    getWeeklySales(),
    getTopSellers(),
    getTopRatedProducts(),
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
      topRated={topRated}
      dateStr={dateStr}
      branchName={branchName}
    />
  );
}
