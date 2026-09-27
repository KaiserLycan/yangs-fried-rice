import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { NotificationBell } from "@/components/nav/notification-bell";

// A stand-in that behaves like realtime-js where it matters: `channel(name)`
// returns the existing channel when the name is taken, and adding a
// `postgres_changes` callback after `subscribe()` throws.
const subscribedTopics: string[] = [];

function fakeClient() {
  const channels = new Map<string, { subscribed: boolean }>();
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: () => Promise.resolve({ data: [], error: null }),
  };
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    from: () => query,
    channel(name: string) {
      const state = channels.get(name) ?? { subscribed: false };
      channels.set(name, state);
      const channel = {
        on() {
          if (state.subscribed) {
            throw new Error(
              `cannot add \`postgres_changes\` callbacks for realtime:${name} after \`subscribe()\`.`,
            );
          }
          return channel;
        },
        subscribe() {
          state.subscribed = true;
          subscribedTopics.push(name);
          return channel;
        },
      };
      return channel;
    },
    removeChannel: vi.fn(),
  };
}

// createBrowserClient hands every caller the same client in a tab.
const shared = fakeClient();
vi.mock("@/lib/supabase/client", () => ({ createClient: () => shared }));

describe("NotificationBell", () => {
  // The bell is mounted twice on /menu (desktop nav bar and mobile header).
  // Both used to open `notifications-<user>`; the second got the first's
  // already-subscribed channel and threw.
  it("can be mounted twice on one page without sharing a channel", async () => {
    render(
      <>
        <NotificationBell />
        <NotificationBell />
      </>,
    );

    await waitFor(() => expect(subscribedTopics).toHaveLength(2));
    expect(new Set(subscribedTopics).size).toBe(2);
    for (const topic of subscribedTopics) expect(topic).toMatch(/^notifications-user-1:/);
  });
});
