"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShowHideToggle } from "@/components/ui/show-hide-toggle";
import { Textarea } from "@/components/ui/textarea";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { AddressValidationNote } from "@/components/checkout/address-validation-note";
import { signupSchema, type SignupField } from "@/lib/validation/signup";
import { registerCustomer } from "@/app/(auth)/actions";

type FieldErrors = Partial<Record<SignupField, string>>;

/**
 * Exported wrapper — keeps the same name/interface the page imports, so
 * page.tsx needs no changes. useSearchParams() (used inside
 * SignupFormInner) requires a Suspense boundary during static
 * prerendering, or `next build` fails with "should be wrapped in a
 * suspense boundary" — dev mode doesn't surface this, production builds
 * do.
 */
export function CustomerSignupForm() {
  return (
    <Suspense fallback={null}>
      <SignupFormInner />
    </Suspense>
  );
}

/**
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
function SignupFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasEmptyRequired, setHasEmptyRequired] = useState(true);
  const [draftAddressStr, setDraftAddressStr] = useState("");
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
    const timer = setTimeout(() => {
      if (formRef.current) checkFormEmpty(formRef.current);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  function handleFormChange(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    checkFormEmpty(form);

    const b = (form.elements.namedItem("buildingNo") as HTMLInputElement)?.value;
    const s = (form.elements.namedItem("street") as HTMLInputElement)?.value;
    const br = (form.elements.namedItem("barangay") as HTMLInputElement)?.value;
    const c = (form.elements.namedItem("city") as HTMLInputElement)?.value;
    const z = (form.elements.namedItem("zip") as HTMLInputElement)?.value;

    const combined = [
      b && s ? `${b} ${s}` : (b || s),
      c
    ].filter(Boolean).join(", ");
    
    setDraftAddressStr(combined);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = signupSchema.safeParse({
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? "").replace(/[^0-9]/g, "") 
        ? `+63${String(data.get("phone") ?? "").replace(/[^0-9]/g, "")}`
        : "",
      password: String(data.get("password") ?? ""),
      buildingNo: String(data.get("buildingNo") ?? ""),
      street: String(data.get("street") ?? ""),
      barangay: String(data.get("barangay") ?? ""),
      city: String(data.get("city") ?? ""),
      zip: String(data.get("zip") ?? ""),
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

  return (
    <div className="relative flex flex-col px-6 pb-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]">
      <form
        ref={formRef}
        noValidate
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        className="flex flex-col gap-[10px] rounded-[22px] bg-background p-5 md:gap-[14px] md:rounded-none md:bg-transparent md:p-0"
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
        ) : null}

        <div className="flex flex-col gap-[10px] md:flex-row md:gap-[14px]">
          <Field className="flex-1" label="First Name *" htmlFor="firstName" error={errors.firstName}>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Liza"
              required
              minLength={2}
              maxLength={50}
              invalid={Boolean(errors.firstName)}
            />
          </Field>

          <Field className="flex-1" label="Last Name *" htmlFor="lastName" error={errors.lastName}>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Reyes"
              required
              minLength={2}
              maxLength={50}
              invalid={Boolean(errors.lastName)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-[10px] md:flex-row md:gap-[14px]">
          <Field className="flex-1" label="Email *" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              minLength={5}
              maxLength={255}
              invalid={Boolean(errors.email)}
            />
          </Field>

          <Field className="flex-1" label="Mobile number *" htmlFor="phone" error={errors.phone}>
            <div
              className={cn(
                "flex w-full items-center rounded-md border bg-white focus-within:ring-2 focus-within:ring-ring/40",
                errors.phone ? "border-error-border" : "border-field-border"
              )}
            >
              <span className="pl-[14px] text-[15px] text-muted-foreground select-none pointer-events-none">+63</span>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="9171234567"
                required
                maxLength={10}
                minLength={8}
                className="w-full bg-transparent px-[6px] py-[13px] text-[15px] text-foreground placeholder:text-placeholder focus:outline-none md:py-[14px]"
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
                }}
              />
            </div>
          </Field>
        </div>

        <Field
          label="Password *"
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            maxLength={72}
            invalid={Boolean(errors.password)}
          />
        </Field>

        <div className="flex flex-col gap-[10px] md:flex-row md:gap-[14px]">
          <Field className="flex-1" label="Building / House No. *" htmlFor="buildingNo" error={errors.buildingNo}>
            <Input
              id="buildingNo"
              name="buildingNo"
              placeholder="e.g. Unit 123, Tower A"
              required
              minLength={1}
              maxLength={100}
              invalid={Boolean(errors.buildingNo)}
            />
          </Field>

          <Field className="flex-1" label="Street *" htmlFor="street" error={errors.street}>
            <Input
              id="street"
              name="street"
              placeholder="e.g. Ayala Ave"
              required
              minLength={2}
              maxLength={100}
              invalid={Boolean(errors.street)}
            />
          </Field>
        </div>

        <Field label="Barangay *" htmlFor="barangay" error={errors.barangay}>
          <Input
            id="barangay"
            name="barangay"
            placeholder="e.g. Bel-Air"
            required
            minLength={2}
            maxLength={100}
            invalid={Boolean(errors.barangay)}
          />
        </Field>

        <div className="flex flex-col gap-[10px] md:flex-row md:gap-[14px]">
          <Field className="flex-1" label="City *" htmlFor="city" error={errors.city}>
            <Input
              id="city"
              name="city"
              placeholder="e.g. Makati"
              required
              minLength={2}
              maxLength={50}
              invalid={Boolean(errors.city)}
            />
          </Field>

          <Field className="flex-1" label="ZIP Code *" htmlFor="zip" error={errors.zip}>
            <Input
              id="zip"
              name="zip"
              placeholder="e.g. 1209"
              required
              minLength={4}
              maxLength={4}
              invalid={Boolean(errors.zip)}
            />
          </Field>
        </div>

        <div className="-mt-1 px-1">
          <AddressValidationNote address={draftAddressStr} />
        </div>

        <label className="flex items-start gap-[9px] text-[13px] mt-1 mb-1">
          <Checkbox name="terms" required />
          <span className="text-muted-foreground leading-tight">
            I have read and agree to the <Link href="/terms" target="_blank" className="font-bold text-primary hover:underline">Terms & Policy</Link>.
          </span>
        </label>

        <Button type="submit" disabled={isPending || hasEmptyRequired}>
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

    </div>
  );
}
