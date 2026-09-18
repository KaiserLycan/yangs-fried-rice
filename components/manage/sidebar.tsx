"use client";

/**
 * Side navigation for the /manage area.
 *
 * Matches the Figma design exactly:
 *   - Deep red background (#b8352a) with cream/orange text
 *   - "YANG'S ADMIN" wordmark (orange "YANG'S" + cream "ADMIN")
 *   - Collapse toggle: shrinks sidebar from 232px → 64px, shows icons only
 *   - Navigation items with active state highlight (#f0b27a background)
 *   - User info footer with avatar initials circle + display name + logout
 *
 * Figma annotations:
 *   - Collapse icon: "When clicked the side bar should collapse and only
 *     show the icons."
 *   - YANG'S ADMIN: "When clicked returns to the admin dashboard."
 *   - Logout: "Clicking on this redirect's the user to the login page
 *     and log them out."
 *   - Collapsed user section: "When collapsed only show the User icon
 *     and the logout button. This should be in flex column where user
 *     first then logout."
 *
 * ============================================================
 * TODO: BACKEND INTEGRATION
 * ============================================================
 * 1. Replace MOCK_USER import with real authenticated user data.
 *    The user's name and initials should come from the Supabase
 *    auth session + employee table lookup.
 *
 * 2. The logout button currently calls the `logout` server action
 *    from app/(auth)/actions.ts. This is already wired and should
 *    work with real auth — no changes needed for logout.
 *
 * 3. Navigation items should be role-gated:
 *    - MANAGER sees all items (Dashboard, Reports, Menu, Orders,
 *      Customers, Employees)
 *    - STAFF should NOT see Dashboard, Reports, Customers, or
 *      Employees — only Menu and Orders
 *    Pass the employee role as a prop and filter NAV_ITEMS.
 * ============================================================
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { logout } from "@/app/(auth)/actions";
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "E";

  const letters = parts
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toUpperCase();

  return letters || "E";
}

const DEFAULT_SIDEBAR_USER = {
  name: "Employee",
  initials: "E",
  profileImageUrl: null as string | null,
};

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/manage/dashboard", icon: DashboardIcon },
  { label: "Reports", href: "/manage/reports", icon: ReportsIcon },
  { label: "Menu", href: "/manage/menu", icon: MenuIcon },
  { label: "Orders", href: "/manage/orders", icon: OrdersIcon },
  { label: "Customers", href: "/manage/customers", icon: CustomersIcon },
  { label: "Employees", href: "/manage/employee", icon: EmployeesIcon },
];

// ---------------------------------------------------------------------------
// Nav item icons (Lucide-style, matching the project's existing dependency)
// ---------------------------------------------------------------------------

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function CustomersIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EmployeesIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 20a6 6 0 0 0-12 0" />
      <circle cx="12" cy="10" r="4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Collapse / Expand icons
// ---------------------------------------------------------------------------

function CollapseIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect
        x="0.5"
        y="0.5"
        width="16"
        height="16"
        rx="3.5"
        stroke="#fbf6ec"
        strokeWidth="1"
      />
      <line x1="6" y1="4" x2="6" y2="13" stroke="#fbf6ec" strokeWidth="1" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect
        x="0.5"
        y="0.5"
        width="16"
        height="16"
        rx="3.5"
        stroke="#fbf6ec"
        strokeWidth="1"
      />
      <line x1="11" y1="4" x2="11" y2="13" stroke="#fbf6ec" strokeWidth="1" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="20"
      height="19"
      viewBox="0 0 20 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 17H3C2.46957 17 1.96086 16.7893 1.58579 16.4142C1.21071 16.0391 1 15.5304 1 15V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H7"
        stroke="#fbf6ec"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 13L19 9L14 5"
        stroke="#fbf6ec"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 9H7"
        stroke="#fbf6ec"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// localStorage key for persisting collapsed state
// ---------------------------------------------------------------------------

const COLLAPSED_KEY = "yangs-sidebar-collapsed";

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState(DEFAULT_SIDEBAR_USER);

  // Persist collapsed state in localStorage
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.localStorage ||
      typeof window.localStorage.getItem !== "function"
    ) {
      return;
    }

    const stored = window.localStorage.getItem(COLLAPSED_KEY);
    if (stored === "true") setIsCollapsed(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSidebarEmployee() {
      try {
        const res = await fetch("/api/employee/profile", { cache: "no-store" });
        if (!res.ok) return;

        const json = await res.json();
        const employee = json?.data;
        if (!employee || !isActive) return;

        const rawName = typeof employee.name === "string" ? employee.name : "Employee";
        const safeName = rawName.trim() || "Employee";

        setUser({
          name: safeName,
          initials: initialsFromName(safeName),
          profileImageUrl: employee.profileImageUrl ?? null,
        });
      } catch {
        // Keep the default employee identity if the session/profile call fails.
      }
    }

    void loadSidebarEmployee();

    return () => {
      isActive = false;
    };
  }, [pathname]);

  function toggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (
        typeof window !== "undefined" &&
        window.localStorage &&
        typeof window.localStorage.setItem === "function"
      ) {
        window.localStorage.setItem(COLLAPSED_KEY, String(next));
      }
      return next;
    });
  }


  function handleLogout() {
    startTransition(async () => {
      const result = await logout();
      if (result.success) {
        router.push("/employee/login");
        router.refresh();
      }
    });
  }

  return (
    <aside
      className={`flex h-full shrink-0 flex-col gap-[6px] border-r border-[#7a6a60] bg-[#b8352a] py-[22px] transition-all duration-300 ease-in-out ${isCollapsed ? "w-[64px] px-2" : "w-[232px] px-4"
        }`}
    >
      {/* Wordmark + collapse toggle */}
      <div
        className={`flex items-center pb-4 ${isCollapsed ? "justify-center" : "px-2"}`}
      >
        {!isCollapsed && (
          <>
            {/* Figma annotation: "When clicked returns to the admin dashboard." */}
            <Link
              href="/manage/dashboard"
              className="font-display text-[18px]"
            >
              <span className="text-[#f0b27a]">YANG&apos;S</span>{" "}
              <span className="text-[#fbf6ec]">ADMIN</span>
            </Link>
            <div className="flex-1" />
          </>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          className="opacity-80 transition-opacity hover:opacity-100"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
        </button>
      </div>

      {/* Navigation items */}
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={`flex items-center gap-2.5 rounded-[10px] py-[11px] text-[13px] font-bold transition-colors ${isCollapsed ? "justify-center px-0" : "px-3"
              } ${isActive
                ? "bg-[#f0b27a] text-[#1b1615]"
                : "text-[#fbf6ec] hover:bg-[#a02e24]"
              }`}
          >
            <Icon className="shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        );
      })}

      {/* Spacer */}
      <div className="min-h-[33px] flex-1" />

      {/* User info footer */}
      {/* Figma annotation (collapsed): "When collapsed only show the User icon
          and the logout button. This should be in flex column where user first
          then logout." */}
      <div
        className={`flex rounded-[10px] px-3 py-[11px] ${isCollapsed
            ? "flex-col items-center gap-3"
            : "items-center gap-2.5"
          }`}
      >
        {/* User profile link (Added to navigate to /manage/profile when avatar/name is clicked) */}
        <Link
          href="/manage/profile"
          className={`flex items-center gap-2.5 transition-opacity hover:opacity-80 ${isCollapsed ? "flex-col gap-3" : ""
            }`}
        >
          {/* Avatar circle with initials or the employee's saved image */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0b27a] ring-1 ring-[#fbf6ec]/40">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[13px] font-bold text-[#3a2e2c]">
                {user.initials}
              </span>
            )}
          </div>

          {/* Display name — hidden when collapsed */}
          {!isCollapsed && (
            <span className="text-[13px] font-bold text-[#fbf6ec]">
              {user.name}
            </span>
          )}
        </Link>

        {/* Spacer to push logout button to the right */}
        {!isCollapsed && <div className="flex-1" />}

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center opacity-80 transition-opacity hover:opacity-100 disabled:opacity-50"
          aria-label="Sign out"
        >
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
}
