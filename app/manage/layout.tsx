"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/manage/sidebar";

/**
 * Back office layout. Staff and Business Owner.
 *
 * Literal prefix — "manage" is in the URL on purpose so middleware.ts guards
 * the whole area with one /manage/:path* match, and any page added here later
 * is protected automatically.
 *
 * ============================================================
 * WHY THIS LAYOUT IS NOT ASYNC
 * ============================================================
 * Previously, this layout was an `async` Server Component that
 * called `supabase.auth.getUser()` and queried the employee
 * table on every render. Because Next.js re-renders layouts on
 * every client-side navigation, those two Supabase round-trips
 * ran on EVERY sidebar tab click, making navigation noticeably
 * slow (~1-2s per click).
 *
 * The auth check was redundant — middleware.ts already guards
 * all /manage/* routes and verifies the employee record.
 * Removing it makes tab switching instant.
 *
 * Role-based routing (MANAGER → dashboard, STAFF → orders,
 * RIDER → deliver) is handled at login time in actions.ts.
 * ============================================================
 */
export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isKds = pathname === "/manage/kds";

  return (
    <div className="flex h-screen bg-[#fbf6ec]">
      {!isKds && <Sidebar />}
      <main className={`flex-1 overflow-y-auto ${isKds ? "" : "px-[30px] py-[26px]"}`}>
        {children}
      </main>
    </div>
  );
}
