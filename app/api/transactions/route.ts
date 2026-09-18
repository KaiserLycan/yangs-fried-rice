import { getTransactions, createTransaction } from "@/app/api/routers/transactions";

export async function GET(request: Request) {
  return getTransactions(request);
}

export async function POST(request: Request) {
  return createTransaction(request);
}
