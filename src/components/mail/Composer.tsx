import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Calendar,
  Check,
  Clock,
  Image,
  Loader2,
  Lock,
  MailPlus,
  Paperclip,
  Send,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { assistWithEmail, generateMailFromPrompt } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export interface ComposerSeed {
  to?: string | undefined;
  cc?: string | undefined;
  bcc?: string | undefined;
  subject?: string | undefined;
  body?: string | undefined;
}

type Tone = "formal" | "friendly" | "concise" | "executive";

function getDefaultTomorrowDateTime(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  now.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatCustomDateTime(isoString: string): string {
  if (!isoString) return "Tomorrow 9:00 AM";
  const dt = new Date(isoString);
  if (isNaN(dt.getTime())) return "Tomorrow 9:00 AM";
  return dt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Compose flyout with Cc/Bcc support, draft auto-save, dynamic schedule options (Now vs Choose time), and bottom-right AI Compose Assistant.
 */
export function Composer({
  seed,
  onClose,
  onSend,
}: {
  seed: ComposerSeed;
  onClose: () => void;
  onSend: (payload: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    schedule: string;
  }) => void;
}) {
  const assist = useServerFn(assistWithEmail);
  const generateMail = useServerFn(generateMailFromPrompt);
  const [to, setTo] = useState(seed.to ?? "");
  const [cc, setCc] = useState(seed.cc ?? "");
  const [bcc, setBcc] = useState(seed.bcc ?? "");
  const [showCc, setShowCc] = useState(Boolean(seed.cc));
  const [showBcc, setShowBcc] = useState(Boolean(seed.bcc));

  const [subject, setSubject] = useState(seed.subject ?? "");
  const [body, setBody] = useState(seed.body ?? "");

  // Dynamic scheduling state: "now" or "custom"
  const [scheduleMode, setScheduleMode] = useState<"now" | "custom">("now");
  const [customDateTime, setCustomDateTime] = useState<string>(getDefaultTomorrowDateTime());

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [sending, setSending] = useState(false);

  // AI Compose Assistant state (Prompt box at lower side)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState<Tone>("formal");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);

  // AI Generate New Mail from Prompt state
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genTone, setGenTone] = useState<Tone>("formal");
  const [genBusy, setGenBusy] = useState(false);
  const [genPreview, setGenPreview] = useState<{ subject: string; body: string } | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced draft auto-save.
  useEffect(() => {
    if (!to && !cc && !bcc && !subject && !body) return;
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      window.localStorage.setItem("em.draft", JSON.stringify({ to, cc, bcc, subject, body }));
      setSaveState("saved");
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [to, cc, bcc, subject, body]);

  function submit() {
    setSending(true);
    const schedulePayload =
      scheduleMode === "now" ? "now" : `Scheduled for ${formatCustomDateTime(customDateTime)}`;

    setTimeout(() => {
      window.localStorage.removeItem("em.draft");
      onSend({ to, cc, bcc, subject, body, schedule: schedulePayload });
      setSending(false);
    }, 500);
  }

  async function handleGenerateAi() {
    setAiGenerating(true);
    setAiPreview(null);
    try {
      const res = await assist({
        data: {
          mode: "compose",
          subject: subject || "No Subject",
          thread: body || "Drafting initial email message",
          tone: aiTone,
          prompt: aiPrompt,
        },
      });
      setAiPreview(res.text);
    } catch {
      setAiPreview("Failed to generate draft. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  }

  function handleApplyAiText() {
    if (aiPreview) {
      setBody(aiPreview);
      setShowAiModal(false);
      setAiPreview(null);
    }
  }

  async function handleGenerateNewMail() {
    if (!genPrompt.trim()) return;
    setGenBusy(true);
    setGenPreview(null);
    try {
      const res = await generateMail({ data: { prompt: genPrompt, tone: genTone } });
      setGenPreview({ subject: res.subject, body: res.body });
    } catch {
      setGenPreview({ subject: "", body: "Failed to generate. Please try again." });
    } finally {
      setGenBusy(false);
    }
  }

  function handleApplyGenerated() {
    if (genPreview) {
      if (genPreview.subject) setSubject(genPreview.subject);
      setBody(genPreview.body);
      setShowGenModal(false);
      setGenPreview(null);
      setGenPrompt("");
    }
  }

  // Quick preset helper for custom date time
  function setQuickPreset(hoursFromNow: number) {
    const dt = new Date();
    dt.setHours(dt.getHours() + hoursFromNow);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const min = pad(dt.getMinutes());
    setCustomDateTime(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New message"
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl animate-fade-up flex-col rounded-t-xl border border-border bg-card shadow-flyout sm:rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 bg-panel/50">
          <h2 className="flex-1 text-sm font-semibold">New message</h2>
          <span
            className={cn(
              "flex items-center gap-1 text-[11px] transition-opacity duration-300",
              saveState === "idle" ? "opacity-0" : "opacity-100",
              saveState === "saved" ? "text-success" : "text-muted-foreground",
            )}
          >
            {saveState === "saving" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Check className="size-3" />
            )}
            {saveState === "saving" ? "Saving draft…" : "Draft saved"}
          </span>
          <button
            type="button"
            aria-label="Close composer"
            onClick={onClose}
            className="focus-ring rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto flex flex-col">
          {/* To Line with Cc / Bcc Toggles */}
          <Line label="To">
            <div className="flex flex-1 items-center gap-2">
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="name@contoso.com"
                aria-label="Recipients"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium px-1 transition-colors"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium px-1 transition-colors"
                >
                  Bcc
                </button>
              )}
            </div>
          </Line>

          {/* Cc Input Line */}
          {showCc && (
            <Line label="Cc">
              <div className="flex flex-1 items-center justify-between gap-2">
                <input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@contoso.com"
                  aria-label="Cc Recipients"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCc(false);
                    setCc("");
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Remove Cc field"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </Line>
          )}

          {/* Bcc Input Line */}
          {showBcc && (
            <Line label="Bcc">
              <div className="flex flex-1 items-center justify-between gap-2">
                <input
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@contoso.com"
                  aria-label="Bcc Recipients"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowBcc(false);
                    setBcc("");
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Remove Bcc field"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </Line>
          )}

          <Line label="Subject">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Add a subject"
              aria-label="Subject"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </Line>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-label="Message body"
            placeholder="Write your message or use AI Assist at bottom right to generate copy…"
            className="min-h-[14rem] flex-1 w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Dynamic Custom Date/Time Picker Bar when "Choose time" is selected */}
        {scheduleMode === "custom" && (
          <div className="border-t border-border/80 bg-muted/40 p-3 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" /> Choose Custom Delivery Time:
              </span>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {formatCustomDateTime(customDateTime)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary focus:shadow-focus"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickPreset(1)}
                  className="rounded border border-input bg-card px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  +1 hr
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset(24)}
                  className="rounded border border-input bg-card px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset(72)}
                  className="rounded border border-input bg-card px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  +3 days
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── AI Compose Assistant (polish / refine existing body) ── */}
        {showAiModal && (
          <div className="border-t border-border bg-card p-4 space-y-3 shadow-flyout animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary animate-sparkle" /> AI Compose Assistant
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-muted-foreground font-medium">Tone:</span>
                  {(["formal", "friendly", "concise", "executive"] as Tone[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAiTone(t)}
                      className={cn(
                        "rounded px-2 py-0.5 capitalize transition-colors text-[11px]",
                        aiTone === t
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleGenerateAi()}
                placeholder="Tell AI what to write or polish (e.g. Request meeting for Q4 roadmap review)..."
                className="flex-1 rounded-md border border-input bg-muted/30 px-3 py-2 text-xs outline-none focus:border-primary focus:shadow-focus"
              />
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="focus-ring flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60 shrink-0"
              >
                {aiGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {aiGenerating ? "Generating..." : "Generate"}
              </button>
            </div>

            {aiPreview && (
              <div className="space-y-2 border-t border-border/80 pt-2.5">
                <p className="text-[11px] font-semibold text-muted-foreground">Generated Draft Preview:</p>
                <div className="max-h-32 overflow-y-auto whitespace-pre-line rounded-md border border-border bg-muted/20 p-2.5 text-xs leading-relaxed text-foreground">
                  {aiPreview}
                </div>
                <button
                  type="button"
                  onClick={handleApplyAiText}
                  className="focus-ring w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  Insert Text into Email Body &amp; Edit
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Generate New Mail from Prompt ── */}
        {showGenModal && (
          <div className="border-t border-border bg-card p-4 space-y-3 shadow-flyout animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MailPlus className="size-3.5 text-primary" /> Generate New Mail from Prompt
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-muted-foreground font-medium">Tone:</span>
                  {(["formal", "friendly", "concise", "executive"] as Tone[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setGenTone(t)}
                      className={cn(
                        "rounded px-2 py-0.5 capitalize transition-colors text-[11px]",
                        genTone === t
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { setShowGenModal(false); setGenPreview(null); }}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Describe the email you want (e.g. 'Write a meeting request to the design team for a Q4 roadmap review next Tuesday')…"
                rows={2}
                className="flex-1 resize-none rounded-md border border-input bg-muted/30 px-3 py-2 text-xs outline-none focus:border-primary focus:shadow-focus"
              />
              <button
                type="button"
                onClick={handleGenerateNewMail}
                disabled={genBusy || !genPrompt.trim()}
                className="focus-ring flex items-center gap-1.5 self-end rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60 shrink-0"
              >
                {genBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                {genBusy ? "Writing..." : "Write"}
              </button>
            </div>

            {genPreview && (
              <div className="space-y-2 border-t border-border/80 pt-2.5">
                {genPreview.subject && (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-2.5 py-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0">Subject:</span>
                    <span className="text-xs font-medium text-foreground truncate">{genPreview.subject}</span>
                  </div>
                )}
                <div className="max-h-32 overflow-y-auto whitespace-pre-line rounded-md border border-border bg-muted/20 p-2.5 text-xs leading-relaxed text-foreground">
                  {genPreview.body}
                </div>
                <button
                  type="button"
                  onClick={handleApplyGenerated}
                  className="focus-ring w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  Use this Email &amp; Edit
                </button>
              </div>
            )}
          </div>
        )}

        <footer className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 bg-panel/30">
          {/* Main Action Button */}
          <button
            type="button"
            disabled={!to.trim() || sending}
            onClick={submit}
            className="focus-ring flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {scheduleMode === "now"
              ? "Send Now"
              : `Schedule (${formatCustomDateTime(customDateTime)})`}
          </button>

          {/* Dynamic Schedule Dropdown: 1st Option "Now", 2nd Option "Choose time" */}
          <label className="flex items-center gap-1.5 rounded-md border border-input px-2.5 py-2 text-xs bg-card">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="sr-only font-medium">Delivery Schedule</span>
            <select
              value={scheduleMode}
              onChange={(e) => setScheduleMode(e.target.value as "now" | "custom")}
              className="bg-transparent text-xs outline-none font-medium cursor-pointer"
            >
              <option value="now">1. Send now</option>
              <option value="custom">2. Choose time…</option>
            </select>
          </label>

          <div className="ml-auto flex items-center gap-1.5">
            <Ghost label="Attach file">
              <Paperclip className="size-4" />
            </Ghost>
            <Ghost label="Insert image">
              <Image className="size-4" />
            </Ghost>
            <Ghost label="Encrypt message">
              <Lock className="size-4" />
            </Ghost>

            {/* Generate New Mail from Prompt */}
            <button
              type="button"
              onClick={() => { setShowGenModal((v) => !v); if (showAiModal) setShowAiModal(false); }}
              aria-label="Generate email from prompt"
              title="Generate New Mail from Prompt (AI)"
              className={cn(
                "focus-ring flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 shadow-sm",
                showGenModal
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              <MailPlus className="size-3.5" /> Generate
            </button>

            {/* AI Compose Assist (refine existing body) */}
            <button
              type="button"
              onClick={() => { setShowAiModal((v) => !v); if (showGenModal) setShowGenModal(false); }}
              aria-label="AI Assist"
              title="AI Compose Assistant – refine & polish"
              className={cn(
                "focus-ring flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 shadow-sm",
                showAiModal
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              <Sparkles className="size-3.5 animate-sparkle" /> AI Assist
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
      <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Ghost({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="focus-ring rounded-md p-1.5 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground active:scale-95"
    >
      {children}
    </button>
  );
}
