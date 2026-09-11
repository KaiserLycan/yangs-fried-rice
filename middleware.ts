import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Route-protection seam.
 *
 * Refreshes the Supabase session on every request and redirects
 * signed-out visitors away from both customer and employee areas.
 *
 * Employee areas check for a matching `employee` row, not just any
 * authenticated session — a logged-in customer must not be able to walk
 * into /manage just because they have a valid session cookie.
 *
 * /employee/login itself is intentionally NOT in the matcher below — it's
 * public by definition, and guarding it wholesale would redirect a
 * signed-out visitor to a page that redirects them again, forever.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
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

  const pathname = request.nextUrl.pathname;
  const isCustomerArea = ["/cart", "/checkout", "/orders", "/profile"].some(
    (path) => pathname.startsWith(path)
  );
  const isEmployeeArea = ["/manage", "/deliver"].some((path) =>
    pathname.startsWith(path)
  );

  // ========================================================================
  // FAST PATH: Employee Areas (No Supabase network requests)
  // ========================================================================
  if (isEmployeeArea) {
    const sessionCookie = request.cookies.get("yfr_employee_session")?.value;
    let isValidEmployee = false;

    if (sessionCookie) {
      // Dynamic import to avoid edge runtime issues if any
      const { decrypt } = await import("@/lib/auth/session");
      const payload = await decrypt(sessionCookie);
      if (payload?.employee_id) {
        isValidEmployee = true;
      }
    }

    if (!isValidEmployee) {
      const redirectUrl = new URL("/employee/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Still return the response so Supabase cookies are passed through if needed
    return response;
  }

  // ========================================================================
  // SLOW PATH: Customer Areas (Validates against Supabase Auth API)
  // ========================================================================
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isCustomerArea && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
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
    // Employee areas. /employee/login is deliberately excluded — see the
    // comment above the middleware function for why.
    "/manage/:path*",
    "/deliver/:path*",
  ],
};