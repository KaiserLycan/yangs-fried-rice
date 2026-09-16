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

  const closeDialog = () => setDialog(null);

  async function handleSave(values: DeliveryAddressValues) {
    const isEdit = dialog?.mode === "edit";
    const url = isEdit
      ? `/api/profile/addresses/${dialog.address.id}`
      : "/api/profile/addresses";

    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!res.ok) {
        showToast(json.error ?? "Could not save address.");
        return;
      }

      showToast(isEdit ? "Address updated." : "Address added.");
      closeDialog();
      router.refresh();
    } catch {
      showToast("Could not save address. Check your connection.");
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

function AddressFormDialog({
  open,
  address,
  isSubmitting,
  onClose,
  onSave,
}: {
  open: boolean;
  address?: CustomerAddress;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (values: DeliveryAddressValues) => void;
}) {
  const [errors, setErrors] = React.useState<
    Partial<Record<DeliveryAddressField, string>>
  >({});

  React.useEffect(() => {
    if (!open) setErrors({});
  }, [open]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = deliveryAddressSchema.safeParse({
      label: String(form.get("label") ?? ""),
      addressDetails: String(form.get("addressDetails") ?? ""),
      deliveryNote: String(form.get("deliveryNote") ?? ""),
    });

    if (!result.success) {
      setErrors(fieldErrorsFrom<DeliveryAddressValues>(result.error.issues));
      return;
    }

    onSave(result.data);
  }

  const formId = React.useId();

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
            />
          </CardField>

          <CardField
            label="Address"
            htmlFor="address-details"
            error={errors.addressDetails}
          >
            <CardInput
              id="address-details"
              name="addressDetails"
              defaultValue={address?.addressDetails ?? ""}
              invalid={Boolean(errors.addressDetails)}
            />
          </CardField>

          <CardField
            label="Delivery note"
            htmlFor="address-note"
            hint="Optional. e.g. Beside the blue gate."
          >
            <CardInput
              id="address-note"
              name="deliveryNote"
              defaultValue={address?.deliveryNote ?? ""}
            />
          </CardField>
        </form>
      ) : null}
    </Dialog>
  );
}