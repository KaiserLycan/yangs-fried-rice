import { AuthShell } from "@/components/auth/auth-shell";
import { BrandPanel } from "@/components/auth/brand-panel";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

/**
 * Where the link in the reset email lands.
 *
 * The recovery token arrives in the URL fragment, which never reaches the
 * server, so all the work happens in the client component — see
 * `ResetPasswordForm`. This page cannot be prerendered with the token in
 * hand, and does not need to be.
 */
export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  return (
    <AuthShell brand={<BrandPanel />}>
      <ResetPasswordForm
        from={searchParams.from === "employee" ? "employee" : "customer"}
      />
    </AuthShell>
  );
}
