"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addressForGeocoding,
  outsideDeliveryRadiusMessage,
} from "@/lib/address/validate-ncr";
import { addressRowFromParts } from "@/lib/address/format";
import { deliveryAddressSchema } from "@/lib/validation/profile";
import {
  fieldErrorFromDbError,
  fieldErrorsFromIssues,
  type FieldErrors,
} from "@/lib/validation/field-errors";

export async function setActiveAddress(addressId: string) {
  cookies().set("active_address_id", addressId, { maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export type UpsertAddressInput = {
  address_id?: string;
  label?: string | null;
  buildingNo: string;
  street: string;
  barangay: string;
  city: string;
  zip: string;
  deliveryNote?: string | null;
};

export type UpsertAddressResult =
  | { success: true; addressId: string }
  | { success: false; error: string; fieldErrors?: FieldErrors };

/**
 * Saves the address being edited at checkout (new when `address_id` is
 * absent) and makes it the active delivery address.
 *
 * Returns field-level errors instead of throwing, so the checkout form can
 * show what went wrong under the field it is about.
 */
export async function upsertCustomerAddress(
  input: UpsertAddressInput,
): Promise<UpsertAddressResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to save an address." };
  }

  const parsed = deliveryAddressSchema.safeParse({
    label: input.label ?? "",
    buildingNo: input.buildingNo,
    street: input.street,
    barangay: input.barangay,
    city: input.city,
    zip: input.zip,
    deliveryNote: input.deliveryNote ?? "",
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Some address fields need fixing.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  // Refuse an address that is known to be beyond the delivery radius.
  const tooFar = await outsideDeliveryRadiusMessage(addressForGeocoding(parsed.data));
  if (tooFar) {
    return { success: false, error: tooFar, fieldErrors: { street: tooFar } };
  }

  const payload = {
    ...addressRowFromParts(parsed.data),
    label: parsed.data.label || null,
    address_note: parsed.data.deliveryNote || null,
    customer_id: user.id,
  };

  let addressId = input.address_id;

  if (addressId) {
    const { error } = await supabase
      .from("customer_address")
      .update(payload)
      .eq("address_id", addressId)
      .eq("customer_id", user.id); // Ensure they own it

    if (error) {
      return {
        success: false,
        error: "Could not update the address.",
        fieldErrors: fieldErrorFromDbError(error) ?? undefined,
      };
    }
  } else {
    const { data, error } = await supabase
      .from("customer_address")
      .insert({ ...payload, is_default: false })
      .select("address_id")
      .single();

    if (error || !data) {
      const fieldErrors = fieldErrorFromDbError(error);
      return {
        success: false,
        error:
          error?.code === "23505"
            ? "This address is already saved in your profile."
            : "Could not add the address.",
        fieldErrors: fieldErrors ?? undefined,
      };
    }
    addressId = data.address_id;
  }

  // Automatically set it as the active address
  cookies().set("active_address_id", addressId, { maxAge: 60 * 60 * 24 * 365 });

  revalidatePath("/", "layout");
  return { success: true, addressId };
}
