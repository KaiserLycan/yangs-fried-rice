import { getProductAddons, createProductAddon } from "@/app/api/routers/addons";

export async function GET(request: Request, context: { params: { id: string } }) {
  return getProductAddons(request, context);
}

export async function POST(request: Request, context: { params: { id: string } }) {
  return createProductAddon(request, context);
}
