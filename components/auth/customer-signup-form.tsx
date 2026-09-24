"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShowHideToggle } from "@/components/ui/show-hide-toggle";
import { PhoneInput } from "@/components/ui/phone-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AuthTabs } from "@/components/auth/auth-tabs";
import {
  AddressFields,
  ADDRESS_FIELD_LABELS,
} from "@/components/forms/address-fields";
import { FormErrorSummary } from "@/components/forms/form-error-summary";
import {
  AddressValidationNote,
  type AddressValidationStatus,
} from "@/components/checkout/address-validation-note";
import { addressForGeocoding } from "@/lib/address/geocoding-query";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useSubmitShortcut } from "@/lib/hooks/use-shortcut";
import { toInternationalMobile } from "@/lib/profile/mobile-number";
import { PH_MOBILE_EXAMPLE } from "@/lib/validation/phone";
import { lengthProps } from "@/lib/validation/fields";
import type { FieldErrors } from "@/lib/validation/field-errors";
import { earliestBirthdate, latestBirthdateForMinAge } from "@/lib/validation/date-of-birth";
import { signupFormSchema } from "@/lib/validation/signup";
import { registerCustomer } from "@/app/(auth)/actions";

const ID_PREFIX = "signup-";

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Mobile number",
  dateOfBirth: "Date of birth",
  password: "Password",
  terms: "Terms & Policy",
  ...ADDRESS_FIELD_LABELS,
};

function readSignupForm(data: FormData) {
  const text = (name: string) => String(data.get(name) ?? "");
  return {
    firstName: text("firstName"),
    lastName: text("lastName"),
    email: text("email"),
    // The field shows the masked digits; this is the stored form.
    phone: toInternationalMobile(text("phone")),
    dateOfBirth: text("dateOfBirth"),
    password: text("password"),
    buildingNo: text("buildingNo"),
    street: text("street"),
    barangay: text("barangay"),
    city: text("city"),
    zip: text("zip"),
    terms: data.get("terms") === "on",
  };
}

/**
 * Exported wrapper — keeps the same name/interface the page imports.
 * useSearchParams() (used inside SignupFormInner) requires a Suspense
 * boundary during static prerendering, or `next build` fails.
 */
export function CustomerSignupForm() {
  return (
    <Suspense fallback={null}>
      <SignupFormInner />
    </Suspense>
  );
}

/**
 * Customer sign-up. Same shell, brand panel, tabs and field treatment as the
 * login frames, so it reads as the other half of one screen.
 *
 * Validation is live: each field is checked as it is typed in and when it is
 * left, errors appear under the field, and "Create account" stays disabled
 * until every rule passes (including the Terms box and the delivery-area
 * check). If the server still rejects the submission, the banner names each
 * failing field and the same message appears under it.
 */
function SignupFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<FieldErrors | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [draftAddressStr, setDraftAddressStr] = useState("");
  const [addressStatus, setAddressStatus] =
    useState<AddressValidationStatus>("checking");

  const live = useLiveValidation({ schema: signupFormSchema, read: readSignupForm });
  const { errors } = live;
  useSubmitShortcut(live.formRef);

  function handleFormChange(event: React.FormEvent<HTMLFormElement>) {
    live.formProps.onChange(event);
    const values = readSignupForm(new FormData(event.currentTarget));
    // Street, barangay, city and ZIP only. The house/building number is left
    // out on purpose: "B10 L10 Camella Homes" is a lot inside a subdivision
    // that no map lists, and including it stops the street from matching.
    setDraftAddressStr(addressForGeocoding(values));
  }

  const handleSubmit = live.handleSubmit(async ({ terms: _terms, ...values }) => {
    setServerError(null);
    setServerFieldErrors(null);

    startTransition(async () => {
      const outcome = await registerCustomer(values);
      if (!outcome.success) {
        setServerError(outcome.error);
        setServerFieldErrors(outcome.fieldErrors ?? null);
        live.setServerErrors(outcome.fieldErrors);
        return;
      }
      // Account created but not signed in (email confirmation pending): go
      // straight to the login page, which shows the green "check your email"
      // notice.
      if (outcome.signedIn === false) {
        const nextParam = searchParams.get("next");
        router.push(
          `/login?registered=1${nextParam ? `&next=${encodeURIComponent(nextParam)}` : ""}`,
        );
        router.refresh();
        return;
      }
      const next = searchParams.get("next") ?? "/";
      router.push(next);
      router.refresh();
    });
  });

  const addressBlocked = addressStatus === "invalid";

  return (
    <div className="relative flex flex-col px-6 pb-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]">
      <form
        {...live.formProps}
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

        <FormErrorSummary
          message={serverError}
          fieldErrors={serverFieldErrors}
          labels={FIELD_LABELS}
          idPrefix={ID_PREFIX}
        />

        <div className="flex flex-col gap-[10px] md:flex-row md:gap-[14px]">
          <Field className="flex-1" label="First name *" htmlFor={`${ID_PREFIX}firstName`} error={errors.firstName}>
            <Input
              id={`${ID_PREFIX}firstName`}
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Liza"
              required
              {...lengthProps("firstName")}
              invalid={Boolean(errors.firstName)}
            />
          </Field>

          <Field className="flex-1" label="Last name *" htmlFor={`${ID_PREFIX}lastName`} error={errors.lastName}>
            <Input
              id={`${ID_PREFIX}lastName`}
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Reyes"
              required
              {...lengthProps("lastName")}
              invalid={Boolean(errors.lastName)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-[10px] md:flex-row md:gap-[14px]">
          <Field className="flex-1" label="Email *" htmlFor={`${ID_PREFIX}email`} error={errors.email}>
            <Input
              id={`${ID_PREFIX}email`}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              {...lengthProps("email")}
              invalid={Boolean(errors.email)}
            />
          </Field>

          <Field className="flex-1" label="Mobile number *" htmlFor={`${ID_PREFIX}phone`} error={errors.phone}>
            <PhoneInput
              id={`${ID_PREFIX}phone`}
              name="phone"
              required
              invalid={Boolean(errors.phone)}
              className={cn(
                "rounded-md border bg-white focus-within:ring-2 focus-within:ring-ring/40",
                errors.phone ? "border-error-border" : "border-field-border"
              )}
              prefixClassName="pl-[14px] text-[15px] text-muted-foreground"
              inputClassName="px-[6px] py-[13px] text-[15px] text-foreground placeholder:text-placeholder md:py-[14px]"
            />
            {!errors.phone ? (
              <p className="text-[12px] text-muted-foreground">e.g. {PH_MOBILE_EXAMPLE}</p>
            ) : null}
          </Field>
        </div>

        <Field label="Date of birth" htmlFor={`${ID_PREFIX}dateOfBirth`} error={errors.dateOfBirth}>
          <Input
            id={`${ID_PREFIX}dateOfBirth`}
            name="dateOfBirth"
            type="date"
            autoComplete="bday"
            min={earliestBirthdate()}
            max={latestBirthdateForMinAge()}
            invalid={Boolean(errors.dateOfBirth)}
          />
          {!errors.dateOfBirth ? (
            <p className="text-[12px] text-muted-foreground">
              Optional. Must be a past date — you need to be 13 or older.
            </p>
          ) : null}
        </Field>

        <Field
          label="Password *"
          htmlFor={`${ID_PREFIX}password`}
          error={errors.password}
          action={
            <ShowHideToggle
              shown={showPassword}
              onToggle={() => setShowPassword((shown) => !shown)}
            />
          }
        >
          <Input
            id={`${ID_PREFIX}password`}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="8 to 72 characters"
            required
            {...lengthProps("password")}
            invalid={Boolean(errors.password)}
          />
        </Field>

        <AddressFields idPrefix="signup" variant="auth" errors={errors} />

        <div className="-mt-1 px-1">
          <AddressValidationNote
            address={draftAddressStr}
            onStatusChange={setAddressStatus}
          />
        </div>

        {/* Only while the form is being sent — it is the moment the
            confirmation email goes out, and the login page repeats it. */}
        {isPending ? (
          <p
            role="status"
            className="rounded-md bg-track px-[12px] py-[10px] text-[12.5px] leading-snug text-muted-foreground"
          >
            <span className="font-bold text-foreground">Check your email.</span>{" "}
            We&apos;re sending a confirmation link — please confirm your email
            address before logging in.
          </p>
        ) : null}

        <div className="flex flex-col gap-[4px]">
          <label className="mb-1 mt-1 flex items-start gap-[9px] text-[13px]">
            <Checkbox id={`${ID_PREFIX}terms`} name="terms" required aria-invalid={Boolean(errors.terms) || undefined} />
            <span className="leading-tight text-muted-foreground">
              I have read and agree to the <Link href="/terms" target="_blank" className="font-bold text-primary hover:underline">Terms & Policy</Link>.
            </span>
          </label>
          {errors.terms ? <p className="text-[12px] text-primary">{errors.terms}</p> : null}
        </div>

        {/* An address outside the delivery radius (or one the map can't find)
            can't be used to sign up — the note above says why. */}
        <SubmitButton
          pending={isPending}
          invalid={!live.isValid || addressBlocked}
          pendingLabel="Creating account…"
          hint="Create your account and sign in"
          blockedHint={
            addressBlocked
              ? "We can't deliver to this address — check the note above."
              : "Complete the highlighted fields to continue."
          }
          wrapperClassName="w-full"
        >
          Create account
        </SubmitButton>

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
