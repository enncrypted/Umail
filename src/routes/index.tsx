import { createFileRoute } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { MailApp } from "@/components/mail/MailApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Umail — UserFacet Enterprise Mail" },
      {
        name: "description",
        content:
          "A fast, accessible enterprise email client with AI thread summaries, contextual replies, priority inbox, scheduled send and undo send.",
      },
      { property: "og:title", content: "Umail — UserFacet Enterprise Mail" },
      {
        property: "og:description",
        content:
          "Three-panel email workspace with AI summaries, contextual replies, keyboard shortcuts and enterprise sign-in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}

/** Renders the mail workspace once a session exists, otherwise the auth flow. */
function Gate() {
  const { session, ready } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  return session ? <MailApp /> : <AuthScreen />;
}
