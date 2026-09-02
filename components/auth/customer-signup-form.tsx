"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { signupSchema, type SignupField } from "@/lib/validation/signup";
import { registerCustomer } from "@/app/(auth)/actions";

type FieldErrors = Partial<Record<SignupField, string>>;

/**
 * Customer sign-up (Cust1).
 *
 * DESIGNER: there is no Figma frame for this screen. It is composed from the
 * login frames — same shell, same brand panel, same tabs, same field and
 * error treatment — so that it reads as the other half of one screen rather
 * than a second design. Every value here is either taken from the login
 * frames or shared with them through the primitives; nothing is invented
 * beyond the field set and its copy. This is the concrete screen to review.
 *
 * Two departures from login, both forced by there being five fields instead
 * of two: the heading is desktop-only (as on login) and the page is allowed
 * to scroll on mobile rather than the card being compressed to fit.
 */
export function CustomerSignupForm() {
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
    const result = signupSchema.safeParse({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      password: String(data.get("password") ?? ""),
      address: String(data.get("address") ?? ""),
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

    // Sign-up is reached from a blocked add-to-cart, so on success we
    // return the customer to wherever ?next= points rather than a generic
    // landing page — losing the item they wanted would be worse than
    // skipping a "you're signed up" screen.
    startTransition(async () => {
      const outcome = await registerCustomer(result.data);
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
        <AuthTabs active="register" />

        <div className="hidden flex-col gap-[5px] md:flex">
          <h1 className="font-display text-[30px] leading-[33px] text-foreground">
            Create your account
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Save your address once and reorder in two taps.
          </p>
        </div>

        {serverError ? (
          <Alert>{serverError}</Alert>
        ) : submitted && hasErrors ? (
          <Alert>
            We couldn&apos;t create your account. Check the fields marked below.
          </Alert>
        ) : null}

        <Field label="Name" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Liza Reyes"
            invalid={Boolean(errors.name)}
          />
        </Field>

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

        <Field label="Mobile number" htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0917 123 4567"
            invalid={Boolean(errors.phone)}
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
            // `new-password` rather than login's `current-password`, so the
            // browser offers to generate and save one instead of filling in
            // the password for an account that does not exist yet.
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            invalid={Boolean(errors.password)}
          />
        </Field>

        <Field
          label="Delivery address"
          htmlFor="address"
          error={errors.address}
        >
          <Textarea
            id="address"
            name="address"
            rows={2}
            autoComplete="street-address"
            placeholder="Unit, street, barangay, city"
            invalid={Boolean(errors.address)}
          />
        </Field>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>

        {/* The tabs above already lead back to login, but they read as a mode
            switch rather than an escape hatch. This is the sentence someone
            who thought they were signing in is looking for. */}
        <p className="text-center text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary">
            Log in
          </Link>
        </p>
      </form>

      {/* Desktop-only, as on login. On a 390px frame the five-field card has
          almost nothing to spare, and this line is what tips it over. */}
      <p className="relative hidden text-[11px] leading-[16.5px] text-placeholder md:mt-[18px] md:block">
        By creating an account you agree to Yang&apos;s terms of service and
        privacy policy.
      </p>
    </div>
  );
}
