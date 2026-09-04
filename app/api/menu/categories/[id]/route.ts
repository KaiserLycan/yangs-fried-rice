import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "@/app/api/routers/categories";

export const GET = getCategoryById;
export const PUT = updateCategory;
export const DELETE = deleteCategory;
