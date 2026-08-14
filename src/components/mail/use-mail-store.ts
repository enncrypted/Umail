import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMockEmailsForUser,
  getMockNotificationsForUser,
  type AppNotification,
  type Email,
  type FolderId,
} from "@/lib/mock-data";

export type FilterId = "all" | "unread" | "priority" | "attachments" | "starred";
export type SortBy = "date-desc" | "date-asc" | "subject" | "sender" | "unread";

function getStorageKey(prefix: string, userEmail?: string | null): string {
  const cleanKey = (userEmail ?? "default")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
  return `${prefix}.${cleanKey}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Single source of truth for mail UI state with per-user isolation and persistence.
 */
export function useMailStore(userEmail?: string | null) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<FolderId>("inbox");
  const [filter, setFilter] = useState<FilterId>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load emails & notifications specifically for the active user session
  useEffect(() => {
    setLoading(true);
    setFolder("inbox");
    setFilter("all");
    setSortBy("date-desc");
    setQuery("");

    const mailKey = getStorageKey("umail.mails", userEmail);
    const notifKey = getStorageKey("umail.notifs", userEmail);

    const initialEmails = loadFromStorage<Email[]>(mailKey, getMockEmailsForUser(userEmail));
    const initialNotifs = loadFromStorage<AppNotification[]>(
      notifKey,
      getMockNotificationsForUser(userEmail),
    );

    const timer = setTimeout(() => {
      setEmails(initialEmails);
      setNotifications(initialNotifs);
      setSelectedId(
        initialEmails.find((e) => e.folder === "inbox")?.id ?? initialEmails[0]?.id ?? null,
      );
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [userEmail]);

  // Persist changes per user
  const updateEmails = useCallback(
    (updater: (prev: Email[]) => Email[]) => {
      setEmails((prev) => {
        const next = updater(prev);
        const mailKey = getStorageKey("umail.mails", userEmail);
        saveToStorage(mailKey, next);
        return next;
      });
    },
    [userEmail],
  );

  const updateNotifications = useCallback(
    (updater: (prev: AppNotification[]) => AppNotification[]) => {
      setNotifications((prev) => {
        const next = updater(prev);
        const notifKey = getStorageKey("umail.notifs", userEmail);
        saveToStorage(notifKey, next);
        return next;
      });
    },
    [userEmail],
  );

  const counts = useMemo(() => {
    const map: Partial<Record<FolderId, number>> = {};
    for (const e of emails) {
      if (e.unread) map[e.folder] = (map[e.folder] ?? 0) + 1;
    }
    return map;
  }, [emails]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return emails
      .filter((e) => e.folder === folder)
      .filter((e) => {
        if (filter === "unread") return e.unread;
        if (filter === "priority") return e.priority;
        if (filter === "attachments") return e.hasAttachment;
        if (filter === "starred") return e.starred;
        return true;
      })
      .filter((e) =>
        q
          ? [e.subject, e.sender, e.preview, ...e.labels, ...e.messages.map((m) => m.body)]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => {
        if (sortBy === "date-asc") return a.id.localeCompare(b.id);
        if (sortBy === "subject") return a.subject.localeCompare(b.subject);
        if (sortBy === "sender") return a.sender.localeCompare(b.sender);
        if (sortBy === "unread") return Number(b.unread) - Number(a.unread);
        // Default "date-desc": Priority first, then ID order
        return Number(b.priority) - Number(a.priority);
      });
  }, [emails, folder, filter, query, sortBy]);

  const selected = useMemo(
    () => visible.find((e) => e.id === selectedId) ?? visible[0] ?? null,
    [visible, selectedId],
  );

  const patch = useCallback(
    (id: string, changes: Partial<Email>) => {
      updateEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));
    },
    [updateEmails],
  );

  const open = useCallback(
    (id: string) => {
      setSelectedId(id);
      patch(id, { unread: false });
    },
    [patch],
  );

  const toggleStar = useCallback(
    (id: string) =>
      updateEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))),
    [updateEmails],
  );

  const toggleUnread = useCallback(
    (id: string) =>
      updateEmails((prev) => prev.map((e) => (e.id === id ? { ...e, unread: !e.unread } : e))),
    [updateEmails],
  );

  const moveTo = useCallback(
    (id: string, target: FolderId) => {
      updateEmails((prev) => prev.map((e) => (e.id === id ? { ...e, folder: target } : e)));
    },
    [updateEmails],
  );

  const removeEmail = useCallback(
    (id: string) => updateEmails((prev) => prev.filter((e) => e.id !== id)),
    [updateEmails],
  );

  const addEmail = useCallback(
    (email: Email) => updateEmails((prev) => [email, ...prev]),
    [updateEmails],
  );

  const pushNotification = useCallback(
    (n: AppNotification) => updateNotifications((prev) => [n, ...prev]),
    [updateNotifications],
  );
  const markAllRead = useCallback(
    () => updateNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    [updateNotifications],
  );
  const dismissNotification = useCallback(
    (id: string) => updateNotifications((prev) => prev.filter((n) => n.id !== id)),
    [updateNotifications],
  );

  const moveSelection = useCallback(
    (dir: 1 | -1) => {
      if (visible.length === 0) return;
      const i = visible.findIndex((e) => e.id === selected?.id);
      const next = visible[Math.min(Math.max(i + dir, 0), visible.length - 1)];
      if (next) open(next.id);
    },
    [visible, selected, open],
  );

  return {
    emails,
    loading,
    folder,
    setFolder,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    query,
    setQuery,
    visible,
    selected,
    counts,
    open,
    toggleStar,
    toggleUnread,
    moveTo,
    removeEmail,
    addEmail,
    moveSelection,
    notifications,
    pushNotification,
    markAllRead,
    dismissNotification,
  };
}

export type MailStore = ReturnType<typeof useMailStore>;
