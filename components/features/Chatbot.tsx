"use client";

/**
 * AI LEGAL ASSISTANT — frosted-glass panel, typing animation,
 * suggested questions, and a deep on-device knowledge base covering
 * Indian & Tamil Nadu law: the 2023 criminal codes, property and
 * registration (TN rates), family law, consumer, MACT, labour,
 * MSME, business registrations, women's rights and legal aid.
 * Swap `answer()` for an LLM API route to go fully generative.
 * Every reply is general information, not legal advice.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Send, Sparkles, X } from "lucide-react";
import { site } from "@/config/site.config";
import ThinkingOrb, { type OrbState } from "@/components/ui/ThinkingOrb";

type Msg = { from: "bot" | "user"; text: string };

/**
 * A PROPOSAL IS NOT AN ACTION.
 *
 * The assistant can work out that someone wants two seats at Saturday's
 * session, and it can fill in the form. It cannot press the button.
 * What arrives here is every field it intends to send, rendered plainly
 * so a wrong number is visible before it is written — and the confirm
 * button is the customer's, not the model's.
 *
 * The POST goes to the same endpoint the ordinary form uses. Seats are
 * re-counted and prices re-derived there, so a proposal that has gone
 * stale while it sat on screen fails exactly as a form submission
 * would, rather than booking a seat that no longer exists.
 */
type Proposal = {
  kind: "booking" | "interest" | "order" | "enquiry";
  summary: { label: string; value: string }[];
  endpoint: string;
  payload: Record<string, unknown>;
  confirmLabel: string;
};

/**
 * The chips are also how anyone finds out the assistant can now DO
 * things rather than only explain them. A capability nobody is told
 * about is a capability nobody uses, so each brand leads with one
 * action it can actually take.
 */
const SUGGESTED_BY_BRAND: Record<string, string[]> = {
  tnwla: [
    "Book me a seat at the next session",
    "What sessions are coming up?",
    "Free legal aid for women",
    "Divorce process in Tamil Nadu",
    "New criminal laws 2024?",
    "Is my membership still valid?",
  ],
  "stand-firm": [
    "I need help with a property matter",
    "TN stamp duty for a sale deed?",
    "How do I get an encumbrance certificate?",
    "Cheque bounce case",
    "MSME delayed payment recovery",
  ],
  jeni: [
    "Order 2 bottles of coconut oil",
    "What coconut oil do you have?",
    "Show me sarees",
    "Do you deliver outside Chennai?",
    "I want a wholesale quote",
  ],
  harmonic: [
    "Register me for the basic class",
    "What dhoobam do you sell?",
    "When is the free meditation?",
    "What happens in a session?",
  ],
};

const DISCLAIMER = " (General information, not legal advice — consult us for your specific case.)";

/* Keyword-scored knowledge base — India & Tamil Nadu */
const KB: { keys: string[]; a: string }[] = [
  { keys: ["bns", "ipc", "new criminal", "bharatiya nyaya", "criminal law 2024", "criminal laws"], a: "From 1 July 2024, India replaced its colonial-era criminal codes: the Bharatiya Nyaya Sanhita (BNS) replaced the IPC, the Bharatiya Nagarik Suraksha Sanhita (BNSS) replaced the CrPC, and the Bharatiya Sakshya Adhiniyam (BSA) replaced the Evidence Act. Key shifts: community service as punishment, mob-lynching as a specific offence, zero-FIR and e-FIR recognition, and time-bound investigation/charge-sheet norms. Old-code cases continue under the old law." },
  { keys: ["stamp duty", "registration charge", "sale deed cost", "property tax registration"], a: "In Tamil Nadu, a sale deed attracts stamp duty of 7% of the property's market value plus a 4% registration fee — about 11% total. Gift/settlement in favour of family members enjoys concessional rates (typically 1% each, capped). We compute the exact duty for your document before you pay." },
  { keys: ["ec", "encumbrance"], a: "An Encumbrance Certificate (EC) lists all registered transactions on a property — sales, mortgages, releases. In TN it's issued by the Sub-Registrar (or online via TNREGINET) for the period you request. Always verify 30+ years of EC before purchase. We obtain and legally review ECs for you." },
  { keys: ["patta", "chitta"], a: "Patta is the TN revenue record showing lawful possession of land; chitta shows land classification. After purchase, apply for patta transfer through the Taluk office or TN e-Sevai. It is essential for enjoyment and future sale — we handle patta name transfer end-to-end." },
  { keys: ["divorce", "mutual consent"], a: "Divorce in India depends on the marriage law: Hindu Marriage Act 1955 (S.13 fault grounds; S.13B mutual consent — 6-18 month process with a cooling-off that courts may waive), Special Marriage Act for civil marriages, and personal laws for other communities. In Chennai, family courts sit at the Madras High Court campus. Maintenance, custody and property claims travel with the case — plan them together." },
  { keys: ["maintenance", "alimony"], a: "Maintenance can be claimed under S.144 BNSS (the old S.125 CrPC — quick, any religion), under the Hindu Adoption & Maintenance Act, or within divorce proceedings. Courts weigh income, standard of living and dependants. Interim maintenance can be ordered early in the case." },
  { keys: ["custody", "child"], a: "Child custody follows the child's welfare above all — courts may award physical custody to one parent with visitation, or shared arrangements. For Hindus, the Hindu Minority & Guardianship Act applies alongside the Guardians & Wards Act. Mothers are ordinarily preferred for children under five." },
  { keys: ["domestic violence", "dv act", "498a", "dowry", "harassment"], a: "Women facing cruelty or dowry harassment have three parallel remedies: the Protection of Women from Domestic Violence Act 2005 (protection, residence and monetary orders through a Magistrate), BNS S.85/86 (the old 498-A cruelty offence), and the Dowry Prohibition Act. TNWLA and our firm offer confidential counselling and free first consultations for domestic-abuse survivors." },
  { keys: ["legal aid", "free legal", "lok adalat"], a: "Under the Legal Services Authorities Act 1987, every woman is entitled to FREE legal aid regardless of income — as are children, SC/ST persons and those below the income ceiling. In Tamil Nadu, apply to TNSLSA or the District Legal Services Authority. Lok Adalats settle cases by compromise with no court fee. As a women-law-association firm, helping you access these rights is part of our mission." },
  { keys: ["bail", "anticipatory", "arrest", "fir"], a: "On arrest you must be produced before a Magistrate within 24 hours. Bail in bailable offences is a right; in non-bailable offences it is the court's discretion. Anticipatory bail (S.482 BNSS) can protect you before arrest. An FIR can be filed at any police station (Zero FIR) and TN also accepts e-FIRs for certain offences. Call us immediately in any arrest situation." },
  { keys: ["consumer", "deficiency", "refund", "complaint against"], a: "Under the Consumer Protection Act 2019: District Commissions hear claims up to ₹50 lakh, State up to ₹2 crore, National above that. You can file where YOU live or work — and e-filing is available (e-daakhil). Limitation is 2 years. Court fee is modest and no lawyer is mandatory, though representation sharply improves outcomes." },
  { keys: ["accident", "mact", "compensation", "insurance claim"], a: "Motor accident victims (or dependants) claim through the Motor Accidents Claims Tribunal (MACT). Compensation covers income loss, medical costs, future prospects (as per Pranay Sethi), and fixed sums for consortium. Claims should be filed within 6 months of the accident under S.166(3) MV Act. Insurers routinely underpay — never sign a discharge without advice." },
  { keys: ["labour", "termination", "gratuity", "pf", "salary unpaid", "wages"], a: "Wrongful termination, unpaid wages and gratuity have distinct remedies: the Industrial Disputes Act (conciliation → Labour Court), the Payment of Gratuity Act (payable after 5 years of continuous service), and PF claims via the EPFO. Chennai's labour courts sit near the High Court. Time limits are short — act quickly." },
  { keys: ["msme", "samadhaan", "delayed payment", "recovery of dues"], a: "Registered MSMEs whose buyers delay payment beyond 45 days can file on the MSME Samadhaan portal — the Facilitation Council can award compound interest at 3x the RBI bank rate, and buyers must deposit 75% of the award to appeal. Udyam registration is the gateway; we handle both registration and recovery proceedings." },
  { keys: ["gst", "registration threshold"], a: "GST registration is mandatory above ₹40 lakh turnover for goods (₹20 lakh for services) in Tamil Nadu, and for all inter-state suppliers and e-commerce sellers regardless of turnover. Composition scheme is available up to ₹1.5 crore. We file registrations, returns and handle notices." },
  { keys: ["company", "incorporation", "startup", "llp"], a: "A private limited company or LLP is incorporated through the MCA's SPICe+ system — name approval, DIN, PAN/TAN and incorporation in one flow, typically 7-10 days. Minimum: 2 directors/partners. We advise on structure (Pvt Ltd vs LLP vs OPC vs partnership) based on liability, tax and investment plans." },
  { keys: ["will", "probate", "inheritance", "succession"], a: "A will needs no stamp paper and no registration to be valid — just the testator's signature and two attesting witnesses. But registering it (₹ nominal fee) makes challenges far harder. Without a will, succession follows personal law (Hindu Succession Act gives daughters equal coparcenary rights since 2005). Probate is generally needed for wills in Chennai city limits." },
  { keys: ["cheque bounce", "138", "cheque"], a: "A dishonoured cheque triggers S.138 NI Act: send a demand notice within 30 days of the return memo; the drawer has 15 days to pay; then you may file a criminal complaint within 1 month before the Magistrate. Punishment can be up to 2 years' imprisonment and twice the cheque amount. Interim compensation of 20% can be ordered." },
  { keys: ["rti", "information"], a: "Under the RTI Act 2005, any citizen can seek information from public authorities for ₹10; a reply is due in 30 days (48 hours where life/liberty is involved). First appeal lies within the department, second to the State/Central Information Commission." },
  { keys: ["senior citizen", "parents maintenance"], a: "Under the Maintenance and Welfare of Parents & Senior Citizens Act 2007, elderly parents can claim maintenance up to ₹10,000/month through Tribunals (RDO in TN) — and property transfers made on condition of care can be CANCELLED if children neglect them." },
  { keys: ["marriage registration", "register marriage"], a: "In TN, marriages are registered under the Hindu Marriage Act or Tamil Nadu Registration of Marriages Act 2009 through the Sub-Registrar (TNREGINET online booking). Needed: joint application, age proof, address proof, wedding invitation/photos and three witnesses. We complete registrations same-week including certificate delivery." },
  { keys: ["poa", "power of attorney"], a: "A General POA authorises broad dealings; a Special POA a single act. POAs for immovable property executed in TN require registration and adjudicated stamp duty; NRI POAs must be adjudicated within 4 months of receipt in India. Post-2011 (Suraj Lamp), sales via GPA are not valid transfers — courts insist on registered sale deeds." },
  { keys: ["writ", "high court", "fundamental right"], a: "Writ petitions under Article 226 before the Madras High Court can challenge government action — habeas corpus (illegal detention), mandamus (compel duty), certiorari (quash orders), prohibition, quo warranto. Writs are powerful, fast remedies where fundamental or statutory rights are breached." },
  { keys: ["tnwla", "association", "women law", "member"], a: `The Tamilnadu Women Law Association — Madras (TN Govt Reg 194/2023) empowers women lawyers with work opportunities, provides free legal aid for poor and marginalised people (especially women), and counsels victims of marital disputes and domestic abuse. You can apply for membership right on this site — open the Form tab. Admission fee ₹500/₹1000, subscription ₹50/₹100 per month.` },
  { keys: ["fee", "charges", "cost"], a: "Fees depend on the matter's nature and complexity. After your first consultation you receive a clear written estimate — no hidden charges, ever. First consultations for domestic-abuse survivors are free." },
  { keys: ["consult", "book", "appointment", "contact", "address", "office", "where"], a: `Book right on this page (scroll to "Begin Your Case"), call ${site.phones[0]}, or WhatsApp us. Chambers: ${site.address}. Landline ${site.landline}. Same-day slots are usually available.` },
];

function answer(q: string): string {
  const s = q.toLowerCase();
  let best: { score: number; a: string } = { score: 0, a: "" };
  for (const item of KB) {
    const score = item.keys.reduce((n, k) => n + (s.includes(k) ? k.split(" ").length + 1 : 0), 0);
    if (score > best.score) best = { score, a: item.a };
  }
  if (best.score > 0) return best.a + DISCLAIMER;
  return `I can help with Indian & Tamil Nadu law — property & registration, the new criminal codes, family matters, consumer complaints, accident claims, labour, MSME, company registrations, wills, writs and women's rights. Ask me anything specific, or call ${site.phones[0]} to speak with our advocates.`;
}

/**
 * `brand` names whose assistant this is. It defaults to the
 * association because the association's site is where the chatbot
 * started — but on /stand-firm the panel must say Stand Firm, or the
 * visitor is once again being greeted by an organisation whose page
 * they are not on.
 */
export default function Chatbot({
  brandIcon,
  brand = "TNWLA",
  brandId = "tnwla",
  greeting,
}: {
  brandIcon?: string;
  brand?: string;
  /** Which system prompt /api/chat should use. See lib/server/grok.ts. */
  brandId?: "tnwla" | "stand-firm" | "jeni" | "harmonic";
  greeting?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "bot",
      text: greeting ??
        `Vanakkam! I am the ${brand} legal assistant — trained on Indian and Tamil Nadu law. Ask me about property, family, criminal, consumer, business matters or women's rights.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  /* "connecting" while the request is still in flight, "thinking" once
     it has been accepted — two states the visitor can actually feel the
     difference between on a slow connection. */
  const [orbState, setOrbState] = useState<OrbState>("connecting");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [confirming, setConfirming] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("sf:chat", openChat);
    return () => window.removeEventListener("sf:chat", openChat);
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing, proposal]);

  /** Type an answer out, however it was produced. */
  const reveal = (full: string) => {
    setMsgs((m) => [...m, { from: "bot", text: "" }]);
    let i = 0;
    const iv = setInterval(() => {
      i += 4;
      setMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { from: "bot", text: full.slice(0, i) };
        return copy;
      });
      if (i >= full.length) clearInterval(iv);
    }, 16);
  };

  /**
   * Ask Grok first, fall back to the keyword answers.
   *
   * The fallback is not a degraded mode — it is the same knowledge base
   * this component has always used, and it is genuinely good on the
   * questions it covers. Grok adds the ability to answer everything
   * else. If there is no key, if the call fails, or if it takes too
   * long, the visitor gets the keyword answer and never learns anything
   * went wrong; the one thing that never happens is a fabricated reply.
   */
  const send = async (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");
    /* A new question supersedes an unconfirmed proposal — leaving a
       stale confirm button on screen invites the wrong one being
       pressed after the conversation has moved on. */
    setProposal(null);
    setTyping(true);
    setOrbState("connecting");

    let full: string | null = null;
    try {
      const history = msgs.slice(-6).map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brandId, question: text, history }),
      });
      /* The moment the server answers the socket, the wait stops being
         "can we reach it" and becomes "what will it say". */
      setOrbState("thinking");
      if (res.ok) {
        const d = await res.json();
        if (typeof d.answer === "string" && d.answer.trim()) full = d.answer.trim() + DISCLAIMER;
        if (d.proposal && typeof d.proposal === "object") {
          setProposal(d.proposal as Proposal);
          /* The model may propose without saying anything; the card has
             to be introduced or it appears from nowhere. */
          if (!full) full = "Here is what I have — please check it and confirm.";
        }
      }
    } catch {
      /* Offline, or the route is unreachable. The keyword answer
         below is a complete reply, not an apology. */
    }

    setOrbState("settling");
    setTyping(false);
    reveal(full ?? answer(text));
  };

  /** The customer's press — the only thing in this component that writes. */
  const confirm = async () => {
    if (!proposal || confirming) return;
    setConfirming(true);
    try {
      const res = await fetch(proposal.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal.payload),
      });
      const d = await res.json().catch(() => null);

      if (!res.ok) {
        /* The server's own words. "Only 1 seat left" is a useful thing
           to be told; "something went wrong" is not. */
        reveal(d?.error ? `That did not go through — ${d.error}` : "That did not go through. Please try again, or call the office.");
        setProposal(null);
        return;
      }

      if (proposal.kind === "order") {
        /* An order is registered, not paid. Sending someone away
           believing it is settled would be the worst possible outcome
           of this whole feature. */
        reveal(
          `Your order is registered${d?.order?.id ? ` as ${d.order.id}` : ""}. ` +
          "It is not paid yet — open the shop to pay, or the office will call you to take payment."
        );
      } else if (proposal.kind === "booking") {
        reveal(
          `Booked${d?.booking?.ref ? ` — your reference is ${d.booking.ref}` : ""}. ` +
          (typeof d?.seatsLeft === "number" ? `${d.seatsLeft} seat${d.seatsLeft === 1 ? "" : "s"} left. ` : "") +
          "Please bring this reference with you."
        );
      } else if (proposal.kind === "interest") {
        reveal("Noted — you will be told as soon as a date is set.");
      } else {
        reveal("Sent to the office. Someone will call you on that number.");
      }
      setProposal(null);
    } catch {
      reveal("That did not go through — you may be offline. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="fixed bottom-24 right-6 z-[95] flex h-[540px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl glass !bg-obsidian/95 gold-border shadow-2xl"
          role="dialog"
          aria-label="AI legal assistant"
        >
          <div className="flex items-center justify-between border-b border-gold/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gold-faint text-gold">
                {brandIcon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brandIcon} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Sparkles size={17} />
                )}
              </span>
              <div>
                <p className="font-serif text-ivory">{brand} Assistant</p>
                <p className="text-[10px] uppercase tracking-luxe text-gold/80">India & TN legal knowledge</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="text-ivory-dim hover:text-gold"><X size={18} /></button>
          </div>

          <div ref={bodyRef} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto px-5 py-4 overscroll-contain">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={m.from === "bot"
                  ? "max-w-[88%] rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3 font-sans text-sm text-ivory/90 leading-relaxed"
                  : "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gold/90 px-4 py-3 font-sans text-sm text-black"}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              /* The orb replaces three bouncing dots. Dots say something
                 is happening; they cannot say what, and a legal
                 assistant that looks frozen is one a visitor abandons.
                 The state changes as the request progresses, and the
                 live region gives a screen reader the word rather than
                 the picture. */
              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
                <ThinkingOrb state={orbState} size={34} speed={0.5} brandId={brandId} />
                <span className="font-sans text-[12px] text-ivory-dim">
                  {orbState === "connecting" ? "Reaching the assistant…" : "Thinking…"}
                </span>
                <span className="sr-only" role="status" aria-live="polite">
                  The assistant is thinking
                </span>
              </div>
            )}

            {/* ---------- the confirmation card ---------- */}
            {proposal && !typing && (
              <div className="rounded-2xl border border-gold/40 bg-gold-faint p-4">
                <p className="mb-3 font-sans text-[10px] uppercase tracking-widest text-gold">
                  Check before confirming
                </p>

                <dl className="space-y-1.5">
                  {proposal.summary.map((r, i) => (
                    <div key={i} className="flex gap-3 text-[12.5px]">
                      <dt className="w-24 shrink-0 font-sans text-ivory-faint">{r.label}</dt>
                      <dd className="min-w-0 flex-1 break-words font-sans text-ivory">{r.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-3 font-sans text-[11px] leading-relaxed text-ivory-dim">
                  {proposal.kind === "order"
                    ? "Nothing is ordered or charged until you press this. The price is calculated by the office, not by me."
                    : "Nothing is recorded until you press this."}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={confirm}
                    disabled={confirming}
                    className="flex h-10 items-center gap-2 rounded-full bg-gold px-5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-50"
                  >
                    {confirming ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {proposal.confirmLabel}
                  </button>
                  <button
                    onClick={() => { setProposal(null); reveal("Cancelled — nothing was recorded. Tell me what to change."); }}
                    disabled={confirming}
                    className="flex h-10 items-center rounded-full gold-border px-4 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:text-gold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none]">
            {(SUGGESTED_BY_BRAND[brandId] ?? SUGGESTED_BY_BRAND.tnwla).map((s) => (
              <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full gold-border px-3.5 py-1.5 text-[11px] font-sans text-ivory-dim hover:text-gold hover:border-gold/60 transition-all">
                {s}
              </button>
            ))}
          </div>

          <form className="flex items-center gap-3 border-t border-gold/20 px-5 py-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any legal matter…"
              aria-label="Message the assistant"
              className="flex-1 bg-transparent font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
            />
            <button type="submit" aria-label="Send" className="text-gold hover:text-gold-bright transition-colors"><Send size={17} /></button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
