import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  category: "meeting" | "deadline" | "event";
  location?: string;
  attendees?: string[];
  description?: string;
  syncedEmailSubject?: string;
}

const EVENTS_BY_USER: Record<string, CalendarEvent[]> = {
  "sarah.j@contoso.com": [
    {
      id: "ev-s1",
      title: "Q4 Product Roadmap & Executive Board Sign-off",
      time: "5:00 PM EST",
      date: "Friday, Aug 15",
      category: "deadline",
      location: "Executive Boardroom / Microsoft Teams",
      attendees: ["Sarah J. Assenmon", "Marcus (CPO)", "Board Members"],
      description:
        "Final presentation of Q4 product strategy deck, UX retention metrics, and budget allocation.",
      syncedEmailSubject: "FW: Q4 Product Roadmap & Executive Board Deck — Final Sign-off",
    },
    {
      id: "ev-s2",
      title: "1:1 Product & Technical Architecture Sync",
      time: "11:00 AM EST",
      date: "Tomorrow, Aug 14",
      category: "meeting",
      location: "Room 4B & Teams",
      attendees: ["Sarah J. Assenmon", "Mark Chen"],
      description:
        "Review client-side search indexing performance, TanStack Start SSR hydration, and Q4 tech debt.",
      syncedEmailSubject: "Weekly Product & Tech 1:1 Agenda",
    },
    {
      id: "ev-s3",
      title: "All-Hands Nova Mail Product Keynote",
      time: "10:00 AM EST",
      date: "Thursday, Aug 16",
      category: "event",
      location: "Main Auditorium",
      attendees: ["All Engineering & Product Staff"],
      description:
        "Live demonstration of the new Nova Mail client, responsive design system, and AI assistants.",
      syncedEmailSubject: "Scheduled: All-Hands Product Keynote Announcement",
    },
    {
      id: "ev-s4",
      title: "Acme Corp Enterprise SSO Rollout Review",
      time: "2:00 PM EST",
      date: "Next Monday, Aug 20",
      category: "meeting",
      location: "Virtual Meeting Link",
      attendees: ["Alex Rivera (Acme VP)", "Sarah J. Assenmon", "Identity Team"],
      description: "Discussing Azure AD SSO integration and trial user feedback.",
      syncedEmailSubject: "Acme Enterprise Customer Feedback — Nova Mail Alpha",
    },
  ],
  "mark.c@contoso.com": [
    {
      id: "ev-m1",
      title: "PR #482 SSR Hydration Code Review Sync",
      time: "11:15 AM EST",
      date: "Today, Aug 14",
      category: "meeting",
      location: "Dev Huddle 2",
      attendees: ["Mark Chen", "Alex Taylor"],
      description:
        "Verifying TanStack Start server function validators and root route hydration safety.",
      syncedEmailSubject: "PR #482 Review: TanStack Start SSR Hydration & Route Caching",
    },
    {
      id: "ev-m2",
      title: "Redis Cache Memory Spike Technical Incident Event",
      time: "2:00 PM EST",
      date: "Today, Aug 14",
      category: "event",
      location: "Engineering War Room",
      attendees: ["Mark Chen", "Grafana On-Call", "DevOps"],
      description:
        "Reviewing 94% memory utilization spike on redis-us-east-1a and key TTL eviction policies.",
      syncedEmailSubject: "CRITICAL ALERT: Redis Cache Memory Utilization at 94%",
    },
    {
      id: "ev-m3",
      title: "v2.4.0 Deployment Release Event",
      time: "02:00 UTC",
      date: "Tonight, Aug 14",
      category: "event",
      location: "Cloud Ops Channel",
      attendees: ["Mark Chen", "Deployment Automated Pipeline"],
      description: "Staging to production deployment of Nova Mail v2.4.0.",
      syncedEmailSubject: "Scheduled: Release Notes v2.4.0 Deployment Summary",
    },
  ],
  "ops.svc@contoso.com": [
    {
      id: "ev-o1",
      title: "Wildcard SSL Certificate Renewal Deadline",
      time: "23:59 UTC",
      date: "Aug 28, 2026",
      category: "deadline",
      location: "Cloudflare ACME Manager",
      attendees: ["Ops Service Account", "Security Desk"],
      description:
        "Complete HTTP-01 DNS challenge verification for *.contoso.com before expiration.",
      syncedEmailSubject: "URGENT: Wildcard SSL Certificate Expiration Warning (14 Days)",
    },
    {
      id: "ev-o2",
      title: "Postgres Database Backup Integrity Test Event",
      time: "04:30 AM UTC",
      date: "Daily Automated",
      category: "event",
      location: "US-East S3 Vault",
      attendees: ["Automated Backup Daemon"],
      description: "Nightly 142 GB full database snapshot SHA256 checksum verification.",
      syncedEmailSubject: "Nightly Postgres Database Backup Successful (142 GB)",
    },
    {
      id: "ev-o3",
      title: "Sunday System Infrastructure Maintenance Event",
      time: "02:00 - 04:00 UTC",
      date: "Sunday, Aug 17",
      category: "event",
      location: "US-East Data Center",
      attendees: ["Ops On-Call Team"],
      description: "Routine container host patching and network router firmware upgrades.",
      syncedEmailSubject: "Scheduled: Sunday Maintenance Window Broadcast",
    },
  ],
};

const DEFAULT_EVENTS: CalendarEvent[] = EVENTS_BY_USER["sarah.j@contoso.com"]!;

const CATEGORIES: { id: "all" | CalendarEvent["category"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "meeting", label: "Meetings" },
  { id: "deadline", label: "Deadlines" },
  { id: "event", label: "Events" },
];

export function CalendarView({
  userEmail,
  onClose,
}: {
  userEmail?: string | null;
  onClose: () => void;
}) {
  const normalizedKey = (userEmail ?? "").trim().toLowerCase();
  const initialEvents =
    EVENTS_BY_USER[normalizedKey] ??
    (normalizedKey.includes("mark")
      ? EVENTS_BY_USER["mark.c@contoso.com"]
      : normalizedKey.includes("ops")
        ? EVENTS_BY_USER["ops.svc@contoso.com"]
        : DEFAULT_EVENTS);

  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [syncing, setSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(initialEvents.length);
  const [filter, setFilter] = useState<"all" | CalendarEvent["category"]>("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("10:00 AM");
  const [newDate, setNewDate] = useState("Tomorrow");
  const [newCategory, setNewCategory] = useState<CalendarEvent["category"]>("meeting");

  function handleSync() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncedCount(events.length);
    }, 600);
  }

  function handleAddEvent() {
    if (!newTitle.trim()) return;
    const item: CalendarEvent = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      time: newTime,
      date: newDate,
      category: newCategory,
      location: "Microsoft Teams",
      description: "Added from Nova Mail Synced Calendar",
    };
    setEvents([item, ...events]);
    setNewTitle("");
    setShowNewModal(false);
  }

  const visibleEvents = events.filter((ev) => filter === "all" || ev.category === filter);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Synced Calendar & Upcoming Events"
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl animate-pop flex-col rounded-xl border border-border bg-card shadow-flyout overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4 bg-panel/50">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <CalendarIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Synced Calendar</h2>
              <p className="text-xs text-muted-foreground">
                Meetings, deadlines, and events synchronized for {userEmail ?? "your account"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="focus-ring flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-60"
            >
              <RefreshCw className={cn("size-3.5", syncing && "animate-spin text-primary")} />
              {syncing ? "Syncing..." : `Synced (${syncedCount})`}
            </button>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="focus-ring flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <Plus className="size-3.5" /> Add event
            </button>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        {/* Filter bar: Meetings, Deadlines, Events */}
        <div className="flex gap-1.5 border-b border-border bg-muted/30 px-5 py-2.5">
          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "focus-ring rounded-md px-3 py-1 text-xs font-medium transition-all",
                filter === id
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Event List */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-3">
          {visibleEvents.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No items found in category "{filter}".
            </div>
          ) : (
            visibleEvents.map((ev) => (
              <div
                key={ev.id}
                className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-panel"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={ev.category} />
                    <h3 className="font-semibold text-sm text-foreground">{ev.title}</h3>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {ev.date}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Clock className="size-3.5 text-primary" /> {ev.time}
                  </span>
                  {ev.location && (
                    <span className="flex items-center gap-1.5">
                      {ev.location.includes("Teams") || ev.location.includes("Virtual") ? (
                        <Video className="size-3.5 text-info" />
                      ) : (
                        <MapPin className="size-3.5 text-muted-foreground" />
                      )}
                      {ev.location}
                    </span>
                  )}
                  {ev.attendees && ev.attendees.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-muted-foreground" />
                      {ev.attendees.join(", ")}
                    </span>
                  )}
                </div>

                {ev.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {ev.description}
                  </p>
                )}

                {ev.syncedEmailSubject && (
                  <div className="mt-1 flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-[11px] font-medium text-primary">
                    <Sparkles className="size-3 shrink-0" />
                    <span className="truncate">Synced from email: {ev.syncedEmailSubject}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* New event prompt inline modal */}
        {showNewModal && (
          <div className="border-t border-border bg-muted/40 p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add New Upcoming Event
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Event title..."
                className="col-span-1 sm:col-span-2 rounded-md border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
              <input
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="Time (e.g. 10:00 AM)"
                className="rounded-md border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CalendarEvent["category"])}
                className="rounded-md border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-primary"
              >
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEvent}
                className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Save event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: CalendarEvent["category"] }) {
  const styles: Record<CalendarEvent["category"], string> = {
    meeting: "bg-info/15 text-info border-info/30",
    deadline: "bg-warning/15 text-warning border-warning/30",
    event: "bg-primary/15 text-primary border-primary/30",
  };
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[category],
      )}
    >
      {category}
    </span>
  );
}
