/**
 * Rider area.
 *
 * Literal prefix, same reasoning as /manage — "deliver" is in the URL so
 * middleware.ts guards the whole area with one /deliver/:path* match.
 *
 * Separate from /manage rather than a section inside it because the job is
 * genuinely different: riders work from a phone, in the field, one delivery
 * at a time. Same sign-in page as the rest of the employees, different
 * destination after it.
 *
 * TODO(auth): signed-in Employee with the Rider role, else redirect to
 * /employee/login.
 */
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, ArrowLeft } from "lucide-react";
import { DeliverSidebar } from "@/components/deliver/deliver-sidebar";
import { useState, useCallback, useEffect } from "react";

export default function DeliverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // If we're strictly on /deliver, we are at the root (list view)
  const isRoot = pathname === "/deliver";
  const isProfile = pathname === "/deliver/profile";

  const [sidebarWidth, setSidebarWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 300 && newWidth <= 800) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Simple Header for Rider */}
      <header className="h-[73px] shrink-0 border-b border-[#2e2523] bg-[#b8352a] flex items-center justify-between px-[24px] md:px-[40px] z-20 relative">
        <Link href="/deliver" className="hover:opacity-80 transition-opacity">
          <h1 className="font-display text-[22px] tracking-[0.44px]">
            <span className="text-[#f0b27a]">RIDER</span> <span className="text-[#fbf6ec]">DISPLAY</span>
          </h1>
        </Link>
        
        {isProfile ? (
          <Link href="/deliver" className="flex items-center justify-center hover:opacity-80 transition-opacity text-[#fbf6ec]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        ) : (
          <div className="flex items-center gap-[24px]">
            <Link href="/deliver/profile" className="flex items-center gap-[16px] hover:opacity-80 transition-opacity">
              <p className="font-bold text-[10px] tracking-[1.4px] text-[#fbf6ec] uppercase text-right leading-none mt-1">
                Rider, John
              </p>
              <div className="w-[36px] h-[36px] rounded-full bg-[#f0b27a] flex items-center justify-center shrink-0">
                <span className="font-bold text-[13px] text-[#3a2e2c] leading-none">
                  LR
                </span>
              </div>
            </Link>
            <div className="w-[1px] h-[24px] bg-[#2e2523] opacity-50" />
            <button className="flex items-center justify-center text-[#fbf6ec] hover:opacity-80 transition-opacity" title="Log Out">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}
      </header>

      {/* Main Responsive Split Layout */}
      <div 
        className="flex flex-1 overflow-hidden relative"
        style={{ 
          cursor: isResizing ? 'col-resize' : 'auto',
          userSelect: isResizing ? 'none' : 'auto'
        }}
      >
        {/* Sidebar (List view) - Hidden on mobile if viewing details, hidden completely on profile */}
        {!isProfile && (
          <>
            <div 
              className={`
                w-full shrink-0 h-full bg-[#FAF5EB] overflow-y-auto 
                ${isRoot ? "block" : "hidden md:block"}
              `}
              style={{ 
                '--sidebar-width': `${sidebarWidth}px`,
                width: 'var(--sidebar-width)',
                maxWidth: '100%' 
              } as React.CSSProperties & { [key: string]: string }}
            >
              <DeliverSidebar />
            </div>
            
            {/* Drag Handle */}
            <div 
              className={`
                w-[6px] shrink-0 h-full bg-rule hover:bg-primary/50 cursor-col-resize z-20 transition-colors hidden md:block
                ${isResizing ? "bg-primary" : ""}
              `}
              onMouseDown={startResizing}
            />
          </>
        )}

        {/* Main Content Area (Detail view) - Hidden on mobile if at root */}
        <div 
          className={`
            flex-1 h-full bg-background relative overflow-hidden
            ${isRoot && !isProfile ? "hidden md:block" : "block"}
          `}
          style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
