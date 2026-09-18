import { getRiders, createRider } from "@/app/api/routers/riders";

export async function GET() {
  return getRiders();
}

export async function POST(request: Request) {
  return createRider(request);
}
