"use server";

import { createClient } from "@/lib/supabase/server";
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
  // using timestamp to bust cache in browser if needed, though upsert handles overwrite
  const filePath = `${user.id}/${Date.now()}.${fileExt}`;

  // Upload to avatars bucket
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  // Update customer table
  const { error: updateError } = await supabase
    .from("customer")
    .update({ profileImage_URL: publicUrl })
    .eq("customer_id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");

  return { success: true, publicUrl };
}