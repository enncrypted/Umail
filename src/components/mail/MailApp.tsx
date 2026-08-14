import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Keyboard,
  LogOut,
  PenSquare,
  Search,
  Undo2,
  UserRoundCog,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { initials, maskIdentifier, type Email } from "@/lib/mock-data";
import { ThemeSlider } from "@/components/theme-slider";
import { BrandMark } from "@/components/auth/AuthScreen";
import { MailSidebar } from "./MailSidebar";
import { EmailList } from "./EmailList";
import { ThreadView, Kbd } from "./ThreadView";
import { AiAssistantPanel } from "./AiAssistantPanel";
import { Composer, type ComposerSeed } from "./Composer";
import { NotificationCenter } from "./NotificationCenter";
import { CalendarView } from "./CalendarView";
import { useMailStore } from "./use-mail-store";
import { cn } from "@/lib/utils";

const SHORTCUTS: [string, string][] = [
  ["C", "Compose a new message"],
  ["J / K", "Next / previous conversation"],
  ["/", "Focus search"],
  ["U", "Toggle read state"],
  ["S", "Star conversation"],
  ["E", "Archive conversation"],
  ["A", "Toggle AI assistant"],
  ["N", "Notification center"],
  ["?", "This shortcut list"],
];

export function MailApp() {
  const { session, signOut } = useAuth();
  const mail = useMailStore(session?.email);
  const [collapsed, setCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [composer, setComposer] = useState<ComposerSeed | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [autoReply, setAutoReply] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ id: string; label: string } | null>(null);
  const [mobileThread, setMobileThread] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadNotifs = mail.notifications.filter((n) => !n.read).length;

  const send = useCallback(
    (payload: {
      to: string;
      cc?: string;
      bcc?: string;
      subject: string;
      body: string;
      schedule: string;
    }) => {
      const scheduled = payload.schedule !== "now";
      const toRecipients = [
        payload.to,
        payload.cc ? `Cc: ${payload.cc}` : "",
        payload.bcc ? `Bcc: ${payload.bcc}` : "",
      ]
        .filter(Boolean)
        .join(", ");
      const email: Email = {
        id: `out-${Date.now()}`,
        folder: scheduled ? "scheduled" : "sent",
        subject: payload.subject || "(no subject)",
        sender: "You",
        senderEmail: session?.email ?? "you@contoso.com",
        preview: payload.body.slice(0, 120) || "(no content)",
        time: scheduled ? payload.schedule : "Just now",
        unread: false,
        starred: false,
        priority: false,
        labels: [scheduled ? "Scheduled" : "Sent"],
        hasAttachment: false,
        messages: [
          {
            id: `out-${Date.now()}-m`,
            from: "You",
            fromEmail: session?.email ?? "you@contoso.com",
            to: toRecipients,
            time: "Just now",
            body: payload.body,
          },
        ],
      };
      // Optimistic: the message appears immediately and can be undone.
      mail.addEmail(email);
      setComposer(null);
      setUndo({ id: email.id, label: scheduled ? "Message scheduled" : "Message sent" });
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndo(null), 8000);
    },
    [mail, session],
  );

  const undoSend = useCallback(() => {
    if (!undo) return;
    mail.removeEmail(undo.id);
    setUndo(null);
  }, [undo, mail]);

  const replyInline = useCallback(
    (body: string) => {
      if (!mail.selected) return;
      send({
        to: mail.selected.senderEmail,
        subject: `RE: ${mail.selected.subject}`,
        body,
        schedule: "now",
      });
    },
    [mail.selected, send],
  );

  // Keyboard shortcuts — ignored while typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (typing) {
        if (e.key === "Escape") el?.blur();
        return;
      }
      const id = mail.selected?.id;
      switch (e.key) {
        case "c":
          e.preventDefault();
          setComposer({});
          break;
        case "j":
          mail.moveSelection(1);
          break;
        case "k":
          mail.moveSelection(-1);
          break;
        case "/":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case "u":
          if (id) mail.toggleUnread(id);
          break;
        case "s":
          if (id) mail.toggleStar(id);
          break;
        case "e":
          if (id) mail.moveTo(id, "archive");
          break;
        case "a":
          setAiOpen((v) => !v);
          break;
        case "n":
          setNotifOpen((v) => !v);
          break;
        case "?":
          setShortcutsOpen(true);
          break;
        case "Escape":
          setNotifOpen(false);
          setAccountOpen(false);
          setShortcutsOpen(false);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mail]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-panel px-3 py-2">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="hidden text-sm font-semibold sm:block">Umail</span>
        </div>

        <div className="relative mx-2 flex min-w-0 flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            ref={searchRef}
            value={mail.query}
            onChange={(e) => mail.setQuery(e.target.value)}
            placeholder="Search mail — press /"
            aria-label="Search mail"
            className="w-full rounded-md border border-input bg-card py-2 pl-9 pr-8 text-sm outline-none transition-shadow duration-200 focus:border-primary focus:shadow-focus"
          />
          {mail.query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => mail.setQuery("")}
              className="focus-ring absolute right-2 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setComposer({})}
          className="focus-ring hidden items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-95 sm:flex"
        >
          <PenSquare className="size-4" /> New
        </button>

        <button
          type="button"
          aria-label="Keyboard shortcuts"
          onClick={() => setShortcutsOpen(true)}
          className="focus-ring hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:block"
        >
          <Keyboard className="size-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications (${unreadNotifs} unread)`}
            onClick={() => {
              setNotifOpen((v) => !v);
              setAccountOpen(false);
            }}
            className="focus-ring relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Bell className={cn("size-4", unreadNotifs > 0 && "animate-sparkle text-primary")} />
            {unreadNotifs > 0 && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {unreadNotifs}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationCenter
              notifications={mail.notifications}
              onClose={() => setNotifOpen(false)}
              onMarkAll={mail.markAllRead}
              onDismiss={mail.dismissNotification}
            />
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setAccountOpen((v) => !v);
              setNotifOpen(false);
            }}
            aria-label="Account menu"
            aria-expanded={accountOpen}
            className="focus-ring flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary transition-transform duration-200 hover:scale-105"
          >
            {initials(session?.name ?? "You")}
          </button>
          {accountOpen && (
            <div className="absolute right-0 top-full z-40 mt-2 w-64 animate-pop rounded-xl border border-border bg-popover p-3 shadow-flyout">
              <p className="truncate text-sm font-semibold">{session?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {maskIdentifier(session?.email ?? "")}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{session?.org}</p>
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  onClick={signOut}
                  className="focus-ring flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <UserRoundCog className="size-4" /> Switch account
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="focus-ring flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <ThemeSlider />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Panels */}
      <div className="flex min-h-0 flex-1">
        <MailSidebar
          folder={mail.folder}
          counts={mail.counts}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((v) => !v)}
          onOpenCalendar={() => setCalendarOpen(true)}
          onSelect={(f) => {
            mail.setFolder(f);
            setMobileThread(false);
          }}
        />

        <div className={cn("min-w-0 flex-1 md:flex", mobileThread ? "hidden md:flex" : "flex")}>
          <EmailList
            folder={mail.folder}
            emails={mail.visible}
            loading={mail.loading}
            selectedId={mail.selected?.id ?? null}
            filter={mail.filter}
            onFilter={mail.setFilter}
            sortBy={mail.sortBy}
            onSort={mail.setSortBy}
            onOpen={(id) => {
              mail.open(id);
              setAutoReply(null);
              setMobileThread(true);
            }}
            onStar={mail.toggleStar}
          />

          <div className="hidden min-w-0 flex-1 md:flex">
            <ThreadView
              email={mail.selected}
              loading={mail.loading}
              onArchive={() => mail.selected && mail.moveTo(mail.selected.id, "archive")}
              onSpam={() => mail.selected && mail.moveTo(mail.selected.id, "spam")}
              onDelete={() => mail.selected && mail.removeEmail(mail.selected.id)}
              onToggleUnread={() => mail.selected && mail.toggleUnread(mail.selected.id)}
              onAskAi={() => setAiOpen(true)}
              onReply={replyInline}
              autoReply={autoReply}
            />
            {aiOpen && (
              <AiAssistantPanel
                email={mail.selected}
                onClose={() => setAiOpen(false)}
                onAutoReply={(body) => setAutoReply(body)}
                onUseReply={(body) =>
                  setComposer({
                    to: mail.selected?.senderEmail,
                    subject: `RE: ${mail.selected?.subject ?? ""}`,
                    body,
                  })
                }
              />
            )}
          </div>
        </div>

        {/* Mobile thread */}
        {mobileThread && (
          <div className="flex min-w-0 flex-1 flex-col md:hidden">
            <button
              type="button"
              onClick={() => setMobileThread(false)}
              className="focus-ring flex items-center gap-1.5 border-b border-border bg-panel px-4 py-2 text-sm text-muted-foreground"
            >
              <ArrowLeft className="size-4" /> Back to list
            </button>
            <ThreadView
              email={mail.selected}
              loading={mail.loading}
              onArchive={() => mail.selected && mail.moveTo(mail.selected.id, "archive")}
              onSpam={() => mail.selected && mail.moveTo(mail.selected.id, "spam")}
              onDelete={() => mail.selected && mail.removeEmail(mail.selected.id)}
              onToggleUnread={() => mail.selected && mail.toggleUnread(mail.selected.id)}
              onAskAi={() => setAiOpen(true)}
              onReply={replyInline}
              autoReply={autoReply}
            />
          </div>
        )}
      </div>

      {/* Undo send toast */}
      {undo && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex animate-fade-up items-center gap-3 rounded-lg border border-border bg-popover px-4 py-3 shadow-flyout"
        >
          <CheckCircle2 className="size-5 text-success" />
          <div className="text-sm">
            <p className="font-medium">{undo.label}</p>
            <p className="text-xs text-muted-foreground">You can undo for a few seconds.</p>
          </div>
          <button
            type="button"
            onClick={undoSend}
            className="focus-ring flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
          >
            <Undo2 className="size-3.5" /> Undo
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setUndo(null)}
            className="focus-ring rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Mobile compose FAB */}
      <button
        type="button"
        onClick={() => setComposer({})}
        aria-label="Compose message"
        className="focus-ring fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-flyout transition-transform duration-200 hover:scale-105 active:scale-95 sm:hidden"
      >
        <PenSquare className="size-5" />
      </button>

      {composer && <Composer seed={composer} onClose={() => setComposer(null)} onSend={send} />}

      {calendarOpen && (
        <CalendarView userEmail={session?.email} onClose={() => setCalendarOpen(false)} />
      )}

      {shortcutsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="w-full max-w-sm animate-pop rounded-xl border border-border bg-card p-6 shadow-flyout"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
            <ul className="mt-4 space-y-2">
              {SHORTCUTS.map(([key, label]) => (
                <li key={key} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <Kbd>{key}</Kbd>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShortcutsOpen(false)}
              className="focus-ring mt-5 w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
