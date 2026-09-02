import { AuthShell } from "@/components/auth/auth-shell";
import { BrandPanel } from "@/components/auth/brand-panel";
import { CustomerSignupForm } from "@/components/auth/customer-signup-form";

/**
 * Customer sign-up (Cust1). There is deliberately no employee equivalent of
 * this page — employee accounts are created by the Business Owner from
 * /manage/staff, not self-served, and /employee/login says so on its face.
 */
export default function RegisterPage() {
  return (
    <AuthShell brand={<BrandPanel />}>
      <CustomerSignupForm />
    </AuthShell>
  );
}
