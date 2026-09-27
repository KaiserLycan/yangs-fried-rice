"use client";

import { ErrorScreen } from "@/components/error-screen";

/**
 * The back office's error page (limitations #33). Rendered inside
 * `app/manage/layout.tsx`, so the sidebar stays and staff can go straight to
 * another screen — a broken report shouldn't cost them the Orders page.
 */
export default function ManageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] rounded-md border border-track bg-white p-6 md:mt-10 md:p-8">
      <ErrorScreen
        error={error}
        reset={reset}
        title="This screen didn't load"
        message="Something went wrong on our side. Nothing you entered was lost unless you were in the middle of saving it — try again, or use the menu on the left to carry on with another screen."
        homeHref="/manage/orders"
        homeLabel="Go to Orders"
      />
    </div>
  );
}
