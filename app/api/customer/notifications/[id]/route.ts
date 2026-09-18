import {
  markNotificationRead,
  deleteNotification,
} from "@/app/api/routers/notifications";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  return markNotificationRead(request, context);
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  return deleteNotification(request, context);
}
