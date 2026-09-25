import { vi, describe, it, expect, beforeEach } from "vitest";
import { createProduct, updateProduct, deleteProduct, createCategory, deleteCategory } from "@/lib/actions/menu";
import { revalidatePath } from "next/cache";

// 1. Mock Next.js Cache Revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// 2. Build the Supabase Mock Chain
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockEqForUpdate = vi.fn(() => ({ select: mockSelect }));
const mockEqForDelete = vi.fn();
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockEqForUpdate }));
const mockDelete = vi.fn(() => ({ eq: mockEqForDelete }));

const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

// 3. Inject the Mock into the createClient function
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("US-02: Menu Management Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-2.1.U: createProduct blocks submission when price is negative or name is blank", async () => {
    // Attempt to create a product with an invalid price and empty name
    const result = await createProduct({
      product_name: "", // Invalid: blank
      product_price: -50, // Invalid: negative
      is_available: true,
    });

    // Zod should intercept this before Supabase is even called
    expect(result.data).toBeNull();
    // It will catch the first error in the schema (the blank name)
    expect(result.error).toContain("Product name is required");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("TC-2.1.I: createProduct successfully inserts valid item and refreshes UI", async () => {
    // Tell the fake Supabase to return a successful insertion
    mockSingle.mockResolvedValue({ 
      data: { product_id: "test-uuid-123", product_name: "Garlic Rice" }, 
      error: null 
    });

    const result = await createProduct({
      product_name: "Garlic Rice",
      product_price: 55.00,
      is_available: true,
    });

    // Verify it succeeded
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ product_id: "test-uuid-123", product_name: "Garlic Rice" });
    
    // Verify it targeted the right table
    expect(mockFrom).toHaveBeenCalledWith("product");
    
    // Verify it told Next.js to refresh the UI immediately (M5 Requirement)
    expect(revalidatePath).toHaveBeenCalledWith("/manage/menu");
    expect(revalidatePath).toHaveBeenCalledWith("/menu");
  });

  it("TC-2.2.U: updateProduct enforces Zod constraints (e.g., price too high)", async () => {
    const result = await updateProduct("test-uuid-123", {
      product_price: 999999.99, // Invalid: Exceeds 99,999.99 limit from schema
    });

    expect(result.data).toBeNull();
    expect(result.error).toContain("Price cannot exceed 99,999.99");
  });

  it("TC-2.3.I: deleteProduct archives the item rather than destroying it", async () => {
    // Tell fake Supabase that the write had no errors
    mockEqForDelete.mockResolvedValue({ error: null });

    const result = await deleteProduct("test-uuid-123");

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ product_id: "test-uuid-123" });

    expect(mockFrom).toHaveBeenCalledWith("product");

    // The point of issue #106: a hard DELETE nulls order_item.product_id on
    // every historical line that referenced this product, so past orders lose
    // the name of what was bought. It must archive instead.
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        archived_at: expect.any(String),
        is_available: false,
      }),
    );

    // Verify the UI refreshes after archiving
    expect(revalidatePath).toHaveBeenCalledWith("/manage/menu");
  });

  it("TC-2.4.I: createCategory successfully inserts a logical category (e.g., Fried Rice)", async () => {
    // Mock the database returning our new category
    mockSingle.mockResolvedValue({ 
      data: { category_id: "cat-uuid-123", category_name: "Fried Rice" }, 
      error: null 
    });

    const result = await createCategory({
      category_name: "Fried Rice",
    });

    // Verify it succeeded
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ category_id: "cat-uuid-123", category_name: "Fried Rice" });
    
    // Verify it targeted the 'categories' table, fulfilling Acceptance Criteria #2
    expect(mockFrom).toHaveBeenCalledWith("categories");
    expect(mockInsert).toHaveBeenCalled();
  });

 it("TC-2.4.U: deleteCategory prevents deletion if products are still mapped to it", async () => {
    // 1. Build the specific chain for the count query: .select().eq()
    const mockEqForCount = vi.fn().mockResolvedValue({ count: 5, error: null });
    const mockSelectForCount = vi.fn(() => ({ eq: mockEqForCount }));
    
    // 2. Override mockFrom just for this test, using 'as any' to bypass TypeScript's strict rules
    mockFrom.mockImplementationOnce(() => ({
      select: mockSelectForCount,
    } as any));

    const result = await deleteCategory("cat-uuid-123");

    // The system should block the deletion
    expect(result.data).toBeNull();
    expect(result.error).toContain("Cannot delete category because 5 products are still assigned to it");
  });
});