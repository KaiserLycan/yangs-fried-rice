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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isCustomerArea = ["/cart", "/checkout", "/orders", "/profile"].some(
    (path) => pathname.startsWith(path)
  );
  const isEmployeeArea = ["/manage", "/deliver"].some((path) =>
    pathname.startsWith(path)
  );

  if (isCustomerArea && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isEmployeeArea) {
    const redirectToEmployeeLogin = () => {
      const redirectUrl = new URL("/employee/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    };

    if (!user) {
      return redirectToEmployeeLogin();
    }

    const { data: employee } = await supabase
      .from("employee")
      .select("employee_id")
      .eq("employee_id", user.id)
      .single();

    // Authenticated but not an employee (e.g. a customer session trying
    // /manage directly) — same destination as signed-out.
    if (!employee) {
      return redirectToEmployeeLogin();
    }
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