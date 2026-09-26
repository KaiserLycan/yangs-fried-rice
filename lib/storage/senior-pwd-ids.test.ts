import { describe, expect, it, vi } from "vitest";
import {
  SENIOR_PWD_ID_BUCKET,
  SENIOR_PWD_ID_URL_TTL_SECONDS,
  isSeniorPwdIdPath,
  seniorPwdIdPath,
  seniorPwdIdUploadProblem,
  signSeniorPwdIdUrl,
} from "./senior-pwd-ids";

const CUSTOMER = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const FILE = "1b2c3d4e-5555-6666-7777-888899990000";

function clientReturning(result: { data: { signedUrl: string } | null; error: unknown }) {
  const createSignedUrl = vi.fn().mockResolvedValue(result);
  const from = vi.fn().mockReturnValue({ createSignedUrl });
  return { client: { storage: { from } } as never, from, createSignedUrl };
}

describe("seniorPwdIdPath", () => {
  it("files the photo under the customer's own folder", () => {
    expect(seniorPwdIdPath(CUSTOMER, "image/jpeg", FILE)).toBe(`${CUSTOMER}/${FILE}.jpg`);
  });

  it("refuses a folder that is not a customer id", () => {
    expect(() => seniorPwdIdPath("../other", "image/png", FILE)).toThrow();
  });
});

describe("isSeniorPwdIdPath", () => {
  it("accepts <uuid>/<file>", () => {
    expect(isSeniorPwdIdPath(`${CUSTOMER}/${FILE}.png`)).toBe(true);
  });

  it("refuses anything that could reach outside one customer's folder", () => {
    expect(isSeniorPwdIdPath(`${CUSTOMER}/../x.png`)).toBe(false);
    expect(isSeniorPwdIdPath(`${CUSTOMER}/..`)).toBe(false);
    expect(isSeniorPwdIdPath("x.png")).toBe(false);
    expect(isSeniorPwdIdPath(`not-a-uuid/${FILE}.png`)).toBe(false);
  });
});

describe("seniorPwdIdUploadProblem", () => {
  it("accepts a small photo", () => {
    expect(seniorPwdIdUploadProblem({ size: 500_000, type: "image/jpeg" })).toBeNull();
  });

  it("refuses a file over 2 MB or one that is not an image", () => {
    expect(seniorPwdIdUploadProblem({ size: 3_000_000, type: "image/jpeg" })).toMatch(/2 MB/);
    expect(seniorPwdIdUploadProblem({ size: 1000, type: "application/pdf" })).toMatch(/photo/);
  });
});

describe("signSeniorPwdIdUrl", () => {
  it("signs a short-lived URL in the private bucket", async () => {
    const { client, from, createSignedUrl } = clientReturning({
      data: { signedUrl: "https://x.supabase.co/signed" },
      error: null,
    });

    await expect(signSeniorPwdIdUrl(client, `${CUSTOMER}/${FILE}.jpg`)).resolves.toBe(
      "https://x.supabase.co/signed",
    );
    expect(from).toHaveBeenCalledWith(SENIOR_PWD_ID_BUCKET);
    expect(createSignedUrl).toHaveBeenCalledWith(
      `${CUSTOMER}/${FILE}.jpg`,
      SENIOR_PWD_ID_URL_TTL_SECONDS,
    );
  });

  it("never signs for longer than five minutes", async () => {
    const { client, createSignedUrl } = clientReturning({
      data: { signedUrl: "https://x" },
      error: null,
    });

    await signSeniorPwdIdUrl(client, `${CUSTOMER}/${FILE}.jpg`, 86_400);
    expect(createSignedUrl.mock.calls[0][1]).toBe(SENIOR_PWD_ID_URL_TTL_SECONDS);
  });

  it("returns null when storage refuses — someone else's ID, or none at all", async () => {
    const { client } = clientReturning({ data: null, error: { message: "not found" } });
    await expect(signSeniorPwdIdUrl(client, `${CUSTOMER}/${FILE}.jpg`)).resolves.toBeNull();
  });

  it("does not ask storage about a malformed path", async () => {
    const { client, createSignedUrl } = clientReturning({ data: null, error: null });
    await expect(signSeniorPwdIdUrl(client, "../../etc")).resolves.toBeNull();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
