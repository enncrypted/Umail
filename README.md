# Nova Mail

A full-featured, AI-powered email client built with **TanStack Start**, **React 19**, and **OpenAI**. Nova Mail delivers a premium inbox experience with real-time AI assistance — thread summarization, smart reply suggestions, auto-reply drafting, and prompt-based mail generation — all server-side with a clean, dark-mode-first UI.

---

## Table of Contents

1. [Features](#features)
2. [Architecture & Approach](#architecture--approach)
3. [Project Structure](#project-structure)
4. [Setup Instructions](#setup-instructions)
5. [Environment Variables](#environment-variables)
6. [AI Services](#ai-services)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Assumptions](#assumptions)

---

## Features

### 📬 Core Mail Experience
| Feature | Details |
|---|---|
| **Folder navigation** | Inbox, Starred, Sent, Drafts, Scheduled, Archive, Spam, Trash |
| **Email list** | Filter by All / Unread / Starred, live search across all fields |
| **Thread view** | Collapsible message cards, attachment previews with download |
| **Composer** | To / Cc / Bcc fields, subject, rich body, draft auto-save to `localStorage` |
| **Send scheduling** | Send Now or schedule for a custom date/time with +1 hr / Tomorrow / +3 days quick presets |
| **Undo send** | 8-second grace window after sending to retract a message |
| **Spam warning** | Visual alert + disabled links/attachments for flagged threads |
| **Keyboard shortcuts** | Full keyboard-driven navigation (see [Keyboard Shortcuts](#keyboard-shortcuts)) |
| **Mobile layout** | Responsive stack — email list → thread → back button; floating compose FAB |

### 🤖 AI Features (OpenAI `gpt-4o-mini`)

| Feature | Where | Description |
|---|---|---|
| **Thread Summary** | AI Assistant Panel | Auto-generates a 3–5 bullet summary when you open any thread |
| **Summary Refinement Field** | AI Assistant Panel | Type a focus hint (e.g. *"focus on deadlines"*) and hit **Go** to re-summarize |
| **Action Items** | AI Assistant Panel | Extracts concrete `[owner] task — due date` bullets from the thread |
| **Auto Reply Draft** | AI Assistant Panel | Drafts an editable reply pre-filled into the reply box, with Formal / Friendly / Concise / Executive tone controls |
| **Smart Reply Chips** | AI Assistant Panel | 3 one-click quick-reply suggestion buttons generated per thread |
| **AI Compose Assist** | Composer → *AI Assist* | Refine or polish the email body you're writing via a prompt |
| **Generate New Mail** | Composer → *Generate* | Describe an email in plain English; AI writes the full **Subject + body** |

All AI features fall back to high-quality offline demo content if no API key is configured.

### 🎨 Design & UX
- Dark-mode-first with a dynamic **Theme Slider** (light → dark continuum)
- Glassmorphism panels, smooth micro-animations, shimmer skeleton loaders
- Google Fonts (`Inter`) via Tailwind CSS v4
- Notification center with unread badge
- Calendar view
- Account menu with masked email display

---

## Architecture & Approach

### Stack

| Layer | Technology |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (file-based SSR router on top of Vite + Nitro) |
| **UI** | React 19, Tailwind CSS v4, Radix UI primitives, Lucide icons |
| **Server functions** | `createServerFn` from `@tanstack/react-start` — typed RPC functions that run exclusively on the server |
| **Validation** | Zod schemas on all server function inputs |
| **AI** | OpenAI Chat Completions API (`gpt-4o-mini`) via native `fetch` |
| **Deployment target** | Cloudflare Workers (Nitro `cloudflare-module` preset) |
| **Build tool** | Vite 8 |
| **Package manager** | npm / bun compatible |

### Key Architectural Decisions

#### Server Functions for AI
All OpenAI calls are made inside **TanStack Start server functions** (`createServerFn`). This guarantees:
- The `OPENAI_API_KEY` is **never exposed to the browser bundle**
- Each AI feature is a discrete, validated RPC endpoint
- The client calls them with `useServerFn()` — identical DX to a regular async function

```
Client (React)          Server (Node / Cloudflare Worker)
─────────────────       ────────────────────────────────────
useServerFn(fn)  ──►    createServerFn handler
                         └─ reads OPENAI_API_KEY from process.env
                         └─ calls OpenAI API
                         └─ returns typed response
```

#### State Management
Mail state is managed by a custom `useMailStore` hook (`use-mail-store.ts`) using plain React `useState` + `useCallback`. There is no external state library — the store is scoped to the session and reset on sign-out.

#### Mock Data Layer
`src/lib/mock-data.ts` provides a fully realistic dataset of emails, threads, attachments, and notifications. This allows the full UI to be exercised without a real mail backend.

#### Graceful AI Degradation
`callOpenAI()` in `ai.functions.ts` checks whether the key is a placeholder before making any network request. If the key is missing or still placeholder, every AI function returns deterministic, high-quality demo content — so the app is fully usable out of the box.

---

## Project Structure

```
nova-mail/
├── src/
│   ├── components/
│   │   ├── mail/
│   │   │   ├── MailApp.tsx          # Root shell — layout, keyboard shortcuts, global state
│   │   │   ├── MailSidebar.tsx      # Folder nav + counts
│   │   │   ├── EmailList.tsx        # Filtered, searchable email list
│   │   │   ├── ThreadView.tsx       # Message cards, attachments, inline reply
│   │   │   ├── AiAssistantPanel.tsx # Summarize / Actions / Auto Reply + smart chips
│   │   │   ├── Composer.tsx         # New message flyout with AI Assist & Generate
│   │   │   ├── CalendarView.tsx     # Calendar overlay
│   │   │   ├── NotificationCenter.tsx
│   │   │   └── use-mail-store.ts    # In-memory mail state hook
│   │   ├── auth/                    # Login / sign-up screens
│   │   └── theme-slider.tsx         # Light ↔ Dark theme control
│   ├── lib/
│   │   ├── ai.functions.ts          # All OpenAI server functions
│   │   ├── mock-data.ts             # Seed emails, threads, attachments
│   │   ├── auth.tsx                 # Session context
│   │   └── utils.ts                 # cn() helper
│   ├── routes/                      # TanStack file-based routes
│   ├── styles.css                   # Global CSS + design tokens
│   └── server.ts                    # Nitro server entry
├── .env                             # Local secrets (git-ignored)
├── .dev.vars                        # Cloudflare Workers local secrets (git-ignored)
├── vite.config.ts
└── package.json
```

---

## Setup Instructions

### Prerequisites
- **Node.js** ≥ 18 (or Bun ≥ 1.0)
- An **OpenAI API key** (get one at [platform.openai.com](https://platform.openai.com))

### 1 — Clone & install

```bash
git clone <your-repo-url>
cd nova-mail
npm install
# or: bun install
```

### 2 — Configure your API key

Open **`.env`** (in the project root) and replace the placeholder:

```env
OPENAI_API_KEY=sk-your-real-key-here
```

If you are running via **Wrangler** (Cloudflare Workers local dev), also update **`.dev.vars`**:

```env
OPENAI_API_KEY=sk-your-real-key-here
```

> Both files are already listed in `.gitignore` and will never be committed.

### 3 — Start the dev server

```bash
npm run dev
```

The app will be available at **[http://localhost:3000](http://localhost:3000)** (or the port Vite assigns).

### 4 — Build for production

```bash
npm run build
```

Output lands in `.output/` (Nitro / Cloudflare Workers bundle).

### 5 — Lint & format

```bash
npm run lint      # ESLint
npm run format    # Prettier
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | **Yes** (for live AI) | placeholder | OpenAI secret key. Server-side only. |
| `AI_API_URL` | No | `https://api.openai.com/v1/chat/completions` | Override to use a compatible proxy |
| `AI_MODEL` | No | `gpt-4o-mini` | OpenAI model name |

> Variables are read server-side via `process.env`. They are **never** bundled into the client.

---

## AI Services

All defined in [`src/lib/ai.functions.ts`](./src/lib/ai.functions.ts) as TanStack Start server functions:

| Server Function | Mode / Endpoint | Used By |
|---|---|---|
| `assistWithEmail` | `summary` `reply` `action-items` `compose` | AI Assistant Panel, Composer AI Assist |
| `summarizeEmail` | Dedicated summarizer | AI Assistant Panel (Summary tab) |
| `autoSuggestReplies` | Returns 3 quick-reply chips | AI Assistant Panel (chip bar) |
| `generateMailFromPrompt` | Full Subject + body from prompt | Composer → Generate panel |

### Offline / Demo Mode
If `OPENAI_API_KEY` is not set or is still the placeholder value, all functions return high-quality hard-coded demo responses. The UI looks and behaves identically — labels just show `gpt-4o-mini (demo mode)`.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `C` | Compose a new message |
| `J` / `K` | Next / previous conversation |
| `/` | Focus search bar |
| `U` | Toggle read / unread |
| `S` | Star / unstar conversation |
| `E` | Archive conversation |
| `A` | Toggle AI assistant panel |
| `N` | Toggle notification center |
| `Shift + D` | Toggle dark mode |
| `?` | Open this shortcut list |
| `Escape` | Close open panels / dialogs |

---

## Assumptions

1. **No real mail backend.** All email data is sourced from `src/lib/mock-data.ts`. Sending, archiving, starring, and deleting are in-memory operations — they reset on page refresh.

2. **Authentication is mocked.** The auth layer (`src/lib/auth.tsx`) simulates login/logout with session state stored in React context. No tokens, cookies, or real identity providers are used.

3. **OpenAI is the only AI provider.** The `AI_API_URL` override allows pointing at any OpenAI-compatible API (e.g. Azure OpenAI, Ollama), but no other provider SDK is integrated.

4. **`gpt-4o-mini` is the default model.** It was chosen for low latency and cost-efficiency. Any OpenAI chat-completions-compatible model can be swapped in via the `AI_MODEL` env variable.

5. **Draft auto-save uses `localStorage`.** Composer drafts are persisted to the browser's local storage under the key `em.draft`. Only a single draft is persisted at a time.

6. **Cloudflare Workers is the primary deployment target.** The Nitro preset is `cloudflare-module`. Running locally with `npm run dev` uses the standard Node.js Vite dev server, which also reads `.env` correctly.

7. **Attachment downloads are simulated.** Clicking "Download" generates a `.txt` placeholder file in the browser — no real file storage exists.

8. **Scheduled sends are client-side only.** The schedule timestamp is stored in the sent email's metadata but no actual delivery mechanism is implemented.
