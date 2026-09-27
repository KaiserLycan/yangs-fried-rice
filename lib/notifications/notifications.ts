/**
 * The customer's notifications, as the nav bar's bell draws them
 * (limitations #10, issue #118).
 *
 * Rows are written by the database — `notify_customer_of_order_status()`
 * fires on every order status change — and read by the bell through the
 * customer's own session, where RLS limits them to their own.
 */

export type CustomerNotification = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId: string | null;
  kind: string | null;
};

/** What the bell selects; kept here so the realtime payload maps the same way. */
export const NOTIFICATION_COLUMNS =
  "notification_id, message, is_read, created_at, order_id, kind";

/** How many the bell lists. Older ones are still in the table. */
export const NOTIFICATION_LIST_LIMIT = 20;

export type NotificationRow = {
  notification_id: string;
  message: string;
  is_read: boolean | null;
  created_at: string | null;
  order_id?: string | null;
  kind?: string | null;
};

export function toNotification(row: NotificationRow): CustomerNotification {
  return {
    id: row.notification_id,
    message: row.message,
    isRead: row.is_read === true,
    createdAt: row.created_at ?? new Date(0).toISOString(),
    orderId: row.order_id ?? null,
    kind: row.kind ?? null,
  };
}

export function unreadCount(notifications: CustomerNotification[]): number {
  return notifications.reduce((count, item) => count + (item.isRead ? 0 : 1), 0);
}

/**
 * Insert or replace one notification, keeping newest first and the list
 * capped. A realtime INSERT and the initial read can race; merging by id
 * means the same row never shows twice.
 */
export function upsertNotification(
  list: CustomerNotification[],
  next: CustomerNotification,
): CustomerNotification[] {
  const others = list.filter((item) => item.id !== next.id);
  return [next, ...others]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, NOTIFICATION_LIST_LIMIT);
}

/** The badge text: a count, capped so it never widens the icon. */
export function badgeLabel(count: number): string | null {
  if (count <= 0) return null;
  return count > 9 ? "9+" : String(count);
}

/** "Just now", "5 min ago", "3 h ago", then a Manila date. */
export function formatNotificationTime(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  const seconds = Math.round((now.getTime() - at.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).format(at);
}
