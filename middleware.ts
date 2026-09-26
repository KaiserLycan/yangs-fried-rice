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

  // Pages you reach precisely because you are not signed in — so a signed-in
  // visitor is sent on to their home instead (see below). /forgot-password
  // belongs here: someone with a live session has no use for it.
  //
  // /reset-password deliberately does NOT. The link in the reset email
  // carries a recovery token that the Supabase client exchanges for a real
  // session as soon as the page mounts, so treating a session as "already
  // signed in, go home" would throw the customer off the very page that
  // token exists to open (issue #106). It is not under a guarded area, so
  // leaving it out of both lists makes it reachable either way.
  const isAuthPage = [
    "/login",
    "/register",
    "/employee/login",
    "/forgot-password",
  ].some(path => pathname === path);

  // ========================================================================
  // FAST PATH: Employee Areas (No Supabase network requests)
  // ========================================================================
  let payload: any = null;
  const sessionCookie = request.cookies.get("yfr_employee_session")?.value;
  if (sessionCookie) {
    const { decrypt } = await import("@/lib/auth/session");
    payload = await decrypt(sessionCookie);
  }
  // A session is only an employee session if its role is one we recognise.
  // Requiring just `employee_id` meant a row whose role is NULL or something
  // unrecognised ("Admin", "Owner") produced a session that passed the gate
  // below but was allowed nowhere — so the redirect sent it to a page that
  // redirected it again, forever.
  const sessionRole = resolveEmployeeRole(payload?.role);
  const isValidEmployee = !!payload?.employee_id && sessionRole !== null;

  if (isEmployeeArea) {
    if (!isValidEmployee) {
      const redirectUrl = new URL("/employee/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    // Role gate. The session payload carries the role, so this costs no
    // network call. STAFF must not reach the dashboard, reports, customers or
    // employee pages by typing the URL; RIDERs belong in /deliver only.
    if (pathname.startsWith("/manage") && !canAccessManagePath(sessionRole, pathname)) {
      // Guaranteed to be somewhere this role *can* go, so this cannot bounce.
      return NextResponse.redirect(new URL(homePathForRole(sessionRole), request.url));
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

  // Signed in is not the same as being a customer. Administrators, staff and
  // riders have Supabase accounts too; one without a `customer` row must not
  // reach the cart, checkout, orders or profile pages. RLS only lets a person
  // read their OWN customer row, so this answers "is this account a
  // customer?" and nothing more.
  if (isCustomerArea && user) {
    const { data: customer } = await supabase
      .from("customer")
      .select("customer_id")
      .eq("customer_id", user.id)
      .maybeSingle();

    if (!customer) {
      if (isValidEmployee) {
        return NextResponse.redirect(new URL(homePathForRole(sessionRole), request.url));
      }
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "not-customer");
      // Drop the Supabase session cookies so the next sign-in starts clean.
      const redirect = NextResponse.redirect(redirectUrl);
      request.cookies
        .getAll()
        .filter(({ name }) => name.startsWith("sb-"))
        .forEach(({ name }) => redirect.cookies.delete(name));
      return redirect;
    }
  }

  if (isAuthPage) {
    if (isValidEmployee) {
      return NextResponse.redirect(new URL(homePathForRole(sessionRole), request.url));
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