import { RoutePlaceholder } from "@/components/route-placeholder";

export default function ManageHomePage() {
  return (
    <RoutePlaceholder
      title="Back office"
      description="Landing page for Staff and Business Owner after sign-in. Links through to the order queue, menu management, inventory, reports, and staff management. Reports and staff are Business-Owner-only."
      requirements={["SAS1"]}
    />
  );
}
