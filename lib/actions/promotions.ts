"use server";

import { createClient } from "@/lib/supabase/server";
import { type Database } from "@/types/database.types";
import { z } from "zod";
import { imageUploadProblem, imageExtensionFor, IMAGE_BUCKETS } from "@/lib/storage/stored-image";
import { removeStoredImage } from "@/lib/storage/remove-stored-image";
import { promotionCodeTermsSchema, type PromotionCodeTerms } from "@/lib/validation/promo-code";

type PromotionRow = Database["public"]["Tables"]["promotion"]["Row"];

export type Promotion = Omit<PromotionRow, "starts_at" | "ends_at" | "created_at" | "updated_at"> & {
  starts_at: string;
  ends_at: string;
  created_at: string;
  updated_at: string;
};

export async function getActivePromotions(): Promise<Promotion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("promotion")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", new Date().toISOString())
    .gte("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch active promotions:", error);
    return [];
  }

  return data as Promotion[];
}

export async function getAllPromotions(): Promise<Promotion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("promotion")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Promotion[];
}

const promotionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional().nullable(),
  image_url: z.string().url("Valid image URL is required").optional().nullable(),
  starts_at: z.string().min(1, "Start date is required"),
  ends_at: z.string().min(1, "End date is required"),
  is_active: z.boolean(),
  product_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  /** The promo code and its terms; with no code the promotion is a banner only. */
  terms: promotionCodeTermsSchema.optional(),
});

/** First problem, for the toast; the database repeats every rule. */
function firstIssue(error: z.ZodError): string {
  return error.errors[0]?.message ?? "Check the promotion's details.";
}

/** The terms as columns, or nothing when the caller didn't send any. */
function termColumns(terms: PromotionCodeTerms | undefined) {
  return terms ?? {};
}

/** A duplicate code is the one database refusal a manager can fix by typing. */
function saveError(error: { code?: string; message: string }): string {
  if (error.code === "23505" && /promotion_code_key/.test(error.message)) {
    return "Another promotion already uses that code.";
  }
  return error.message;
}

/** Normalise a datetime-local value ("2026-09-28T06:43") into ISO with seconds and Z. */
function toISO(dt: string): string {
  if (!dt) return dt;
  // Already full ISO → keep it
  if (dt.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dt)) return dt;
  // datetime-local → append seconds and Z
  return dt.includes("T") ? `${dt}${dt.length <= 16 ? ":00" : ""}Z` : `${dt}T00:00:00Z`;
}

export async function createPromotion(payload: unknown, formData: FormData) {
  const parsed = promotionSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const supabase = createClient();
  const file = formData.get("file");
  
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  
  const problem = imageUploadProblem(file);
  if (problem) return { error: problem };

  const id = crypto.randomUUID();
  const filePath = `promo-${id}-${Date.now()}.${imageExtensionFor(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKETS.promotions)
    .upload(filePath, file, { contentType: file.type });
    
  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from(IMAGE_BUCKETS.promotions).getPublicUrl(filePath);

  const { image_url: _ignored, terms, ...rest } = parsed.data;
  const { error } = await supabase
    .from("promotion")
    .insert({ ...rest, ...termColumns(terms), id, image_url: publicUrl, starts_at: toISO(rest.starts_at), ends_at: toISO(rest.ends_at) });

  if (error) {
    // The image is already up; don't leave it behind for a promotion that doesn't exist.
    await removeStoredImage(IMAGE_BUCKETS.promotions, publicUrl);
    return { error: saveError(error) };
  }
  return { error: null };
}

export async function updatePromotion(id: string, payload: unknown, formData?: FormData) {
  const parsed = promotionSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const supabase = createClient();
  
  let publicUrl = parsed.data.image_url ?? null;
  
  if (formData) {
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      const problem = imageUploadProblem(file);
      if (problem) return { error: problem };
      
      const filePath = `promo-${id}-${Date.now()}.${imageExtensionFor(file)}`;
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKETS.promotions)
        .upload(filePath, file, { contentType: file.type });
        
      if (uploadError) return { error: uploadError.message };
      
      const { data: urlData } = supabase.storage.from(IMAGE_BUCKETS.promotions).getPublicUrl(filePath);
      publicUrl = urlData.publicUrl;
      
      // Cleanup old image if different
      if (parsed.data.image_url && parsed.data.image_url !== publicUrl) {
         await removeStoredImage(IMAGE_BUCKETS.promotions, parsed.data.image_url);
      }
    }
  }

  const { image_url: _ignored, terms, ...rest } = parsed.data;
  const { error } = await supabase
    .from("promotion")
    .update({ ...rest, ...termColumns(terms), image_url: publicUrl ?? undefined, starts_at: toISO(rest.starts_at), ends_at: toISO(rest.ends_at) })
    .eq("id", id);
    
  if (error) return { error: saveError(error) };
  return { error: null };
}

export async function deletePromotion(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("promotion")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
