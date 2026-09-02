import { EmployeeAuthShell } from "@/components/auth/employee-auth-shell";
import { EmployeeBrandPanel } from "@/components/auth/employee-brand-panel";
import { EmployeeLoginForm } from "@/components/auth/employee-login-form";

/**
 * Employee sign-in (SAS1). One page shared by Staff, Business Owner and
 * Rider. Customers do not sign in here — they use /login. There is no
 * matching register page: employee accounts are created by the Business
 * Owner, and the footer on this screen says so.
 *
 * The post-sign-in redirect depends on Employee.role and is the only place in
 * the route tree where the role vocabulary changes behaviour. See the TODO in
 * EmployeeLoginForm.
 */
export default function EmployeeLoginPage() {
  return (
    <EmployeeAuthShell brand={<EmployeeBrandPanel />}>
      <EmployeeLoginForm />
    </EmployeeAuthShell>
  );
}
