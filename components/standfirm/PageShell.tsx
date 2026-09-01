"use client";

/** Shared masthead for the firm's flat pages (About, Team, FAQs…). */
import { sf } from "@/config/standfirm.config";

export default function PageShell({
  kicker, title, lead, image = "/media/stills/scene-2.jpg", children,
}: {
  kicker: string; title: string; lead: string; image?: string; children: React.ReactNode;
}) {
  return (
    <main id="main">
      <section className="relative overflow-hidden bg-obsidian-deep pb-14 pt-36 md:pt-44">
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.18]" style={{ backgroundImage: `url(${image})` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep via-obsidian-deep/90 to-obsidian" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <p className="kicker mb-4">{kicker}</p>
          <h1 className="font-serif text-4xl leading-tight gold-text md:text-6xl">{title}</h1>
          <p className="prose-justify mx-auto mt-6 max-w-2xl text-center font-sans text-[15px] leading-relaxed text-ivory-dim">
            {lead}
          </p>
          <p className="mt-5 font-sans text-[10px] uppercase tracking-luxe text-ivory-faint">{sf.reg}</p>
        </div>
      </section>
      {children}
    </main>
  );
}
