"use client";
import * as React from "react";
import {
  AddressValidationNote,
  type AddressValidationStatus,
} from "@/components/checkout/address-validation-note";
import { formatMobileNumber } from "@/lib/profile/mobile-number";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { setActiveAddress, upsertCustomerAddress } from "@/lib/actions/address";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { CardField, CardInput } from "@/components/profile/profile-card";
import {
  AddressFields,
  ADDRESS_FIELD_LABELS,
} from "@/components/forms/address-fields";
import { FormErrorSummary } from "@/components/forms/form-error-summary";
import { SubmitButton } from "@/components/ui/submit-button";
import { Tooltip } from "@/components/ui/tooltip";
import { addressForGeocoding } from "@/lib/address/geocoding-query";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useSubmitShortcut } from "@/lib/hooks/use-shortcut";
import { lengthProps } from "@/lib/validation/fields";
import type { FieldErrors } from "@/lib/validation/field-errors";
import { deliveryAddressSchema } from "@/lib/validation/profile";

const FORM_LABELS: Record<string, string> = {
  label: "Label",
  deliveryNote: "Delivery note",
  ...ADDRESS_FIELD_LABELS,
};

function readAddressForm(form: FormData) {
  const text = (name: string) => String(form.get(name) ?? "");
  return {
    label: text("label"),
    buildingNo: text("buildingNo"),
    street: text("street"),
    barangay: text("barangay"),
    city: text("city"),
    zip: text("zip"),
    deliveryNote: text("deliveryNote"),
  };
}

export function DeliveryDetailsCard({ profile }: { profile: CustomerProfile }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [editingAddressId, setEditingAddressId] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = React.useState<FieldErrors | null>(null);
  const [draftAddressStr, setDraftAddressStr] = React.useState("");
  const [addressStatus, setAddressStatus] =
    React.useState<AddressValidationStatus>("checking");

  const live = useLiveValidation({ schema: deliveryAddressSchema, read: readAddressForm });
  useSubmitShortcut(live.formRef, { enabled: isEditing });

  const editingAddress = editingAddressId
    ? profile.addresses.find((a) => a.id === editingAddressId)
    : undefined;

  const startEditing = (addressId?: string) => {
    const address = addressId ? profile.addresses.find((a) => a.id === addressId) : undefined;
    setEditingAddressId(address?.id ?? null);
    setDraftAddressStr(address ? addressForGeocoding(address) : "");
    setSaveError(null);
    setSaveFieldErrors(null);
    live.reset();
    setIsEditing(true);
  };

  const stopEditing = () => {
    setIsEditing(false);
    setSaveError(null);
    setSaveFieldErrors(null);
    live.reset();
  };

  function handleFormChange(event: React.FormEvent<HTMLFormElement>) {
    live.formProps.onChange(event);
    setDraftAddressStr(addressForGeocoding(readAddressForm(new FormData(event.currentTarget))));
  }

  const handleSave = live.handleSubmit(async (values) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveFieldErrors(null);
    try {
      const result = await upsertCustomerAddress({
        address_id: editingAddressId || undefined,
        ...values,
      });
      if (!result.success) {
        setSaveError(result.error);
        setSaveFieldErrors(result.fieldErrors ?? null);
        live.setServerErrors(result.fieldErrors);
        return;
      }
      stopEditing();
    } catch {
      setSaveError("Could not save the address. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  });

  const activeAddress = profile.addresses.find(a => a.id === profile.activeAddressId) ?? profile.addresses[0];
  const addressBlocked = addressStatus === "invalid";

  return (
    <section className="flex flex-col gap-[12px] rounded-lg border border-rule bg-card p-[20px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[1.54px] text-muted-foreground">
          Delivery details
        </h2>
      </div>

      <div className="flex gap-[12px]">
        <Field label="Name" value={profile.name || "Not set"} />
        <Field
          label="Contact"
          value={profile.mobile ? formatMobileNumber(profile.mobile) : "Not set"}
        />
      </div>

      {isEditing ? (
        <form
          key={editingAddressId ?? "new"}
          {...live.formProps}
          onChange={handleFormChange}
          onSubmit={handleSave}
          className="mt-[4px] flex flex-col gap-[12px] rounded-[11px] border border-rule bg-background p-[16px]"
        >
          <FormErrorSummary
            message={saveError}
            fieldErrors={saveFieldErrors}
            labels={FORM_LABELS}
            idPrefix="checkout-address-"
          />

          <CardField
            label="Label"
            htmlFor="checkout-address-label"
            hint="Optional. e.g. Home or Work."
            error={live.errors.label}
          >
            <CardInput
              id="checkout-address-label"
              name="label"
              defaultValue={editingAddress?.label ?? ""}
              {...lengthProps("addressLabel")}
              invalid={Boolean(live.errors.label)}
            />
          </CardField>

          <AddressFields
            idPrefix="checkout-address"
            variant="card"
            defaults={editingAddress}
            errors={live.errors}
            gapClassName="gap-[12px] md:gap-[16px]"
          />

          <CardField
            label="Delivery note"
            htmlFor="checkout-address-deliveryNote"
            hint="Optional. e.g. Beside the blue gate."
            error={live.errors.deliveryNote}
          >
            <CardInput
              id="checkout-address-deliveryNote"
              name="deliveryNote"
              defaultValue={editingAddress?.deliveryNote ?? ""}
              {...lengthProps("deliveryNote")}
              invalid={Boolean(live.errors.deliveryNote)}
            />
          </CardField>

          <AddressValidationNote address={draftAddressStr} onStatusChange={setAddressStatus} />

          <div className="mt-[8px] flex items-center gap-[8px]">
            <SubmitButton
              pending={isSaving}
              invalid={!live.isValid || addressBlocked}
              pendingLabel="Saving..."
              hint="Save this address and deliver to it"
              blockedHint={
                addressBlocked
                  ? "We can't deliver to this address — see the note above."
                  : "Complete the highlighted fields to continue."
              }
              wrapperClassName="w-auto"
              className="w-auto rounded-sm bg-foreground px-[16px] py-[10px] text-[13px] hover:bg-foreground/90 md:p-[10px] md:px-[16px]"
            >
              Save Address
            </SubmitButton>
            <button
              type="button"
              onClick={stopEditing}
              disabled={isSaving}
              className="rounded-sm border border-rule bg-card px-[16px] py-[10px] text-[13px] font-bold text-foreground hover:bg-background disabled:opacity-60 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-[5px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">
              Address
            </span>
            {activeAddress && (
              <Tooltip content="Change this delivery address">
                <button
                  type="button"
                  onClick={() => startEditing(activeAddress.id)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Edit
                </button>
              </Tooltip>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              className="flex w-full items-center justify-between rounded-[12px] border border-[#ddcdb8] bg-white px-4 py-3 text-[14px] text-[#1a1210] outline-none transition-colors hover:bg-[#faf5eb]"
            >
              <span className="truncate pr-4">
                {activeAddress ? `${activeAddress.label ? activeAddress.label + ' - ' : ''}${activeAddress.addressDetails}` : "Select Address"}
              </span>
              {dropdownOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-[#7a6a60] transition-transform" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-[#7a6a60] transition-transform" />
              )}
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-[12px] border border-[#ddcdb8] bg-white p-[5px] shadow-[0px_8px_20px_rgba(26,18,16,0.12)]">
                  {profile.addresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={async () => {
                        setDropdownOpen(false);
                        await setActiveAddress(a.id);
                      }}
                      className={`flex w-full flex-col rounded-[8px] px-3 py-2.5 text-left transition-colors ${
                        activeAddress?.id === a.id
                          ? "bg-[#f6e9d9] font-bold text-[#8c1c13]"
                          : "text-[#1a1210] hover:bg-[#faf5eb]"
                      }`}
                    >
                      {a.label && (
                        <span className="text-[13px] font-bold">{a.label}</span>
                      )}
                      <span className="text-[14px] truncate">{a.addressDetails}</span>
                    </button>
                  ))}

                  <div className="my-1 border-t border-[#ddcdb8]/40"></div>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      startEditing();
                    }}
                    className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2.5 text-left text-[14px] font-bold text-[#ca762d] transition-colors hover:bg-[#faf5eb]"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    Add new address...
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!isEditing && activeAddress ? (
        <AddressValidationNote address={addressForGeocoding(activeAddress)} />
      ) : !isEditing && (
        <p className="text-[12px] text-muted-foreground">
          You have no saved delivery address yet. Please add one above.
        </p>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-[5px]">
      <span className="text-[11px] font-bold uppercase text-muted-foreground">
        {label}
      </span>
      <p className="rounded-[11px] border border-field-border bg-background p-[12px] text-[14px] text-foreground">
        {value}
      </p>
    </div>
  );
}
