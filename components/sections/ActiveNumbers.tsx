"use client";

/**
 * ACTIVE PERSON LIST — a simple roster of the association's team,
 * each shown with a live "Active" status, in place of the old phone-
 * number cards. The names come straight from `lawyers` (the
 * President) and `leadersPanel` (the office bearers) in
 * site.config.ts rather than a separate hand-kept list, so this
 * table can never drift out of sync with the Advocates page.
 *
 * The phone numbers this section used to show still live on in
 * `activeNumbers` (config/site.config.ts) and on the Contact section
 * below — nothing was deleted, this section just stopped repeating
 * them.
 */
import { UserRound } from "lucide-react";
import { lawyers, leadersPanel } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";

const activePersons = [
  { name: lawyers[0].name, nameTa: lawyers[0].nameTa, role: lawyers[0].role, roleTa: lawyers[0].roleTa },
  ...leadersPanel.map((l) => ({ name: l.name, nameTa: l.nameTa, role: l.position, roleTa: l.positionTa })),
];

export default function ActiveNumbers() {
  const { lang, t } = useLang();

  return (
    <section id="active-numbers" className="bg-obsidian-deep section-pad">
      {/* No kicker here — see the redesign notes above; the title
          alone, styled the same bold serif way as every other
          section, is the whole heading now. */}
      <SectionHeading kicker="" title={t("activeNumbersTitle")} />

      <div className="mx-auto mt-10 max-w-3xl overflow-hidden overflow-x-auto rounded-2xl glass gold-border">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gold/20 bg-gold-faint/40">
              <th scope="col" className="px-6 py-3 font-sans text-[11px] font-normal uppercase tracking-widest text-gold">
                {lang === "ta" ? "குழு உறுப்பினர்" : "Team Member"}
              </th>
              <th scope="col" className="px-6 py-3 text-right font-sans text-[11px] font-normal uppercase tracking-widest text-gold">
                {lang === "ta" ? "நிலை" : "Status"}
              </th>
            </tr>
          </thead>
          <tbody>
            {activePersons.map((p, i) => (
              <tr
                key={p.name}
                className={i !== activePersons.length - 1 ? "border-b border-[var(--hairline)]" : undefined}
              >
                <td className="px-6 py-4">
                  <span className="flex items-center gap-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-faint text-gold">
                      <UserRound size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-serif text-[15px] leading-snug text-ivory">
                        {lang === "ta" ? p.nameTa : p.name}
                      </span>
                      <span className="block font-sans text-[11px] leading-relaxed text-ivory-faint">
                        {lang === "ta" ? p.roleTa : p.role}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-green-400">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                    {lang === "ta" ? "செயலில்" : "Active"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
