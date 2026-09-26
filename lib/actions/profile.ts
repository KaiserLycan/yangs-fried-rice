"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  IMAGE_BUCKETS,
  imageExtensionFor,
  imageUploadProblem,
} from "@/lib/storage/stored-image";
import { removeStoredImage } from "@/lib/storage/remove-stored-image";
import { addressForGeocoding, outsideDeliveryRadiusMessage } from "@/lib/address/validate-ncr";
import {
  ADDRESS_COLUMNS,
  addressPartsFromRow,
  addressRowFromParts,
} from "@/lib/address/format";
import {
  fieldErrorFromDbError,
  fieldErrorsFromIssues,
  type FieldErrors,
} from "@/lib/validation/field-errors";
import { toInternationalMobile } from "@/lib/validation/phone";
import {
  personalDetailsSchema,
  contactDetailsSchema,
  deliveryAddressSchema,
  passwordChangeSchema,
} from "@/lib/validation/profile";

/**
 * `fieldErrors` rides along with `error` when the rejection is about a
 * particular field, so the form can show it under that input.
 */
type RouterResult<T> = {
  data: T | null;
  error: string | null;
  fieldErrors?: FieldErrors;
};

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
      .select("first_name, last_name, name, phone_number, profileImage_URL, password_last_updated, date_of_birth")
      .eq("customer_id", user.id)
      .maybeSingle(),
    supabase
      .from("customer_address")
      .select(ADDRESS_COLUMNS)
      .eq("customer_id", user.id)
      .order("address_id"),
  ]);

  if (customerResult.error) {
    return { data: null, error: "Could not load profile." };
  }

  return {
    data: {
      firstName: customerResult.data?.first_name ?? null,
      lastName: customerResult.data?.last_name ?? null,
      name: customerResult.data?.name ?? null,
      email: user.email ?? null,
      mobile: customerResult.data?.phone_number ?? null,
      profileImageUrl: customerResult.data?.profileImage_URL ?? null,
      passwordLastUpdated: customerResult.data?.password_last_updated ?? null,
      dateOfBirth: customerResult.data?.date_of_birth ?? null,
      addresses: (addressesResult.data ?? []).map((row) => ({
        id: row.address_id,
        label: row.label,
        ...addressPartsFromRow(row),
        addressDetails: row.address_details,
        note: row.address_note,
        isDefault: row.is_default,
      })),
    },
    error: null,
  };
}


type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
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

  const namesSent = input.firstName !== undefined || input.lastName !== undefined;
  if (namesSent || input.dateOfBirth !== undefined) {
    // Names travel as a pair: the card always sends both, and validating one
    // without the other would let "first name only" through as a full name.
    const parsed = personalDetailsSchema
      .partial({ firstName: true, lastName: true })
      .safeParse({
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth ?? "",
      });
    if (!parsed.success || (namesSent && (!input.firstName || !input.lastName))) {
      const fieldErrors = parsed.success ? {} : fieldErrorsFromIssues(parsed.error.issues);
      if (namesSent && !input.firstName) fieldErrors.firstName ??= "Enter first name.";
      if (namesSent && !input.lastName) fieldErrors.lastName ??= "Enter last name.";
      return { data: null, error: "Some personal details need fixing.", fieldErrors };
    }

    const { error } = await supabase
      .from("customer")
      .update({
        ...(namesSent
          ? { first_name: parsed.data.firstName, last_name: parsed.data.lastName }
          : {}),
        // date_of_birth is a `date` column: a blank field must be stored as
        // NULL, not "" (which Postgres rejects as an invalid date).
        ...(input.dateOfBirth !== undefined ? { date_of_birth: parsed.data.dateOfBirth || null } : {}),
      })
      .eq("customer_id", user.id);

    if (error) {
      return {
        data: null,
        error: "Could not update your details.",
        fieldErrors: fieldErrorFromDbError(error) ?? undefined,
      };
    }
  }

  if (input.mobile !== undefined) {
    const parsed = contactDetailsSchema.shape.mobile.safeParse(input.mobile);
    if (!parsed.success) {
      return {
        data: null,
        error: "Enter a valid mobile number.",
        fieldErrors: { mobile: parsed.error.issues[0]?.message ?? "Enter a valid mobile number." },
      };
    }

    const { error } = await supabase
      .from("customer")
      // Stored in one canonical shape (+63XXXXXXXXXX), whatever was typed.
      .update({ phone_number: toInternationalMobile(parsed.data) || null })
      .eq("customer_id", user.id);

    if (error) {
      return {
        data: null,
        error: "Could not update your mobile number.",
        fieldErrors: { mobile: "The database rejected this number. Use +63 followed by 10 digits." },
      };
    }
  }

  if (input.email !== undefined) {
    const parsed = contactDetailsSchema.shape.email.safeParse(input.email);
    if (!parsed.success) {
      return {
        data: null,
        error: "Enter a valid email address.",
        fieldErrors: { email: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      };
    }

    const { error } = await supabase.auth.updateUser({ email: parsed.data });
    if (error) {
      return { data: null, error: error.message, fieldErrors: { email: error.message } };
    }
    emailConfirmationSent = true;
  }

  revalidatePath("/", "layout");
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
    return {
      data: null,
      error: "Some address fields need fixing.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  // A "super far" address must not be saved (the form disables Save for it,
  // but the form is not the only caller). Checked on the trimmed street + city,
  // the same essential form sign-up geocodes.
  const tooFar = await outsideDeliveryRadiusMessage(
    addressForGeocoding({
      street: parsed.data.street,
      barangay: parsed.data.barangay,
      city: parsed.data.city,
      zip: parsed.data.zip,
    }),
  );
  if (tooFar) {
    return { data: null, error: tooFar, fieldErrors: { street: tooFar } };
  }

  const row = addressRowFromParts(parsed.data);

  // Check for duplicates before inserting — part by part, case-insensitive,
  // the same rule as the customer_address_unique_per_customer index.
  if (await isDuplicateAddress(supabase, user.id, row)) {
    return {
      data: null,
      error: "This address is already saved in your profile.",
      fieldErrors: { street: "This address is already saved in your profile." },
    };
  }

  const { data, error } = await supabase
    .from("customer_address")
    .insert({
      customer_id: user.id,
      label: parsed.data.label || null,
      ...row,
      address_note: parsed.data.deliveryNote || null,
    })
    .select("address_id")
    .single();

  if (error || !data) {
    return {
      data: null,
      error: "Could not save address.",
      fieldErrors: fieldErrorFromDbError(error) ?? undefined,
    };
  }

  revalidatePath("/", "layout");
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
    return {
      data: null,
      error: "Some address fields need fixing.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const partKeys = ["buildingNo", "street", "barangay", "city", "zip"] as const;
  const sentParts = partKeys.filter((key) => input[key] !== undefined);
  let row: ReturnType<typeof addressRowFromParts> | undefined;
  if (sentParts.length > 0) {
    // The parts are one address: changing the street without the city could
    // pair a new street with the wrong city, so all five travel together.
    const missing = partKeys.filter((key) => !parsed.data[key]);
    if (missing.length > 0) {
      return {
        data: null,
        error: "Send every part of the address when changing it.",
        fieldErrors: Object.fromEntries(missing.map((key) => [key, "Required."])),
      };
    }
    row = addressRowFromParts({
      buildingNo: parsed.data.buildingNo!,
      street: parsed.data.street!,
      barangay: parsed.data.barangay!,
      city: parsed.data.city!,
      zip: parsed.data.zip!,
    });

    const tooFar = await outsideDeliveryRadiusMessage(
      addressForGeocoding({
        street: parsed.data.street,
        barangay: parsed.data.barangay,
        city: parsed.data.city,
        zip: parsed.data.zip,
      }),
    );
    if (tooFar) {
      return { data: null, error: tooFar, fieldErrors: { street: tooFar } };
    }

    if (await isDuplicateAddress(supabase, user.id, row, addressId)) {
      return {
        data: null,
        error: "This address is already saved in your profile.",
        fieldErrors: { street: "This address is already saved in your profile." },
      };
    }
  }

  const { error, count } = await supabase
    .from("customer_address")
    .update({
      ...(input.label !== undefined ? { label: parsed.data.label || null } : {}),
      ...(row ?? {}),
      ...(input.deliveryNote !== undefined
        ? { address_note: parsed.data.deliveryNote || null }
        : {}),
    })
    .eq("address_id", addressId)
    .eq("customer_id", user.id); 

  if (error) {
    return {
      data: null,
      error: "Could not update address.",
      fieldErrors: fieldErrorFromDbError(error) ?? undefined,
    };
  }
  if (count === 0) {
    return { data: null, error: "Address not found." };
  }

  return { data: undefined, error: null };
}

/**
 * Is this exact address (every part, ignoring case) already saved for the
 * customer? `exceptId` skips the address being edited.
 */
async function isDuplicateAddress(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  row: ReturnType<typeof addressRowFromParts>,
  exceptId?: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("customer_address")
    .select("address_id, building_no, street, barangay, city, zip_code")
    .eq("customer_id", customerId)
    .eq("zip_code", row.zip_code);

  const same = (a: string | null, b: string) =>
    (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

  return (data ?? []).some(
    (existing) =>
      existing.address_id !== exceptId &&
      same(existing.building_no, row.building_no) &&
      same(existing.street, row.street) &&
      same(existing.barangay, row.barangay) &&
      same(existing.city, row.city),
  );
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
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return {
      data: null,
      error: "Your current password is incorrect.",
      fieldErrors: { currentPassword: "This isn't your current password." },
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (updateError) {
    return {
      data: null,
      error: updateError.message,
      fieldErrors: { newPassword: updateError.message },
    };
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

  revalidatePath("/", "layout");

  return { data: undefined, error: null };
}


export async function deleteMyAccount(): Promise<RouterResult<undefined>> {
  const supabase = createClient();
  const user = await requireCustomer(supabase);
  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const userId = user.id;

  // Read before the row goes: the photo is only reachable through it.
  const { data: photoRow } = await supabase
    .from("customer")
    .select("profileImage_URL")
    .eq("customer_id", userId)
    .maybeSingle();

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

  await removeStoredImage(IMAGE_BUCKETS.customerAvatar, photoRow?.profileImage_URL);
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

  const problem = imageUploadProblem(file);
  if (problem) return { error: problem };

  // The photo being replaced, removed once the new one is saved. The path is
  // unique per upload (so a cached page never shows a half-replaced file),
  // which also meant `upsert` never had anything to overwrite and every
  // change left the previous photo behind.
  const { data: before } = await supabase
    .from("customer")
    .select("profileImage_URL")
    .eq("customer_id", user.id)
    .maybeSingle();

  const filePath = `${user.id}/${Date.now()}.${imageExtensionFor(file)}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKETS.customerAvatar)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
    });

  if (uploadError) return { error: uploadError.message };

  const { data: publicUrlData } = supabase.storage
    .from(IMAGE_BUCKETS.customerAvatar)
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("customer")
    .update({ profileImage_URL: publicUrl })
    .eq("customer_id", user.id);

  if (updateError) {
    await removeStoredImage(IMAGE_BUCKETS.customerAvatar, publicUrl);
    return { error: updateError.message };
  }

  await removeStoredImage(IMAGE_BUCKETS.customerAvatar, before?.profileImage_URL);

  revalidatePath("/", "layout");

  return { success: true, publicUrl };
}