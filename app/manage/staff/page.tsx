import { notFound } from "next/navigation";
import { RoutePlaceholder } from "@/components/route-placeholder";

/**
 * A placeholder for a screen that is not built. Kept for development, but a
 * 404 in production (issue #118): a live back office should not offer a
 * page that only describes what it will one day do.
 */
export default function ManageStaffPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <RoutePlaceholder
      title="Staff"
      description="Create and manage employee accounts and their roles, and oversee registered customer accounts. This is where employee accounts come from — there is no employee self-registration page. Business-Owner-only; gate it in app/manage/layout.tsx."
      requirements={["SAS1"]}
    />
  );
}
