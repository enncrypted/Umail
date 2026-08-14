import { Inbox, ListFilter, Paperclip, Settings2, Star } from "lucide-react";
import { initials, type Email, type FolderId } from "@/lib/mock-data";
import type { FilterId, SortBy } from "./use-mail-store";
import { cn } from "@/lib/utils";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "priority", label: "Priority" },
  { id: "starred", label: "Starred" },
  { id: "attachments", label: "Files" },
];

const TITLES: Record<FolderId, string> = {
  inbox: "Inbox",
  sent: "Sent Box",
  drafts: "Drafts",
  scheduled: "Scheduled",
  archive: "Archive",
  spam: "Spam",
};

export function EmailList({
  folder,
  emails,
  loading,
  selectedId,
  filter,
  onFilter,
  sortBy,
  onSort,
  onOpen,
  onStar,
}: {
  folder: FolderId;
  emails: Email[];
  loading: boolean;
  selectedId: string | null;
  filter: FilterId;
  onFilter: (f: FilterId) => void;
  sortBy: SortBy;
  onSort: (s: SortBy) => void;
  onOpen: (id: string) => void;
  onStar: (id: string) => void;
}) {
  const isSpam = folder === "spam";
  const priority = isSpam ? [] : emails.filter((e) => e.priority);
  const rest = isSpam ? emails : emails.filter((e) => !e.priority);

  return (
    <section
      aria-label={`${TITLES[folder]} messages`}
      className={cn(
        "flex w-full min-w-0 flex-col border-r border-border bg-panel md:w-[22rem] lg:w-[24rem]",
        isSpam && "border-destructive/40 ring-1 ring-inset ring-destructive/30",
      )}
    >
      <header
        className={cn(
          "flex items-center gap-2 border-b border-border px-4 py-3",
          isSpam && "bg-destructive/10",
        )}
      >
        <h2 className="flex-1 truncate text-sm font-semibold">{TITLES[folder]}</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground">
            <ListFilter className="size-4" />
            <select
              value={sortBy}
              onChange={(e) => onSort(e.target.value as SortBy)}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer appearance-none"
              aria-label="Sort messages"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="subject">Subject (A-Z)</option>
              <option value="sender">Sender (A-Z)</option>
              <option value="unread">Unread First</option>
            </select>
          </label>
        </div>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              "focus-ring shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200",
              filter === f.id
                ? "bg-primary text-primary-foreground shadow-panel"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <ul className="space-y-1 p-3" aria-busy="true">
            {Array.from({ length: 7 }).map((_, i) => (
              <li key={i} className="flex gap-3 rounded-lg p-2">
                <span className="size-9 shrink-0 rounded-full shimmer-bar" />
                <span className="flex-1 space-y-2 py-1">
                  <span className="block h-2.5 w-1/2 rounded shimmer-bar" />
                  <span className="block h-2.5 w-4/5 rounded shimmer-bar" />
                </span>
              </li>
            ))}
          </ul>
        ) : emails.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center animate-fade-in">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Inbox className="size-5" />
            </span>
            <p className="text-sm font-medium">Nothing here</p>
            <p className="text-xs text-muted-foreground">
              No messages match this folder and filter combination.
            </p>
          </div>
        ) : (
          <>
            {priority.length > 0 && <GroupLabel>Priority</GroupLabel>}
            <ul>
              {priority.map((e) => (
                <Row
                  key={e.id}
                  email={e}
                  selected={e.id === selectedId}
                  onOpen={onOpen}
                  onStar={onStar}
                />
              ))}
            </ul>
            {rest.length > 0 && (
              <GroupLabel>{priority.length > 0 ? "Recent" : "All messages"}</GroupLabel>
            )}
            <ul>
              {rest.map((e) => (
                <Row
                  key={e.id}
                  email={e}
                  selected={e.id === selectedId}
                  onOpen={onOpen}
                  onStar={onStar}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="sticky top-0 z-10 bg-panel/95 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
      {children}
    </p>
  );
}

function Row({
  email,
  selected,
  onOpen,
  onStar,
}: {
  email: Email;
  selected: boolean;
  onOpen: (id: string) => void;
  onStar: (id: string) => void;
}) {
  return (
    <li className="animate-fade-in">
      <div
        role="button"
        tabIndex={0}
        aria-current={selected ? "true" : undefined}
        onClick={() => onOpen(email.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(email.id);
          }
        }}
        className={cn(
          "focus-ring group relative flex cursor-pointer gap-3 border-b border-border/70 px-4 py-3 transition-colors duration-200",
          selected ? "bg-selected" : "hover:bg-accent/50",
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-0 h-full w-[3px] bg-primary transition-transform duration-300",
            selected ? "scale-y-100" : "scale-y-0",
          )}
        />
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            email.folder === "spam"
              ? "bg-destructive/15 text-destructive"
              : "bg-primary/15 text-primary",
          )}
        >
          {initials(email.sender)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                email.unread ? "font-semibold" : "font-medium",
              )}
            >
              {email.sender}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{email.time}</span>
          </span>

          {email.priority && email.folder !== "spam" && (
            <span className="mt-0.5 inline-flex items-center rounded bg-warning/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-warning-foreground dark:text-warning">
              Priority
            </span>
          )}

          <span className={cn("mt-0.5 block truncate text-sm", email.unread && "font-semibold")}>
            {email.subject}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{email.preview}</span>

          <span className="mt-1 flex items-center gap-1.5">
            {email.labels.slice(0, 2).map((l) => (
              <span
                key={l}
                className="rounded bg-secondary px-1.5 py-px text-[10px] text-muted-foreground"
              >
                {l}
              </span>
            ))}
            {email.hasAttachment && <Paperclip className="size-3 text-muted-foreground" />}
          </span>
        </span>

        <button
          type="button"
          aria-label={email.starred ? "Remove star" : "Star message"}
          onClick={(ev) => {
            ev.stopPropagation();
            onStar(email.id);
          }}
          className="focus-ring self-start rounded p-1 text-muted-foreground transition-transform duration-200 hover:scale-125"
        >
          <Star className={cn("size-3.5", email.starred && "fill-warning text-warning")} />
        </button>

        {email.unread && (
          <span className="absolute right-3 bottom-3 size-2 rounded-full bg-primary" />
        )}
      </div>
    </li>
  );
}
