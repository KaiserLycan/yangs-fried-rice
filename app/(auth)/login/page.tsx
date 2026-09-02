import { AuthShell } from "@/components/auth/auth-shell";
import { BrandPanel } from "@/components/auth/brand-panel";
import { CustomerLoginForm } from "@/components/auth/customer-login-form";

/**
 * Customer login (Cust2). Employees do not log in here — Staff, Business
 * Owner and Rider use /employee/login.
 */
export default function CustomerLoginPage() {
  return (
    <AuthShell brand={<BrandPanel />}>
      <CustomerLoginForm />
    </AuthShell>
  );
}
