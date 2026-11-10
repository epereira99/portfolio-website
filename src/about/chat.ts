// Talking to him at the camp: the RAG API (portfolio-rag) answers as him, as Server-Sent Events over a POST.
const API = process.env.NEXT_PUBLIC_CHAT_API_URL ?? "https://eduardo-portfolio-rag.fly.dev";

export const MAX_QUESTION = 500;

export type ChatLink = { title: string; url: string };
export type ChatImage = { src: string; alt: string; caption?: string };
export type ChatEvent =
  | { event: "bubble"; data: { text: string } }
  | { event: "links"; data: ChatLink[] }
  | { event: "images"; data: ChatImage[] }
  | { event: "done"; data: object };

// One id per page visit, in memory only: it just groups a visitor's questions in the API's traces.
let session: string | undefined;

/** Splits off the complete `event: x\ndata: {...}` blocks in buf; returns them and the unfinished rest. */
export function parseEvents(buf: string): { events: ChatEvent[]; rest: string } {
  const blocks = buf.replace(/\r\n/g, "\n").split("\n\n");
  const rest = blocks.pop()!;
  const events: ChatEvent[] = [];
  for (const block of blocks) {
    let event = "";
    let data = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (event && data) events.push({ event, data: JSON.parse(data) } as ChatEvent);
  }
  return { events, rest };
}

/** Asks him a question; each event of the answer goes to onEvent as it arrives. Throws on HTTP errors and network
 * failures, with the status on the error when there is one. */
export async function askChat(question: string, onEvent: (e: ChatEvent) => void, signal?: AbortSignal) {
  session ??= crypto.randomUUID();
  const res = await fetch(`${API}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, session_id: session }),
    signal,
  });
  if (!res.ok || !res.body) throw Object.assign(new Error(`chat ${res.status}`), { status: res.status });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const { events, rest } = parseEvents(buf + value);
    buf = rest;
    events.forEach(onEvent);
  }
  parseEvents(buf + "\n\n").events.forEach(onEvent); // a last block without its blank line
}

/** The slug of a read-more link (always /?project=<slug>), or null. */
export const linkSlug = (url: string) => new URL(url, "http://x").searchParams.get("project");

/** What he says when the API couldn't answer: never a bare error. */
export function failLine(status?: number) {
  if (status === 400) return "Hmm, I didn't catch a question there. Try asking me something?";
  if (status === 413 || status === 422) return "That's a lot to take in! Could you ask it a bit shorter?";
  return "Sorry, my head's in the clouds right now. Try me again in a minute?";
}
