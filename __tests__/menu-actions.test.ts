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

// Reads of the row being changed — deleteProduct and updateProduct look up the
// current image first so they can remove it from Storage afterwards.
const mockMaybeSingle = vi.fn();
const mockReadSelect = vi.fn(() => ({
  eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
}));

const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  select: mockReadSelect,
}));

const mockRemoveStoredImage = vi.fn();
vi.mock("@/lib/storage/remove-stored-image", () => ({
  removeStoredImage: (...args: unknown[]) => mockRemoveStoredImage(...args),
}));

// 3. Inject the Mock into the createClient function
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// 4. Who is calling. Prices are manager-only, so most tests run as a manager.
const mockGetCurrentEmployee = vi.fn();
vi.mock("@/lib/actions/admin", () => ({
  getCurrentEmployee: () => mockGetCurrentEmployee(),
}));
const asRole = (role: string) =>
  mockGetCurrentEmployee.mockResolvedValue({ data: { employee_id: "emp-1", role }, error: null });

describe("US-02: Menu Management Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asRole("MANAGER");
  });

  it("staff cannot add a product, because that sets a price", async () => {
    asRole("STAFF");
    const result = await createProduct({
      product_name: "Garlic Rice",
      product_price: 55,
      is_available: true,
      is_featured: false,
    });
    expect(result.error).toBe("Only a manager can set or change menu prices.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("staff cannot change a price, but may save other edits with it unchanged", async () => {
    asRole("STAFF");
    mockMaybeSingle.mockResolvedValue({ data: { product_price: 55 }, error: null });

    const changed = await updateProduct("test-uuid-123", { product_price: 60 });
    expect(changed.error).toBe("Only a manager can set or change menu prices.");
    expect(mockUpdate).not.toHaveBeenCalled();

    mockSingle.mockResolvedValue({ data: { product_id: "test-uuid-123", image_url: null }, error: null });
    const unchanged = await updateProduct("test-uuid-123", { product_price: 55, product_name: "Garlic Rice" });
    expect(unchanged.error).toBeNull();
    // The price is left out of the write entirely.
    expect(mockUpdate).toHaveBeenCalledWith({ product_name: "Garlic Rice" });
  });

  it("TC-2.1.U: createProduct blocks submission when price is negative or name is blank", async () => {
    // Attempt to create a product with an invalid price and empty name
    const result = await createProduct({
      product_name: "", // Invalid: blank
      product_price: -50, // Invalid: negative
      is_available: true,
      is_featured: false,
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
      // Required since issue #120 (promotions and featured products).
      is_featured: false,
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
    mockMaybeSingle.mockResolvedValue({
      data: { image_url: "https://x.supabase.co/storage/v1/object/public/menu-images/1.webp" },
      error: null,
    });

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
        // Nothing may point at the photo once it is deleted.
        image_url: null,
      }),
    );

    // Only the menu listing reads the photo, and it skips archived rows, so
    // the file is removed rather than left in the bucket forever.
    expect(mockRemoveStoredImage).toHaveBeenCalledWith(
      "menu-images",
      "https://x.supabase.co/storage/v1/object/public/menu-images/1.webp",
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