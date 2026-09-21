import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import {
  canAccessManagePath,
  homePathForRole,
  resolveEmployeeRole,
} from "@/lib/auth/roles";

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

  const isAuthPage = ["/login", "/register", "/employee/login"].some(path => pathname === path);

  // ========================================================================
  // FAST PATH: Employee Areas (No Supabase network requests)
  // ========================================================================
  let payload: any = null;
  const sessionCookie = request.cookies.get("yfr_employee_session")?.value;
  if (sessionCookie) {
    const { decrypt } = await import("@/lib/auth/session");
    payload = await decrypt(sessionCookie);
  }
  const isValidEmployee = !!payload?.employee_id;

  if (isEmployeeArea) {
    if (!isValidEmployee) {
      const redirectUrl = new URL("/employee/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    // Role gate. The session payload carries the role, so this costs no
    // network call. STAFF must not reach the dashboard, reports, customers or
    // employee pages by typing the URL; RIDERs belong in /deliver only.
    const role = resolveEmployeeRole(payload?.role);
    if (pathname.startsWith("/manage") && !canAccessManagePath(role, pathname)) {
      return NextResponse.redirect(new URL(homePathForRole(role), request.url));
    }

    // Still return the response so Supabase cookies are passed through if needed
    return response;
  }

  // ========================================================================
  // SLOW PATH: Customer Areas & Auth Pages (Validates against Supabase Auth)
  // ========================================================================
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isCustomerArea && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage) {
    if (isValidEmployee) {
      const role = resolveEmployeeRole(payload.role);
      return NextResponse.redirect(new URL(homePathForRole(role), request.url));
    }
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images, favicon.ico, _next (public assets)
     */
    "/((?!api|_next/static|_next/image|images|favicon.ico).*)",
  ],
};