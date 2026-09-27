import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * The key the employee session cookie is signed with.
 *
 * It used to fall back to NEXT_PUBLIC_SUPABASE_ANON_KEY and then to a literal
 * string. Both are public — the anon key ships inside the browser bundle — so
 * on any deployment without a service-role key set, anyone could mint
 * themselves a cookie saying `role: "MANAGER"` and walk into /manage. There is
 * no safe default for a signing key, so a missing one is an error rather than
 * a weak fallback.
 *
 * EMPLOYEE_SESSION_SECRET must be a long random string. In production there
 * is no fallback (security review S11): signing sessions with the
 * service-role key tied two secrets together, so leaking or rotating one
 * affected the other. Local development may still fall back to it, with a
 * warning, so a fresh checkout runs. Neither is ever sent to the browser.
 */
function sessionSecret(): Uint8Array {
  const dedicated = process.env.EMPLOYEE_SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  if (!dedicated && !isProduction && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("EMPLOYEE_SESSION_SECRET is not set; using the service-role key for local development only.");
  }
  const secret = dedicated || (isProduction ? undefined : process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!secret || secret.trim().length < 32) {
    throw new Error(
      "EMPLOYEE_SESSION_SECRET is not set (or is too short). Employee sign-in is disabled until a server-side secret of at least 32 characters is configured.",
    );
  }

  return new TextEncoder().encode(secret);
}

export const SESSION_COOKIE_NAME = "yfr_employee_session";

export interface EmployeeSessionPayload {
  employee_id: string;
  role: string;
}

/**
 * Encrypts a payload into a JWT string.
 */
export async function encrypt(payload: EmployeeSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // Session valid for 24 hours
    .sign(sessionSecret());
}

/**
 * Decrypts and verifies a JWT string back into the payload.
 */
export async function decrypt(token: string): Promise<EmployeeSessionPayload | null> {
  try {
    // `algorithms` is pinned so a token claiming "alg": "none" (or any other
    // algorithm) cannot bypass the signature check.
    const { payload } = await jwtVerify(token, sessionSecret(), {
      algorithms: ["HS256"],
    });

    // A signature alone is not enough: the payload still has to look like an
    // employee session.
    if (
      typeof payload.employee_id !== "string" ||
      payload.employee_id.length === 0 ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      employee_id: payload.employee_id,
      role: payload.role,
    };
  } catch {
    // Bad signature, expired, malformed — or no secret configured. All of
    // them mean "no valid session".
    return null;
  }
}

/**
 * Creates a secure HttpOnly cookie containing the signed session.
 */
export async function createSession(employeeId: string, role: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await encrypt({ employee_id: employeeId, role });

  cookies().set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expires,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Clears the session cookie.
 */
export function deleteSession() {
  cookies().set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    sameSite: "lax",
    path: "/",
  });
}
