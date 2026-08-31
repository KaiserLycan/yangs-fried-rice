import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route-protection seam.
 *
 * Auth is not built yet, so this passes every request straight through. The
 * matcher below is the part that matters today: it already names every area
 * that will need a session, so pages added inside those areas are covered
 * automatically once the real check lands here.
 *
 * TODO(auth): refresh the Supabase session and redirect signed-out visitors.
 * There are two destinations, not one:
 *   - customer areas (/cart, /checkout, /orders, /profile) -> /login
 *   - employee areas (/manage, /deliver)                   -> /employee/login
 *
 * Do NOT add "/employee/:path*" to this matcher. /employee/login lives under
 * that prefix, so guarding it wholesale would redirect a signed-out visitor
 * to a page that redirects them again, forever. The employee login is public
 * by definition; only /manage and /deliver need guarding.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Customer areas. These live in the (account) route group, and route
    // groups contribute nothing to the URL, so each path is listed by hand.
    // The primary gate is app/(account)/layout.tsx — this is defence in depth.
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile/:path*",
    // Employee areas. Literal prefixes, so one match each covers every page
    // added inside them later.
    "/manage/:path*",
    "/deliver/:path*",
  ],
};
