import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth, DEMO_PASSWORD, type SavedAccount } from "@/lib/auth";
import { initials, maskIdentifier } from "@/lib/mock-data";
import { ThemeSlider } from "@/components/theme-slider";
import { cn } from "@/lib/utils";

type Mode = "accounts" | "credentials" | "forgot" | "forgot-sent";

export function AuthScreen() {
  const { accounts, rememberedEmail, signIn, removeAccount, requestReset } = useAuth();
  const [mode, setMode] = useState<Mode>(accounts.length > 0 ? "accounts" : "credentials");
  const [identifier, setIdentifier] = useState(rememberedEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(Boolean(rememberedEmail));
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; form?: string }>(
    {},
  );
  const [busy, setBusy] = useState(false);
  const [resetTarget, setResetTarget] = useState("");

  function pickAccount(acc: SavedAccount) {
    setIdentifier(acc.email);
    setPassword("");
    setErrors({});
    setMode("credentials");
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = "Enter your work email or username.";
    else if (identifier.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim()))
      next.identifier = "That doesn't look like a valid email address.";
    if (!password) next.password = "Enter your password.";
    else if (password.length < 6) next.password = "Passwords are at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      await signIn(identifier, password, remember);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Sign-in failed." });
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget.trim()) {
      setErrors({ identifier: "Enter your work email or username." });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await requestReset(resetTarget);
      setMode("forgot-sent");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not send the reset link." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80rem 40rem at 15% -10%, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent 60%), radial-gradient(60rem 30rem at 90% 110%, color-mix(in oklab, var(--color-primary) 14%, transparent), transparent 65%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <div className="leading-tight">
            <p className="text-sm font-semibold">Umail</p>
            <p className="text-[11px] text-muted-foreground">UserFacet Enterprise Mail</p>
          </div>
        </div>
        <ThemeSlider />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-14">
        <div className="w-full max-w-[26rem] animate-fade-up rounded-xl border border-border bg-card/95 p-6 shadow-flyout backdrop-blur-sm sm:p-8">
          {mode === "accounts" && (
            <section aria-labelledby="pick-account" className="animate-fade-in">
              <h1 id="pick-account" className="text-xl font-semibold tracking-tight">
                Pick an account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Saved on this device.</p>

              <ul className="mt-5 space-y-1.5">
                {accounts.map((acc) => (
                  <li key={acc.id} className="group flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => pickAccount(acc)}
                      className="focus-ring flex flex-1 items-center gap-3 rounded-lg border border-transparent px-2.5 py-2.5 text-left transition-all duration-200 hover:-translate-y-px hover:border-border hover:bg-accent/60"
                    >
                      <Avatar name={acc.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{acc.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {maskIdentifier(acc.email)} · {acc.lastUsed}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove saved account ${acc.name}`}
                      onClick={() => removeAccount(acc.id)}
                      className="focus-ring rounded-md p-2 text-muted-foreground opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
                {accounts.length === 0 && (
                  <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    No saved accounts on this device.
                  </li>
                )}
              </ul>

              <button
                type="button"
                onClick={() => {
                  setIdentifier("");
                  setPassword("");
                  setErrors({});
                  setMode("credentials");
                }}
                className="focus-ring mt-4 flex w-full items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent/60"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Plus className="size-4" />
                </span>
                Use another account
              </button>
            </section>
          )}

          {mode === "credentials" && (
            <section aria-labelledby="sign-in" className="animate-fade-in">
              <h1 id="sign-in" className="text-xl font-semibold tracking-tight">
                Sign in
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Use your UserFacet work account.</p>

              <form onSubmit={submitCredentials} className="mt-6 space-y-4" noValidate>
                <Field
                  id="identifier"
                  label="Email or username"
                  icon={<Mail className="size-4" />}
                  error={errors.identifier}
                >
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@userfacet.com"
                    aria-invalid={Boolean(errors.identifier)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                  />
                </Field>

                <Field
                  id="password"
                  label="Password"
                  icon={<Lock className="size-4" />}
                  error={errors.password}
                >
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="focus-ring rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </Field>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
                    <span
                      className={cn(
                        "relative inline-flex size-4 items-center justify-center rounded-[4px] border transition-all duration-200",
                        remember ? "border-primary bg-primary" : "border-input bg-card",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                      <CheckCircle2
                        className={cn(
                          "size-3 text-primary-foreground transition-all duration-200",
                          remember ? "scale-100 opacity-100" : "scale-50 opacity-0",
                        )}
                      />
                    </span>
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetTarget(identifier);
                      setErrors({});
                      setMode("forgot");
                    }}
                    className="focus-ring rounded text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {errors.form && (
                  <p
                    role="alert"
                    className="flex animate-shake items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {errors.form}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-[0.99] disabled:opacity-70"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {busy ? "Signing in…" : "Sign in"}
                </button>

                {accounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMode("accounts")}
                    className="focus-ring flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" /> Back to saved accounts
                  </button>
                )}
              </form>

              <p className="mt-6 rounded-md bg-secondary/70 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                Demo environment — sign in as any saved account with the password{" "}
                <code className="font-semibold text-foreground">{DEMO_PASSWORD}</code>.
              </p>
            </section>
          )}

          {mode === "forgot" && (
            <section aria-labelledby="reset" className="animate-fade-in">
              <h1 id="reset" className="text-xl font-semibold tracking-tight">
                Reset your password
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll send a single-use reset link to your work address.
              </p>

              <form onSubmit={submitReset} className="mt-6 space-y-4" noValidate>
                <Field
                  id="reset-id"
                  label="Email or username"
                  icon={<Mail className="size-4" />}
                  error={errors.identifier}
                >
                  <input
                    id="reset-id"
                    type="text"
                    value={resetTarget}
                    onChange={(e) => setResetTarget(e.target.value)}
                    placeholder="you@userfacet.com"
                    aria-invalid={Boolean(errors.identifier)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                  />
                </Field>

                {errors.form && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.form}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-[0.99] disabled:opacity-70"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {busy ? "Sending link…" : "Send reset link"}
                </button>
                <BackToLogin onClick={() => setMode("credentials")} />
              </form>
            </section>
          )}

          {mode === "forgot-sent" && (
            <section aria-labelledby="sent" className="animate-fade-in text-center">
              <span className="mx-auto flex size-12 animate-pop items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-6" />
              </span>
              <h1 id="sent" className="mt-4 text-xl font-semibold tracking-tight">
                Check your inbox
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                A reset link is on its way to{" "}
                <span className="font-medium text-foreground">{maskIdentifier(resetTarget)}</span>.
                It expires in 15 minutes.
              </p>
              <div className="mt-6">
                <BackToLogin onClick={() => setMode("credentials")} />
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="relative z-10 pb-6 text-center text-[11px] text-muted-foreground">
        Protected by UserFacet single sign-on · Sessions expire after 8 hours
      </footer>
    </div>
  );
}

function BackToLogin({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" /> Back to sign in
    </button>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border bg-card px-3 py-2.5 transition-all duration-200 focus-within:shadow-focus",
          error ? "border-destructive" : "border-input focus-within:border-primary",
        )}
      >
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive" role="alert">
          <AlertCircle className="size-3" /> {error}
        </p>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
      {initials(name)}
    </span>
  );
}

export function BrandMark() {
  return (
    <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-panel">
      <Mail className="size-4" />
    </span>
  );
}
