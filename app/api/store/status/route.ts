import { NextResponse } from "next/server";
import { readStoreStatus } from "@/lib/store/read-store-status";

/**
 * GET /api/store/status: is the shop open, paused or busy (issue #115).
 *
 * Read by the menu banner and the cart's checkout button, which are client
 * components and so can see neither the database directly nor
 * `FORCE_STORE_OPEN` (only `NEXT_PUBLIC_*` variables reach the browser).
 *
 * Never cached: a manager's pause should reach customers on their next poll,
 * and in Next 14 a GET handler with no dynamic input would otherwise be
 * rendered once at build time and served frozen.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await readStoreStatus();
  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
