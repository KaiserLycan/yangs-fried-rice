"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthTabs } from "@/components/auth/auth-tabs";

/**
 * Messages are taken verbatim from the error frames rather than written
 * fresh, so the rendered errors match the design exactly.
 */
const loginSchema = z.object({
  identifier: z
    .string()
    .refine(
      (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
        /^\+?[\d\s-]{7,}$/.test(value),
      "Enter a valid email address or mobile number.",
    ),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type FieldErrors = Partial<Record<"identifier" | "password", string>>;

export function CustomerLoginForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      identifier: String(data.get("identifier") ?? ""),
      password: String(data.get("password") ?? ""),
    });

    setSubmitted(true);
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    // TODO(auth): no session yet. Sign in against Supabase, then return the
    // customer to wherever they were headed — usually the item they were
    // trying to add to their cart.
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="relative flex flex-col px-6 pb-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-[14px] rounded-[22px] bg-background p-5 md:gap-[18px] md:rounded-none md:bg-transparent md:p-0"
      >
        <AuthTabs active="login" />

        <div className="hidden flex-col gap-[5px] md:flex">
          <h1 className="font-display text-[30px] leading-[33px] text-foreground">
            Welcome back
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Log in to reorder in two taps.
          </p>
        </div>

        {submitted && hasErrors ? (
          <Alert>
            We couldn&apos;t sign you in. Check your details and try again.
          </Alert>
        ) : null}

        <Field
          label="Email or mobile"
          htmlFor="identifier"
          error={errors.identifier}
        >
          <Input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="you@example.com"
            invalid={Boolean(errors.identifier)}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          action={
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              className="text-[12px] text-primary"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          }
        >
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="At least 8 characters"
            invalid={Boolean(errors.password)}
          />
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-[9px] text-[13px]">
            <Checkbox name="remember" defaultChecked />
            Keep me logged in
          </label>
          <Link href="/login" className="text-[13px] font-bold text-primary">
            <span className="md:hidden">Forgot?</span>
            <span className="hidden md:inline">Forgot password?</span>
          </Link>
        </div>

        <Button type="submit">Log in</Button>

        {/* Social sign-in appears only in the desktop error frame, not in the
            clean or mobile ones — most likely the newer frame is the current
            one. Rendered on desktop to match it, and flagged: OAuth is not in
            Cust1/Cust2 and needs Supabase providers configured. */}
        <div className="hidden items-center gap-3 md:flex">
          <span className="h-px flex-1 bg-divider" />
          <span className="text-[11px] uppercase tracking-[1.54px] text-placeholder">
            or
          </span>
          <span className="h-px flex-1 bg-divider" />
        </div>
        <div className="hidden gap-[10px] md:flex">
          {/* TODO(auth): wire to Supabase OAuth providers once configured. */}
          <Button type="button" variant="outline">
            Continue with Google
          </Button>
          <Button type="button" variant="outline">
            Continue with Facebook
          </Button>
        </div>
      </form>

      {/* TODO(auth): "Continue as guest" contradicts the recorded decision
          that the cart is server-side and keyed by customer_id, with no guest
          checkout (docs/reference/frontend-integration.md §2). Raised with
          the PM; points at the public menu until it is settled. */}
      <Link
        href="/menu"
        className="relative mt-[18px] block text-center text-[14px] font-bold text-on-brand-accent underline md:mt-0 md:pb-[8px] md:pt-[6px] md:text-left md:text-primary"
      >
        Continue as guest →
      </Link>

      <p className="relative hidden text-[11px] leading-[16.5px] text-placeholder md:block">
        By continuing you agree to Yang&apos;s terms of service and privacy
        policy.
      </p>
    </div>
  );
}
