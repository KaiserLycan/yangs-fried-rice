"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  employeeLoginSchema,
  EMPLOYEE_SIGN_IN_FAILED,
  type EmployeeLoginField,
} from "@/lib/validation/employee-login";

type FieldErrors = Partial<Record<EmployeeLoginField, string>>;

/**
 * COPY: "created by an admin" names a role that does not exist — the confirmed
 * user types are Customer, Business Owner, Staff and Rider, and employee
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = employeeLoginSchema.safeParse({
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
    // TODO(auth): no session yet. Sign in against Supabase, then route on
    // Employee.role — Staff and Business Owner to /manage, Rider to /deliver.
    // That redirect is the only place in the route tree where the role
    // vocabulary changes behaviour, so it needs the final Employee.role values
    // confirmed with the PM and DB developer before it is wired.
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="relative flex flex-1 flex-col px-6 pb-[28px] pt-[22px] md:justify-center md:gap-[18px] md:bg-background md:px-[52px] md:pb-[46px] md:pt-[46px]">
      <form
        noValidate
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

        {submitted && hasErrors ? (
          <Alert>{EMPLOYEE_SIGN_IN_FAILED}</Alert>
        ) : null}

        <Field
          label="Staff ID or work email"
          htmlFor="identifier"
          error={errors.identifier}
        >
          <Input
            id="identifier"
            name="identifier"
            type="text"
            // `username` rather than `email`: the field accepts a staff ID as
            // well, so an email-only hint would fight the browser's autofill.
            autoComplete="username"
            placeholder="YFR-0142 or name@yangs.ph"
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

        <Button type="submit">Sign in</Button>

        <div className="flex items-center justify-between">
          <Link
            href="/employee/login"
            className="text-[13px] font-bold text-primary"
          >
            Forgot password?
          </Link>
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