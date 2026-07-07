import { supabase } from "../lib/supabase";

const notificationColumns = [
  "id",
  "recipient_user_id",
  "recipient_email",
  "type",
  "title",
  "message",
  "related_report_id",
  "related_assignment_id",
  "status",
  "delivery_status",
  "email_action_url",
  "created_at",
  "read_at",
].join(", ");

export async function loadNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select(notificationColumns)
    .order("created_at", {
      ascending: false,
    })
    .limit(30);

  if (error) throw error;

  return data || [];
}

export async function markNotificationRead(notificationId) {
  const { data, error } = await supabase.rpc(
    "mark_notification_read",
    {
      p_notification_id: notificationId,
    }
  );

  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead() {
  const { data, error } = await supabase.rpc(
    "mark_all_notifications_read"
  );

  if (error) throw error;
  return data;
}
