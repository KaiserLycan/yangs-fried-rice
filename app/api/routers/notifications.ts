import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Resolves the authenticated customer, or returns an error response.
 */
async function requireCustomer(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: customer } = await supabase
    .from("customer")
    .select("customer_id")
    .eq("customer_id", user.id)
    .single();

  return customer ?? null;
}

// ---------------------------------------------------------------------------
// GET /api/customer/notifications
// ---------------------------------------------------------------------------

/**
 * Lists notifications for the signed-in customer, newest first.
 * Optional query: ?unread=true to filter only unread notifications.
 */
export async function getNotifications(request: Request) {
  const supabase = createClient();
  const customer = await requireCustomer(supabase);
  if (!customer) {
    return NextResponse.json(
      { error: "You must be signed in as a customer." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  let query = supabase
    .from("notification")
    .select("notification_id, message, is_read, created_at")
    .eq("customer_id", customer.customer_id)
    .order("created_at", { ascending: false });

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: data.length,
    data,
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/customer/notifications/[id]
// ---------------------------------------------------------------------------

/**
 * Marks a notification as read.
 */
export async function markNotificationRead(
  _request: Request,
  { params }: RouteParams
) {
  const supabase = createClient();
  const customer = await requireCustomer(supabase);
  if (!customer) {
    return NextResponse.json(
      { error: "You must be signed in as a customer." },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("notification")
    .update({ is_read: true })
    .eq("notification_id", params.id)
    .eq("customer_id", customer.customer_id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Notification not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Notification marked as read.",
    data,
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/customer/notifications/[id]
// ---------------------------------------------------------------------------

/**
 * Deletes a notification.
 */
export async function deleteNotification(
  _request: Request,
  { params }: RouteParams
) {
  const supabase = createClient();
  const customer = await requireCustomer(supabase);
  if (!customer) {
    return NextResponse.json(
      { error: "You must be signed in as a customer." },
      { status: 401 }
    );
  }

  const { error } = await supabase
    .from("notification")
    .delete()
    .eq("notification_id", params.id)
    .eq("customer_id", customer.customer_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Notification deleted successfully.",
  });
}
