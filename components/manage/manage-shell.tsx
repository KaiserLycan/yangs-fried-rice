"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/manage/sidebar";
import type { EmployeeRole } from "@/lib/auth/roles";

/**
 * The /manage chrome: sidebar + scrolling content column.
 *
 * The sidebar and the content are side by side in one flex row. Opening the
 * sidebar widens its slot and the content column (`flex-1 min-w-0`) narrows to
 * fit; closing it hands the room back. Nothing is ever covered.
 */
export function ManageShell({
  role,
  children,
}: {
  role: EmployeeRole | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isKds = pathname === "/manage/kds";

  return (
    <div className="flex h-screen bg-[#fbf6ec]">
      {!isKds && <Sidebar role={role} />}
      <main
        className={`min-w-0 flex-1 overflow-y-auto ${isKds ? "" : "px-[30px] py-[26px]"}`}
        style={{ scrollbarGutter: "stable" }}
      >
        {children}
      </main>
    </div>
  );
}
