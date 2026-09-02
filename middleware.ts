import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Route-protection seam.
 *
 * Refreshes the Supabase session on every request and redirects signed-out
 * visitors away from customer areas. Employee areas (/manage, /deliver) are
 * intentionally NOT guarded here yet — that depends on the employee auth
 * flow, which is separate from Cust1-3 and out of scope for this issue.
 *
 * Do NOT add "/employee/:path*" to the matcher. /employee/login lives under
 * that prefix, so guarding it wholesale would redirect a signed-out visitor
 * to a page that redirects them again, forever. The employee login is public
 * by definition; only /manage and /deliver need guarding, and that guard is
 * still a TODO for whoever picks up employee auth.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isCustomerArea = ["/cart", "/checkout", "/orders", "/profile"].some(
    (path) => request.nextUrl.pathname.startsWith(path)
  );

  if (isCustomerArea && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
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
    // Employee areas — matched but not yet guarded (see comment above).
    "/manage/:path*",
    "/deliver/:path*",
  ],
};