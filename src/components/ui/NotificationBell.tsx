"use client";

// ============================================================
// src/components/ui/NotificationBell.tsx
// In-app notification bell for the top navbar.
//
// Features:
//   • Numeric unread badge (1–99, 99+ overflow)
//   • Auto-toast for new notifications arriving during session
//   • Rich dropdown: icon, title, message, ref#, time, read state
//   • Mark one / mark all as read
//   • 30s full poll + 15s delta poll (for toasts)
//   • Sidebar pendingMRCount emitted via context for sidebar badge
//   • Fully styled with FireGuard dark-navy palette
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Bell, CheckCheck, ClipboardList, ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Pending MR Context (consumed by Sidebar) ─────────────────────────────────

interface PendingMRContextValue {
  pendingMRCount: number;
}

export const PendingMRContext = createContext<PendingMRContextValue>({
  pendingMRCount: 0,
});

export function usePendingMRCount() {
  return useContext(PendingMRContext).pendingMRCount;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  materialRequestId: number | null;
  createdAt: string;
}

interface ToastItem {
  id: string; // unique per toast instance
  notification: AppNotification;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function notificationEmoji(type: string): string {
  if (type === "MATERIAL_REQUEST_CREATED" || type === "MATERIAL_REQUEST_SUBMITTED") return "📋";
  if (type === "MATERIAL_REQUEST_APPROVED") return "✅";
  if (type === "MATERIAL_REQUEST_REJECTED") return "❌";
  if (type.startsWith("EXPIRY") || type === "STOCK_EXPIRED") return "⏰";
  return "🔔";
}

function notificationAccent(type: string): string {
  if (type === "MATERIAL_REQUEST_APPROVED") return "#22c55e";
  if (type === "MATERIAL_REQUEST_REJECTED") return "#e02424";
  if (type === "MATERIAL_REQUEST_CREATED" || type === "MATERIAL_REQUEST_SUBMITTED") return "#3b82f6";
  if (type.startsWith("EXPIRY") || type === "STOCK_EXPIRED") return "#f59e0b";
  return "#5a657a";
}

function formatBadgeCount(n: number): string {
  if (n <= 0) return "";
  if (n > 99) return "99+";
  return String(n);
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function NotificationToast({
  toast,
  onClose,
  onNavigate,
}: {
  toast: ToastItem;
  onClose: (id: string) => void;
  onNavigate: (n: AppNotification) => void;
}) {
  const n = toast.notification;
  const accent = notificationAccent(n.type);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), 6000);
    return () => clearTimeout(t);
  }, [toast.id, onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      onClick={() => onNavigate(n)}
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        background: "#0F1524",
        border: `1px solid ${accent}40`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: "10px",
        padding: "14px 14px 14px 16px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(30,42,61,0.7)`,
        cursor: "pointer",
        width: "340px",
        animation: "toastSlideIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent progress bar — 6s drain animation */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "2px",
          background: accent,
          width: "100%",
          animation: "toastDrain 6s linear forwards",
          opacity: 0.5,
        }}
      />

      {/* Icon bubble */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "9px",
          background: `${accent}18`,
          border: `1px solid ${accent}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "17px",
          flexShrink: 0,
        }}
      >
        {notificationEmoji(n.type)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 3px",
            fontSize: "12.5px",
            fontWeight: 700,
            color: "#dce3ef",
            lineHeight: 1.3,
          }}
        >
          {n.title}
        </p>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: "11.5px",
            color: "#8a99b3",
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {n.message}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {n.materialRequestId && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: accent,
                letterSpacing: "0.08em",
                fontFamily: "monospace",
              }}
            >
              VIEW REQUEST
            </span>
          )}
          <span
            style={{ fontSize: "10.5px", color: "#3d4c62", marginLeft: "auto" }}
          >
            {timeAgo(n.createdAt)}
          </span>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(toast.id);
        }}
        aria-label="Dismiss notification"
        style={{
          background: "transparent",
          border: "none",
          color: "#3d4c62",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          flexShrink: 0,
          borderRadius: "4px",
          transition: "color 150ms",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = "#dce3ef")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = "#3d4c62")
        }
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onClose,
  onNavigate,
}: {
  toasts: ToastItem[];
  onClose: (id: string) => void;
  onNavigate: (n: AppNotification) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <NotificationToast
            toast={t}
            onClose={onClose}
            onNavigate={onNavigate}
          />
        </div>
      ))}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(24px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes toastDrain {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </div>
  );
}

// ─── Main NotificationBell Component ─────────────────────────────────────────

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingMRCount, setPendingMRCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Track the highest notification ID we've seen to detect new arrivals
  const highestSeenIdRef = useRef<number>(0);
  // Prevent showing toasts on the very first load
  const initialLoadDoneRef = useRef(false);

  // ── Fetch (full) ────────────────────────────────────────────────────────────

  const fetchFull = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const incoming: AppNotification[] = data.notifications ?? [];

      setNotifications(incoming);
      setUnreadCount(data.unreadCount ?? 0);
      setPendingMRCount(data.pendingMRCount ?? 0);

      // Initialise the high-watermark on first load (no toasts yet)
      if (!initialLoadDoneRef.current) {
        if (incoming.length > 0) {
          highestSeenIdRef.current = Math.max(...incoming.map((n) => n.id));
        }
        initialLoadDoneRef.current = true;
      }
    } catch {
      // Silent
    }
  }, []);

  // ── Delta poll (for toasts) ─────────────────────────────────────────────────

  const fetchDelta = useCallback(async () => {
    if (!initialLoadDoneRef.current) return;
    try {
      const url = `/api/notifications?since=${highestSeenIdRef.current}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const incoming: AppNotification[] = data.notifications ?? [];
      if (incoming.length === 0) return;

      // New notifications are those with id > highestSeenId
      const newOnes = incoming.filter(
        (n) => n.id > highestSeenIdRef.current && !n.isRead,
      );

      if (newOnes.length > 0) {
        // Update high-watermark
        highestSeenIdRef.current = Math.max(
          highestSeenIdRef.current,
          ...newOnes.map((n) => n.id),
        );

        // Show toasts for each new notification (max 3 at once)
        const toShow = newOnes.slice(0, 3);
        setToasts((prev) => [
          ...prev,
          ...toShow.map((n) => ({
            id: `toast-${n.id}-${Date.now()}`,
            notification: n,
          })),
        ]);

        // Also prepend to main list + bump unread count
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const truly = toShow.filter((n) => !existingIds.has(n.id));
          return [...truly, ...prev].slice(0, 25);
        });
        setUnreadCount((c) => c + toShow.length);
      }

      // Also update pendingMRCount
      if (data.pendingMRCount !== undefined) {
        setPendingMRCount(data.pendingMRCount);
      }
    } catch {
      // Silent
    }
  }, []);

  // Initial fetch + 30s full poll + 15s delta poll
  useEffect(() => {
    fetchFull();
    const fullInterval = setInterval(fetchFull, 30_000);
    const deltaInterval = setInterval(fetchDelta, 15_000);
    return () => {
      clearInterval(fullInterval);
      clearInterval(deltaInterval);
    };
  }, [fetchFull, fetchDelta]);

  // ── Close dropdown on outside click ────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    function onOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [isOpen]);

  // ── Mark one as read ────────────────────────────────────────────────────────

  async function handleNotificationClick(n: AppNotification) {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id: n.id }),
      }).catch(() => {});
    }
    setIsOpen(false);
    if (n.materialRequestId) {
      router.push("/material-requests");
    }
  }

  // ── Toast navigate ──────────────────────────────────────────────────────────

  function handleToastNavigate(n: AppNotification) {
    // Optimistically mark as read
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", id: n.id }),
    }).catch(() => {});

    if (n.materialRequestId) {
      router.push("/material-requests");
    }
  }

  // ── Mark all as read ────────────────────────────────────────────────────────

  async function handleMarkAllRead() {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent
    } finally {
      setMarkingAll(false);
    }
  }

  // ── Dismiss toast ───────────────────────────────────────────────────────────

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Badge label ─────────────────────────────────────────────────────────────

  const badgeLabel = formatBadgeCount(unreadCount);
  const hasBadge = unreadCount > 0;

  // ── Expose pendingMRCount via context ───────────────────────────────────────

  return (
    <PendingMRContext.Provider value={{ pendingMRCount }}>
      {/* Toast stack */}
      <ToastContainer
        toasts={toasts}
        onClose={dismissToast}
        onNavigate={handleToastNavigate}
      />

      {/* Bell button */}
      <div style={{ position: "relative" }}>
        <button
          ref={buttonRef}
          id="notification-bell-btn"
          className="app-topnav-icon-btn"
          aria-label={
            hasBadge
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "Notifications"
          }
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={() => {
            setIsOpen((v) => !v);
            if (!isOpen) fetchFull();
          }}
          style={{
            position: "relative",
            // Widen the button when badge is visible to fit the count
            minWidth: hasBadge && unreadCount > 9 ? "46px" : "34px",
            paddingRight: hasBadge ? "6px" : undefined,
            gap: hasBadge ? "4px" : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: hasBadge ? "flex-start" : "center",
          }}
        >
          <Bell size={17} style={{ flexShrink: 0 }} />

          {/* Numeric unread badge */}
          {hasBadge && (
            <span
              aria-hidden="true"
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "#fff",
                background: "#e02424",
                borderRadius: "20px",
                padding: "0 5px",
                minWidth: "17px",
                height: "17px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                letterSpacing: "-0.01em",
                boxShadow: "0 0 8px rgba(224,36,36,0.5)",
                flexShrink: 0,
              }}
            >
              {badgeLabel}
            </span>
          )}
        </button>

        {/* ── Dropdown panel ───────────────────────────────────────────── */}
        {isOpen && (
          <div
            ref={panelRef}
            id="notification-panel"
            role="dialog"
            aria-label="Notifications panel"
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              width: "380px",
              maxHeight: "520px",
              background: "#0F1524",
              border: "1px solid #1e2a3d",
              borderRadius: "14px",
              boxShadow:
                "0 12px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(30,42,61,0.9)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "notifFadeIn 160ms cubic-bezier(0.34,1.2,0.64,1)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px 12px",
                borderBottom: "1px solid #1e2a3d",
                flexShrink: 0,
                background:
                  "linear-gradient(180deg, #161d2e 0%, #0F1524 100%)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Bell size={14} color="#dce3ef" />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#dce3ef",
                    letterSpacing: "0.01em",
                  }}
                >
                  Notifications
                </span>
                {hasBadge && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#fff",
                      background: "#e02424",
                      borderRadius: "20px",
                      padding: "1px 7px",
                      minWidth: "20px",
                      textAlign: "center",
                      boxShadow: "0 0 6px rgba(224,36,36,0.4)",
                    }}
                  >
                    {badgeLabel} unread
                  </span>
                )}
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {hasBadge && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                    title="Mark all as read"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#5a657a",
                      background: "transparent",
                      border: "1px solid #1e2a3d",
                      borderRadius: "6px",
                      padding: "3px 9px",
                      cursor: "pointer",
                      transition: "color 150ms, border-color 150ms",
                      opacity: markingAll ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#dce3ef";
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.borderColor = "#2a3650";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#5a657a";
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.borderColor = "#1e2a3d";
                    }}
                  >
                    <CheckCheck size={11} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close notifications"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: "transparent",
                    border: "none",
                    color: "#5a657a",
                    cursor: "pointer",
                    transition: "color 150ms, background 150ms",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#dce3ef";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#161d2e";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#5a657a";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "44px 20px",
                    gap: "12px",
                  }}
                >
                  <ClipboardList
                    size={34}
                    strokeWidth={1.2}
                    color="#3d4c62"
                  />
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      margin: 0,
                      color: "#5a657a",
                    }}
                  >
                    No notifications yet
                  </p>
                  <p
                    style={{
                      fontSize: "11.5px",
                      margin: 0,
                      color: "#3d4c62",
                      textAlign: "center",
                      lineHeight: 1.5,
                    }}
                  >
                    You'll be notified here when material
                    <br />
                    requests are submitted or updated.
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const accent = notificationAccent(n.type);
                  return (
                    <button
                      key={n.id}
                      id={`notification-item-${n.id}`}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: n.isRead
                          ? "transparent"
                          : `${accent}09`,
                        border: "none",
                        borderBottom: "1px solid #1a2235",
                        padding: "13px 16px",
                        cursor: "pointer",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          n.isRead ? "#161d2e" : `${accent}14`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          n.isRead ? "transparent" : `${accent}09`;
                      }}
                    >
                      {/* Left accent bar for unread */}
                      {!n.isRead && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "60%",
                            borderRadius: "0 3px 3px 0",
                            background: accent,
                          }}
                        />
                      )}

                      {/* Icon bubble */}
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "9px",
                          background: `${accent}15`,
                          border: `1px solid ${accent}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          flexShrink: 0,
                        }}
                      >
                        {notificationEmoji(n.type)}
                      </div>

                      {/* Content */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "8px",
                            marginBottom: "3px",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "12.5px",
                              fontWeight: n.isRead ? 500 : 700,
                              color: n.isRead ? "#7a8aa0" : "#dce3ef",
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                background: accent,
                                flexShrink: 0,
                                marginTop: "3px",
                                boxShadow: `0 0 5px ${accent}90`,
                              }}
                            />
                          )}
                        </div>

                        {/* Message — 2-line clamp */}
                        <p
                          style={{
                            margin: "0 0 6px",
                            fontSize: "11.5px",
                            color: n.isRead ? "#5a657a" : "#8a99b3",
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                          }}
                        >
                          {n.message}
                        </p>

                        {/* Footer: ref + time */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          {n.materialRequestId && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontSize: "10px",
                                fontWeight: 700,
                                color: accent,
                                letterSpacing: "0.06em",
                              }}
                            >
                              <ExternalLink size={9} />
                              MATERIAL REQUEST
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: "10.5px",
                              color: "#3d4c62",
                              fontWeight: 500,
                              marginLeft: "auto",
                            }}
                          >
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid #1e2a3d",
                  padding: "10px 16px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background:
                    "linear-gradient(0deg, #161d2e 0%, #0F1524 100%)",
                }}
              >
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/material-requests");
                  }}
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 600,
                    color: "#3b82f6",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "color 150ms",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "#60a5fa")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "#3b82f6")
                  }
                >
                  <ExternalLink size={11} />
                  View all requests
                </button>
                <p
                  style={{
                    margin: 0,
                    fontSize: "10.5px",
                    color: "#3d4c62",
                  }}
                >
                  Refreshes every 30s
                </p>
              </div>
            )}
          </div>
        )}

        {/* Animations */}
        <style>{`
          @keyframes notifFadeIn {
            from { opacity: 0; transform: translateY(-8px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
        `}</style>
      </div>
    </PendingMRContext.Provider>
  );
}
