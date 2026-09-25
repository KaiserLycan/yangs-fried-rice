import { AuthShell } from "@/components/auth/auth-shell";
import { BrandPanel } from "@/components/auth/brand-panel";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

/**
 * Ask for a password-reset link.
 *
 * Reached from both front doors — the customer login's "Forgot password?"
 * and the employee login's — because one Supabase account holds one
 * password whichever side of the app it signs into. `?from=employee` only
 * changes which login the way-back link points at.
 */
export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  return (
    <AuthShell brand={<BrandPanel />}>
      <ForgotPasswordForm
        from={searchParams.from === "employee" ? "employee" : "customer"}
      />
    </AuthShell>
  );
}
