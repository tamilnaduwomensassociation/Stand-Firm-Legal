"use client";

/**
 * FLOATING FEATURES — WhatsApp, AI assistant, scroll-to-top.
 * (Phone/contact bubble removed by client request — the number
 * stays one tap away in the navbar and contact section.)
 */
import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle, Sparkles } from "lucide-react";
import { site } from "@/config/site.config";
import { cn } from "@/lib/utils";

export default function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const base = "flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition-all duration-500 hover:scale-110";

  return (
    <div className="fixed bottom-6 right-6 z-[85] flex flex-col items-center gap-3">
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("sf:chat"))}
        className={cn(base, "glass gold-border text-gold hover:shadow-[0_0_30px_rgba(201,162,75,0.45)] animate-float-slow")}
        aria-label="Open AI legal assistant"
      >
        <Sparkles size={20} />
      </button>
      <a
        href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer"
        className={cn(base, "bg-[#25D366] text-white hover:shadow-[0_0_30px_rgba(37,211,102,0.5)]")}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={21} />
      </a>
      <button
        onClick={() => window.scrollTo({ top: 0 })}
        className={cn(base, "glass text-ivory-dim hover:text-gold", showTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4")}
        aria-label="Scroll to top"
      >
        <ArrowUp size={19} />
      </button>
    </div>
  );
}
