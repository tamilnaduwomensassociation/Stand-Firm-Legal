"use client";

/**
 * The horizontal tab strip that sits under the header on every
 * /jeni/* page, so you can move between counters without going back
 * to the front page first. The active tab is derived from the URL, not
 * from state — which is what makes a browser Back button work.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { verticals } from "@/config/jeni.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function VerticalTabs() {
  const pathname = usePathname();
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <div className="sticky top-[68px] z-[70] border-y border-[var(--hairline)] glass !bg-obsidian/92">
      {/* Horizontal scroll rather than a wrap: nine tabs on a phone
          would otherwise stack into four rows and push the content
          below the fold. */}
      <nav
        data-lenis-prevent
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto overscroll-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Jeni Enterprises sections"
      >
        <Link
          href="/jeni"
          className={cn(
            "shrink-0 whitespace-nowrap border-b-2 px-4 py-3.5 font-sans text-[11px] uppercase tracking-[0.12em] transition-all",
            pathname === "/jeni" ? "border-gold text-gold" : "border-transparent text-ivory/75 hover:border-gold/50 hover:text-gold"
          )}
        >
          {ta ? "முகப்பு" : "All"}
        </Link>
        {verticals.map((v) => {
          const active = pathname === `/jeni/${v.slug}`;
          return (
            <Link
              key={v.slug}
              href={`/jeni/${v.slug}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-4 py-3.5 transition-all",
                ta ? "font-tamil text-[12px]" : "font-sans text-[11px] uppercase tracking-[0.12em]",
                active ? "border-gold text-gold" : "border-transparent text-ivory/75 hover:border-gold/50 hover:text-gold"
              )}
            >
              {ta ? v.ta : v.en}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
