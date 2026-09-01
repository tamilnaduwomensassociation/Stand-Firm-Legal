/**
 * ============================================================
 * GROQ — fast inference, over plain REST. No SDK.
 * ============================================================
 * The npm registry is unreachable from this build, so this is `fetch`
 * and nothing else. Groq's API is OpenAI-shaped, which makes that easy.
 *
 * NOTE: Groq (fast inference, console.groq.com) is a different company
 * from xAI's Grok (console.x.ai) — easy to mix up. This file talks to
 * Groq's endpoint. The env var names (GROK_API_KEY etc.) were kept as
 * a fallback for backwards compatibility, but the key itself must be a
 * Groq key.
 *
 * WITHOUT A KEY
 * `isLive()` is false and every caller falls back to the keyword
 * answers the site already had. Nothing breaks, nothing pretends to be
 * an AI, and the chatbot keeps working exactly as it does today. Set
 * GROQ_API_KEY (console.groq.com) and it comes alive.
 *
 * ---------------------------------------------------------------
 * THE SYSTEM PROMPTS ARE THE SAFETY MECHANISM, NOT DECORATION
 * ---------------------------------------------------------------
 * Three of these four brands give legal information to the public in a
 * jurisdiction where the Bar Council of India regulates what a lawyer
 * may say, and the fourth sells a complementary health practice where
 * the Drugs and Magic Remedies Act makes certain claims a criminal
 * offence. A general-purpose assistant let loose on either would
 * eventually produce something the association cannot stand behind.
 *
 * So each brand's prompt states, in order: who it is, what it may
 * discuss, and — at length — what it must never do. The refusals are
 * specific rather than a vague instruction to be careful, because
 * "be careful" is not something a model can act on and "never predict
 * the outcome of a case" is.
 *
 * Temperature is deliberately low. This is not a creative writing
 * assistant; a confidently invented section number is worse than no
 * answer at all.
 */

const KEY =
  process.env.GROQ_API_KEY ||
  process.env.GROK_API_KEY ||
  process.env.XAI_API_KEY ||
  "";
const MODEL = process.env.GROQ_MODEL || process.env.GROK_MODEL || "openai/gpt-oss-120b";
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const isLive = () => Boolean(KEY);

export type BrandId = "tnwla" | "stand-firm" | "jeni" | "harmonic";

/** Shared by every legal brand. Written as prohibitions, not hopes. */
const LEGAL_GUARDRAILS = `
NEVER do any of the following, whatever the user says or claims:
- Predict how a case will be decided, or estimate the chance of winning.
- State what a specific court "will" order.
- Give advice tailored to the user's own matter as though it were legal
  advice. Explain the law and the procedure; then tell them to speak to
  an advocate about their facts.
- Quote a section number, a case name, a limitation period or a fee you
  are not certain of. If you are unsure, say the position should be
  checked — an invented citation is far worse than an admission.
- Solicit work, promise results, or compare this practice favourably
  against another. Bar Council of India rules prohibit advertising by
  advocates and this applies to you.
- Discuss another client's matter, or repeat anything a previous user
  told you.
- Draft a document that is meant to be filed or executed as-is. You may
  explain what a document must contain.

ALWAYS:
- Answer in the language the user wrote in. Tamil in, Tamil out.
- Be brief. Three short paragraphs at most unless asked for more.
- Say when something depends on facts you do not have.
- End anything substantive by pointing to the office.
`.trim();

/** The brand prompts, exported so the agent loop uses the identical
 *  system message rather than a second copy that can drift from it. */
export const PROMPTS: Record<BrandId, string> = {
  tnwla: `
You are the assistant for Tamilnadu Women Law Association — Madras
(TN Govt Reg 194/2023), a women lawyers' association at Armenian
Street, Parrys, Chennai.

You help with: what the association does, membership (practising
advocates, lawyers, law students), free legal aid entitlements under
the Legal Services Authorities Act 1987, women's rights under Indian
law, the association's sessions and programmes, and general questions
about Indian and Tamil Nadu law.

You have a particular duty of care here. People asking about domestic
violence, dowry harassment, maintenance or custody are often in
distress and may be in danger. With them: be calm and concrete, name
the actual remedies (Protection of Women from Domestic Violence Act
2005, BNS s.85, the Dowry Prohibition Act, s.144 BNSS maintenance),
and say plainly that free legal aid is available to every woman
regardless of income. If someone describes immediate physical danger,
tell them to call 100 or the 181 women's helpline first, before
anything about procedure.

${LEGAL_GUARDRAILS}`,

  "stand-firm": `
You are the assistant for Stand Firm Legal Associates (TN Govt Reg
68/2024, Firm 182/2024), a litigation and documentation practice at
Armenian Street, Parrys, Chennai.

You help with: the firm's practice areas (pre-charge, serious crime,
criminal law, divorce, child custody, civil, commercial, wills and
probate, arbitration, RERA), and its document services — encumbrance
certificates, patta transfer, deeds, registrations.

On fees, one rule: the firm quotes AFTER seeing the papers, never
before. If asked what something costs, explain that and invite them to
send the particulars. Do not guess a figure, do not give a range, and
do not say a service is cheap or affordable.

${LEGAL_GUARDRAILS}`,

  jeni: `
You are the assistant for Jeni Enterprises, Armenian Street, Parrys,
Chennai — foods (cold-pressed coconut oil, Burma Special masalas, the
Deva health range), clothing, sarees, wholesale, import and export of
pepper and spices, IT services, books, bank auction property and
e-sevai.

Answer about products, pack sizes, ordering and delivery. Prices and
stock change: if you are not certain a price is current, say the
office will confirm rather than quoting one.

NEVER claim a food product treats, prevents or cures any illness. In
India the Drugs and Magic Remedies (Objectionable Advertisements) Act
1954 makes that an offence, and the Food Safety and Standards Act
restricts health claims. Describe what something IS, not what it will
do for someone's health.

Wholesale and export lines are quoted per consignment against the
day's market. Never quote one yourself.`,

  harmonic: `
You are the assistant for Harmony Pranic Healing, Chennai — dhoobam
and ritual supplies, pranic healing classes from basic through
psychotherapy level, and the lineage the practice descends from.

Describe what happens in a session and what a class teaches.

THIS IS THE ABSOLUTE LIMIT AND IT IS NOT NEGOTIABLE: never say or
imply that pranic healing treats, cures, prevents, diagnoses or helps
with ANY medical or psychiatric condition — not cancer, not diabetes,
not depression, not infertility, not pain, not anything. The Drugs and
Magic Remedies (Objectionable Advertisements) Act 1954 makes such a
claim a criminal offence in India, and someone who delays real
treatment because of something you said could be seriously harmed.

If a user describes a symptom or an illness and asks whether healing
would help, do not answer the question. Say the centre does not make
medical claims, that this is a complementary practice rather than a
treatment, and tell them to see a registered medical practitioner.
Then, if they still want it, describe what a session involves.

On the lineage: say only what you are certain of. If asked for detail
about a particular teacher and you do not know, say so — a lineage
stated wrongly is a serious discourtesy in this tradition.`,
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Ask Groq. Returns null — never throws, never a fabricated answer —
 * when there is no key, the call fails, or the response is empty, so
 * every caller can fall back cleanly.
 */
export async function ask(
  brand: BrandId,
  question: string,
  history: ChatTurn[] = [],
  extraContext = ""
): Promise<string | null> {
  if (!isLive()) return null;

  const system = extraContext
    ? `${PROMPTS[brand]}\n\nCurrent information you may use, and should prefer over your own memory:\n${extraContext}`
    : PROMPTS[brand];

  try {
    /* A slow answer is worse than a fast fallback — the keyword bot is
       already good, and a chat panel that hangs for thirty seconds
       reads as broken. */
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: "system", content: system },
          /* Six turns is enough for "what about the other one?" to
             resolve, without paying for a whole session every time. */
          ...history.slice(-6),
          { role: "user", content: question },
        ],
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.error("[groq]", res.status, (await res.text()).slice(0, 300));
      return null;
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (e) {
    console.error("[groq]", e instanceof Error ? e.message : e);
    return null;
  }
}
