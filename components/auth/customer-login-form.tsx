"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { loginSchema, type LoginField } from "@/lib/validation/login";
import { loginCustomer } from "@/app/(auth)/actions";

type FieldErrors = Partial<Record<LoginField, string>>;

/**
 * Exported wrapper — keeps the same name/interface the page imports, so
 * page.tsx needs no changes. useSearchParams() (used inside
 * LoginFormInner) requires a Suspense boundary during static
 * prerendering, or `next build` fails with "should be wrapped in a
 * suspense boundary" — dev mode doesn't surface this, production builds
 * do.
 */
export function CustomerLoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: String(data.get("email") ?? ""),
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
    setServerError(null);

    startTransition(async () => {
      const outcome = await loginCustomer(result.data);
      if (!outcome.success) {
        setServerError(outcome.error);
        return;
      }
      const next = searchParams.get("next") ?? "/";
      router.push(next);
      router.refresh();
    });
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

        {serverError ? (
          <Alert>{serverError}</Alert>
        ) : submitted && hasErrors ? (
          <Alert>
            We couldn&apos;t sign you in. Check your details and try again.
          </Alert>
        ) : null}

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
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

        <Button type="submit" disabled={isPending}>
          {isPending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="relative hidden text-[11px] leading-[16.5px] text-placeholder md:mt-[18px] md:block">
        By continuing you agree to Yang&apos;s terms of service and privacy
        policy.
      </p>
    </div>
  );
}
