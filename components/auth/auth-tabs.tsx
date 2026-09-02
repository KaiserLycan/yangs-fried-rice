import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The Log in / Sign up segmented control.
 *
 * Drawn as a toggle in Figma, but built as two links rather than client-side
 * tab state: /login and /register are real routes in the scaffold, and the
 * routing convention keeps customer URLs short and shareable. Making this a
 * tab would collapse one of them.
 */
export function AuthTabs({ active }: { active: "login" | "register" }) {
  return (
    <div className="flex w-full gap-1 rounded-[11px] bg-track p-1 md:w-auto md:self-start md:rounded-md">
      <Tab href="/login" active={active === "login"}>
        Log in
      </Tab>
      <Tab href="/register" active={active === "register"}>
        Sign up
      </Tab>
    </div>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex-1 rounded-[8px] px-[6px] py-[10px] text-center text-[13px] font-bold md:flex-none md:rounded-[9px] md:px-[18px] md:py-[9px]",
        active
          ? "bg-accent text-white"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
