/**
 * ============================================================
 * THE TOOL-CALLING LOOP
 * ============================================================
 * xAI's API is OpenAI-shaped, so this is the standard loop: send the
 * messages and the tool list, and if the reply contains tool calls,
 * run them, append the results, and go round again.
 *
 * Three things keep it from being dangerous or expensive.
 *
 * A HARD ROUND LIMIT. Two rounds, not "until it stops". A model that
 * keeps calling search_catalogue in a circle is a billing incident with
 * a spinner on top, and there is no question here that honestly needs
 * more than a lookup and an answer.
 *
 * WRITES NEVER EXECUTE. A call to a propose_* tool ends the loop and
 * comes back as a proposal for the customer to confirm. The reasoning
 * is in agentTools.ts and it is the most important thing in this
 * feature. If a future tool needs to write, it does not get added
 * here — it gets a confirmation card like everything else.
 *
 * FAILURE IS ALWAYS SOFT. Any error returns nulls and the caller falls
 * back to the keyword answers the site shipped with. A chat panel that
 * shows a stack trace is worse than one that answers plainly.
 */
import { list } from "@/lib/server/db";
import { countSeats, countInterest } from "@/lib/server/events";
import { priceableByBrand } from "@/config/priceable.config";
import { loadPriceBook } from "@/lib/server/prices.server";
import { AGENT_RULES, WRITE_TOOLS, toolsFor } from "@/lib/server/agentTools";
import type { BrandId, ChatTurn } from "@/lib/server/grok";

const KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";
const MODEL = process.env.GROK_MODEL || "grok-3";
const ENDPOINT = "https://api.x.ai/v1/chat/completions";
const MAX_ROUNDS = 2;

export type Proposal = {
  kind: "booking" | "interest" | "order" | "enquiry";
  brand: BrandId;
  /** What the customer is shown, field by field, before confirming. */
  summary: { label: string; value: string }[];
  /** The endpoint the browser posts to when they press confirm. */
  endpoint: string;
  /** The body it posts. Prices and seat counts are re-derived there. */
  payload: Record<string, unknown>;
  confirmLabel: string;
};

type ToolCall = { id: string; function: { name: string; arguments: string } };
type Msg = Record<string, unknown>;

const phone10 = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-10);

/* ---------------------------------------------------------------- */
/* READ tools                                                        */
/* ---------------------------------------------------------------- */

async function runFindSessions(): Promise<string> {
  const events = await list("events", {
    brand: "tnwla",
    where: (r) => ["scheduled", "full", "proposed"].includes(String(r.status)),
    limit: 10,
  });
  if (!events.length) return "No sessions are listed at the moment.";

  const rows = await Promise.all(
    events.map(async (e) => {
      if (e.status === "proposed") {
        const i = await countInterest(e.id);
        return {
          id: e.id, title: e.title, status: "proposed",
          note: `no date yet — ${i.votes} of ${i.threshold} people interested`,
        };
      }
      const s = await countSeats(e.id, Number(e.capacity) || 0);
      return {
        id: e.id, title: e.title, status: e.status,
        date: e.date ?? null, time: e.time ?? null, venue: e.venue ?? null,
        seatsLeft: s.left, capacity: Number(e.capacity) || 0,
      };
    })
  );
  return JSON.stringify(rows);
}

async function runSearchCatalogue(brand: BrandId, query: string): Promise<string> {
  const all = priceableByBrand[brand] ?? [];
  const q = String(query || "").toLowerCase().trim();
  const words = q.split(/\s+/).filter(Boolean);

  const scored = all
    .map((i) => {
      const hay = `${i.en} ${i.group} ${i.unit}`.toLowerCase();
      const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
      return { i, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  if (!scored.length) return `Nothing in the catalogue matches "${query}".`;

  /* Live prices, so an answer cannot quote a figure Superadmin has
     already changed. */
  const book = await loadPriceBook();
  return JSON.stringify(
    scored.map(({ i }) => ({
      id: i.id, name: i.en, unit: i.unit, group: i.group, kind: i.kind,
      price: book.price(i.id) ?? i.price,
      available: !book.outOfStock(i.id),
    }))
  );
}

async function runCheckMembership(no: string): Promise<string> {
  const wanted = String(no || "").trim().toUpperCase();
  if (!wanted) return "No membership number given.";
  const rows = await list("members", {
    where: (r) => String(r.membershipNo ?? "").toUpperCase() === wanted,
    limit: 1,
  });
  const m = rows[0];
  if (!m) return JSON.stringify({ found: false });
  /* Only what the holder already knows. A chat window is not a place to
     hand back a date of birth or a mobile number on request. */
  return JSON.stringify({
    found: true,
    membershipNo: m.membershipNo,
    validUpTo: m.validUpTo ?? null,
    status: m.status ?? "active",
  });
}

/* ---------------------------------------------------------------- */
/* WRITE tools — turned into a proposal, never run                   */
/* ---------------------------------------------------------------- */

function toProposal(brand: BrandId, name: string, args: Record<string, unknown>): Proposal | null {
  const person = String(args.name ?? "").trim();
  const phone = phone10(args.phone);

  switch (name) {
    case "propose_booking": {
      const eventId = String(args.eventId ?? "").trim();
      const seats = Math.max(1, Math.min(4, Number(args.seats) || 1));
      if (!eventId || !person || phone.length !== 10) return null;
      return {
        kind: "booking", brand,
        summary: [
          { label: "Name", value: person },
          { label: "Phone", value: phone },
          { label: "Seats", value: String(seats) },
          ...(args.membershipNo ? [{ label: "Membership", value: String(args.membershipNo) }] : []),
          ...(args.email ? [{ label: "Email", value: String(args.email) }] : []),
        ],
        endpoint: `/api/events/${encodeURIComponent(eventId)}/book`,
        payload: {
          name: person, phone, seats,
          email: String(args.email ?? ""),
          membershipNo: String(args.membershipNo ?? ""),
          notes: String(args.notes ?? ""),
        },
        confirmLabel: `Book ${seats} seat${seats > 1 ? "s" : ""}`,
      };
    }
    case "propose_interest": {
      const eventId = String(args.eventId ?? "").trim();
      if (!eventId || phone.length !== 10) return null;
      return {
        kind: "interest", brand,
        summary: [
          ...(person ? [{ label: "Name", value: person }] : []),
          { label: "Phone", value: phone },
        ],
        endpoint: `/api/events/${encodeURIComponent(eventId)}/interest`,
        payload: { name: person, phone },
        confirmLabel: "Register my interest",
      };
    }
    case "propose_order": {
      const raw = Array.isArray(args.lines) ? (args.lines as Record<string, unknown>[]) : [];
      const known = new Set((priceableByBrand[brand] ?? []).map((i) => i.id));
      /* An id the catalogue does not contain is dropped, not passed on.
         The order route would price it at zero and flag it; refusing it
         here means a hallucinated id never reaches the order book. */
      const lines = raw
        .map((l) => ({ id: String(l.id ?? "").trim(), qty: Math.max(1, Math.min(99, Number(l.qty) || 1)) }))
        .filter((l) => known.has(l.id));
      if (!lines.length || !person || phone.length !== 10) return null;

      const byId = new Map((priceableByBrand[brand] ?? []).map((i) => [i.id, i]));
      return {
        kind: "order", brand,
        summary: [
          ...lines.map((l) => ({
            label: byId.get(l.id)?.en ?? l.id,
            value: `× ${l.qty}`,
          })),
          { label: "Name", value: person },
          { label: "Phone", value: phone },
          ...(args.address ? [{ label: "Deliver to", value: String(args.address) }] : []),
        ],
        endpoint: "/api/orders",
        payload: {
          brand, lines, name: person, phone,
          email: String(args.email ?? ""),
          address: String(args.address ?? ""),
          notes: String(args.notes ?? ""),
        },
        confirmLabel: "Review and pay",
      };
    }
    case "propose_enquiry": {
      const notes = String(args.notes ?? "").trim();
      if (!person || phone.length !== 10 || !notes) return null;
      return {
        kind: "enquiry", brand,
        summary: [
          { label: "Name", value: person },
          { label: "Phone", value: phone },
          ...(args.service ? [{ label: "About", value: String(args.service) }] : []),
          { label: "Your message", value: notes },
        ],
        endpoint: "/api/enquiries",
        payload: {
          brand, name: person, phone,
          email: String(args.email ?? ""),
          service: String(args.service ?? ""),
          notes,
        },
        confirmLabel: "Send to the office",
      };
    }
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- */

export async function runAgent(
  brand: BrandId,
  system: string,
  question: string,
  history: ChatTurn[]
): Promise<{ answer: string | null; proposal: Proposal | null }> {
  if (!KEY) return { answer: null, proposal: null };

  const tools = toolsFor(brand);
  const messages: Msg[] = [
    { role: "system", content: `${system}\n\n${AGENT_RULES}` },
    ...history.slice(-6),
    { role: "user", content: question },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    for (let round = 0; round <= MAX_ROUNDS; round++) {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.2,
          max_tokens: 700,
          messages,
          tools,
          /* On the last round the tools are withdrawn, so the model has
             to answer in words instead of calling something it will
             never get a result for. */
          tool_choice: round === MAX_ROUNDS ? "none" : "auto",
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("[agent]", res.status, (await res.text()).slice(0, 300));
        return { answer: null, proposal: null };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string; tool_calls?: ToolCall[] } }[];
      };
      const msg = json.choices?.[0]?.message;
      const calls = msg?.tool_calls ?? [];

      if (!calls.length) {
        return { answer: msg?.content?.trim() || null, proposal: null };
      }

      messages.push(msg as Msg);

      /* A write call ends the turn. It is a proposal, not an action. */
      for (const c of calls) {
        if (WRITE_TOOLS.has(c.function.name)) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(c.function.arguments || "{}"); } catch { /* malformed */ }
          const proposal = toProposal(brand, c.function.name, args);
          if (proposal) {
            return {
              answer: msg?.content?.trim() || null,
              proposal,
            };
          }
          /* Not enough detail to propose anything — tell the model so it
             asks for what is missing rather than trying again blind. */
          messages.push({
            role: "tool",
            tool_call_id: c.id,
            content: "Not enough detail. Ask the user for the missing fields — a full name and a 10-digit mobile number are always required — then propose again.",
          });
        }
      }

      /* Read calls run and feed back in. */
      for (const c of calls) {
        if (WRITE_TOOLS.has(c.function.name)) continue;
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(c.function.arguments || "{}"); } catch { /* malformed */ }

        let out = "That tool is not available here.";
        try {
          if (c.function.name === "find_sessions") out = await runFindSessions();
          else if (c.function.name === "search_catalogue") out = await runSearchCatalogue(brand, String(args.query ?? ""));
          else if (c.function.name === "check_membership") out = await runCheckMembership(String(args.membershipNo ?? ""));
        } catch {
          out = "That lookup failed. Tell the user you could not check just now.";
        }
        messages.push({ role: "tool", tool_call_id: c.id, content: out });
      }
    }
    return { answer: null, proposal: null };
  } catch (e) {
    console.error("[agent]", e instanceof Error ? e.message : e);
    return { answer: null, proposal: null };
  } finally {
    clearTimeout(timer);
  }
}
