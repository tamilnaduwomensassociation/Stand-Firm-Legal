import type { Metadata } from "next";
import { Check } from "lucide-react";
import PageShell from "@/components/standfirm/PageShell";
import SFContact from "@/components/standfirm/SFContact";
import { sf } from "@/config/standfirm.config";

export const metadata: Metadata = {
  title: "About the Firm",
  description: `${sf.name} — a litigation and documentation practice on Armenian Street, Parrys, Chennai, appearing before the Madras High Court and the courts and tribunals of Tamil Nadu.`,
};

const PRINCIPLES = [
  { t: "We tell you what a case is worth before you spend on it", d: "Some matters should be fought, some should be settled, and a few should never have been started. A client who is told that at the outset is better served than one who finds out in the third year." },
  { t: "One advocate stays with the matter", d: "The person who reads your papers is the person who argues them. Files are not passed down a chain, and you are not re-explaining your case to someone new at every hearing." },
  { t: "Costs are stated, not discovered", d: "Professional charges are quoted before work begins. Court fees, stamp duty and statutory levies are separate and are billed at actuals — never marked up." },
  { t: "The paperwork and the litigation sit together", d: "A property dispute usually starts as a document problem. Because the firm does both, the deed that has to be rectified and the suit that has to be filed are handled by the same office." },
];

export default function AboutPage() {
  return (
    <PageShell
      kicker="The Practice"
      title="Stand Firm Legal Associates"
      lead="A litigation and documentation practice at Parrys, Chennai. We appear before the Madras High Court, the City Civil and Sessions Courts, and the tribunals — and we handle the registrations and deeds that most disputes begin with."
      image="/media/stills/scene-1.jpg"
    >
      <section className="bg-obsidian section-pad">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sf.logoCard} alt={sf.name} className="mb-8 h-36 w-auto rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]" />
            <p className="kicker mb-3">How We Work</p>
            <h2 className="font-serif text-3xl gold-text md:text-4xl">Four things we hold to</h2>
            <p className="mt-5 font-sans text-sm leading-relaxed text-ivory-dim">
              None of these are unusual. They are simply written down, so a client can hold us
              to them.
            </p>
          </div>

          <ul className="space-y-4">
            {PRINCIPLES.map((p) => (
              <li key={p.t} className="rounded-2xl glass gold-border p-6">
                <div className="flex gap-3.5">
                  <Check size={17} className="mt-1 shrink-0 text-gold" />
                  <div>
                    <p className="font-serif text-lg leading-snug text-ivory">{p.t}</p>
                    <p className="prose-justify mt-2 font-sans text-[13px] leading-relaxed text-ivory-dim">{p.d}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-obsidian-deep section-pad">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="kicker mb-3">Where We Appear</p>
            <h2 className="font-serif text-3xl gold-text md:text-4xl">Courts &amp; Tribunals</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sf.courts.map((c) => (
              <div key={c} className="rounded-2xl glass gold-border p-6 text-center font-sans text-sm text-ivory-dim">{c}</div>
            ))}
          </div>
          <p className="mt-9 text-center font-sans text-[12px] uppercase tracking-widest text-gold/80">
            {sf.areaServed.join(" · ")}
          </p>
        </div>
      </section>

      <SFContact />
    </PageShell>
  );
}
