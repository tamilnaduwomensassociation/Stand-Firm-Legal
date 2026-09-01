import type { Metadata } from "next";
import PageShell from "@/components/standfirm/PageShell";
import SFContact from "@/components/standfirm/SFContact";
import { sf } from "@/config/standfirm.config";
import { lawyers, leadersPanel, namedPartners } from "@/config/site.config";

/**
 * Who appears on this page.
 *
 * The President led it alone, which left a single card floating in a
 * three-column grid — and the Vice President, who is an advocate of the
 * same standing, appeared nowhere on the firm's side of the site at all.
 * She is read from leadersPanel by position rather than by index, so if
 * the office changes hands the page follows the config instead of
 * needing an edit here.
 */
const vicePresident = leadersPanel.find((l) => /vice\s*president/i.test(l.position));

const advocates = [
  ...lawyers,
  ...(vicePresident
    ? [{
        name: `Adv. ${vicePresident.name}`,
        role: vicePresident.position,
        focus: `${vicePresident.qualification} · ${vicePresident.position}, TNWLA Madras`,
        photo: vicePresident.photo,
      }]
    : []),
];

export const metadata: Metadata = {
  title: "Our Advocates",
  description: "The advocates of Stand Firm Legal Associates, Armenian Street, Parrys, Chennai.",
};

export default function TeamPage() {
  return (
    <PageShell
      kicker="The People"
      title="Our Advocates"
      lead="The advocate who reads your papers is the advocate who argues them. There is no chain to be passed down."
      image="/media/stills/team-2.jpg"
    >
      <section className="bg-obsidian section-pad">
        {/* Two advocates read better centred than pinned to the left of a
            three-column grid, so the grid tracks the number there are. */}
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {advocates.map((l) => (
            <article key={l.name} className="flex flex-col overflow-hidden rounded-2xl glass gold-border">
              {"photo" in l && typeof (l as { photo?: string }).photo === "string" ? (
                /*
                  THE WHOLE PHOTOGRAPH, NOT A CROP OF IT.

                  `object-cover` filled the frame by cutting whatever did
                  not fit — and these are portraits shot at 2:3, so a
                  short landscape frame sliced the head off. `contain`
                  fits the entire image inside a portrait frame instead,
                  on a soft ground, so both advocates appear in full and
                  the two cards still stand the same height.
                */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={(l as { photo: string }).photo}
                  alt={l.name}
                  className="aspect-[3/4] w-full bg-obsidian-soft object-contain object-center"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-obsidian-soft">
                  <span className="font-serif text-5xl gold-text">
                    {l.name.replace(/^Adv\.\s*/, "").charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-serif text-xl leading-snug text-ivory">{l.name}</h2>
                <p className="mt-1.5 font-sans text-[11px] uppercase tracking-widest text-gold">{l.role}</p>
                <p className="mt-3 flex-1 font-sans text-[12.5px] leading-relaxed text-ivory-dim">{l.focus}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      {/* ---------- Partnerships ----------
          Moved here from the association's advocates page. These are
          the firm's partners, so this is where they belong.

          The section renders only when a partner has a real name — see
          the note above sflaPartners in site.config for why an unnamed
          card is worse than an absent one. Name one and it returns. */}
      {namedPartners.length > 0 && (
      <section className="bg-obsidian-deep section-pad">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="kicker mb-3">{sf.short}</p>
            <h2 className="font-serif text-3xl gold-text md:text-4xl">Partnerships</h2>
            <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
              The partners who lead each side of the practice. A matter is taken by the
              partner whose area it falls in, and stays with them.
            </p>
          </div>

          <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {namedPartners.map((p, i) => (
              <article key={`${p.role}-${i}`} className="flex flex-col overflow-hidden rounded-2xl glass gold-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt={p.name} className="h-60 w-full object-cover" loading="lazy" />
                <div className="flex flex-1 flex-col p-7 text-center">
                  <h3 className="font-serif text-xl text-ivory">{p.name}</h3>
                  <p className="mt-1.5 font-sans text-sm text-gold">{p.role}</p>
                  <a
                    href="/stand-firm/contact"
                    className="mt-5 inline-block self-center rounded-full gold-border px-5 py-2 font-sans text-[11px] uppercase tracking-luxe text-gold transition-all duration-300 hover:bg-gold hover:text-black"
                  >
                    Consult
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      <SFContact />
    </PageShell>
  );
}
