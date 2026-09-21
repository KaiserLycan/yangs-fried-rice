"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { outsideDeliveryRadiusMessage } from "@/lib/address/validate-ncr";
import { escapeLikePattern } from "@/lib/validation/like-pattern";

export async function setActiveAddress(addressId: string) {
  cookies().set("active_address_id", addressId, { maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export async function upsertCustomerAddress({
  address_id,
  address_details,
  label,
  address_note,
}: {
  address_id?: string;
  address_details: string;
  label?: string | null;
  address_note?: string | null;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to save an address");
  }

  // Refuse an address that is known to be beyond the delivery radius.
  const tooFar = await outsideDeliveryRadiusMessage(address_details);
  if (tooFar) throw new Error(tooFar);

  // If no address_id is provided, we insert a new address.
  // Otherwise, we update the existing one.
  const payload = {
    address_details,
    label: label ?? null,
    address_note: address_note ?? null,
    customer_id: user.id,
    is_default: false,
  };

  let returnedAddressId = address_id;

  if (address_id) {
    const { error } = await supabase
      .from("customer_address")
      .update(payload)
      .eq("address_id", address_id)
      .eq("customer_id", user.id); // Ensure they own it

    if (error) throw new Error("Failed to update address: " + error.message);
  } else {
    // Check for duplicates before inserting
    const { data: existing } = await supabase
      .from("customer_address")
      .select("address_id")
      .eq("customer_id", user.id)
      .ilike("address_details", escapeLikePattern(address_details))
      .maybeSingle();
      
    if (existing) {
      throw new Error("This address is already saved in your profile.");
    }

    const { data, error } = await supabase
      .from("customer_address")
      .insert(payload)
      .select("address_id")
      .single();

    if (error) throw new Error("Failed to add address: " + error.message);
    returnedAddressId = data.address_id;
  }

  // Automatically set it as the active address
  if (returnedAddressId) {
    cookies().set("active_address_id", returnedAddressId, { maxAge: 60 * 60 * 24 * 365 });
  }

  revalidatePath("/", "layout");
}
