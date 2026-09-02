"use client";

/**
 * A NOTICE THAT NEVER HAD ANYWHERE TO APPEAR.
 *
 * Superadmin's content editor has always had a "Notice banner" field
 * for TNWLA and an "Announcement banner" field for Jeni, each with the
 * hint "Leave empty to hide it" — but no component on either public
 * site ever rendered one. This is that component: a slim, dismissible
 * strip that shows the override text when it's set, and renders
 * nothing at all when it's empty, matching the hint exactly.
 *
 * Dismissal is remembered per MESSAGE, not just per brand — keyed by
 * the text itself, so publishing a new notice after an old one was
 * dismissed shows the new one again rather than staying hidden
 * because "a" notice was once dismissed.
 */
import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useContent } from "@/lib/useContent";

export default function NoticeBanner({
  brand, contentKey, className = "",
}: { brand: string; contentKey: string; className?: string }) {
  const c = useContent(brand);
  const message = c(contentKey, "");
  const [dismissed, setDismissed] = useState(true); // start hidden — no flash before the effect below runs

  const storageKey = `notice-dismissed:${brand}:${contentKey}`;

  useEffect(() => {
    if (!message) return;
    try {
      setDismissed(localStorage.getItem(storageKey) === message);
    } catch {
      setDismissed(false);
    }
  }, [message, storageKey]);

  if (!message || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(storageKey, message); } catch { /* private browsing, etc. */ }
  };

  return (
    <div className={`flex items-center justify-center gap-3 rounded-xl border border-gold/30 bg-gold-faint px-4 py-3 ${className}`}>
      <Megaphone size={15} className="shrink-0 text-gold" />
      <p className="flex-1 text-center font-sans text-[13px] leading-relaxed text-ivory/90">{message}</p>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-ivory-faint transition-colors hover:text-gold"
      >
        <X size={15} />
      </button>
    </div>
  );
}
