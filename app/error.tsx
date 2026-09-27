"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { BrandPanel } from "@/components/auth/brand-panel";
import { ErrorScreen } from "@/components/error-screen";

/**
 * The customer-facing error page: anything that throws while rendering a
 * page outside `/manage` lands here instead of Next.js's default screen
 * (limitations #33). Same shell as the 404, so it reads as part of the site.
 *
 * `/manage` has its own boundary (`app/manage/error.tsx`) so staff keep the
 * sidebar; a failure in the root layout itself is `app/global-error.tsx`.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AuthShell brand={<BrandPanel />}>
      <div className="relative flex flex-col px-6 pb-[30px] pt-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]">
        <div className="rounded-[22px] bg-background p-5 shadow-sm md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <ErrorScreen
            error={error}
            reset={reset}
            title="Something went wrong"
            message="The wok flared up and this page didn't load. Your cart and orders are safe — please try again. If it keeps happening, give it a minute or head back to the menu."
            homeHref="/menu"
            homeLabel="Back to menu"
          />
        </div>
      </div>
    </AuthShell>
  );
}
