"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateNcrAddress } from "@/lib/address/validate-ncr";

export interface SaveAddressInput {
  label?: string | null;
  buildingNo: string;
  street: string;
  barangay: string;
  city: string;
  zip: string;
  deliveryNote?: string | null;
  isDefault?: boolean;
}

export interface SaveAddressResult {
  success: boolean;
  error?: string;
  data?: {
    address_id: string;
    label: string | null;
    address_details: string;
    address_note: string | null;
    is_default: boolean;
  };
}

/**
 * Saves a new customer address, validating that it falls within the NCR service boundary.
 */
export async function addCustomerAddressAction(
  input: SaveAddressInput
): Promise<SaveAddressResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to save an address." };
  }

  const buildingNo = input.buildingNo?.trim() || "";
  const street = input.street?.trim() || "";
  const barangay = input.barangay?.trim() || "";
  const city = input.city?.trim() || "";
  const zip = input.zip?.trim() || "";

  if (!buildingNo || !street || !barangay || !city || !zip) {
    return { success: false, error: "Please fill out all address fields." };
  }

  const fullAddress = `${buildingNo} ${street}, ${barangay}, ${city} ${zip}`;
  const essentialAddress = `${buildingNo} ${street}, ${city}`;

  // Enforce NCR delivery boundary check
  const ncrValidation = await validateNcrAddress(essentialAddress);
  if (!ncrValidation.valid) {
    return {
      success: false,
      error:
        ncrValidation.message ??
        "Delivery is currently restricted to Metro Manila (NCR). This address cannot be accepted.",
    };
  }

  const { data, error } = await supabase
    .from("customer_address")
    .insert({
      customer_id: user.id,
      label: input.label?.trim() || "Home",
      address_details: fullAddress,
      address_note: input.deliveryNote?.trim() || null,
      is_default: input.isDefault ?? false,
    })
    .select("address_id, label, address_details, address_note, is_default")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/profile");
  return { success: true, data };
}

/**
 * Fetches all saved addresses for the authenticated customer.
 */
export async function getCustomerAddressesAction() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  const { data, error } = await supabase
    .from("customer_address")
    .select("address_id, label, address_details, address_note, is_default")
    .eq("customer_id", user.id)
    .order("address_id");

  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data ?? [] };
}
