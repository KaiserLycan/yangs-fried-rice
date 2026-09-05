"use client";

import * as React from "react";
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

const ADD_TOAST =
  "Saving a new address isn’t available yet. We’re still building it.";
const EDIT_TOAST =
  "Saving your address changes isn’t available yet. We’re still building it.";
const DELETE_TOAST =
  "Deleting this address isn’t available yet. We’re still building it.";
const DEFAULT_TOAST =
  "Setting a default address isn’t available yet. We’re still building it.";

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
 * A list that happens to contain one entry, not a single fixed row: sign-up
 * writes exactly one address today, but a second is a confirmed upcoming
 * feature. Add, Edit, Delete and Set as default all raise a toast and write
 * nothing — see `.scratch/profile-page/issues/05-backend-handoff.md`.
 *
 * Only the collapsed row and the edit form are drawn in the frames
 * (`2047:1025` desktop, `2047:1154` mobile). Add, Delete and Set as default
 * are derived: there is no frame for any of the three, so each reuses the
 * controls already on the card rather than inventing a new composition.
 */
export function DeliveryAddressesCard({
  addresses,
}: {
  addresses: CustomerAddress[];
}) {
  const showToast = useToast();
  const [dialog, setDialog] = React.useState<DialogState>(null);

  const closeDialog = () => setDialog(null);

  function handleSave() {
    showToast(dialog?.mode === "edit" ? EDIT_TOAST : ADD_TOAST);
    closeDialog();
  }

  function handleDelete() {
    showToast(DELETE_TOAST);
    closeDialog();
  }

  function handleSetDefault() {
    showToast(DEFAULT_TOAST);
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

        {/* The count only appears in the desktop frame — the mobile one has
            no room for it beside the shortened title. */}
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
                onSetDefault={handleSetDefault}
              />
            </div>
          ))
        )}
      </div>

      <AddressFormDialog
        open={dialog?.mode === "add" || dialog?.mode === "edit"}
        address={dialog?.mode === "edit" ? dialog.address : undefined}
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
          {/* Rendered only when the data actually says this is the default —
              never hardcoded onto whichever address happens to be first. */}
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

/**
 * The one form Add and Edit share, built on the `Dialog` primitive. There is
 * no mobile frame for either action — the mobile card only draws the
 * collapsed row and its Edit button — so the same dialog serves both
 * breakpoints, the way ticket 04's password form does for its own fields.
 */
function AddressFormDialog({
  open,
  address,
  onClose,
  onSave,
}: {
  open: boolean;
  /** Present in edit mode; absent when adding a new address. */
  address?: CustomerAddress;
  onClose: () => void;
  onSave: (values: DeliveryAddressValues) => void;
}) {
  const [errors, setErrors] = React.useState<
    Partial<Record<DeliveryAddressField, string>>
  >({});

  // Closing the dialog drops its error state, so reopening it — for the same
  // address or a different one — starts clean rather than showing a stale
  // rejection from the last attempt.
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
          <Button variant="confirm" className="flex-1" type="submit" form={formId}>
            Save
          </Button>
        </>
      }
    >
      {/* Only rendered while open — matching the password card's mobile
          dialog — so the fields don't sit mounted (and, briefly, holding the
          previous address's values) while the dialog is closed. Keyed on the
          address id (or "add") so the uncontrolled fields remount with fresh
          defaults every time a different row's Edit is pressed, rather than
          carrying the previous address's values into this one. */}
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
