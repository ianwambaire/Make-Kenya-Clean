import { Bell, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const panelRef = useRef(null);
  const buttonRef = useRef(null);

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
        const loadedNotifications = await loadNotifications();
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

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleClickOutside(event) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape, return focus to the trigger button
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const unreadCount = notifications.filter(
    (notification) => notification.status === "Unread"
  ).length;

  async function handleToggle() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      await refreshNotifications();
    }
  }

  async function handleRead(notification) {
    if (notification.status === "Unread") {
      await markNotificationRead(notification.id);
      await refreshNotifications();
    }
  }

  async function handleReadAll() {
    if (isMarkingAll) return;
    setIsMarkingAll(true);
    await markAllNotificationsRead();
    await refreshNotifications();
    setIsMarkingAll(false);
  }

  if (!user) return null;

  return (
    <div className="notification-shell">
      <button
        ref={buttonRef}
        type="button"
        className="notification-button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
        >
          <div className="panel-header compact">
            <div>
              <h2>Notifications</h2>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            <div className="notification-panel-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={handleReadAll}
                  disabled={isMarkingAll}
                >
                  {isMarkingAll ? "Marking..." : "Mark all read"}
                </button>
              )}

              <button
                type="button"
                className="notification-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {error && (
            <p className="form-message error-message">{error}</p>
          )}

          {notifications.length === 0 ? (
            <div className="notification-empty">
              <Bell size={22} />
              <p>Nothing here yet. New report activity will show up in this list.</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <Link
                  to={reportPathFromNotification(notification)}
                  className={`notification-item ${notification.status.toLowerCase()}`}
                  key={notification.id}
                  onClick={() => {
                    handleRead(notification);
                    setIsOpen(false);
                  }}
                >
                  {notification.status === "Unread" && (
                    <span
                      className="notification-dot"
                      aria-hidden="true"
                    />
                  )}
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