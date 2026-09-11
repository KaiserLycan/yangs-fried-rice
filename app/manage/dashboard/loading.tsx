import { DashboardSkeleton } from "@/components/manage/dashboard/dashboard-skeleton";

/**
 * Next.js loading file for the dashboard route.
 *
 * Automatically shown during route transitions (e.g. navigating from
 * /manage/orders to /manage/dashboard). This provides instant visual
 * feedback while the page component loads.
 *
 * The DashboardSkeleton matches the exact layout of the real dashboard
 * so the transition from skeleton → real content is seamless.
 */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
