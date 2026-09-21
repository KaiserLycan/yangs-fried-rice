"use client";
import * as React from "react";
import Link from "next/link";
import { AddressValidationNote } from "@/components/checkout/address-validation-note";
import { formatMobileNumber } from "@/lib/profile/mobile-number";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { setActiveAddress, upsertCustomerAddress } from "@/lib/actions/address";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { CardField, CardInput } from "@/components/profile/profile-card";

export function DeliveryDetailsCard({ profile }: { profile: CustomerProfile }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Draft state for new/edited address
  const [draftDetails, setDraftDetails] = React.useState("");
  const [draftLabel, setDraftLabel] = React.useState("");
  const [draftNote, setDraftNote] = React.useState("");
  const [draftBuildingNo, setDraftBuildingNo] = React.useState("");
  const [draftStreet, setDraftStreet] = React.useState("");
  const [draftBarangay, setDraftBarangay] = React.useState("");
  const [draftCity, setDraftCity] = React.useState("");
  const [draftZip, setDraftZip] = React.useState("");
  const [editingAddressId, setEditingAddressId] = React.useState<string | null>(null);

  const startEditing = (addressId?: string) => {
    if (addressId) {
      const addr = profile.addresses.find(a => a.id === addressId);
      setEditingAddressId(addressId);
      setDraftLabel(addr?.label || "");
      setDraftNote(addr?.deliveryNote || "");
      
      const parsed = parseAddress(addr?.addressDetails);
      setDraftBuildingNo(parsed.buildingNo);
      setDraftStreet(parsed.street);
      setDraftBarangay(parsed.barangay);
      setDraftCity(parsed.city);
      setDraftZip(parsed.zip);
    } else {
      setEditingAddressId(null);
      setDraftBuildingNo("");
      setDraftStreet("");
      setDraftBarangay("");
      setDraftCity("");
      setDraftZip("");
      setDraftLabel("");
      setDraftNote("");
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    const combinedAddress = [
      draftBuildingNo && draftStreet ? `${draftBuildingNo} ${draftStreet}` : (draftBuildingNo || draftStreet),
      draftBarangay,
      draftCity && draftZip ? `${draftCity} ${draftZip}` : (draftCity || draftZip)
    ].filter(Boolean).join(", ");
    
    if (!combinedAddress) return;
    
    setIsSaving(true);
    try {
      await upsertCustomerAddress({
        address_id: editingAddressId || undefined,
        address_details: combinedAddress,
        label: draftLabel,
        address_note: draftNote,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeAddress = profile.addresses.find(a => a.id === profile.activeAddressId) ?? profile.addresses[0];

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
        <div className="flex flex-col gap-[12px] rounded-[11px] border border-rule bg-background p-[16px] mt-[4px]">
          <CardField
            label="Label"
            htmlFor="address-label"
            hint="Optional. e.g. Home or Work."
          >
            <CardInput
              id="address-label"
              name="label"
              value={draftLabel}
              onChange={e => setDraftLabel(e.target.value)}
              maxLength={50}
            />
          </CardField>

          <div className="flex flex-col gap-[12px] md:flex-row md:gap-[16px]">
            <CardField className="flex-1" label="Building / House No. *" htmlFor="address-buildingNo">
              <CardInput
                id="address-buildingNo"
                name="buildingNo"
                value={draftBuildingNo}
                onChange={e => setDraftBuildingNo(e.target.value)}
                maxLength={100}
              />
            </CardField>

            <CardField className="flex-1" label="Street *" htmlFor="address-street">
              <CardInput
                id="address-street"
                name="street"
                value={draftStreet}
                onChange={e => setDraftStreet(e.target.value)}
                maxLength={100}
              />
            </CardField>
          </div>

          <CardField label="Barangay *" htmlFor="address-barangay">
            <CardInput
              id="address-barangay"
              name="barangay"
              value={draftBarangay}
              onChange={e => setDraftBarangay(e.target.value)}
              maxLength={100}
            />
          </CardField>

          <div className="flex flex-col gap-[12px] md:flex-row md:gap-[16px]">
            <CardField className="flex-1" label="City *" htmlFor="address-city">
              <CardInput
                id="address-city"
                name="city"
                value={draftCity}
                onChange={e => setDraftCity(e.target.value)}
                maxLength={50}
              />
            </CardField>

            <CardField className="flex-1" label="ZIP Code *" htmlFor="address-zip">
              <CardInput
                id="address-zip"
                name="zip"
                value={draftZip}
                onChange={e => setDraftZip(e.target.value)}
                maxLength={4}
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
              value={draftNote}
              onChange={e => setDraftNote(e.target.value)}
              maxLength={255}
            />
          </CardField>

          <AddressValidationNote 
            address={[
              draftBuildingNo && draftStreet ? `${draftBuildingNo} ${draftStreet}` : (draftBuildingNo || draftStreet),
              draftCity
            ].filter(Boolean).join(", ")}
          />

          <div className="flex items-center gap-[8px] mt-[8px]">
            <button 
              onClick={handleSave} 
              disabled={isSaving || !draftStreet || !draftBarangay || !draftCity || !draftZip}
              className="rounded-sm bg-foreground px-[16px] py-[10px] text-[13px] font-bold text-background hover:bg-foreground/90 disabled:opacity-60 transition-colors"
            >
              {isSaving ? "Saving..." : "Save Address"}
            </button>
            <button 
              onClick={() => setIsEditing(false)} 
              disabled={isSaving}
              className="rounded-sm border border-rule bg-card px-[16px] py-[10px] text-[13px] font-bold text-foreground hover:bg-background disabled:opacity-60 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[5px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">
              Address
            </span>
            {activeAddress && (
              <button 
                onClick={() => startEditing(activeAddress.id)} 
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
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
        <AddressValidationNote 
          address={(() => {
            const p = parseAddress(activeAddress.addressDetails);
            return [p.street, p.city].filter(Boolean).join(", ");
          })()} 
        />
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

function parseAddress(fullAddress: string = "") {
  if (!fullAddress) {
    return { buildingNo: "", street: "", barangay: "", city: "", zip: "" };
  }
  const parts = fullAddress.split(",").map((p) => p.trim());
  let buildingNo = "";
  let street = "";
  let barangay = "";
  let city = "";
  let zip = "";

  if (parts.length >= 3) {
    const bldStreet = parts[0];
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
    street = fullAddress;
  }

  return { buildingNo, street, barangay, city, zip };
}
