import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "fallback_secret_for_dev_only"
);

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
    .sign(SECRET_KEY);
}

/**
 * Decrypts and verifies a JWT string back into the payload.
 */
export async function decrypt(token: string): Promise<EmployeeSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as unknown as EmployeeSessionPayload;
  } catch (error) {
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
