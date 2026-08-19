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
import { Send, Sparkles, X } from "lucide-react";
import { site } from "@/config/site.config";

type Msg = { from: "bot" | "user"; text: string };

const SUGGESTED = [
  "TN stamp duty for a sale deed?",
  "New criminal laws 2024?",
  "Divorce process in Tamil Nadu",
  "Free legal aid for women",
  "MSME delayed payment recovery",
  "Cheque bounce case",
];

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

export default function Chatbot({ brandIcon }: { brandIcon?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Vanakkam! I am the TNWLA legal assistant — trained on Indian and Tamil Nadu law. Ask me about property, family, criminal, consumer, business matters or women's rights." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("sf:chat", openChat);
    return () => window.removeEventListener("sf:chat", openChat);
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const full = answer(text);
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
    }, 900);
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
                <p className="font-serif text-ivory">TNWLA Assistant</p>
                <p className="text-[10px] uppercase tracking-luxe text-gold/80">India & TN legal knowledge</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="text-ivory-dim hover:text-gold"><X size={18} /></button>
          </div>

          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
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
              <div className="flex w-16 items-center gap-1 rounded-2xl bg-white/[0.06] px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none]">
            {SUGGESTED.map((s) => (
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
