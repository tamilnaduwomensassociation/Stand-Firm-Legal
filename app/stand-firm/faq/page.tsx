import type { Metadata } from "next";
import PageShell from "@/components/standfirm/PageShell";
import SFContact from "@/components/standfirm/SFContact";
import { faqs } from "@/config/site.config";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Common questions about instructing Stand Firm Legal Associates — consultations, documents, fees and confidentiality.",
};

export default function FaqPage() {
  return (
    <PageShell
      kicker="Before You Ask"
      title="Frequently Asked"
      lead="The questions the office answers most often. If yours is not here, call — it costs nothing to ask."
      image="/media/stills/blog-business.jpg"
    >
      <section className="bg-obsidian section-pad">
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl glass gold-border p-6 transition-all duration-300 open:border-gold/60">
              <summary className="cursor-pointer list-none font-serif text-lg text-ivory transition-colors marker:content-none group-open:text-gold">
                {f.q}
              </summary>
              <p className="prose-justify mt-4 border-t border-[var(--hairline)] pt-4 font-sans text-[13.5px] leading-relaxed text-ivory-dim">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
      <SFContact />
    </PageShell>
  );
}
