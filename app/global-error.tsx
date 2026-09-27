"use client";

import "./globals.css";
import { Button } from "@/components/ui/button";

/**
 * Last resort: an error in the root layout itself, which `app/error.tsx`
 * cannot catch because it renders inside that layout. It replaces the whole
 * document, so it brings its own <html> and <body> and depends on nothing
 * but the stylesheet (issue #118).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 font-sans">
        <main role="alert" className="flex max-w-[480px] flex-col gap-[14px]">
          <h1 className="text-3xl font-bold leading-tight text-primary">Something went wrong</h1>
          <p className="text-base leading-relaxed text-foreground">
            Yang&apos;s Fried Rice couldn&apos;t load right now. Please try again in a moment.
          </p>
          {error.digest ? (
            <p className="text-sm text-foreground">
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
          <div className="flex gap-[10px]">
            <Button variant="unstyled"
              type="button"
              onClick={reset}
              className="min-h-[44px] rounded-sm bg-primary px-[18px] text-base font-bold text-primary-foreground"
            >
              Try again
            </Button>
            {/* A plain anchor, not next/link: the router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/menu"
              className="flex min-h-[44px] items-center rounded-sm border border-field-border px-[18px] text-base font-bold text-foreground"
            >
              Back to menu
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
