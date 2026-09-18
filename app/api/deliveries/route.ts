import { getDeliveries } from "@/app/api/routers/deliveries";

export async function GET(request: Request) {
  return getDeliveries(request);
}
