"use client";

import "./globals.css";

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
          <h1 className="text-[30px] font-bold leading-tight text-primary">Something went wrong</h1>
          <p className="text-[15px] leading-relaxed text-foreground">
            Yang&apos;s Fried Rice couldn&apos;t load right now. Please try again in a moment.
          </p>
          {error.digest ? (
            <p className="text-[14px] text-foreground">
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
          <div className="flex gap-[10px]">
            <button
              type="button"
              onClick={reset}
              className="min-h-[44px] rounded-[8px] bg-primary px-[18px] text-[15px] font-bold text-primary-foreground"
            >
              Try again
            </button>
            {/* A plain anchor, not next/link: the router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/menu"
              className="flex min-h-[44px] items-center rounded-[8px] border border-field-border px-[18px] text-[15px] font-bold text-foreground"
            >
              Back to menu
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
