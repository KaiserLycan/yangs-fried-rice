import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandPanel } from "@/components/auth/brand-panel";
import {
  SELLER_ADDRESS,
  SELLER_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from "@/lib/site/site-info";

/**
 * The shell `/terms` and `/privacy` share (issue #116): the auth screens'
 * brand panel on the left, the text on the right, as `/terms` already was.
 */
export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <AuthShell brand={<BrandPanel />}>
      <div className="relative flex flex-col px-6 pb-[30px] pt-[30px] md:bg-background md:px-[52px] md:py-[48px]">
        <div className="flex flex-col gap-[14px] rounded-lg bg-background p-5 shadow-sm md:gap-[18px] md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <Link
            href="/"
            className="inline-block w-fit text-sm font-bold text-accent hover:underline"
          >
            &larr; Back
          </Link>

          <h1 className="mt-2 font-display text-3xl uppercase text-accent md:text-5xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated {lastUpdated}
          </p>

          <div className="mt-4 space-y-6 text-base leading-relaxed text-muted-foreground md:text-base">
            {children}
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="mb-2 font-display text-lg text-foreground md:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * How to reach the seller. Email and phone show once they are set in
 * `lib/site/site-info.ts`; until then the branch counter is the contact.
 */
export function SellerContact() {
  return (
    <p>
      {SELLER_NAME}, {SELLER_ADDRESS}.{" "}
      {SUPPORT_EMAIL || SUPPORT_PHONE ? (
        <>
          Contact us at{" "}
          {[SUPPORT_EMAIL, SUPPORT_PHONE].filter(Boolean).join(" or ")}, or ask
          at the counter.
        </>
      ) : (
        <>Ask for the manager at the counter.</>
      )}
    </p>
  );
}
