"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CardField,
  CardInput,
  CardValue,
} from "@/components/profile/profile-card";
import { fieldErrorsFrom } from "@/components/profile/use-card-editor";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { AddressValidationNote } from "@/components/checkout/address-validation-note";
import type { CustomerAddress } from "@/lib/profile/customer-profile";
import {
  deliveryAddressSchema,
  type DeliveryAddressField,
  type DeliveryAddressValues,
} from "@/lib/validation/profile";

const NOTE_EMPTY_STATE = "No delivery note added yet.";

/** Which dialog, if any, is open, and the address it is acting on. */
type DialogState =
  | { mode: "add" }
  | { mode: "edit"; address: CustomerAddress }
  | { mode: "delete"; address: CustomerAddress }
  | null;

/**
 * Delivery addresses (Order7), the section the requirements care about most
 * — a rider cannot deliver without one.
 *
 * Add, Edit, Delete and Set as default are all wired to
 * app/api/profile/addresses (lib/actions/profile.ts). Two fixes made while
 * wiring, not just a toast-to-fetch swap:
 *   - handleSave previously ignored the values the dialog submitted.
 *   - handleSetDefault previously had no way to know which address was
 *     clicked, since it was passed to every row identically.
 */
export function DeliveryAddressesCard({
  addresses,
}: {
  addresses: CustomerAddress[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const closeDialog = () => {
    setDialog(null);
    setFormError(null);
  };

  async function handleSave(values: DeliveryAddressValues) {
    const isEdit = dialog?.mode === "edit";
    const url = isEdit
      ? `/api/profile/addresses/${dialog.address.id}`
      : "/api/profile/addresses";

    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!res.ok) {
        setFormError(json.error ?? "Could not save address.");
        return;
      }

      showToast(isEdit ? "Address updated." : "Address added.");
      closeDialog();
      router.refresh();
    } catch {
      setFormError("Could not save address. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (dialog?.mode !== "delete") return;
    const addressId = dialog.address.id;

    try {
      const res = await fetch(`/api/profile/addresses/${addressId}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        showToast(json.error ?? "Could not delete address.");
        return;
      }

      showToast("Address deleted.");
      closeDialog();
      router.refresh();
    } catch {
      showToast("Could not delete address. Check your connection.");
    }
  }

  async function handleSetDefault(address: CustomerAddress) {
    try {
      const res = await fetch(`/api/profile/addresses/${address.id}/default`, {
        method: "PATCH",
      });
      const json = await res.json();

      if (!res.ok) {
        showToast(json.error ?? "Could not update default address.");
        return;
      }

      showToast("Default address updated.");
      router.refresh();
    } catch {
      showToast("Could not update default address. Check your connection.");
    }
  }

  return (
    <section
      id="addresses"
      aria-label="Delivery address"
      className="overflow-hidden rounded-sm border border-rule bg-card"
    >
      <div className="flex items-center gap-[10px] border-b border-rule bg-background px-[14px] py-[12px] md:gap-[12px] md:px-[18px] md:py-[14px]">
        <h2 className="font-display text-[15px] tracking-[0.3px] text-foreground md:text-[17px] md:tracking-[0.34px]">
          <span className="md:hidden">ADDRESS</span>
          <span className="hidden md:inline">DELIVERY ADDRESS</span>
        </h2>

        <span className="hidden text-[12.5px] text-muted-foreground md:inline">
          {addresses.length === 1
            ? "1 saved"
            : `${addresses.length} saved`}
        </span>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setDialog({ mode: "add" })}
            className="rounded-sm border border-rule bg-card px-[15px] py-[11px] text-[13px] font-bold text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:py-[8px]"
          >
            Add address
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {addresses.length === 0 ? (
          <p className="px-[14px] py-[18px] text-[13.5px] text-muted-foreground md:px-[18px]">
            You have no saved addresses yet.
          </p>
        ) : (
          addresses.map((address, index) => (
            <div
              key={address.id}
              className={
                index < addresses.length - 1
                  ? "border-b border-rule"
                  : undefined
              }
            >
              <AddressRow
                address={address}
                onEdit={() => setDialog({ mode: "edit", address })}
                onDelete={() => setDialog({ mode: "delete", address })}
                onSetDefault={() => handleSetDefault(address)}
              />
            </div>
          ))
        )}
      </div>

      <AddressFormDialog
        open={dialog?.mode === "add" || dialog?.mode === "edit"}
        address={dialog?.mode === "edit" ? dialog.address : undefined}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={closeDialog}
        onSave={handleSave}
      />

      <Dialog
        open={dialog?.mode === "delete"}
        onClose={closeDialog}
        tone="danger"
        title="DELETE THIS ADDRESS?"
        description="This removes it from your saved addresses. This can’t be undone."
        footer={
          <>
            <Button variant="outline" className="flex-1 p-[14px]" onClick={closeDialog}>
              Cancel
            </Button>
            <Button variant="confirm" className="flex-1" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      />
    </section>
  );
}

function AddressRow({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: CustomerAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div className="flex flex-col gap-[10px] px-[14px] py-[15px] md:flex-row md:items-start md:justify-between md:gap-[16px] md:px-[18px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-[14px] font-bold text-foreground md:text-[14.5px]">
            {address.label || "Address"}
          </span>
          {address.isDefault ? (
            <span className="rounded-sm bg-rule px-[7px] py-[3px] text-[10px] font-bold uppercase tracking-[1px] text-primary md:px-[8px] md:text-[10.5px] md:tracking-[1.05px]">
              Default
            </span>
          ) : null}
        </div>
        <p className="text-[13px] text-foreground md:text-[13.5px]">
          {address.addressDetails}
        </p>
        <CardValue value={address.deliveryNote ?? ""} emptyState={NOTE_EMPTY_STATE} />
      </div>

      <div className="flex flex-wrap gap-[8px]">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-sm border border-rule bg-card px-[13px] py-[9px] text-[12.5px] font-bold text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:py-[8px]"
        >
          Edit
        </button>
        {!address.isDefault ? (
          <button
            type="button"
            onClick={onSetDefault}
            className="rounded-sm border border-rule bg-card px-[13px] py-[9px] text-[12.5px] font-bold text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:py-[8px]"
          >
            Set as default
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          className="rounded-sm border border-rule bg-card px-[13px] py-[9px] text-[12.5px] font-bold text-primary hover:bg-error-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:py-[8px]"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function parseAddress(fullAddress: string = "") {
  if (!fullAddress) {
    return { buildingNo: "", street: "", barangay: "", city: "", zip: "" };
  }
  // Best effort parsing of: "Unit 123 Tower A Ayala Ave, Bel-Air, Makati 1209"
  // Assuming format: "{buildingNo} {street}, {barangay}, {city} {zip}"
  const parts = fullAddress.split(",").map((p) => p.trim());
  let buildingNo = "";
  let street = "";
  let barangay = "";
  let city = "";
  let zip = "";

  if (parts.length >= 3) {
    // If it has at least 3 parts, assume: [building+street, barangay, city+zip]
    const bldStreet = parts[0];
    // Split building and street (heuristically take first word if it has numbers, or just put all in street)
    // For simplicity, we just put the whole first part in street since splitting it reliably is hard.
    street = bldStreet;
    
    barangay = parts[1];
    
    const cityZip = parts[parts.length - 1];
    const match = cityZip.match(/^(.*?)\s+(\d+)$/);
    if (match) {
      city = match[1];
      zip = match[2];
    } else {
      city = cityZip;
    }
  } else {
    // Fallback: put everything in street
    street = fullAddress;
  }

  return { buildingNo, street, barangay, city, zip };
}

function AddressFormDialog({
  open,
  address,
  isSubmitting,
  error: formError,
  onClose,
  onSave,
}: {
  open: boolean;
  address?: CustomerAddress;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (values: DeliveryAddressValues) => void;
}) {
  const [errors, setErrors] = React.useState<
    Partial<Record<DeliveryAddressField, string>>
  >({});
  const [draftAddressStr, setDraftAddressStr] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setErrors({});
    } else if (address?.addressDetails) {
      setDraftAddressStr(address.addressDetails);
    } else {
      setDraftAddressStr("");
    }
  }, [open, address]);

  function handleFormChange(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const b = (form.elements.namedItem("buildingNo") as HTMLInputElement)?.value;
    const s = (form.elements.namedItem("street") as HTMLInputElement)?.value;
    const br = (form.elements.namedItem("barangay") as HTMLInputElement)?.value;
    const c = (form.elements.namedItem("city") as HTMLInputElement)?.value;
    const z = (form.elements.namedItem("zip") as HTMLInputElement)?.value;

    const combined = [
      b && s ? `${b} ${s}` : (b || s),
      c
    ].filter(Boolean).join(", ");
    
    setDraftAddressStr(combined);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = deliveryAddressSchema.safeParse({
      label: String(form.get("label") ?? ""),
      buildingNo: String(form.get("buildingNo") ?? ""),
      street: String(form.get("street") ?? ""),
      barangay: String(form.get("barangay") ?? ""),
      city: String(form.get("city") ?? ""),
      zip: String(form.get("zip") ?? ""),
      deliveryNote: String(form.get("deliveryNote") ?? ""),
    });

    if (!result.success) {
      setErrors(fieldErrorsFrom<DeliveryAddressValues>(result.error.issues));
      return;
    }

    onSave(result.data);
  }

  const formId = React.useId();
  const parsed = parseAddress(address?.addressDetails);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={address ? "EDIT ADDRESS" : "ADD ADDRESS"}
      footer={
        <>
          <Button variant="outline" className="flex-1 p-[14px]" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="confirm"
            className="flex-1"
            type="submit"
            form={formId}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      {open ? (
        <form
          key={address?.id ?? "add"}
          id={formId}
          noValidate
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          className="flex flex-col gap-[12px]"
        >
          <CardField
            label="Label"
            htmlFor="address-label"
            hint="Optional. e.g. Home or Work."
          >
            <CardInput
              id="address-label"
              name="label"
              defaultValue={address?.label ?? ""}
              maxLength={50}
            />
          </CardField>

          <div className="flex flex-col gap-[12px] md:flex-row md:gap-[16px]">
            <CardField className="flex-1" label="Building / House No. *" htmlFor="address-buildingNo" error={errors.buildingNo}>
              <CardInput
                id="address-buildingNo"
                name="buildingNo"
                defaultValue={parsed.buildingNo}
                minLength={1}
                maxLength={100}
                invalid={Boolean(errors.buildingNo)}
              />
            </CardField>

            <CardField className="flex-1" label="Street *" htmlFor="address-street" error={errors.street}>
              <CardInput
                id="address-street"
                name="street"
                defaultValue={parsed.street}
                minLength={2}
                maxLength={100}
                invalid={Boolean(errors.street)}
              />
            </CardField>
          </div>

          <CardField label="Barangay *" htmlFor="address-barangay" error={errors.barangay}>
            <CardInput
              id="address-barangay"
              name="barangay"
              defaultValue={parsed.barangay}
              minLength={2}
              maxLength={100}
              invalid={Boolean(errors.barangay)}
            />
          </CardField>

          <div className="flex flex-col gap-[12px] md:flex-row md:gap-[16px]">
            <CardField className="flex-1" label="City *" htmlFor="address-city" error={errors.city}>
              <CardInput
                id="address-city"
                name="city"
                defaultValue={parsed.city}
                minLength={2}
                maxLength={50}
                invalid={Boolean(errors.city)}
              />
            </CardField>

            <CardField className="flex-1" label="ZIP Code *" htmlFor="address-zip" error={errors.zip}>
              <CardInput
                id="address-zip"
                name="zip"
                defaultValue={parsed.zip}
                minLength={4}
                maxLength={4}
                invalid={Boolean(errors.zip)}
              />
            </CardField>
          </div>

          <CardField
            label="Delivery note"
            htmlFor="address-note"
            hint="Optional. e.g. Beside the blue gate."
          >
            <CardInput
              id="address-note"
              name="deliveryNote"
              defaultValue={address?.deliveryNote ?? ""}
              maxLength={255}
            />
          </CardField>
          
          <div className="pt-2">
            <AddressValidationNote address={draftAddressStr} />
          </div>

          {formError && (
            <div className="rounded-[4px] bg-destructive/10 p-[12px] text-[13px] font-medium text-destructive">
              {formError}
            </div>
          )}
        </form>
      ) : null}
    </Dialog>
  );
}