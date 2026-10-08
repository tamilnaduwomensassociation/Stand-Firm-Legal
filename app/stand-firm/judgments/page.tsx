import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageShell from "@/components/standfirm/PageShell";
import SFContact from "@/components/standfirm/SFContact";
import { caseStudies } from "@/config/site.config";

export const metadata: Metadata = {
  title: "Judgments & Case Notes",
  description: "Notes on decided points of law, written up by Stand Firm Legal Associates for clients and practitioners.",
};

export default function JudgmentsPage() {
  return (
    <PageShell
      kicker="Case Notes"
      title="Judgments"
      lead="Notes on points that come up often — what the law actually says, and what it means for someone standing in front of it. These are summaries of law, not accounts of our own clients' matters, which stay confidential."
      image="/media/stills/scene-5.jpg"
    >
      <section className="bg-obsidian section-pad">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((c) => (
            <Link
              key={c.slug}
              href={`/case-studies/${c.slug}`}
              className="group flex flex-col rounded-2xl glass gold-border p-7 transition-all duration-500 hover:border-gold/70"
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="font-serif text-3xl gold-text">{c.no}</span>
                <ArrowUpRight size={16} className="mt-2 text-ivory-faint transition-colors group-hover:text-gold" />
              </div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-gold/80">{c.area}</p>
              <h2 className="mt-2 font-serif text-xl leading-snug text-ivory">{c.en}</h2>
              <p className="prose-justify mt-3 flex-1 font-sans text-[12.5px] leading-relaxed text-ivory-dim line-clamp-4">
                {c.result}
              </p>
            </Link>
          ))}
        </div>
      </section>
      <SFContact />
    </PageShell>
  );
}
