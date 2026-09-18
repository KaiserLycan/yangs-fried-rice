import { getDeliveryById, updateDelivery } from "@/app/api/routers/deliveries";

export async function GET(request: Request, context: { params: { id: string } }) {
  return getDeliveryById(request, context);
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  return updateDelivery(request, context);
}
