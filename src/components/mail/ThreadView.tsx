import { useEffect, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Mail,
  MailOpen,
  MoreHorizontal,
  Paperclip,
  Reply,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { initials, type Attachment, type Email } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const ICONS: Record<Attachment["kind"], typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  image: FileImage,
  zip: Paperclip,
};

export function ThreadView({
  email,
  loading,
  onArchive,
  onSpam,
  onDelete,
  onToggleUnread,
  onAskAi,
  onReply,
  autoReply,
}: {
  email: Email | null;
  loading: boolean;
  onArchive: () => void;
  onSpam: () => void;
  onDelete: () => void;
  onToggleUnread: () => void;
  onAskAi: () => void;
  onReply: (body: string) => void;
  /** Pre-generated AI reply text that pre-fills the reply box */
  autoReply?: string | null;
}) {
  const [draft, setDraft] = useState("");
  const [isAiDraft, setIsAiDraft] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);

  // Pre-fill the reply box when an AI-generated reply arrives
  useEffect(() => {
    if (autoReply) {
      setDraft(autoReply);
      setIsAiDraft(true);
    }
  }, [autoReply]);

  if (loading) {
    return (
      <section className="flex min-w-0 flex-1 flex-col bg-panel p-6" aria-busy="true">
        <span className="h-4 w-2/3 rounded shimmer-bar" />
        <span className="mt-6 h-3 w-1/3 rounded shimmer-bar" />
        <span className="mt-4 h-24 w-full rounded-lg shimmer-bar" />
        <span className="mt-3 h-24 w-full rounded-lg shimmer-bar" />
      </section>
    );
  }

  if (!email) {
    return (
      <section className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 bg-panel p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Mail className="size-6" />
        </span>
        <p className="text-sm font-medium">Select a message</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Pick a conversation from the list, or press <Kbd>C</Kbd> to compose a new one.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Conversation" className="flex min-w-0 flex-1 flex-col bg-panel">
      <header className="flex items-center gap-1 border-b border-border px-4 py-3">
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{email.subject}</h2>
        <IconBtn label="Summarize with AI" onClick={onAskAi}>
          <Sparkles className="size-4 text-primary" />
        </IconBtn>
        <IconBtn label="Mark unread" onClick={onToggleUnread}>
          {email.unread ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
        </IconBtn>
        <IconBtn label="Archive" onClick={onArchive}>
          <Archive className="size-4" />
        </IconBtn>
        <IconBtn label="Report as spam" onClick={onSpam}>
          <ShieldAlert className="size-4" />
        </IconBtn>
        <IconBtn label="Delete" onClick={onDelete}>
          <Trash2 className="size-4" />
        </IconBtn>
        <IconBtn label="More actions">
          <MoreHorizontal className="size-4" />
        </IconBtn>
      </header>

      {email.folder === "spam" && (
        <p className="m-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive animate-fade-in">
          <ShieldAlert className="size-4 shrink-0" />
          Caution: this message was flagged as spam. Links and attachments are disabled.
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {email.messages.map((m, i) => (
          <MessageCard
            key={m.id}
            index={i}
            message={m}
            spam={email.folder === "spam"}
            onPreview={setPreview}
          />
        ))}
      </div>

      <footer className="border-t border-border p-3 space-y-2">
        {/* AI-suggested reply badge */}
        {isAiDraft && draft && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-primary/8 border border-primary/20 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
              <Sparkles className="size-3 animate-sparkle" />
              AI-suggested reply ready — review, edit, or send as-is
            </span>
            <button
              type="button"
              onClick={() => {
                setDraft("");
                setIsAiDraft(false);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear AI draft"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <div
          className={cn(
            "flex items-end gap-2 rounded-lg border bg-card px-3 py-2 transition-shadow focus-within:shadow-focus",
            isAiDraft && draft ? "border-primary/40 shadow-focus" : "border-input",
          )}
        >
          <Reply className="mb-1.5 size-4 shrink-0 text-muted-foreground" />
          <textarea
            rows={isAiDraft && draft ? 4 : 1}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setIsAiDraft(false);
            }}
            placeholder={`Reply to ${email.sender.split(" ")[0]}…`}
            aria-label="Reply message"
            className="max-h-48 min-h-[1.75rem] flex-1 resize-none bg-transparent py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => {
              onReply(draft);
              setDraft("");
              setIsAiDraft(false);
            }}
            aria-label="Send reply"
            className="focus-ring mb-0.5 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-95 disabled:opacity-40"
          >
            <Send className="size-3" /> Send
          </button>
        </div>
      </footer>

      {preview && <AttachmentPreview attachment={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}

function MessageCard({
  message,
  index,
  spam,
  onPreview,
}: {
  message: Email["messages"][number];
  index: number;
  spam: boolean;
  onPreview: (a: Attachment) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <article
      className="animate-fade-up rounded-lg border border-border bg-card shadow-panel"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left"
      >
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full text-[11px] font-semibold",
            spam ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary",
          )}
        >
          {initials(message.from)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{message.from}</span>
          <span className="block truncate text-xs text-muted-foreground">to {message.to}</span>
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{message.time}</span>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", !open && "-rotate-90")}
        />
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-foreground/90">
            {message.body}
          </p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
              {message.attachments.map((a) => {
                const Icon = ICONS[a.kind];
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={spam}
                    onClick={() => onPreview(a)}
                    className="focus-ring flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-2.5 py-1.5 text-left transition-all duration-200 hover:-translate-y-px hover:border-primary/40 disabled:opacity-50"
                  >
                    <Icon className="size-4 text-primary" />
                    <span className="text-xs">
                      <span className="block max-w-[10rem] truncate font-medium">{a.name}</span>
                      <span className="block text-[10px] text-muted-foreground">{a.size}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function AttachmentPreview({
  attachment,
  onClose,
}: {
  attachment: Attachment;
  onClose: () => void;
}) {
  const Icon = ICONS[attachment.kind];
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  function handleDownload() {
    setDownloading(true);
    setTimeout(() => {
      try {
        const dummyContent = `Nova Mail File Download\nFile: ${attachment.name}\nSize: ${attachment.size}\nType: ${attachment.kind.toUpperCase()}\nTimestamp: ${new Date().toISOString()}`;
        const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // fallback
      }
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    }, 450);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${attachment.name}`}
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-pop rounded-xl border border-border bg-card p-6 shadow-flyout overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">
              {attachment.size} · {attachment.kind.toUpperCase()} document
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* File Preview Area */}
        <div className="mt-4 flex min-h-[11rem] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Icon className="size-6" />
          </div>
          <p className="text-xs font-semibold text-foreground">{attachment.name}</p>
          <p className="mt-1 text-[11px] text-muted-foreground max-w-xs">
            {attachment.kind === "pdf"
              ? "Adobe PDF Document · Verified virus-free"
              : attachment.kind === "sheet"
                ? "Spreadsheet Data File · Ready for Excel / Sheets"
                : attachment.kind === "image"
                  ? "High-Resolution Image File"
                  : "Compressed File Archive"}
          </p>
          {downloaded && (
            <span className="mt-2.5 inline-flex items-center gap-1 rounded bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success animate-fade-in">
              <Check className="size-3" /> Download completed
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md border border-input px-3.5 py-2 text-xs font-medium transition-colors hover:bg-accent"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            aria-label="Download attachment"
            className="focus-ring flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-[0.98] disabled:opacity-70"
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : downloaded ? (
              <Check className="size-3.5" />
            ) : (
              <Download className="size-3.5" />
            )}
            {downloading ? "Downloading…" : downloaded ? "Downloaded" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="focus-ring rounded-md p-1.5 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground active:scale-95"
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground">
      {children}
    </kbd>
  );
}
