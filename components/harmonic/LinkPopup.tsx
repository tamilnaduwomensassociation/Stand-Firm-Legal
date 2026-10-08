"use client";

/**
 * HARMONY — the Link popup.
 *
 * Reads popupLink / popupTitle / popupText from this brand's Content
 * overrides — the same store the Superadmin "Link" tab writes to
 * (components/admin/LinkPanel.tsx) via the same useContent("harmonic")
 * hook every other piece of Harmony copy already uses. There is
 * nothing to redeploy when the office changes the link: the next
 * visitor's page load fetches the new value, same as any other
 * content override on this site.
 *
 * Shown once per browser tab session per link — closing it, or
 * clicking through, marks THAT link as seen so it doesn't reopen on
 * every page of the visit; a link the office changes afterwards is a
 * different value, so it is treated as new and shown again.
 */
import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { harmony } from "@/config/harmonic.config";
import { useContent } from "@/lib/useContent";
import { useLang } from "@/lib/i18n";
import { useLockPageScroll } from "@/lib/useLockPageScroll";

const SEEN_KEY = "harmony-link-popup-seen";

export default function LinkPopup() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const c = useContent("harmonic");
  const link = c("popupLink", "");
  const title = c("popupTitle", "");
  const text = c("popupText", "");

  const [open, setOpen] = useState(false);
  useLockPageScroll(open);

  useEffect(() => {
    if (!link) { setOpen(false); return; }
    try {
      if (sessionStorage.getItem(SEEN_KEY) === link) return;
    } catch {
      /* sessionStorage unavailable — show it anyway rather than hide silently */
    }
    setOpen(true);
  }, [link]);

  const dismiss = () => {
    setOpen(false);
    try { sessionStorage.setItem(SEEN_KEY, link); } catch { /* ignore */ }
  };

  if (!open || !link) return null;

  return (
    <div
      className="fixed inset-0 z-[97] flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
        <button
          onClick={dismiss}
          aria-label={ta ? "மூடு" : "Close"}
          className="absolute right-4 top-4 z-10 text-ivory-dim transition-colors hover:text-gold"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center px-8 pb-8 pt-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={harmony.mark} alt="" className="h-14 w-14 rounded-full ring-1 ring-gold/30" />
          <p className="mt-4 font-sans text-[10px] uppercase tracking-widest text-gold/70">
            {harmony.name}
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-snug gold-text">
            {title || (ta ? "அறிவிப்பு" : "Announcement")}
          </h3>
          {text ? (
            <p className="prose-justify mt-3 font-sans text-sm leading-relaxed text-ivory-dim">
              {text}
            </p>
          ) : null}

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
          >
            {ta ? "காண்க" : "View"} <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
