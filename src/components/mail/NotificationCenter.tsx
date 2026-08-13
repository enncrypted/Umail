import { AtSign, BellRing, Info, X } from "lucide-react";
import type { AppNotification } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const ICONS = {
  reminder: BellRing,
  mention: AtSign,
  system: Info,
};

export function NotificationCenter({
  notifications,
  onClose,
  onMarkAll,
  onDismiss,
}: {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAll: () => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Notification center"
      className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-1.5rem))] animate-pop overflow-hidden rounded-xl border border-border bg-popover shadow-flyout"
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="flex-1 text-sm font-semibold">Notifications</h2>
        <button
          type="button"
          onClick={onMarkAll}
          className="focus-ring rounded text-xs font-medium text-primary hover:underline"
        >
          Mark all read
        </button>
        <button
          type="button"
          aria-label="Close notifications"
          onClick={onClose}
          className="focus-ring rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </header>

      <ul className="max-h-80 overflow-y-auto">
        {notifications.length === 0 && (
          <li className="px-4 py-10 text-center text-xs text-muted-foreground">
            You're all caught up.
          </li>
        )}
        {notifications.map((n) => {
          const Icon = ICONS[n.kind];
          return (
            <li
              key={n.id}
              className={cn(
                "group flex animate-fade-in gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-accent/50",
                !n.read && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                  n.kind === "reminder"
                    ? "bg-warning/20 text-warning"
                    : "bg-primary/15 text-primary",
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-xs", n.read ? "font-medium" : "font-semibold")}>
                  {n.title}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">{n.detail}</span>
                <span className="text-[10px] text-muted-foreground">{n.time}</span>
              </span>
              <button
                type="button"
                aria-label={`Dismiss ${n.title}`}
                onClick={() => onDismiss(n.id)}
                className="focus-ring self-start rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
