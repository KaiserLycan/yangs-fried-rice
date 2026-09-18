import { getRiderById, updateRider, deleteRider } from "@/app/api/routers/riders";

export async function GET(request: Request, context: { params: { id: string } }) {
  return getRiderById(request, context);
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  return updateRider(request, context);
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  return deleteRider(request, context);
}
