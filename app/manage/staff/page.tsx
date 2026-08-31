import { RoutePlaceholder } from "@/components/route-placeholder";

export default function ManageStaffPage() {
  return (
    <RoutePlaceholder
      title="Staff"
      description="Create and manage employee accounts and their roles, and oversee registered customer accounts. This is where employee accounts come from — there is no employee self-registration page. Business-Owner-only; gate it in app/manage/layout.tsx."
      requirements={["SAS1"]}
    />
  );
}
