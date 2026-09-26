"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useSubmitShortcut } from "@/lib/hooks/use-shortcut";
import { lengthProps } from "@/lib/validation/fields";
import {
  forgotPasswordSchema,
  RESET_LINK_SENT,
} from "@/lib/validation/password-reset";
import { requestPasswordReset } from "@/app/(auth)/actions";

/**
 * "Forgot password?" — ask for a reset link.
 *
 * Serves customers and employees from one screen: Supabase Auth holds a
 * single password per account, so there is nothing role-specific to do. The
 * `backTo` prop only decides which login page the way-back link points at,
 * since the two have separate front doors.
 *
 * Once sent, the form is replaced by the confirmation rather than left on
 * screen — the same message is shown whether or not the address is
 * registered, so a second submission would tell the sender nothing new.
 */
/**
 * The way back to whichever front door they came from.
 *
 * A `from` flag rather than a ready-made URL so the two routes stay literal
 * at the `href` — `__tests__/security/xss.test.tsx` requires every dynamic
 * href to resolve to a hard-coded path, and a string passed down as a prop
 * cannot be seen to do that.
 */
function BackToLogin({
  from,
  className,
}: {
  from: "customer" | "employee";
  className?: string;
}) {
  return (
    <Link
      href={from === "employee" ? "/employee/login" : "/login"}
      className={className}
    >
      Back to log in
    </Link>
  );
}

export function ForgotPasswordForm({
  from = "customer",
}: {
  /** Which login page to offer as the way back. */
  from?: "customer" | "employee";
}) {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const live = useLiveValidation({
    schema: forgotPasswordSchema,
    read: (data) => ({ email: String(data.get("email") ?? "") }),
  });
  const { errors } = live;
  useSubmitShortcut(live.formRef);

  const handleSubmit = live.handleSubmit(async (values) => {
    setServerError(null);
    startTransition(async () => {
      const outcome = await requestPasswordReset(values);
      if (outcome.success) {
        setSent(true);
      } else {
        setServerError(outcome.error);
      }
    });
  });

  if (sent) {
    return (
      <div className="relative flex flex-col px-6 pb-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]">
        <div className="flex flex-col gap-[14px] rounded-[22px] bg-background p-5 md:gap-[18px] md:rounded-none md:bg-transparent md:p-0">
          <h1 className="font-display text-[30px] leading-[33px] text-foreground">
            Check your email
          </h1>
          <Alert tone="success" role="status">
            {RESET_LINK_SENT}
          </Alert>
          <p className="text-[13px] text-muted-foreground">
            The link expires after a while. If it does, come back here and ask
            for another one.
          </p>
          <BackToLogin from={from} className="text-[13px] font-bold text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col px-6 pb-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]">
      <form
        {...live.formProps}
        onSubmit={handleSubmit}
        className="flex flex-col gap-[14px] rounded-[22px] bg-background p-5 md:gap-[18px] md:rounded-none md:bg-transparent md:p-0"
      >
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-display text-[30px] leading-[33px] text-foreground">
            Forgot your password?
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Give us the email on your account and we’ll send a link to set a new
            password.
          </p>
        </div>

        {serverError ? <Alert>{serverError}</Alert> : null}

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

        <SubmitButton
          pending={isPending}
          invalid={!live.isValid}
          pendingLabel="Sending…"
          hint="Email me a link to reset my password"
          blockedHint="Enter a valid email address."
          wrapperClassName="w-full"
        >
          Send reset link
        </SubmitButton>

        <BackToLogin
          from={from}
          className="text-center text-[13px] font-bold text-primary"
        />
      </form>
    </div>
  );
}
