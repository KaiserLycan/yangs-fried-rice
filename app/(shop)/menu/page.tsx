import { RoutePlaceholder } from "@/components/route-placeholder";

export default function MenuPage() {
  return (
    <RoutePlaceholder
      title="Menu"
      description="Browse the full menu, search by keyword, and filter by category. Public — no login required, and menu changes should appear here in real time."
      requirements={["Browsing1", "SFR1", "SFR2", "Menu5"]}
    />
  );
}
