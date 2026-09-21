"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShowHideToggle } from "@/components/ui/show-hide-toggle";
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
  const successMessage = searchParams.get("message");
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasEmptyRequired, setHasEmptyRequired] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  function checkFormEmpty(form: HTMLFormElement) {
    let empty = false;
    const elements = form.elements;
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLInputElement;
      if (el.hasAttribute('required')) {
        if (el.type === 'checkbox' && !el.checked) {
          empty = true;
          break;
        } else if (el.type !== 'checkbox' && !el.value.trim()) {
          empty = true;
          break;
        }
      }
    }
    setHasEmptyRequired(empty);
  }

  useEffect(() => {
    if (formRef.current) {
      checkFormEmpty(formRef.current);
    }
    // Set a timeout to catch delayed autofill
    const timer = setTimeout(() => {
      if (formRef.current) checkFormEmpty(formRef.current);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  function handleFormChange(event: React.FormEvent<HTMLFormElement>) {
    checkFormEmpty(event.currentTarget);
  }

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

  return (
    <div className="relative flex flex-col px-6 pb-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]">
      <form
        ref={formRef}
        noValidate
        onChange={handleFormChange}
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
        ) : successMessage ? (
          <Alert tone="success" role="status">{successMessage}</Alert>
        ) : null}

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
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
            invalid={Boolean(errors.password)}
          />
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-[9px] text-[13px]">
            <Checkbox name="remember" defaultChecked />
            Keep me logged in
          </label>
        </div>

        <Button type="submit" disabled={isPending || hasEmptyRequired}>
          {isPending ? "Logging in…" : "Log in"}
        </Button>
      </form>

    </div>
  );
}
