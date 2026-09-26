"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CardField,
  CardInput,
  CardValue,
} from "@/components/profile/profile-card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  AddressFields,
  ADDRESS_FIELD_LABELS,
} from "@/components/forms/address-fields";
import { FormErrorSummary } from "@/components/forms/form-error-summary";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useSubmitShortcut } from "@/lib/hooks/use-shortcut";
import { lengthProps } from "@/lib/validation/fields";
import type { FieldErrors } from "@/lib/validation/field-errors";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  AddressValidationNote,
  type AddressValidationStatus,
} from "@/components/checkout/address-validation-note";
import { addressForGeocoding } from "@/lib/address/geocoding-query";
import type { CustomerAddress } from "@/lib/profile/customer-profile";
import {
  deliveryAddressSchema,
  type DeliveryAddressValues,
} from "@/lib/validation/profile";

const ADDRESS_FORM_LABELS: Record<string, string> = {
  label: "Label",
  deliveryNote: "Delivery note",
  ...ADDRESS_FIELD_LABELS,
};

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
  const [formFieldErrors, setFormFieldErrors] = React.useState<FieldErrors | null>(null);

  const closeDialog = () => {
    setDialog(null);
    setFormError(null);
    setFormFieldErrors(null);
  };

  async function handleSave(values: DeliveryAddressValues) {
    const isEdit = dialog?.mode === "edit";
    const url = isEdit
      ? `/api/profile/addresses/${dialog.address.id}`
      : "/api/profile/addresses";

    setFormError(null);
    setFormFieldErrors(null);
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
        setFormFieldErrors(json.fieldErrors ?? null);
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
          <Tooltip content="Save another delivery address">
            <button
              type="button"
              onClick={() => setDialog({ mode: "add" })}
              className="rounded-sm border border-rule bg-card px-[15px] py-[11px] text-[13px] font-bold text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:py-[8px]"
            >
              Add address
            </button>
          </Tooltip>
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
        fieldErrors={formFieldErrors}
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
  error: formError,
  fieldErrors: serverFieldErrors,
  onClose,
  onSave,
}: {
  open: boolean;
  address?: CustomerAddress;
  isSubmitting: boolean;
  error?: string | null;
  fieldErrors?: FieldErrors | null;
  onClose: () => void;
  onSave: (values: DeliveryAddressValues) => void;
}) {
  const [draftAddressStr, setDraftAddressStr] = React.useState("");
  const [addressStatus, setAddressStatus] =
    React.useState<AddressValidationStatus>("checking");

  const live = useLiveValidation({
    schema: deliveryAddressSchema,
    read: (form) => ({
      label: String(form.get("label") ?? ""),
      buildingNo: String(form.get("buildingNo") ?? ""),
      street: String(form.get("street") ?? ""),
      barangay: String(form.get("barangay") ?? ""),
      city: String(form.get("city") ?? ""),
      zip: String(form.get("zip") ?? ""),
      deliveryNote: String(form.get("deliveryNote") ?? ""),
    }),
  });
  const { reset, setServerErrors } = live;
  useSubmitShortcut(live.formRef, { enabled: open });

  React.useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    setDraftAddressStr(address ? addressForGeocoding(address) : "");
  }, [open, address, reset]);

  // A server rejection lands under the field it names.
  React.useEffect(() => {
    setServerErrors(serverFieldErrors);
  }, [serverFieldErrors, setServerErrors]);

  function handleFormChange(event: React.FormEvent<HTMLFormElement>) {
    live.formProps.onChange(event);
    const form = new FormData(event.currentTarget);
    // Street, barangay, city and ZIP only. The house/building number is left
    // out on purpose: "B10 L10 Camella Homes" is a lot inside a subdivision
    // that no map lists, and including it stops the street from matching.
    setDraftAddressStr(
      addressForGeocoding({
        street: String(form.get("street") ?? ""),
        barangay: String(form.get("barangay") ?? ""),
        city: String(form.get("city") ?? ""),
        zip: String(form.get("zip") ?? ""),
      }),
    );
  }

  const formId = React.useId();
  const { errors } = live;
  const addressBlocked = addressStatus === "invalid";

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
          <SubmitButton
            variant="confirm"
            form={formId}
            pending={isSubmitting}
            invalid={!live.isValid || addressBlocked}
            pendingLabel="Saving…"
            hint={address ? "Save changes to this address" : "Save this address"}
            // An address the map rejects — including one beyond the delivery
            // radius — can't be saved at all. The note under the form says why.
            blockedHint={
              addressBlocked
                ? "We can't deliver to this address — see the note in the form."
                : "Complete the highlighted fields to continue."
            }
            wrapperClassName="flex-1"
          >
            Save
          </SubmitButton>
        </>
      }
    >
      {open ? (
        <form
          key={address?.id ?? "add"}
          id={formId}
          {...live.formProps}
          onChange={handleFormChange}
          onSubmit={live.handleSubmit(onSave)}
          className="flex flex-col gap-[12px]"
        >
          <FormErrorSummary
            message={formError}
            fieldErrors={serverFieldErrors}
            labels={ADDRESS_FORM_LABELS}
            idPrefix="address-"
          />

          <CardField
            label="Label"
            htmlFor="address-label"
            hint="Optional. e.g. Home or Work."
            error={errors.label}
          >
            <CardInput
              id="address-label"
              name="label"
              defaultValue={address?.label ?? ""}
              {...lengthProps("addressLabel")}
              invalid={Boolean(errors.label)}
            />
          </CardField>

          <AddressFields
            idPrefix="address"
            variant="card"
            defaults={address}
            errors={errors}
            gapClassName="gap-[12px] md:gap-[16px]"
          />

          <CardField
            label="Delivery note"
            htmlFor="address-deliveryNote"
            hint="Optional. e.g. Beside the blue gate."
            error={errors.deliveryNote}
          >
            <CardInput
              id="address-deliveryNote"
              name="deliveryNote"
              defaultValue={address?.deliveryNote ?? ""}
              {...lengthProps("deliveryNote")}
              invalid={Boolean(errors.deliveryNote)}
            />
          </CardField>

          <div className="pt-2">
            <AddressValidationNote
              address={draftAddressStr}
              onStatusChange={setAddressStatus}
            />
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
