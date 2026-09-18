import {
  getTransactionById,
  updateTransactionStatus,
} from "@/app/api/routers/transactions";

export async function GET(request: Request, context: { params: { id: string } }) {
  return getTransactionById(request, context);
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  return updateTransactionStatus(request, context);
}
