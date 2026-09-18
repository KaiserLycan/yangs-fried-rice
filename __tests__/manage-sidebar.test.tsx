import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Sidebar } from "@/components/manage/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/manage/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/app/(auth)/actions", () => ({
  logout: vi.fn(async () => ({ success: true })),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: {
          name: "Maya Cruz",
          profileImageUrl: "https://example.com/avatar.jpg",
        },
      }),
    })));
  });

  it("loads the signed-in employee name and avatar from the API instead of the mock fallback", async () => {
    render(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByText("Maya Cruz")).toBeInTheDocument();
    });

    expect(screen.queryByText("Lazy Ryan")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Maya Cruz/i })).toBeInTheDocument();
    expect(document.querySelector('img[src="https://example.com/avatar.jpg"]')).toBeInTheDocument();
  });
});
