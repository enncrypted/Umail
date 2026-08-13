import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Edit3,
  ListChecks,
  Loader2,
  MessageSquare,
  PenLine,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { assistWithEmail, autoSuggestReplies, summarizeEmail } from "@/lib/ai.functions";
import type { Email } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Mode = "summary" | "reply" | "action-items";
type Tone = "concise" | "friendly" | "formal" | "executive";

export function AiAssistantPanel({
  email,
  onClose,
  onUseReply,
  onAutoReply,
}: {
  email: Email | null;
  onClose: () => void;
  onUseReply: (body: string) => void;
  /** Called once an auto-reply is generated so it can be pre-filled in the thread reply box */
  onAutoReply?: (body: string) => void;
}) {
  const assist = useServerFn(assistWithEmail);
  const runSummary = useServerFn(summarizeEmail);
  const runSuggest = useServerFn(autoSuggestReplies);

  const [mode, setMode] = useState<Mode>("summary");
  const [tone, setTone] = useState<Tone>("formal");
  const [result, setResult] = useState<string | null>(null);
  const [editableText, setEditableText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>("gpt-4o-mini");

  // Smart-reply chip state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestBusy, setSuggestBusy] = useState(false);

  // Summarize field – editable summary box
  const [summaryPrompt, setSummaryPrompt] = useState("");
  const [summaryFocused, setSummaryFocused] = useState(false);

  const buildThread = useCallback(
    () => email?.messages.map((m) => `${m.from} (${m.time}):\n${m.body}`).join("\n\n---\n\n") ?? "",
    [email],
  );

  // ── Core AI run ──────────────────────────────────────────────────────────
  const run = useCallback(
    async (nextMode: Mode, chosenTone: Tone = tone) => {
      if (!email) return;
      setMode(nextMode);
      setBusy(true);
      setError(null);
      setResult(null);

      try {
        let text = "";
        let used = "gpt-4o-mini";

        if (nextMode === "summary") {
          const res = await runSummary({
            data: { subject: email.subject, thread: buildThread() },
          });
          text = res.summary;
          used = res.modelUsed;
        } else {
          const res = await assist({
            data: {
              mode: nextMode,
              subject: email.subject,
              thread: buildThread(),
              tone: chosenTone,
            },
          });
          text = res.text;
          used = res.modelUsed ?? used;
        }

        setResult(text);
        setEditableText(text);
        setModelUsed(used);
        return text;
      } catch (err) {
        setError(err instanceof Error ? err.message : "The assistant is unavailable right now.");
      } finally {
        setBusy(false);
      }
    },
    [assist, runSummary, email, tone, buildThread],
  );

  // ── Auto-suggestion chips ─────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async () => {
    if (!email) return;
    setSuggestBusy(true);
    try {
      const res = await runSuggest({
        data: { subject: email.subject, thread: buildThread() },
      });
      setSuggestions(res.suggestions);
    } catch {
      // silently ignore
    } finally {
      setSuggestBusy(false);
    }
  }, [email, runSuggest, buildThread]);

  // ── Init on new email ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!email) return;
    setSuggestions([]);
    setSummaryPrompt("");

    async function init() {
      // Summary tab + suggestion chips in parallel
      await Promise.all([
        run("summary"),
        fetchSuggestions(),
      ]);

      // Silently pre-generate auto-reply for the reply box
      if (!email) return;
      try {
        const res = await assist({
          data: {
            mode: "reply",
            subject: email.subject,
            thread: email.messages.map((m) => `${m.from} (${m.time}):\n${m.body}`).join("\n\n---\n\n"),
            tone: "formal",
          },
        });
        if (res.text && onAutoReply) onAutoReply(res.text);
      } catch {
        // best-effort
      }
    }

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email?.id]);

  return (
    <aside
      aria-label="AI assistant"
      className="flex w-full shrink-0 animate-slide-in-right flex-col border-l border-border bg-panel lg:w-[21rem]"
    >
      {/* Header */}
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 animate-sparkle text-primary" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold">AI Assistant</h2>
          <span className="text-[10px] text-muted-foreground">OpenAI {modelUsed}</span>
        </div>
        <button
          type="button"
          aria-label="Close AI assistant"
          onClick={onClose}
          className="focus-ring rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-3 py-2">
        <Tab active={mode === "summary"} onClick={() => run("summary")} Icon={Sparkles} label="Summarize" />
        <Tab
          active={mode === "action-items"}
          onClick={() => run("action-items")}
          Icon={ListChecks}
          label="Actions"
        />
        <Tab active={mode === "reply"} onClick={() => run("reply")} Icon={PenLine} label="Auto Reply" />
      </div>

      {/* Tone selector for Reply mode */}
      {mode === "reply" && (
        <div className="flex items-center gap-1 border-b border-border/60 bg-muted/20 px-3 py-1.5 text-[11px]">
          <span className="text-muted-foreground font-medium mr-1">Tone:</span>
          {(["formal", "friendly", "concise", "executive"] as Tone[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTone(t);
                void run("reply", t);
              }}
              className={cn(
                "rounded px-2 py-0.5 capitalize transition-colors",
                tone === t
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Summarize search/refine field */}
      {mode === "summary" && (
        <div
          className={cn(
            "flex items-center gap-2 border-b border-border/60 bg-muted/10 px-3 py-2 transition-shadow",
            summaryFocused && "shadow-[inset_0_-2px_0_0_hsl(var(--primary)/0.5)]",
          )}
        >
          <Sparkles className="size-3.5 shrink-0 text-primary/70" />
          <input
            value={summaryPrompt}
            onChange={(e) => setSummaryPrompt(e.target.value)}
            onFocus={() => setSummaryFocused(true)}
            onBlur={() => setSummaryFocused(false)}
            placeholder="Refine summary (e.g. focus on deadlines)…"
            aria-label="Summary refinement prompt"
            className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/60"
          />
          {summaryPrompt && (
            <button
              type="button"
              aria-label="Run refined summary"
              title="Run with this refinement"
              onClick={async () => {
                if (!email) return;
                setBusy(true);
                setError(null);
                setResult(null);
                try {
                  const res = await assist({
                    data: {
                      mode: "summary",
                      subject: email.subject,
                      thread: buildThread(),
                      prompt: summaryPrompt,
                    },
                  });
                  setResult(res.text);
                  setEditableText(res.text);
                  setModelUsed(res.modelUsed ?? "gpt-4o-mini");
                } catch {
                  setError("Could not refine summary.");
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go
            </button>
          )}
        </div>
      )}

      {/* Smart-reply chips */}
      {suggestions.length > 0 && (
        <div className="border-b border-border/60 bg-muted/10 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="size-3 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground">Quick Replies</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onUseReply(s)}
                title={`Send: "${s}"`}
                className="rounded-full border border-primary/30 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary transition-all hover:bg-primary/15 hover:border-primary/60 hover:shadow-sm active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {suggestBusy && suggestions.length === 0 && (
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/10 px-3 py-2">
          <Loader2 className="size-3 animate-spin text-primary" />
          <span className="text-[10px] text-muted-foreground">Generating quick replies…</span>
        </div>
      )}

      {/* Main content area */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!email && (
          <p className="text-xs text-muted-foreground">Open a conversation to use the assistant.</p>
        )}

        {busy && (
          <div className="space-y-2.5" aria-busy="true">
            <span className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Loader2 className="size-3.5 animate-spin text-primary" /> Processing with {getModelLabel(modelUsed)}…
            </span>
            <span className="block h-2.5 w-full rounded shimmer-bar" />
            <span className="block h-2.5 w-5/6 rounded shimmer-bar" />
            <span className="block h-2.5 w-2/3 rounded shimmer-bar" />
          </div>
        )}

        {error && !busy && (
          <p className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}

        {result && !busy && (
          <div className="animate-fade-up space-y-3">
            {mode === "reply" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Edit3 className="size-3 text-primary" /> Editable Automated Reply:
                  </span>
                  <span>(Edit before sending)</span>
                </div>
                <textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  rows={6}
                  className="w-full resize-y rounded-lg border border-border bg-card p-3 text-xs leading-relaxed outline-none focus:border-primary focus:shadow-focus"
                />
                <button
                  type="button"
                  onClick={() => onUseReply(editableText)}
                  className="focus-ring w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-[0.99]"
                >
                  Insert into Reply &amp; Send
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {mode === "summary" && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-1">
                    <MessageSquare className="size-3 text-primary" /> Thread Summary:
                  </div>
                )}
                <p className="whitespace-pre-line rounded-lg border border-border bg-card p-3 text-xs leading-relaxed shadow-panel">
                  {result}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => run(mode)}
              className="focus-ring w-full rounded-md border border-input px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
            >
              Regenerate Response
            </button>
          </div>
        )}
      </div>

      <p className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
        Powered by OpenAI {getModelLabel(modelUsed)} · Secure server execution.
      </p>
    </aside>
  );
}

function getModelLabel(modelUsed: string): string {
  return modelUsed.includes("simulated") ? "gpt-4o-mini (demo mode)" : modelUsed;
}

function Tab({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Sparkles;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "bg-primary/15 text-primary font-semibold"
          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
