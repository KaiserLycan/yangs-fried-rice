import { describe, expect, it } from "vitest";
import {
  badgeLabel,
  formatNotificationTime,
  NOTIFICATION_LIST_LIMIT,
  toNotification,
  unreadCount,
  upsertNotification,
  type CustomerNotification,
} from "./notifications";

const note = (id: string, createdAt: string, isRead = false): CustomerNotification => ({
  id,
  message: `m${id}`,
  isRead,
  createdAt,
  orderId: null,
  kind: null,
});

describe("toNotification", () => {
  it("reads a missing read flag as unread", () => {
    expect(
      toNotification({ notification_id: "1", message: "hi", is_read: null, created_at: "2026-01-01T00:00:00Z" }).isRead,
    ).toBe(false);
  });
});

describe("upsertNotification", () => {
  it("keeps newest first and never shows the same row twice", () => {
    let list = [note("a", "2026-01-01T00:00:00Z")];
    list = upsertNotification(list, note("b", "2026-01-02T00:00:00Z"));
    // The realtime echo of a row the first read already had.
    list = upsertNotification(list, note("a", "2026-01-01T00:00:00Z", true));
    expect(list.map((item) => item.id)).toEqual(["b", "a"]);
    expect(unreadCount(list)).toBe(1);
  });

  it("caps the list", () => {
    let list: CustomerNotification[] = [];
    for (let i = 0; i < NOTIFICATION_LIST_LIMIT + 5; i += 1) {
      list = upsertNotification(list, note(String(i), new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString()));
    }
    expect(list).toHaveLength(NOTIFICATION_LIST_LIMIT);
  });
});

describe("badgeLabel", () => {
  it("hides at zero and caps at 9+", () => {
    expect(badgeLabel(0)).toBeNull();
    expect(badgeLabel(3)).toBe("3");
    expect(badgeLabel(12)).toBe("9+");
  });
});

describe("formatNotificationTime", () => {
  const now = new Date("2026-09-28T12:00:00Z");
  it("is relative for the first day", () => {
    expect(formatNotificationTime("2026-09-28T11:59:30Z", now)).toBe("Just now");
    expect(formatNotificationTime("2026-09-28T11:55:00Z", now)).toBe("5 min ago");
    expect(formatNotificationTime("2026-09-28T09:00:00Z", now)).toBe("3 h ago");
  });

  it("then a Manila date", () => {
    expect(formatNotificationTime("2026-09-20T12:00:00Z", now)).toBe("Sep 20");
  });
});
