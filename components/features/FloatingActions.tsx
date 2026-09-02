"use client";

/**
 * FLOATING FEATURES — WhatsApp, AI assistant, scroll-to-top.
 * (Phone/contact bubble removed by client request — the number
 * stays one tap away in the navbar and contact section.)
 *
 * The AI-assistant button shows a generic sparkle by default, but on
 * /jeni and /stand-firm it's passed that page's own logo instead
 * (see the `brandIcon` prop, and app/jeni/page.tsx and
 * app/stand-firm/page.tsx for how each is wired) so the floating
 * button reads as "this page's assistant," not a generic site-wide
 * icon that happens to be floating over a different brand's film.
 */
import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle, Sparkles } from "lucide-react";
import { site } from "@/config/site.config";
import { sf } from "@/config/standfirm.config";
import { jeni } from "@/config/jeni.config";
import { useContent } from "@/lib/useContent";
import { cn } from "@/lib/utils";

/* Default WhatsApp number per brand, and the content-override key each
   reads from — kept in one place so a brand can't be added here
   without both. */
const WHATSAPP_BY_BRAND: Record<string, string> = {
  tnwla: site.whatsapp,
  "stand-firm": sf.whatsapp,
  jeni: jeni.whatsapp,
};

export default function FloatingActions({
  brandIcon, brand = "tnwla",
}: { brandIcon?: string; brand?: "tnwla" | "stand-firm" | "jeni" } = {}) {
  const [showTop, setShowTop] = useState(false);
  /* This button is rendered on TNWLA, Stand Firm and Jeni pages alike
     (see the page.tsx files under app/) . It used to always message TNWLA's number
     regardless of which brand's page it floated over — fixed by
     reading the number for THIS brand, with THIS brand's own
     Superadmin override on top. */
  const c = useContent(brand);
  const whatsappNumber = c("whatsapp", WHATSAPP_BY_BRAND[brand] ?? site.whatsapp);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* The two glass buttons were washing out over the pale part of the
     hero film — legible against the dark half, ghosts against the light
     half, which is how they came to look "hidden" next to the solid
     green WhatsApp button. An opaque surface token behind the blur
     fixes it in both themes without pinning a literal colour. */
  const base = "flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition-all duration-500 hover:scale-110";
  const solid = "bg-[rgb(var(--c-bg-soft))]/92";

  return (
    <div className="fixed bottom-6 right-6 z-[85] flex flex-col items-center gap-3">
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("sf:chat"))}
        className={cn(base, solid, "glass gold-border text-gold hover:shadow-[0_0_30px_rgba(201,162,75,0.45)] animate-float-slow overflow-hidden")}
        aria-label="Open AI legal assistant"
      >
        {brandIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brandIcon} alt="" className="h-8 w-8 object-contain" />
        ) : (
          <Sparkles size={20} />
        )}
      </button>
      <a
        href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
        className={cn(base, "bg-[#25D366] text-white hover:shadow-[0_0_30px_rgba(37,211,102,0.5)]")}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={21} />
      </a>
      <button
        onClick={() => window.scrollTo({ top: 0 })}
        className={cn(base, solid, "glass text-ivory-dim hover:text-gold", showTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4")}
        aria-label="Scroll to top"
      >
        <ArrowUp size={19} />
      </button>
    </div>
  );
}
