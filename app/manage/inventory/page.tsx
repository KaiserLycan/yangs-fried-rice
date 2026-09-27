import { notFound } from "next/navigation";
import { RoutePlaceholder } from "@/components/route-placeholder";

/**
 * A placeholder for a screen that is not built. Kept for development, but a
 * 404 in production (issue #118): a live back office should not offer a
 * page that only describes what it will one day do.
 */
export default function ManageInventoryPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <RoutePlaceholder
      title="Inventory"
      description="Ingredient stock levels, recipes, and stock movements — the pain point behind wasted ingredients in the business case. Later phase: the requirements proposal has no explicit requirement IDs for inventory, so scope this with the PM before building."
    />
  );
}
