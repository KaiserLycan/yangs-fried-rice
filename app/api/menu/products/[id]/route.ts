import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/app/api/routers/products";

export const GET = getProductById;
export const PUT = updateProduct;
export const DELETE = deleteProduct;
