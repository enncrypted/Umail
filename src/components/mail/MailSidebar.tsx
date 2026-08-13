import {
  Archive,
  CalendarDays,
  ChevronLeft,
  Clock,
  FileEdit,
  Inbox,
  Send,
  ShieldAlert,
} from "lucide-react";
import type { FolderId } from "@/lib/mock-data";
import { ThemeSlider } from "@/components/theme-slider";
import { cn } from "@/lib/utils";

const ITEMS: { id: FolderId; label: string; Icon: typeof Inbox }[] = [
  { id: "inbox", label: "Inbox", Icon: Inbox },
  { id: "sent", label: "Sent", Icon: Send },
  { id: "drafts", label: "Drafts", Icon: FileEdit },
  { id: "scheduled", label: "Scheduled", Icon: Clock },
  { id: "archive", label: "Archive", Icon: Archive },
  { id: "spam", label: "Spam", Icon: ShieldAlert },
];

export function MailSidebar({
  folder,
  counts,
  collapsed,
  onCollapse,
  onSelect,
  onOpenCalendar,
}: {
  folder: FolderId;
  counts: Partial<Record<FolderId, number>>;
  collapsed: boolean;
  onCollapse: () => void;
  onSelect: (id: FolderId) => void;
  onOpenCalendar?: () => void;
}) {
  return (
    <nav
      aria-label="Mail folders"
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-rail transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex",
        collapsed ? "w-[4.25rem]" : "w-56",
      )}
    >
      <div className="flex items-center justify-between px-3 py-3">
        {!collapsed && (
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Folders
          </p>
        )}
        <button
          type="button"
          onClick={onCollapse}
          aria-label={collapsed ? "Expand folder list" : "Collapse folder list"}
          className="focus-ring rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft
            className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")}
          />
        </button>
      </div>

      <ul className="flex-1 space-y-0.5 px-2">
        {ITEMS.map(({ id, label, Icon }) => {
          const active = folder === id;
          const count = counts[id] ?? 0;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "focus-ring group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all duration-200",
                  active
                    ? "bg-selected font-semibold text-selected-foreground"
                    : "text-rail-foreground hover:bg-accent/70",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-primary transition-all duration-300",
                    active ? "opacity-100" : "scale-y-0 opacity-0",
                  )}
                />
                <Icon className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
                {!collapsed && count > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {count}
                  </span>
                )}
              </button>
            </li>
          );
        })}

        <li className="pt-2 border-t border-border/50 mt-2">
          <button
            type="button"
            onClick={onOpenCalendar}
            title={collapsed ? "Synced Calendar & Events" : undefined}
            className="focus-ring group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-rail-foreground transition-all duration-200 hover:bg-accent/70 hover:text-foreground"
          >
            <CalendarDays className="size-4 shrink-0 text-primary transition-transform duration-200 group-hover:scale-110" />
            {!collapsed && <span className="flex-1 truncate text-left font-medium">Calendar</span>}
          </button>
        </li>
      </ul>

      <div className="p-2">
        <ThemeSlider compact={collapsed} className={collapsed ? "grid-cols-3 gap-0.5" : ""} />
      </div>
    </nav>
  );
}
