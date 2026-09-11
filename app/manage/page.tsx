import { redirect } from "next/navigation";

/**
 * /manage root — redirects to the dashboard.
 *
 * The dashboard is the landing page for MANAGER (Business Owner).
 * STAFF users will be redirected to /manage/orders by the login action,
 * so they should never hit this page. But if they somehow do (e.g.
 * navigating directly), the dashboard page itself will handle the
 * role check.
 *
 * TODO: BACKEND INTEGRATION — This redirect is unconditional. If you
 * want to add role-aware routing at this level, check the employee's
 * role here and redirect STAFF to /manage/orders instead.
 */
export default function ManageHomePage() {
  redirect("/manage/dashboard");
}
