"use server";

import { createServerClient } from "@/lib/supabase/server";
import { type Database } from "@/types/database.types";
import { z } from "zod";

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
  image_url: z.string().url("Valid image URL is required"),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  is_active: z.boolean(),
  product_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
});

export async function upsertPromotion(id: string | null, payload: unknown) {
  const parsed = promotionSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = createServerClient();
  
  if (id) {
    const { error } = await supabase
      .from("promotion")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("promotion")
      .insert(parsed.data);
    if (error) return { error: error.message };
  }

  return { error: null };
}

export async function deletePromotion(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("promotion")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
