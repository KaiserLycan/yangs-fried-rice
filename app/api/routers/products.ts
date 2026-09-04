import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { productSchema, productUpdateSchema } from "@/lib/validation/menu";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/menu/products
 * Optional query parameter: ?categoryId=<UUID>
 */
export async function getProducts(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  const supabase = createClient();

  let query = supabase
    .from("product")
    .select("*, categories(category_name)")
    .order("product_name");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: data.length,
    data,
  });
}

/**
 * POST /api/menu/products
 * Creates a new product. Accepts custom product_id (must be UUID).
 * Returns 409 Conflict if the product_id already exists.
 */
export async function createProduct(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const row: TablesInsert<"product"> = {
    product_name: parsed.data.product_name,
    product_price: parsed.data.product_price,
    product_details: parsed.data.product_details ?? null,
    category_id: parsed.data.category_id ?? null,
    is_available: parsed.data.is_available,
    ...(parsed.data.product_id ? { product_id: parsed.data.product_id } : {}),
  };

  const { data, error } = await supabase
    .from("product")
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: `Product ID "${parsed.data.product_id}" already exists. Duplicate IDs are not allowed.`,
        },
        { status: 409 }
      );
    }
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error: `Category with ID "${parsed.data.category_id}" does not exist.`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/manage/menu");
  revalidatePath("/menu");

  return NextResponse.json(
    {
      message: `Product "${data.product_name}" created successfully`,
      data,
    },
    { status: 201 }
  );
}

/**
 * GET /api/menu/products/[id]
 * Fetch a single product by product_id.
 */
export async function getProductById(_request: Request, { params }: RouteParams) {
  const productId = params.id;
  if (!productId) {
    return NextResponse.json(
      { error: "product_id URL parameter is required" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("product")
    .select("*, categories(category_name)")
    .eq("product_id", productId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: `Product with ID "${productId}" not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data,
  });
}

/**
 * PUT /api/menu/products/[id]
 * Updates product fields (partial).
 */
export async function updateProduct(request: Request, { params }: RouteParams) {
  const productId = params.id;
  if (!productId) {
    return NextResponse.json(
      { error: "product_id URL parameter is required" },
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

  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const changes: TablesUpdate<"product"> = {
    ...parsed.data,
  };

  const { data, error } = await supabase
    .from("product")
    .update(changes)
    .eq("product_id", productId)
    .select()
    .single();

  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error: `Category with ID "${parsed.data.category_id}" does not exist.`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: `Product with ID "${productId}" not found` },
      { status: 404 }
    );
  }

  revalidatePath("/manage/menu");
  revalidatePath("/menu");

  return NextResponse.json({
    message: `Product "${data.product_name}" updated successfully`,
    data,
  });
}

/**
 * DELETE /api/menu/products/[id]
 * Deletes a product permanently.
 */
export async function deleteProduct(_request: Request, { params }: RouteParams) {
  const productId = params.id;
  if (!productId) {
    return NextResponse.json(
      { error: "product_id URL parameter is required" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("product")
    .delete()
    .eq("product_id", productId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: `Product with ID "${productId}" not found` },
      { status: 404 }
    );
  }

  revalidatePath("/manage/menu");
  revalidatePath("/menu");

  return NextResponse.json({
    message: `Product "${data.product_name}" deleted successfully`,
    data,
  });
}
