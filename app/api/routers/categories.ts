import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validation/menu";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/menu/categories
 * Returns all categories sorted alphabetically.
 */
export async function getCategories() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("category_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: data.length,
    data,
  });
}

/**
 * POST /api/menu/categories
 * Body: { category_name: string, category_id?: string }
 */
export async function createCategory(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const row: TablesInsert<"categories"> = {
    category_name: parsed.data.category_name,
    ...(parsed.data.category_id ? { category_id: parsed.data.category_id } : {}),
  };

  const { data, error } = await supabase
    .from("categories")
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: `Category ID "${parsed.data.category_id}" already exists. Duplicate IDs are not allowed.`,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/manage/menu");
  revalidatePath("/menu");

  return NextResponse.json(
    {
      message: `Category "${data.category_name}" created successfully`,
      data,
    },
    { status: 201 }
  );
}

/**
 * GET /api/menu/categories/[id]
 * Fetches a single category by category_id.
 */
export async function getCategoryById(_request: Request, { params }: RouteParams) {
  const categoryId = params.id;
  if (!categoryId) {
    return NextResponse.json(
      { error: "category_id URL parameter is required" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("category_id", categoryId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: `Category with ID "${categoryId}" not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data,
  });
}

/**
 * PUT /api/menu/categories/[id]
 * Updates category_name for the given category_id.
 */
export async function updateCategory(request: Request, { params }: RouteParams) {
  const categoryId = params.id;
  if (!categoryId) {
    return NextResponse.json(
      { error: "category_id URL parameter is required" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const changes: TablesUpdate<"categories"> = {
    category_name: parsed.data.category_name,
  };

  const { data, error } = await supabase
    .from("categories")
    .update(changes)
    .eq("category_id", categoryId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: `Category with ID "${categoryId}" not found` },
      { status: 404 }
    );
  }

  revalidatePath("/manage/menu");
  revalidatePath("/menu");

  return NextResponse.json({
    message: `Category "${data.category_name}" updated successfully`,
    data,
  });
}

/**
 * DELETE /api/menu/categories/[id]
 * Deletes a category by category_id if no products are assigned to it.
 */
export async function deleteCategory(_request: Request, { params }: RouteParams) {
  const categoryId = params.id;
  if (!categoryId) {
    return NextResponse.json(
      { error: "category_id URL parameter is required" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // Check if any products are still assigned to this category
  const { count, error: countError } = await supabase
    .from("product")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if (count && count > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete category because ${count} product${count > 1 ? "s are" : " is"} still assigned to it. Please reassign or delete the products first.`,
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("category_id", categoryId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: `Category with ID "${categoryId}" not found` },
      { status: 404 }
    );
  }

  revalidatePath("/manage/menu");
  revalidatePath("/menu");

  return NextResponse.json({
    message: `Category "${data.category_name}" deleted successfully`,
    data,
  });
}
