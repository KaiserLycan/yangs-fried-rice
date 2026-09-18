import { getNotifications } from "@/app/api/routers/notifications";

export async function GET(request: Request) {
  return getNotifications(request);
}
