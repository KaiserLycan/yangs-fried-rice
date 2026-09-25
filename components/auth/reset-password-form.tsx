"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShowHideToggle } from "@/components/ui/show-hide-toggle";
import { SubmitButton } from "@/components/ui/submit-button";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useSubmitShortcut } from "@/lib/hooks/use-shortcut";
import { lengthProps } from "@/lib/validation/fields";
import { resetPasswordSchema } from "@/lib/validation/password-reset";
import { createClient } from "@/lib/supabase/client";
import { resetPassword } from "@/app/(auth)/actions";

/**
 * Set a new password from the link in the reset email.
 *
 * Supabase puts the recovery token in the URL **fragment** (`#access_token=…`)
 * rather than the query string, which means the server never sees it — only
 * the browser can exchange it for a session. So this waits for the client
 * library to pick the fragment up and raise `PASSWORD_RECOVERY` before
 * offering the form; submitting earlier would update nobody's password.
 *
 * `detectSessionInUrl` is on by default in `createBrowserClient`, so merely
 * constructing the client here is what triggers the exchange.
 */
export function ResetPasswordForm({
  from = "customer",
}: {
  /** Which login page to send them to once the password is set. */
  from?: "customer" | "employee";
}) {
  const router = useRouter();
  const [ready, setReady] = React.useState<boolean | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const supabase = createClient();

    // Already exchanged by the time this mounts, or about to be.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    // A link that was already used, or that expired, raises no event at all.
    // Rather than spin forever, give up and offer a fresh one.
    const timeout = window.setTimeout(
      () => setReady((current) => current ?? false),
      4000,
    );

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const live = useLiveValidation({
    schema: resetPasswordSchema,
    read: (data) => ({
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
    }),
  });
  const { errors } = live;
  useSubmitShortcut(live.formRef);

  const handleSubmit = live.handleSubmit(async (values) => {
    setServerError(null);
    startTransition(async () => {
      const outcome = await resetPassword(values);
      if (outcome.success) {
        // The action signs the recovery session out, so the new password has
        // to be typed — which is the point of setting one.
        router.push(
          from === "employee"
            ? "/employee/login?reset=1"
            : "/login?reset=1",
        );
      } else {
        setServerError(outcome.error);
      }
    });
  });

  const shell =
    "relative flex flex-col px-6 pb-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]";
  const panel =
    "flex flex-col gap-[14px] rounded-[22px] bg-background p-5 md:gap-[18px] md:rounded-none md:bg-transparent md:p-0";

  if (ready === null) {
    return (
      <div className={shell}>
        <div className={panel}>
          <p role="status" className="text-[13px] text-muted-foreground">
            Checking your reset link…
          </p>
        </div>
      </div>
    );
  }

  if (ready === false) {
    return (
      <div className={shell}>
        <div className={panel}>
          <h1 className="font-display text-[30px] leading-[33px] text-foreground">
            That link has expired
          </h1>
          <Alert>
            Reset links can only be used once, and they don’t last forever.
            Ask for a new one and it’ll be in your inbox in a moment.
          </Alert>
          <Link
            href="/forgot-password"
            className="text-[13px] font-bold text-primary"
          >
            Send me a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <form {...live.formProps} onSubmit={handleSubmit} className={panel}>
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-display text-[30px] leading-[33px] text-foreground">
            Set a new password
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Pick something you haven’t used here before.
          </p>
        </div>

        {serverError ? <Alert>{serverError}</Alert> : null}

        <Field
          label="New password"
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
            {...lengthProps("password")}
            invalid={Boolean(errors.password)}
          />
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword}
        >
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Type it again"
            required
            invalid={Boolean(errors.confirmPassword)}
          />
        </Field>

        <SubmitButton
          pending={isPending}
          invalid={!live.isValid}
          pendingLabel="Saving…"
          hint="Save this as my new password"
          blockedHint="Enter a password of at least 8 characters, twice."
          wrapperClassName="w-full"
        >
          Save new password
        </SubmitButton>
      </form>
    </div>
  );
}
