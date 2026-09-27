"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  badgeLabel,
  formatNotificationTime,
  NOTIFICATION_COLUMNS,
  NOTIFICATION_LIST_LIMIT,
  toNotification,
  unreadCount,
  upsertNotification,
  type CustomerNotification,
  type NotificationRow,
} from "@/lib/notifications/notifications";
import { cn } from "@/lib/utils";
import { uniqueChannelName } from "@/lib/supabase/channel-name";

/**
 * The bell in the nav bar (limitations #10, issue #118): an unread count
 * that updates live, and a panel listing the latest messages.
 *
 * The rows are written by a database trigger whenever an order's status
 * changes — "Your order #… is ready for pickup — Counter 1" is the one that
 * matters most, because a pickup customer otherwise only learns it if the
 * tracking page happens to be open. Supabase Realtime pushes each new row
 * here; RLS applies to the subscription, so only the customer's own arrive.
 *
 * Renders nothing until it knows who is signed in, so a guest never sees it.
 * Both places it sits (the desktop bar, the mobile menu header) are brand
 * red, so the icon is drawn white.
 */
export function NotificationBell({ className }: { className?: string }) {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<CustomerNotification[]>([]);
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // One browser client for the component's lifetime, so the channel below
  // is opened on the same connection it is later removed from. Created in an
  // effect, never during render: if Supabase isn't configured the bell just
  // doesn't appear, instead of taking the whole nav bar down with it.
  const [supabase, setSupabase] = React.useState<ReturnType<typeof createClient> | null>(null);
  React.useEffect(() => {
    try {
      setSupabase(createClient());
    } catch {
      setSupabase(null);
    }
  }, []);

  React.useEffect(() => {
    if (!supabase) return;
    let active = true;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("notification")
        .select(NOTIFICATION_COLUMNS)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(NOTIFICATION_LIST_LIMIT);
      if (active && data) {
        setItems((current) =>
          (data as NotificationRow[]).map(toNotification).reduce(upsertNotification, current),
        );
      }
    })().catch(() => {
      // Offline, or auth unreachable: the bell stays hidden (or empty) rather
      // than leaving an unhandled rejection behind.
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  React.useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase
      .channel(uniqueChannelName(`notifications-${userId}`))
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification", filter: `customer_id=eq.${userId}` },
        (payload: { new: Record<string, unknown> }) => {
          setItems((current) => upsertNotification(current, toNotification(payload.new as NotificationRow)));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notification", filter: `customer_id=eq.${userId}` },
        (payload: { new: Record<string, unknown> }) => {
          setItems((current) => upsertNotification(current, toNotification(payload.new as NotificationRow)));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  // Close on Escape (focus back to the bell) and on a press outside.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const markRead = React.useCallback(
    async (ids: string[]) => {
      if (!supabase || ids.length === 0) return;
      const idSet = new Set(ids);
      setItems((current) =>
        current.map((item) => (idSet.has(item.id) ? { ...item, isRead: true } : item)),
      );
      const { error } = await supabase
        .from("notification")
        .update({ is_read: true })
        .in("notification_id", ids);
      if (error) {
        // Put them back, so the count doesn't claim something that didn't save.
        setItems((current) =>
          current.map((item) => (idSet.has(item.id) ? { ...item, isRead: false } : item)),
        );
      }
    },
    [supabase],
  );

  if (!userId) return null;

  const unread = unreadCount(items);
  const badge = badgeLabel(unread);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex size-[44px] items-center justify-center rounded-pill text-white/90 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <Bell aria-hidden="true" className="size-[20px]" />
        {badge ? (
          <span
            aria-hidden="true"
            className="absolute right-[4px] top-[4px] flex min-w-[18px] items-center justify-center rounded-pill bg-white px-[4px] text-[12px] font-bold leading-[18px] text-primary"
          >
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+6px)] z-50 flex max-h-[70vh] w-[min(340px,calc(100vw-32px))] flex-col overflow-hidden rounded-[14px] border border-field-border bg-white text-foreground shadow-[0px_8px_20px_rgba(26,18,16,0.12)]"
        >
          <div className="flex items-center justify-between gap-[8px] border-b border-rule px-[14px] py-[8px]">
            <h2 className="text-[15px] font-bold">Notifications</h2>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markRead(items.filter((item) => !item.isRead).map((item) => item.id))}
                className="min-h-[44px] px-[4px] text-[14px] font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-[14px] py-[18px] text-[14px] text-muted-strong">
              Nothing yet. We&apos;ll let you know here when your order is being cooked and when
              it&apos;s ready to pick up.
            </p>
          ) : (
            <ul className="overflow-y-auto">
              {items.map((item) => {
                const body = (
                  <>
                    <span className="flex items-start gap-[8px]">
                      {!item.isRead ? (
                        <span aria-hidden="true" className="mt-[7px] size-[8px] shrink-0 rounded-full bg-primary" />
                      ) : (
                        <span aria-hidden="true" className="size-[8px] shrink-0" />
                      )}
                      <span className={cn("text-[14px] leading-[20px]", !item.isRead && "font-bold")}>
                        {!item.isRead ? <span className="sr-only">Unread: </span> : null}
                        {item.message}
                      </span>
                    </span>
                    <span className="pl-[16px] text-[14px] text-muted-strong">
                      {formatNotificationTime(item.createdAt)}
                    </span>
                  </>
                );
                const rowClass =
                  "flex w-full flex-col gap-[2px] border-b border-rule px-[14px] py-[10px] text-left last:border-b-0 hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40";
                return (
                  <li key={item.id}>
                    {item.orderId ? (
                      <Link
                        href={`/orders/${item.orderId}`}
                        className={rowClass}
                        onClick={() => {
                          if (!item.isRead) void markRead([item.id]);
                          setOpen(false);
                        }}
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={rowClass}
                        onClick={() => {
                          if (!item.isRead) void markRead([item.id]);
                        }}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
