import { describe, expect, it } from "vitest";
import {
  imageExtensionFor,
  imageUploadProblem,
  storagePathFromPublicUrl,
} from "@/lib/storage/stored-image";

const BASE = "https://abc.supabase.co/storage/v1/object/public";

describe("storagePathFromPublicUrl", () => {
  it("returns the path inside the bucket", () => {
    expect(storagePathFromPublicUrl(`${BASE}/menu-images/1712.webp`, "menu-images")).toBe(
      "1712.webp",
    );
    expect(
      storagePathFromPublicUrl(`${BASE}/avatars/user-1/1712.webp`, "avatars"),
    ).toBe("user-1/1712.webp");
  });

  it("decodes escaped characters", () => {
    expect(storagePathFromPublicUrl(`${BASE}/avatars/a%20b.png`, "avatars")).toBe("a b.png");
  });

  it("ignores a query string", () => {
    expect(storagePathFromPublicUrl(`${BASE}/emp-pfp/x.webp?t=1`, "emp-pfp")).toBe("x.webp");
  });

  it("refuses a URL from a different bucket", () => {
    expect(storagePathFromPublicUrl(`${BASE}/avatars/x.webp`, "menu-images")).toBeNull();
  });

  it("refuses external, empty, malformed and escaping URLs", () => {
    expect(storagePathFromPublicUrl("https://images.example.com/rice.jpg", "menu-images")).toBeNull();
    expect(storagePathFromPublicUrl(null, "menu-images")).toBeNull();
    expect(storagePathFromPublicUrl("not a url", "menu-images")).toBeNull();
    expect(storagePathFromPublicUrl(`${BASE}/menu-images/`, "menu-images")).toBeNull();
    // Dot segments are resolved by the URL parser, so this one lands in the
    // avatars bucket — and is refused as not being in menu-images.
    expect(
      storagePathFromPublicUrl(`${BASE}/menu-images/%2E%2E/avatars/x.webp`, "menu-images"),
    ).toBeNull();
    // An encoded slash survives parsing and only becomes ".." on decoding.
    expect(
      storagePathFromPublicUrl(`${BASE}/menu-images/..%2Favatars%2Fx.webp`, "menu-images"),
    ).toBeNull();
  });
});

describe("imageExtensionFor", () => {
  it("follows the content type, not the original name", () => {
    expect(imageExtensionFor({ type: "image/webp", name: "IMG_0042.jpg" })).toBe("webp");
    expect(imageExtensionFor({ type: "image/jpeg", name: "photo.jpeg" })).toBe("jpg");
  });

  it("falls back to the filename for an unknown type", () => {
    expect(imageExtensionFor({ type: "image/heic", name: "shot.HEIC" })).toBe("heic");
    expect(imageExtensionFor({ type: "", name: "noext" })).toBe("bin");
  });
});

describe("imageUploadProblem", () => {
  it("accepts a small JPEG, PNG or WebP", () => {
    expect(imageUploadProblem({ type: "image/webp", size: 40_000 })).toBeNull();
    expect(imageUploadProblem({ type: "image/png", size: 5 * 1024 * 1024 })).toBeNull();
  });

  it("refuses other types and oversized files", () => {
    expect(imageUploadProblem({ type: "application/pdf", size: 10 })).toMatch(/JPEG, PNG, or WebP/);
    expect(imageUploadProblem({ type: "image/jpeg", size: 5 * 1024 * 1024 + 1 })).toMatch(/5MB/);
  });
});
