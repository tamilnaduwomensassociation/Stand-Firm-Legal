"use client";

/**
 * Header, tab strip and footer for the Harmony brand.
 *
 * Kept deliberately light. This brand is new and its content is still
 * being written, so the chrome carries the mark, the three tabs and
 * the disclaimer — which is the one element on these pages that is not
 * optional. See the note at the top of harmonic.config.ts for why.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, GraduationCap, Mail, MapPin, Phone, ScrollText, type LucideIcon } from "lucide-react";
import { harmony, harmonyTabs } from "@/config/harmonic.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import BackToAssociation from "@/components/ui/BackToAssociation";

const icons: Record<string, LucideIcon> = { Flame, GraduationCap, ScrollText };

export function HarmonyHeader() {
  const pathname = usePathname();
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <header className="fixed inset-x-0 top-0 z-[80] glass !bg-obsidian/92 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:gap-4 md:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
        <BackToAssociation />

        <Link href="/harmonic" className="group flex shrink-0 items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white/95 ring-1 ring-gold/40 transition-all group-hover:ring-gold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={harmony.mark} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold tracking-[0.12em] gold-text md:text-xl">HARMONY</span>
            <span className="mt-1 font-sans text-[8px] font-extrabold uppercase tracking-[0.2em] text-ivory-dim md:text-[9px]">
              Pranic Healing
            </span>
          </span>
        </Link>
        </div>

        <a
          href={`tel:+91${harmony.phones[0].replace(/\D/g, "").slice(-10)}`}
          className="glass gold-border flex items-center gap-2 rounded-full px-3 py-2 text-gold transition-all hover:bg-gold hover:text-black"
        >
          <Phone size={15} />
          <span className="hidden font-sans text-[11px] tracking-widest sm:inline">{harmony.phones[0]}</span>
        </a>
      </div>

      <nav
        data-lenis-prevent
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto overscroll-contain border-t border-[var(--hairline)] px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Harmony sections"
      >
        <Link
          href="/harmonic"
          className={cn(
            "shrink-0 whitespace-nowrap border-b-2 px-4 py-3 font-sans text-[11px] uppercase tracking-[0.12em] transition-all",
            pathname === "/harmonic" ? "border-gold text-gold" : "border-transparent text-ivory/75 hover:border-gold/50 hover:text-gold"
          )}
        >
          {ta ? "முகப்பு" : "Home"}
        </Link>
        {harmonyTabs.map((t) => {
          const active = pathname === `/harmonic/${t.slug}`;
          const Icon = icons[t.icon] ?? Flame;
          return (
            <Link
              key={t.slug}
              href={`/harmonic/${t.slug}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 transition-all",
                ta ? "font-tamil text-[12px]" : "font-sans text-[11px] uppercase tracking-[0.12em]",
                active ? "border-gold text-gold" : "border-transparent text-ivory/75 hover:border-gold/50 hover:text-gold"
              )}
            >
              <Icon size={13} /> {ta ? t.ta : t.en}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function HarmonyFooter() {
  return (
    <footer className="border-t border-gold/15 bg-obsidian-deep">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={harmony.mark} alt={harmony.name} className="h-16 w-16 rounded-full ring-1 ring-gold/40" />
          <p className="mt-5 font-serif text-xl tracking-[0.1em] gold-text">HARMONY</p>
          <p className="mt-1 text-[10px] uppercase tracking-luxe text-ivory-dim">Pranic Healing</p>
          <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.24em] text-gold/70">{harmony.tagline}</p>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-sans text-sm text-ivory-dim">
            <li className="flex items-center gap-2"><MapPin size={14} className="text-gold" /> {harmony.address}</li>
            <li>
              <a href={`tel:+91${harmony.phones[0].replace(/\D/g, "").slice(-10)}`} className="flex items-center gap-2 transition-colors hover:text-gold">
                <Phone size={14} className="text-gold" /> {harmony.phones[0]}
              </a>
            </li>
            <li>
              <a href={`mailto:${harmony.email}`} className="flex items-center gap-2 break-all transition-colors hover:text-gold">
                <Mail size={14} className="text-gold" /> {harmony.email}
              </a>
            </li>
          </ul>

          {/* Not decorative and not removable — see harmonic.config.ts */}
          <p className="mx-auto mt-10 max-w-2xl border-t border-[var(--hairline)] pt-7 font-sans text-[11px] leading-relaxed text-ivory-faint">
            {harmony.disclaimer}
          </p>

          <p className="mt-6 font-sans text-xs text-ivory-faint">
            © {new Date().getFullYear()} {harmony.name}.
          </p>
        </div>
      </div>
    </footer>
  );
}
