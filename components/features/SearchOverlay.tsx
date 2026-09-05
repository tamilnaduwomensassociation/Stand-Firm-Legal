"use client";

/**
 * SEARCH — animated fullscreen overlay. Blur-fades in, the input
 * underline draws itself, and live results filter every service,
 * deed, practice area and page section as you type.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import {
  activeNumbers, blogPosts, businessServices, caseStudies, deeds, leadersPanel, navLinks,
  practiceAreas, propertyServices, sflaMatters, namedPartners, testimonials,
} from "@/config/site.config";
import { membershipCategories } from "@/config/forms.config";
import { useLockPageScroll } from "@/lib/useLockPageScroll";

/* `keywords` carries the Tamil term and any extra words worth matching
   on, so a search hits even when they aren't in the visible label.
   `open` tells the forms section which form to actually open, so a
   deed or membership result lands on the form itself rather than
   dumping the visitor at the top of the section. */
type OpenTarget = { mode: "deed" | "member"; deedIndex?: number };
type Item = { label: string; sub?: string; href: string; keywords?: string; open?: OpenTarget };

export default function SearchOverlay() {
  const [open, setOpen] = useState(false);

  /* Freeze the page behind the popup — see lib/useLockPageScroll.ts */
  useLockPageScroll(open);
  const [q, setQ] = useState("");

  const index: Item[] = useMemo(
    () => [
      ...navLinks.map((n) => ({ label: n.label, sub: "Page section", href: n.href.startsWith("#") ? `/${n.href}` : n.href, keywords: n.ta })),
      ...practiceAreas.map((p) => ({ label: p.en, sub: "Practice Area", href: "/#practice", keywords: `${p.ta} ${p.desc}` })),
      ...propertyServices.map((p) => ({ label: p.en, sub: "Property E-Service · Stand Firm", href: "/stand-firm/services#property", keywords: p.ta })),
      ...deeds.map((d, i) => ({
        label: d.en, sub: "Deed — order & form", href: "/stand-firm/services#deeds",
        keywords: `${d.ta} deed preparation agreement`,
        open: { mode: "deed" as const, deedIndex: i },
      })),
      ...businessServices.map((b) => ({ label: b.en, sub: "Registration & Online Service · Stand Firm", href: "/stand-firm/services#business", keywords: b.ta })),
      /* Membership */
      ...membershipCategories.map((m) => ({
        label: `${m.en} — Membership`, sub: `Joining ₹${m.joiningFee} · Renewal ₹${m.renewalFee}/yr`,
        href: "/membership", keywords: `${m.ta} membership registration join TNWLA form ${m.blurb}`,
        open: { mode: "member" as const },
      })),
      /* Stand Firm Legal Associates */
      ...sflaMatters.map((m) => ({ label: m.en, sub: "Stand Firm Legal Associates · Banking & Recovery", href: "/stand-firm#sfla", keywords: `${m.ta} ${m.desc} SFLA` })),
      ...namedPartners.map((p) => ({ label: p.name, sub: p.role, href: "/stand-firm/team", keywords: `${p.nameTa} ${p.roleTa} partner SFLA` })),
      /* People */
      ...leadersPanel.map((l) => ({ label: l.name, sub: l.position, href: "/#team", keywords: `${l.nameTa} ${l.positionTa} leaders panel advocate` })),
      /* Case studies — link to their own pages */
      ...caseStudies.map((c) => ({ label: c.en, sub: `Women & Law · ${c.area}`, href: `/case-studies/${c.slug}`, keywords: `${c.ta} ${c.result} ${c.framework} ${c.background}` })),
      /* Editorial */
      ...blogPosts.map((b) => ({ label: b.title, sub: `Legal Update · ${b.tag}`, href: "/#blog", keywords: `${b.titleTa} ${b.excerpt}` })),
      ...activeNumbers.map((n) => ({ label: `${n.label}: ${n.number}`, sub: "Active Number", href: "/#active-numbers", keywords: `${n.labelTa} ${n.note} ${n.noteTa}` })),
      ...testimonials.map((t) => ({ label: t.name, sub: "Client Voice · Google review", href: "/#testimonials", keywords: `${t.text} ${t.meta} review testimonial` })),
      /* Standalone pages */
      { label: "Gallery", sub: "Photographs from our chambers", href: "/gallery", keywords: "படத்தொகுப்பு photos moments" },
      { label: "Stand Firm Legal Associates", sub: "Services, deeds, registrations & banking", href: "/stand-firm", keywords: "SFLA store order property deed registration cart price" },
      { label: "Legal News & Judgments", sub: "Live feed — courts, rules, notifications", href: "/legal-news", keywords: "சட்ட செய்திகள் live law bar and bench judgment update" },
      { label: "Member ID Card", sub: "Generate & download your card", href: "/id-card", keywords: "அடையாள அட்டை identity card member" },
      { label: "Jeni Enterprises", sub: "Foods · Books · IT · Auction Property · E-Sevai", href: "/jeni", keywords: "jeni enterprises foods books it services bank auction esevai" },
    ],
    []
  );

  /* Every term must appear somewhere in the entry, so multi-word
     queries narrow the list instead of widening it. Label matches
     outrank keyword-only matches. */
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const terms = query.split(/\s+/);
    return index
      .map((i) => {
        const label = i.label.toLowerCase();
        const hay = `${label} ${(i.sub ?? "").toLowerCase()} ${(i.keywords ?? "").toLowerCase()}`;
        if (!terms.every((t) => hay.includes(t))) return null;
        const score = label.startsWith(query) ? 0 : label.includes(query) ? 1 : 2;
        return { item: i, score };
      })
      .filter((r): r is { item: Item; score: number } => r !== null)
      .sort((a, b) => a.score - b.score)
      .slice(0, 12)
      .map((r) => r.item);
  }, [q, index]);

  useEffect(() => {
    const openSearch = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("sf:search", openSearch);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("sf:search", openSearch);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          data-lenis-prevent className="fixed inset-0 z-[96] bg-obsidian-deep/90 px-6"
          role="dialog"
          aria-label="Site search"
        >
          <button onClick={() => setOpen(false)} aria-label="Close search" className="absolute right-8 top-8 text-ivory-dim hover:text-gold transition-colors">
            <X size={28} />
          </button>

          <div className="mx-auto mt-[18vh] max-w-2xl">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 border-b border-gold/40 pb-4"
            >
              <Search size={26} className="text-gold" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search anything — services, deeds, cases, membership…"
                aria-label="Search"
                className="w-full bg-transparent font-serif text-2xl md:text-3xl text-ivory placeholder:text-ivory-faint focus:outline-none"
              />
            </motion.div>

            <div data-lenis-prevent className="mt-6 max-h-[58vh] space-y-1 overflow-y-auto overscroll-contain">
              <AnimatePresence>
                {results.map((r, i) => (
                  <motion.a
                    key={r.label + r.href}
                    href={r.href}
                    onClick={() => {
                      setOpen(false);
                      /* Let the forms section switch tab and open the
                         exact form; delayed so the scroll to #form
                         starts first and the modal lands in view. */
                      if (r.open) {
                        const target = r.open;
                        window.setTimeout(
                          () => window.dispatchEvent(new CustomEvent("sf:openForm", { detail: target })),
                          420
                        );
                      }
                    }}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group flex items-center justify-between rounded-xl px-4 py-3.5 hover:bg-white/[0.05] transition-colors"
                  >
                    <span>
                      <span className="block font-sans text-ivory group-hover:text-gold transition-colors">{r.label}</span>
                      <span className="block text-xs text-ivory-faint mt-0.5">{r.sub}</span>
                    </span>
                    <ArrowUpRight size={16} className="text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.a>
                ))}
              </AnimatePresence>
              {q.length > 1 && results.length === 0 && (
                <p className="px-4 py-6 font-sans text-sm text-ivory-faint">No matches — try “SARFAESI”, “membership”, “GST”, “patta”…</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
