"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The body of the app's error pages (`app/error.tsx`, `app/manage/error.tsx`,
 * issue #118). Before these existed a server error showed Next.js's own
 * bare screen (limitations #33).
 *
 * Says what happened in plain words, offers "Try again" (Next's `reset`,
 * which re-renders the failed segment without a full reload) and a way out.
 * The error's `digest` — the id Next logs on the server for this failure —
 * is shown as a reference, so a customer or staff member reporting it gives
 * a developer something to search the logs for. The message itself is never
 * shown: in production it is redacted anyway, and in development it can
 * carry details nobody at the counter needs.
 */
export function ErrorScreen({
  error,
  reset,
  title,
  message,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  message: string;
  homeHref: string;
  homeLabel: string;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  const headingRef = React.useRef<HTMLHeadingElement>(null);
  // Move focus to the heading so a screen reader announces what happened
  // instead of staying on the control that triggered the failure.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-[14px]">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-3xl leading-tight text-primary outline-none md:text-3xl"
      >
        {title}
      </h1>
      <p className="text-base leading-relaxed text-muted-strong">{message}</p>
      {error.digest ? (
        <p className="text-sm text-muted-strong">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-2 flex flex-col gap-[10px] sm:flex-row">
        <Button variant="unstyled"
          type="button"
          onClick={reset}
          className="flex min-h-[44px] items-center justify-center gap-[8px] rounded-sm bg-primary px-[18px] text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RotateCcw aria-hidden="true" className="size-[16px]" />
          Try again
        </Button>
        <Link
          href={homeHref}
          className="flex min-h-[44px] items-center justify-center rounded-sm border border-field-border bg-card px-[18px] text-base font-bold text-foreground transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
