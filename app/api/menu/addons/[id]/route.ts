import { getAddonById, updateAddon, deleteAddon } from "@/app/api/routers/addons";

export async function GET(request: Request, context: { params: { id: string } }) {
  return getAddonById(request, context);
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  return updateAddon(request, context);
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  return deleteAddon(request, context);
}
