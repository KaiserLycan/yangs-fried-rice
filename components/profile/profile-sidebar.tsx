import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { formatMemberSince, formatOrderCount } from "@/lib/profile/identity";
import { cn } from "@/lib/utils";

/**
 * The desktop-only rail down the left of the profile screen: section links,
 * then a summary of who is signed in.
 *
 * The links are in-page anchors rather than routes. Every section they name
 * lives on this one page, so a route per section would mean four pages
 * showing the same screen. The target ids are added by the tickets that build
 * those sections — until then the links resolve to nothing, which is inert
 * rather than broken.
 *
 * The frame carries a "Verified mobile" line under the order count. It is cut:
 * nothing in the system verifies a phone number and no requirement asks for
 * it, so the badge could only ever have been hardcoded.
 */

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "contact", label: "Contact details" },
  { id: "addresses", label: "Addresses" },
  { id: "password", label: "Password" },
];

/**
 * Which section the rail highlights. Named rather than inferred from
 * position, so reordering `SECTIONS` cannot silently move the highlight.
 */
const CURRENT_SECTION = "profile";

export function ProfileSidebar({ profile }: { profile: CustomerProfile }) {
  const joined = formatMemberSince(profile.memberSince);

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col gap-[6px] border-r border-rule bg-background px-[16px] pt-[20px] md:flex">
      <p className="px-[8px] pb-[6px] text-[10.5px] font-bold uppercase tracking-[1.68px] text-muted-foreground">
        Account
      </p>

      <nav className="flex flex-col gap-[6px]">
        {SECTIONS.map(({ id, label }) => {
          const isCurrent = id === CURRENT_SECTION;
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={isCurrent ? "true" : undefined}
              className={cn(
                "rounded-sm px-[12px] py-[10px] text-[13.5px]",
                isCurrent
                  ? "bg-rule font-bold text-primary"
                  : "font-medium text-muted-foreground hover:bg-rule/50",
              )}
            >
              {label}
            </a>
          );
        })}
      </nav>

      <div className="mt-[22px] flex flex-col gap-[4px] border-t border-rule px-[8px] pt-[16px]">
        <p className="text-[12.5px] font-bold text-foreground">
          {profile.name}
        </p>
        {joined ? (
          <p className="text-[12px] text-muted-foreground">
            Member since {joined}
          </p>
        ) : null}
        <p className="text-[12px] text-muted-foreground">
          {formatOrderCount(profile.orderCount)}
        </p>
      </div>
    </aside>
  );
}
