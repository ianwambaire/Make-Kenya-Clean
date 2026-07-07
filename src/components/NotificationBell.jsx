import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications";
import { formatDate } from "../services/reports";

function reportPathFromNotification(notification) {
  const actionUrl = notification.email_action_url || "";

  if (actionUrl.startsWith("/reports/")) {
    return actionUrl;
  }

  return notification.related_report_id
    ? "/dashboard"
    : "/dashboard";
}

export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      setError("");
      setNotifications(await loadNotifications());
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentNotifications() {
      if (!user) {
        if (isMounted) {
          setNotifications([]);
        }
        return;
      }

      try {
        const loadedNotifications =
          await loadNotifications();
        if (isMounted) {
          setError("");
          setNotifications(loadedNotifications);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      }
    }

    loadCurrentNotifications();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const unreadCount = notifications.filter(
    (notification) => notification.status === "Unread"
  ).length;

  async function handleRead(notification) {
    if (notification.status === "Unread") {
      await markNotificationRead(notification.id);
      await refreshNotifications();
    }
  }

  async function handleReadAll() {
    await markAllNotificationsRead();
    await refreshNotifications();
  }

  if (!user) return null;

  return (
    <div className="notification-shell">
      <button
        type="button"
        className="notification-button"
        onClick={() => {
          setIsOpen((current) => !current);
          refreshNotifications();
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="panel-header compact">
            <div>
              <h2>Notifications</h2>
              <p>{unreadCount} unread</p>
            </div>

            {unreadCount > 0 && (
              <button type="button" onClick={handleReadAll}>
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <p className="form-message error-message">
              {error}
            </p>
          )}

          {notifications.length === 0 ? (
            <p>No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <Link
                  to={reportPathFromNotification(notification)}
                  className={`notification-item ${notification.status.toLowerCase()}`}
                  key={notification.id}
                  onClick={() => handleRead(notification)}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>
                    {notification.type} ·{" "}
                    {formatDate(notification.created_at)}
                  </small>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
