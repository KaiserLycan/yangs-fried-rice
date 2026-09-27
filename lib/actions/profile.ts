"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  IMAGE_BUCKETS,
  imageExtensionFor,
  imageUploadProblem,
} from "@/lib/storage/stored-image";
import { removeStoredImage } from "@/lib/storage/remove-stored-image";
import { ORDER_ISSUE_PHOTO_BUCKET } from "@/lib/validation/order-issue";
import {
  fieldErrorFromDbError,
  fieldErrorsFromIssues,
  type FieldErrors,
} from "@/lib/validation/field-errors";
import { toInternationalMobile } from "@/lib/validation/phone";
import {
  personalDetailsSchema,
  contactDetailsSchema,
  passwordChangeSchema,
} from "@/lib/validation/profile";
import { countActiveOrders } from "@/lib/orders/active-orders";
import { DELETE_BLOCKED_MESSAGE } from "@/lib/orders/active-orders-message";
import { expireAbandonedOrders } from "@/lib/checkout/expire-abandoned-orders";

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

  const customerResult = await supabase
    .from("customer")
    .select("first_name, last_name, name, phone_number, profileImage_URL, password_last_updated")
    .eq("customer_id", user.id)
    .maybeSingle();

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
    },
    error: null,
  };
}


type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
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
  if (namesSent) {
    // Names travel as a pair: the card always sends both, and validating one
    // without the other would let "first name only" through as a full name.
    const parsed = personalDetailsSchema
      .partial({ firstName: true, lastName: true })
      .safeParse({
        firstName: input.firstName,
        lastName: input.lastName,
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
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
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

  // Not while an order is still in progress (issue #115): the kitchen may
  // be cooking it, the counter may be waiting for them, or a payment may be
  // owed or refunded. Checked before anything is touched, and a failed check
  // refuses too — this is the one action that cannot be taken back.
  //
  // A wallet order abandoned past its 30-minute window is cancelled first,
  // so it doesn't block deletion while waiting for the next sweep. Best
  // effort: if it fails, the count below still sees the order and refuses.
  try {
    await expireAbandonedOrders(userId);
  } catch (error) {
    console.error("deleteMyAccount: could not expire abandoned orders:", error);
  }

  let activeOrders: number;
  try {
    activeOrders = await countActiveOrders(supabase, userId);
  } catch (error) {
    console.error("deleteMyAccount: could not count active orders:", error);
    return {
      data: null,
      error: "We couldn't check your orders. Please try again.",
    };
  }
  if (activeOrders > 0) {
    return { data: null, error: DELETE_BLOCKED_MESSAGE };
  }

  // Read before the row goes: the photo is only reachable through it.
  const { data: photoRow } = await supabase
    .from("customer")
    .select("profileImage_URL")
    .eq("customer_id", userId)
    .maybeSingle();

  const admin = createAdminClient();

  // Problem-report photos sit in the customer's own folder of a private
  // bucket, and nothing else would ever remove them. The reports themselves
  // stay (the store may still be resolving one) but lose the photo, and the
  // link to who filed them once the customer row goes.
  const { data: issuePhotos } = await admin.storage
    .from(ORDER_ISSUE_PHOTO_BUCKET)
    .list(userId, { limit: 1000 });
  if (issuePhotos && issuePhotos.length > 0) {
    await admin.storage
      .from(ORDER_ISSUE_PHOTO_BUCKET)
      .remove(issuePhotos.map((file) => `${userId}/${file.name}`));
  }
  await admin.from("order_issue").update({ photo_path: null }).eq("customer_id", userId);

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

  const { error: customerError } = await supabase
    .from("customer")
    .delete()
    .eq("customer_id", userId);
  if (customerError) {
    return { data: null, error: "Could not delete your account. Please try again." };
  }

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