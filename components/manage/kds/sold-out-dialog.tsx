"use client";

import * as React from "react";
import { PackageX } from "lucide-react";
import { getProducts, toggleAvailability } from "@/lib/actions/menu";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * "Sold out" from the kitchen screen (kitchen-staff persona review): the
 * cook who just ran out marks the dish without leaving the KDS for the menu
 * editor. The switch is the same `product.is_available` the editor's
 * "Available?" toggle writes, so the customer menu greys the dish out and
 * checkout refuses it.
 */
type Dish = { id: string; name: string; available: boolean };

export function SoldOutButton({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="unstyled" onClick={() => setOpen(true)} className={className}>
        <PackageX className="h-4 w-4" aria-hidden /> Sold out
      </Button>
      <SoldOutDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SoldOutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const showToast = useToast();
  const [dishes, setDishes] = React.useState<Dish[] | null>(null);
  const [query, setQuery] = React.useState("");
  const [saving, setSaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setDishes(null);
    void getProducts().then((result) => {
      if (result.error !== null) {
        showToast(`Couldn't load the menu: ${result.error}`, "error");
        setDishes([]);
        return;
      }
      setDishes(
        result.data.map((p) => ({ id: p.product_id, name: p.product_name, available: p.is_available !== false })),
      );
    });
  }, [open, showToast]);

  async function toggle(dish: Dish) {
    setSaving(dish.id);
    const result = await toggleAvailability(dish.id, !dish.available);
    setSaving(null);
    if (result.error !== null) {
      showToast(result.error, "error");
      return;
    }
    setDishes((current) =>
      (current ?? []).map((d) => (d.id === dish.id ? { ...d, available: !dish.available } : d)),
    );
    showToast(
      dish.available ? `${dish.name} marked sold out.` : `${dish.name} is back on the menu.`,
      "success",
    );
  }

  const needle = query.trim().toLowerCase();
  // Sold-out dishes first: they are the ones someone will want to bring back.
  const shown = (dishes ?? [])
    .filter((d) => !needle || d.name.toLowerCase().includes(needle))
    .sort((a, b) => Number(a.available) - Number(b.available) || a.name.localeCompare(b.name));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="SOLD OUT"
      description="Switch a dish off when the kitchen runs out. Customers see it greyed out straight away."
      footer={
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Done
        </Button>
      }
    >
      <Input
        type="search"
        aria-label="Find a dish"
        placeholder="Find a dish"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="flex max-h-[50vh] flex-col divide-y divide-rule overflow-y-auto rounded-md border border-rule">
        {dishes === null ? (
          <li className="p-3 text-sm text-muted-foreground">Loading the menu…</li>
        ) : shown.length === 0 ? (
          <li className="p-3 text-sm text-muted-foreground">No dish matches.</li>
        ) : (
          shown.map((dish) => (
            <li key={dish.id} className="flex min-h-[48px] items-center justify-between gap-3 px-3">
              <span className={cn("text-sm font-bold", dish.available ? "text-foreground" : "text-muted-foreground line-through")}>
                {dish.name}
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-strong">
                {dish.available ? "Available" : "Sold out"}
                <Switch
                  checked={dish.available}
                  onChange={() => void toggle(dish)}
                  disabled={saving === dish.id}
                  label={`${dish.name} available`}
                />
              </span>
            </li>
          ))
        )}
      </ul>
    </Dialog>
  );
}
