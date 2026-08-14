import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Mock authentication layer.
 *
 * Deliberately isolated behind this provider so the UI never talks to the
 * "backend" directly — swapping in a real identity provider means replacing
 * signIn/requestReset only.
 */

export interface SavedAccount {
  id: string;
  name: string;
  email: string;
  lastUsed: string;
  org: string;
}

export interface Session {
  name: string;
  email: string;
  org: string;
}

const SESSION_KEY = "umail.session";
const ACCOUNTS_KEY = "umail.accounts";
const REMEMBER_KEY = "umail.remember";

const DEFAULT_ACCOUNTS: SavedAccount[] = [
  {
    id: "acc-1",
    name: "Sarah J. Assenmon",
    email: "sarah.j@userfacet.com",
    lastUsed: "Today",
    org: "UserFacet Corp",
  },
  {
    id: "acc-2",
    name: "Mark Chen",
    email: "mark.c@userfacet.com",
    lastUsed: "Yesterday",
    org: "UserFacet Corp",
  },
  {
    id: "acc-3",
    name: "Ops Service Account",
    email: "ops.svc@userfacet.com",
    lastUsed: "Last week",
    org: "UserFacet IT",
  },
];

/** Any account password below is "userfacet" for the demo. */
export const DEMO_PASSWORD = "userfacet";

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  accounts: SavedAccount[];
  rememberedEmail: string | null;
  signIn: (identifier: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => void;
  removeAccount: (id: string) => void;
  requestReset: (identifier: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [accounts, setAccounts] = useState<SavedAccount[]>(DEFAULT_ACCOUNTS);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(read<Session | null>(SESSION_KEY, null));
    setAccounts(read<SavedAccount[]>(ACCOUNTS_KEY, DEFAULT_ACCOUNTS));
    setRememberedEmail(window.localStorage.getItem(REMEMBER_KEY));
    setReady(true);
  }, []);

  const persistAccounts = useCallback((next: SavedAccount[]) => {
    setAccounts(next);
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
  }, []);

  const signIn = useCallback(
    async (identifier: string, password: string, remember: boolean) => {
      await wait(900);
      const id = identifier.trim().toLowerCase();
      const match = accounts.find(
        (a) => a.email.toLowerCase() === id || a.email.split("@")[0] === id,
      );
      if (!match || password !== DEMO_PASSWORD) {
        throw new Error("The account or password is incorrect. Please try again.");
      }
      const next: Session = { name: match.name, email: match.email, org: match.org };
      setSession(next);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      if (remember) window.localStorage.setItem(REMEMBER_KEY, match.email);
      else window.localStorage.removeItem(REMEMBER_KEY);
      setRememberedEmail(remember ? match.email : null);
      persistAccounts([
        { ...match, lastUsed: "Just now" },
        ...accounts.filter((a) => a.id !== match.id),
      ]);
    },
    [accounts, persistAccounts],
  );

  const signOut = useCallback(() => {
    setSession(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const removeAccount = useCallback(
    (id: string) => {
      persistAccounts(accounts.filter((a) => a.id !== id));
    },
    [accounts, persistAccounts],
  );

  const requestReset = useCallback(async (identifier: string) => {
    await wait(1200);
    if (!identifier.trim()) throw new Error("Enter your work email or username.");
  }, []);

  const value = useMemo(
    () => ({
      session,
      ready,
      accounts,
      rememberedEmail,
      signIn,
      signOut,
      removeAccount,
      requestReset,
    }),
    [session, ready, accounts, rememberedEmail, signIn, signOut, removeAccount, requestReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
