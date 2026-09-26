"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShowHideToggle } from "@/components/ui/show-hide-toggle";
import { SubmitButton } from "@/components/ui/submit-button";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useSubmitShortcut } from "@/lib/hooks/use-shortcut";
import { lengthProps } from "@/lib/validation/fields";
import { loginSchema } from "@/lib/validation/login";
import { loginCustomer } from "@/app/(auth)/actions";
import {
  ACCOUNT_DISABLED_LOGIN_ERROR,
  ACCOUNT_DISABLED_MESSAGE,
} from "@/lib/auth/account-status";

/**
 * Exported wrapper — keeps the same name/interface the page imports.
 * useSearchParams() (used inside LoginFormInner) requires a Suspense
 * boundary during static prerendering, or `next build` fails.
 */
export function CustomerLoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}

/** Set by middleware when a signed-in account has no customer record. */
const NOT_CUSTOMER_NOTICE =
  "That account isn't a customer account, so it can't use the customer pages. Staff and administrators sign in at the employee login.";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(() => {
    const reason = searchParams.get("error");
    if (reason === "not-customer") return NOT_CUSTOMER_NOTICE;
    // Set by middleware, or by checkout, when the account was disabled while
    // signed in; the session has already been ended.
    if (reason === ACCOUNT_DISABLED_LOGIN_ERROR) return ACCOUNT_DISABLED_MESSAGE;
    return null;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const justRegistered = searchParams.get("registered") === "1";
  /** Arrived from /reset-password, which signs the recovery session out. */
  const justReset = searchParams.get("reset") === "1";

  const live = useLiveValidation({
    schema: loginSchema,
    read: (data) => ({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    }),
  });
  const { errors } = live;
  useSubmitShortcut(live.formRef);

  const handleSubmit = live.handleSubmit(async (values) => {
    setServerError(null);
    startTransition(async () => {
      const outcome = await loginCustomer(values);
      if (!outcome.success) {
        setServerError(outcome.error);
        live.setServerErrors(outcome.fieldErrors);
        return;
      }
      const next = searchParams.get("next") ?? "/";
      router.push(next);
      router.refresh();
    });
  });


  return (
    <div className="relative flex flex-col px-6 pb-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]">
      <form
        {...live.formProps}
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

        {/* Arrived here straight from sign-up. Green, because nothing went
            wrong: the account exists and the only step left is the email. */}
        {justRegistered && !serverError ? (
          <Alert tone="success" role="status">
            Account created! Check your inbox and confirm your email address,
            then log in.
          </Alert>
        ) : null}

        {justReset && !serverError ? (
          <Alert tone="success" role="status">
            Password updated. Log in with your new password.
          </Alert>
        ) : null}

        {serverError ? (
          <Alert>{serverError}</Alert>
        ) : null}

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            {...lengthProps("email")}
            invalid={Boolean(errors.email)}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          action={
            <ShowHideToggle
              shown={showPassword}
              onToggle={() => setShowPassword((shown) => !shown)}
            />
          }
        >
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="At least 8 characters"
            required
            {...lengthProps("password")}
            invalid={Boolean(errors.password)}
          />
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-[9px] text-[13px]">
            <Checkbox name="remember" defaultChecked />
            Keep me logged in
          </label>
          <Link
            href="/forgot-password"
            className="text-[13px] font-bold text-primary"
          >
            <span className="md:hidden">Forgot?</span>
            <span className="hidden md:inline">Forgot password?</span>
          </Link>
        </div>

        <SubmitButton
          pending={isPending}
          invalid={!live.isValid}
          pendingLabel="Logging in…"
          hint="Log in to your customer account"
          blockedHint="Enter a valid email and a password of at least 8 characters."
          wrapperClassName="w-full"
        >
          Log in
        </SubmitButton>
      </form>

    </div>
  );
}
