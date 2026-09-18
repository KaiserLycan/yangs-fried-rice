"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  personalDetailsSchema,
  contactDetailsSchema,
  deliveryAddressSchema,
  passwordChangeSchema,
} from "@/lib/validation/profile";

type RouterResult<T> = { data: T | null; error: string | null };

async function requireCustomer(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

export async function getMyProfile(): Promise<RouterResult<unknown>> {
  const supabase = createClient();
  const user = await requireCustomer(supabase);
  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const [customerResult, addressesResult] = await Promise.all([
    supabase
      .from("customer")
      .select("name, phone_number, profileImage_URL, password_last_updated")
      .eq("customer_id", user.id)
      .maybeSingle(),
    supabase
      .from("customer_address")
      .select("address_id, label, address_details, address_note, is_default")
      .eq("customer_id", user.id)
      .order("address_id"),
  ]);

  if (customerResult.error) {
    return { data: null, error: "Could not load profile." };
  }

  return {
    data: {
      name: customerResult.data?.name ?? null,
      email: user.email ?? null,
      mobile: customerResult.data?.phone_number ?? null,
      profileImageUrl: customerResult.data?.profileImage_URL ?? null,
      passwordLastUpdated: customerResult.data?.password_last_updated ?? null,
      dateOfBirth: null,
      addresses: (addressesResult.data ?? []).map((row) => ({
        id: row.address_id,
        label: row.label,
        addressDetails: row.address_details,
        note: row.address_note,
        isDefault: row.is_default,
      })),
    },
    error: null,
  };
}


type UpdateProfileInput = {
  name?: string;
  dateOfBirth?: string;
  mobile?: string;
  email?: string;
};


export async function updateMyProfile(
  input: UpdateProfileInput
): Promise<RouterResult<{ emailConfirmationSent: boolean }>> {
  const supabase = createClient();
  const user = await requireCustomer(supabase);
  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  let emailConfirmationSent = false;

  if (input.name !== undefined || input.dateOfBirth !== undefined) {
    const parsed = personalDetailsSchema.safeParse({
      name: input.name ?? "",
      dateOfBirth: input.dateOfBirth ?? "",
    });
    if (!parsed.success) {
      return { data: null, error: "Some personal details need fixing." };
    }

    const { error } = await supabase
      .from("customer")
      .update({
        ...(input.name !== undefined ? { name: parsed.data.name } : {}),
      })
      .eq("customer_id", user.id);

    if (error) {
      return { data: null, error: "Could not update your details." };
    }
  }

  if (input.mobile !== undefined) {
    const parsed = contactDetailsSchema.shape.mobile.safeParse(input.mobile);
    if (!parsed.success) {
      return { data: null, error: "Enter a valid mobile number." };
    }

    const { error } = await supabase
      .from("customer")
      .update({ phone_number: parsed.data })
      .eq("customer_id", user.id);

    if (error) {
      return { data: null, error: "Could not update your mobile number." };
    }
  }

  if (input.email !== undefined) {
    const parsed = contactDetailsSchema.shape.email.safeParse(input.email);
    if (!parsed.success) {
      return { data: null, error: "Enter a valid email address." };
    }

    const { error } = await supabase.auth.updateUser({ email: parsed.data });
    if (error) {
      return { data: null, error: error.message };
    }
    emailConfirmationSent = true;
  }

  return { data: { emailConfirmationSent }, error: null };
}

type AddressInput = {
  label?: string;
  buildingNo: string;
  street: string;
  barangay: string;
  city: string;
  zip: string;
  deliveryNote?: string;
};

export async function addMyAddress(
  input: AddressInput
): Promise<RouterResult<{ addressId: string }>> {
  const supabase = createClient();
  const user = await requireCustomer(supabase);
  if (!user) {
    return { data: null, error: "You must be signed in." };
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
    return { data: null, error: "Enter a valid address." };
  }

  const fullAddress = `${parsed.data.buildingNo} ${parsed.data.street}, ${parsed.data.barangay}, ${parsed.data.city} ${parsed.data.zip}`;

  const { data, error } = await supabase
    .from("customer_address")
    .insert({
      customer_id: user.id,
      label: parsed.data.label || null,
      address_details: fullAddress,
      address_note: parsed.data.deliveryNote || null,
    })
    .select("address_id")
    .single();

  if (error || !data) {
    return { data: null, error: "Could not save address." };
  }

  return { data: { addressId: data.address_id }, error: null };
}

export async function updateMyAddress(
  addressId: string,
  input: Partial<AddressInput>
): Promise<RouterResult<undefined>> {
  const supabase = createClient();
  const user = await requireCustomer(supabase);
  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const parsed = deliveryAddressSchema.partial().safeParse({
    label: input.label,
    buildingNo: input.buildingNo,
    street: input.street,
    barangay: input.barangay,
    city: input.city,
    zip: input.zip,
    deliveryNote: input.deliveryNote,
  });
  if (!parsed.success) {
    return { data: null, error: "Enter a valid address." };
  }

  let fullAddress: string | undefined;
  if (
    parsed.data.buildingNo ||
    parsed.data.street ||
    parsed.data.barangay ||
    parsed.data.city ||
    parsed.data.zip
  ) {
    // If any part of the address was updated, we expect all parts to be sent by the form
    fullAddress = `${parsed.data.buildingNo || ""} ${parsed.data.street || ""}, ${parsed.data.barangay || ""}, ${parsed.data.city || ""} ${parsed.data.zip || ""}`;
  }

  const { error, count } = await supabase
    .from("customer_address")
    .update({
      ...(input.label !== undefined ? { label: parsed.data.label || null } : {}),
      ...(fullAddress !== undefined
        ? { address_details: fullAddress.trim() }
        : {}),
      ...(input.deliveryNote !== undefined
        ? { address_note: parsed.data.deliveryNote || null }
        : {}),
    })
    .eq("address_id", addressId)
    .eq("customer_id", user.id); 

  if (error) {
    return { data: null, error: "Could not update address." };
  }
  if (count === 0) {
    return { data: null, error: "Address not found." };
  }

  return { data: undefined, error: null };
}

export async function deleteMyAddress(
  addressId: string
): Promise<RouterResult<undefined>> {
  const supabase = createClient();
  const user = await requireCustomer(supabase);
  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const { error, count } = await supabase
    .from("customer_address")
    .delete()
    .eq("address_id", addressId)
    .eq("customer_id", user.id);

  if (error) {
    return { data: null, error: "Could not delete address." };
  }
  if (count === 0) {
    return { data: null, error: "Address not found." };
  }

  return { data: undefined, error: null };
}

export async function setDefaultAddress(
  addressId: string
): Promise<RouterResult<undefined>> {
  const supabase = createClient();
  const user = await requireCustomer(supabase);
  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const { error: unsetError } = await supabase
    .from("customer_address")
    .update({ is_default: false })
    .eq("customer_id", user.id)
    .eq("is_default", true);
  if (unsetError) {
    return { data: null, error: "Could not update default address." };
  }

  const { error: setError, count } = await supabase
    .from("customer_address")
    .update({ is_default: true })
    .eq("address_id", addressId)
    .eq("customer_id", user.id);
  if (setError) {
    return { data: null, error: "Could not update default address." };
  }
  if (count === 0) {
    return { data: null, error: "Address not found." };
  }

  return { data: undefined, error: null };
}


export async function changeMyPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<RouterResult<undefined>> {
  const supabase = createClient();
  const user = await requireCustomer(supabase);
  if (!user || !user.email) {
    return { data: null, error: "You must be signed in." };
  }

  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: parsed.error.issues[0]?.message ?? "Check your password fields.",
    };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return { data: null, error: "Your current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (updateError) {
    return { data: null, error: updateError.message };
  }

  await Promise.all([
    supabase
      .from("customer")
      .update({ password_last_updated: new Date().toISOString() })
      .eq("customer_id", user.id),
    supabase
      .from("employee")
      .update({ password_last_updated: new Date().toISOString() })
      .eq("employee_id", user.id),
  ]);

    await Promise.all([
    supabase
      .from("customer")
      .update({ password_last_updated: new Date().toISOString() })
      .eq("customer_id", user.id),
    supabase
      .from("employee")
      .update({ password_last_updated: new Date().toISOString() })
      .eq("employee_id", user.id),
  ]);

  return { data: undefined, error: null };  // <-- this line was missing
}


export async function deleteMyAccount(): Promise<RouterResult<undefined>> {
  const supabase = createClient();
  const user = await requireCustomer(supabase);
  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const userId = user.id;

  await supabase.from("order").update({ customer_id: null }).eq("customer_id", userId);
  await supabase.from("review").update({ customer_id: null }).eq("customer_id", userId);
  await supabase
    .from("notification")
    .delete()
    .eq("customer_id", userId);

  const { error: cartError } = await supabase
    .from("cart")
    .delete()
    .eq("customer_id", userId);
  if (cartError) {
    return { data: null, error: "Could not delete your account. Please try again." };
  }

  const { error: addressError } = await supabase
    .from("customer_address")
    .delete()
    .eq("customer_id", userId);
  if (addressError) {
    return { data: null, error: "Could not delete your account. Please try again." };
  }

  const { error: customerError } = await supabase
    .from("customer")
    .delete()
    .eq("customer_id", userId);
  if (customerError) {
    return { data: null, error: "Could not delete your account. Please try again." };
  }

  const admin = createAdminClient();
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    return {
      data: null,
      error:
        "Your data was removed, but we couldn't fully close your account. Please contact support.",
    };
  }

  await supabase.auth.signOut();

  return { data: undefined, error: null };
}

import { revalidatePath } from "next/cache";

export async function uploadProfileImage(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in" };

  const fileExt = file.name.split(".").pop();
  const filePath = `${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("customer")
    .update({ profileImage_URL: publicUrl })
    .eq("customer_id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");

  return { success: true, publicUrl };
}