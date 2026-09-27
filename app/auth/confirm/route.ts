import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";

/**
 * GET /auth/confirm — where the sign-up confirmation email lands.
 *
 * Before this the link went to /login, and nothing turned its code into a
 * session: a customer confirmed their email, then had to type their password
 * again to reach a menu they had just left (UI/UX review, docs/user-simulation.md
 * #16). Now the code is exchanged here and they land on `next` (the menu)
 * signed in.
 *
 * PKCE links carry `?code=`; the email-template style carries
 * `?token_hash=&type=`. Both are handled. If the exchange fails — most often
 * because the link was opened in a different browser from the one that signed
 * up, so the PKCE verifier cookie is missing — the email is still confirmed
 * (Supabase did that before redirecting), so the customer is sent to log in,
 * with `next` kept.
 *
 * Supabase only redirects here if `<origin>/auth/confirm` is listed under
 * Authentication → URL Configuration → Redirect URLs.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"), "/menu");
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const supabase = createClient();
  let signedIn = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    signedIn = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    signedIn = !error;
  }

  if (signedIn) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const login = new URL("/login", url.origin);
  login.searchParams.set("confirmed", "1");
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}
