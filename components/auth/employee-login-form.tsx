"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useSubmitShortcut } from "@/lib/hooks/use-shortcut";
import { lengthProps } from "@/lib/validation/fields";
import { Input } from "@/components/ui/input";
import { ShowHideToggle } from "@/components/ui/show-hide-toggle";
import {
  employeeLoginSchema,
} from "@/lib/validation/employee-login";
import { loginEmployee } from "@/app/(auth)/actions";
import {
  ACCOUNT_DISABLED_LOGIN_ERROR,
  EMPLOYEE_ACCOUNT_DISABLED_MESSAGE,
} from "@/lib/auth/account-status";

/**
 * COPY: "created by an admin" names a role that does not exist — the confirmed
 * user types are Customer, Business Owner and Staff, and employee
 * accounts are the Business Owner's to create. Ported as drawn and flagged.
 *
 * BACKEND: "Sessions end automatically at close of shift" is an authentication
 * requirement that appears in this frame and nowhere else in the
 * requirements. The backend developer needs to know it exists.
 */
const FOOTER_NOTE =
  "Employee accounts are created by an admin. No self-registration. Sessions end automatically at close of shift.";

/**
 * The cream side of the employee login screens. Wider than the customer form
 * column, with no sign-up tabs and no remember-me checkbox: there is no
 * employee self-registration, and the footer says so.
 *
 * On mobile the form is a card floating on the dark page and the footer sits
 * outside it, pinned to the bottom; on desktop the card dissolves into the
 * cream column and the footer becomes its last row, above a hairline rule.
 */
export function EmployeeLoginForm() {
  // useSearchParams() needs a Suspense boundary during static prerendering,
  // the same reason CustomerLoginForm wraps its inner form.
  return (
    <Suspense fallback={null}>
      <EmployeeLoginFormInner />
    </Suspense>
  );
}

function EmployeeLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Middleware signs a disabled employee out and lands them here with the
  // reason in the URL (issue #114).
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error") === ACCOUNT_DISABLED_LOGIN_ERROR
      ? EMPLOYEE_ACCOUNT_DISABLED_MESSAGE
      : null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const live = useLiveValidation({
    schema: employeeLoginSchema,
    read: (data) => ({
      identifier: String(data.get("identifier") ?? ""),
      password: String(data.get("password") ?? ""),
    }),
  });
  const { errors } = live;
  useSubmitShortcut(live.formRef);

  const handleSubmit = live.handleSubmit(async (values) => {
    setServerError(null);

    // Route on Employee.role: managers to the dashboard, staff to orders
    // (homePathForRole in lib/auth/roles.ts).
    startTransition(async () => {
      const outcome = await loginEmployee(values);
      if (!outcome.success) {
        setServerError(outcome.error);
        return;
      }
      router.push(outcome.redirectTo);
      router.refresh();
    });
  });

  return (
    <div className="relative flex flex-1 flex-col px-6 pb-[28px] pt-[22px] md:justify-center md:gap-[18px] md:bg-background md:px-[52px] md:pb-[46px] md:pt-[46px]">
      <form
        {...live.formProps}
        onSubmit={handleSubmit}
        className="flex flex-col gap-[14px] rounded-[20px] bg-background p-5 md:gap-[18px] md:rounded-none md:bg-transparent md:p-0"
      >
        <div className="flex flex-col gap-1 md:gap-[5px]">
          <h1 className="font-display text-[24px] leading-[26.4px] text-foreground md:text-[30px] md:leading-[33px]">
            Employee sign-in
          </h1>
          <p className="text-[12.5px] text-muted-foreground md:text-[13px]">
            Use the work account issued by your manager.
          </p>
        </div>

        {serverError ? <Alert>{serverError}</Alert> : null}

        <Field
          label="Work email"
          htmlFor="identifier"
          error={errors.identifier}
        >
          <Input
            id="identifier"
            name="identifier"
            type="text"
            // `username` rather than `email` to play nicely with autofill
            autoComplete="username"
            placeholder="name@yangs.ph"
            required
            {...lengthProps("email")}
            invalid={Boolean(errors.identifier)}
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

        {/* Issue #106 asked for employees to get the same way back in that
            customers have. `?from=employee` only steers the way-back link, so
            a rider who resets a password lands on /employee/login rather than
            the customer one. */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password?from=employee"
            className="text-[13px] font-bold text-primary"
          >
            Forgot password?
          </Link>
        </div>

        <SubmitButton
          pending={isPending}
          invalid={!live.isValid}
          pendingLabel="Signing in…"
          hint="Sign in to the back office or delivery app"
          blockedHint="Enter your work email and a password of at least 8 characters."
          wrapperClassName="w-full"
        >
          Sign in
        </SubmitButton>

        <div className="flex justify-end">
          <Link
            href="/login"
            className="pb-[2px] text-[13px] font-bold text-primary"
          >
            I&apos;m a customer &rarr;
          </Link>
        </div>
      </form>

      {/* One string, two treatments. On mobile it sits on the dark page below
          the card and is pushed to the bottom by the auto margin; on desktop
          it is the last row of the cream column, under a hairline rule. */}
      <p className="mt-auto pt-[18px] text-[11px] leading-[16.5px] text-on-console-faint md:mt-0 md:border-t md:border-rule md:pt-[14px] md:text-placeholder">
        {FOOTER_NOTE}
      </p>
    </div>
  );
}
