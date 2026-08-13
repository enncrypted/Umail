import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side AI helpers powered by the OpenAI API (gpt-4o-mini).
 *
 * API key is loaded from the environment variable OPENAI_API_KEY, which is
 * defined in:
 *   - `.env`           → picked up by Vite / Node.js dev servers
 *   - `.dev.vars`      → picked up by Wrangler (Cloudflare Workers local dev)
 *
 * The three exposed server functions cover:
 *   1. assistWithEmail  – compose / reply / summary / action-items (existing)
 *   2. summarizeEmail   – dedicated one-shot summary of an email thread
 *   3. autoSuggestReplies – returns 3 short smart-reply chips for quick send
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function getApiKey(): string | undefined {
  return process.env["OPENAI_API_KEY"] || process.env["AI_API_KEY"];
}

function getApiUrl(): string {
  return process.env["AI_API_URL"] || "https://api.openai.com/v1/chat/completions";
}

function getModel(): string {
  return process.env["AI_MODEL"] || "gpt-4o-mini";
}

async function callOpenAI(systemPrompt: string, userMessage: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.startsWith("sk-placeholder")) return null;

  try {
    const res = await fetch(getApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getModel(),
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (res.ok) {
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return json.choices?.[0]?.message?.content?.trim() ?? null;
    }
  } catch {
    // Network error – fall through to offline fallback
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1. assistWithEmail  (compose · reply · summary · action-items)
// ---------------------------------------------------------------------------

const AssistInput = z.object({
  mode: z.enum(["summary", "reply", "action-items", "compose"]),
  subject: z.string().max(300).default(""),
  thread: z.string().max(12000).default(""),
  tone: z.enum(["concise", "friendly", "formal", "executive"]).optional(),
  prompt: z.string().max(1000).optional(),
});

const SYSTEM_PROMPTS: Record<string, string> = {
  summary:
    "You are an AI email assistant (Nova Mail). Summarize the email thread in 2-4 crisp bullet points starting with '- '. Highlight key decisions, action owners, and deadlines. No conversational preamble.",
  reply:
    "You are an AI email assistant (Nova Mail). Draft a ready-to-send reply on behalf of the user. Keep it professional, under 120 words, clear, and ending with a professional sign-off. Output only the email body.",
  "action-items":
    "You are an AI email assistant (Nova Mail). Extract concrete action items as bullet points in the format '- [owner] task — due date'. If no due date, write 'no date'. No preamble.",
  compose:
    "You are an AI email assistant (Nova Mail). Generate a well-structured, professional email body based on the subject, prompt instructions, and desired tone. Output only the email body text without email headers.",
};

function fallbackGenerate(
  mode: "summary" | "reply" | "action-items" | "compose",
  subject: string,
  _thread: string,
  tone?: string,
  prompt?: string,
): string {
  const t = tone ? ` [Tone: ${tone}]` : "";
  if (mode === "summary") {
    return `- Key Objective: Review and finalize ${subject || "project deliverables"} by the specified deadline.\n- Status: Team aligned on core design tokens, performance metrics, and enterprise security compliance.\n- Next Steps: Final sign-off pending executive review.`;
  }
  if (mode === "reply") {
    if (tone === "formal") {
      return `Dear Colleague,\n\nThank you for the update regarding "${subject || "the thread"}". I have reviewed the details and agree with the proposed next steps.\n\nWe will ensure all items are completed on schedule. Please let me know if you need any additional information.\n\nSincerely,\nNova Mail User`;
    }
    if (tone === "friendly") {
      return `Hi there,\n\nThanks for sending this over! Everything looks great regarding "${subject || "this update"}". I'm on board with the plan and will get started right away.\n\nBest,\nNova Mail User`;
    }
    return `Hello,\n\nThank you for the update on "${subject || "this thread"}". I've reviewed the requirements and confirm we are aligned. I will follow up once the next milestone is complete.\n\nBest regards,\nNova Mail User`;
  }
  if (mode === "action-items") {
    return `- [Owner] Review final deck and cost model — due Friday 5 PM\n- [Eng Team] Verify TanStack Start SSR hydration and build metrics — due Today\n- [Ops] Verify wildcard SSL certificate challenge — due in 14 days`;
  }
  if (mode === "compose") {
    const userGoal = prompt ? prompt : `Draft email regarding ${subject || "project updates"}`;
    return `Hello,\n\nI am writing to share an update regarding ${subject || "our upcoming milestones"}.\n\n${userGoal}.\n\nPlease review the attached details when convenient, and let me know if you have any questions or feedback.\n\nBest regards,\nNova Mail User${t}`;
  }
  return "AI assistant generated response.";
}

export const assistWithEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AssistInput.parse(input))
  .handler(async ({ data }) => {
    const model = getModel();
    const toneNote = data.tone ? ` Preferred tone: ${data.tone}.` : "";
    const promptNote = data.prompt ? ` Additional user prompt: ${data.prompt}.` : "";

    const userMsg = `Subject: ${data.subject}${promptNote}\n\nThread Context:\n${data.thread}`;
    const sysPrompt = (SYSTEM_PROMPTS[data.mode] ?? "") + toneNote;

    const aiText = await callOpenAI(sysPrompt, userMsg);
    if (aiText) return { text: aiText, modelUsed: model };

    // High-quality offline fallback
    const fallbackText = fallbackGenerate(data.mode, data.subject, data.thread, data.tone, data.prompt);
    return { text: fallbackText, modelUsed: `${model} (simulated)` };
  });

// ---------------------------------------------------------------------------
// 2. summarizeEmail  – dedicated summary server function
// ---------------------------------------------------------------------------

const SummarizeInput = z.object({
  subject: z.string().max(300),
  thread: z.string().max(12000),
});

export const summarizeEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SummarizeInput.parse(input))
  .handler(async ({ data }) => {
    const model = getModel();
    const systemPrompt =
      "You are Nova Mail's AI summarizer. Given an email thread, produce a clean 3-5 bullet summary. " +
      "Start each bullet with '- '. Cover: main topic, key decisions, who owns what, deadlines. " +
      "No preamble, no sign-off.";

    const aiText = await callOpenAI(systemPrompt, `Subject: ${data.subject}\n\nThread:\n${data.thread}`);
    if (aiText) return { summary: aiText, modelUsed: model };

    return {
      summary: `- Topic: ${data.subject || "Email thread"}\n- Status: Awaiting review and approval from stakeholders.\n- Action required: Respond by end of business day.\n- Note: Add your OpenAI API key to .env to get live AI summaries.`,
      modelUsed: `${model} (simulated)`,
    };
  });

// ---------------------------------------------------------------------------
// 3. autoSuggestReplies  – 3 smart-reply chips
// ---------------------------------------------------------------------------

const SuggestInput = z.object({
  subject: z.string().max(300),
  thread: z.string().max(6000),
});

export const autoSuggestReplies = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SuggestInput.parse(input))
  .handler(async ({ data }) => {
    const model = getModel();
    const systemPrompt =
      "You are Nova Mail's smart-reply engine. Given an email thread, return exactly 3 short reply suggestions " +
      "that the user could send with one click. Each suggestion must be on its own line starting with '- '. " +
      "Keep each suggestion under 12 words. Cover: agree/confirm, ask for more info, decline/defer. No preamble.";

    const aiText = await callOpenAI(
      systemPrompt,
      `Subject: ${data.subject}\n\nThread:\n${data.thread}`,
    );

    if (aiText) {
      const suggestions = aiText
        .split("\n")
        .map((l) => l.replace(/^[-•]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
      return { suggestions, modelUsed: model };
    }

    // Offline fallback chips
    return {
      suggestions: ["Sounds good, I'll take a look!", "Can you share more details?", "Let me get back to you on this."],
      modelUsed: `${model} (simulated)`,
    };
  });

// ---------------------------------------------------------------------------
// 4. generateMailFromPrompt – new mail creation from a prompt
// ---------------------------------------------------------------------------

const GenerateMailInput = z.object({
  prompt: z.string().max(1000),
  tone: z.enum(["concise", "friendly", "formal", "executive"]).optional(),
});

export const generateMailFromPrompt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GenerateMailInput.parse(input))
  .handler(async ({ data }) => {
    const model = getModel();
    const toneNote = data.tone ? ` Use a ${data.tone} tone.` : " Use a professional tone.";
    const systemPrompt =
      "You are Nova Mail's AI mail drafter. Generate a complete, ready-to-send email including a Subject line and body. " +
      "Format your response exactly as:\nSubject: <subject here>\n\n<email body here>" +
      toneNote +
      " No preamble outside the email itself.";

    const aiText = await callOpenAI(systemPrompt, data.prompt);

    if (aiText) {
      // Parse subject and body from the response
      const subjectMatch = aiText.match(/^Subject:\s*(.+)/m);
      const subject = subjectMatch?.[1]?.trim() ?? "";
      const body = aiText.replace(/^Subject:.*\n?/m, "").trim();
      return { subject, body, modelUsed: model };
    }

    return {
      subject: `Re: ${data.prompt.substring(0, 50)}`,
      body: `Hello,\n\nI am writing regarding: ${data.prompt}.\n\nPlease let me know how you would like to proceed.\n\nBest regards,\nNova Mail User`,
      modelUsed: `${model} (simulated)`,
    };
  });
