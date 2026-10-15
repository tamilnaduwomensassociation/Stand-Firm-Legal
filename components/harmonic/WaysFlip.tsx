"use client";

/**
 * "Ways You Can Support" — each way is a box that turns over.
 *
 * FRONT   the centre's own words: icon, title and description.
 * BACK    a finished picture card shown whole, with the same two contact actions
 *         the page has always had (WhatsApp / call). Nothing here takes a
 *         payment or states an amount, bank or UPI account.
 *
 * The pictures are illustrations of the kind of help, not a record of a
 * particular event. Turning works like the other flip cards on this page:
 * hover or click (mouse), tap (touch), Enter/Space (keyboard), Esc or
 * "Flip back" to return; the hidden face is `inert`; reduced motion swaps
 * the faces without the 3D turn (see .sflip in app/globals.css).
 */
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Phone, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type Way = {
  id: string;
  n: string;
  emoji: string;
  title: string;
  text: string;
  /** the picture on the back: a finished card (picture, icon, title, words) shown whole */
  image: string;
  /** what the picture shows, for people who cannot see it */
  alt: string;
  w: number;
  h: number;
};

function WayCard({ way, wa, tel, phone }: { way: Way; wa: string; tel: string; phone: string }) {
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const blockHover = useRef(false);
  const front = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);
  const flipped = pinned || hover;

  useEffect(() => {
    if (!moved.current) return;
    (flipped ? back : front).current?.focus({ preventScroll: true });
  }, [flipped]);

  const turnBack = () => {
    moved.current = true;
    setPinned(false);
    setHover(false);
    blockHover.current = true;
  };

  return (
    <div
      className="sflip"
      data-flipped={flipped}
      onPointerEnter={(e) => { if (e.pointerType === "mouse" && !blockHover.current) setHover(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") { setHover(false); blockHover.current = false; } }}
      onKeyDown={(e) => { if (e.key === "Escape" && flipped) { e.stopPropagation(); turnBack(); } }}
    >
      <div className="sflip-inner">
        {/* ---------------- front: the words ---------------- */}
        <div className="sflip-face sflip-front" inert={flipped}>
          <button
            ref={front}
            type="button"
            onClick={() => { moved.current = true; setPinned(true); }}
            aria-label={`${way.title} — turn the card over to see a picture`}
            className="group relative flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-white via-obsidian-soft to-gold/10 p-7 text-left shadow-[0_12px_34px_-20px_rgba(76,29,149,0.5)] transition-shadow duration-500 hover:shadow-[0_20px_44px_-20px_rgba(76,29,149,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <span className="pointer-events-none absolute -right-3 -top-5 select-none font-serif text-8xl font-bold leading-none text-gold/10" aria-hidden>{way.n}</span>
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-white text-5xl shadow-sm" aria-hidden>{way.emoji}</span>
            <span className="relative mt-5 block h-0.5 w-10 bg-gold transition-all duration-500 group-hover:w-20" aria-hidden />
            <h4 className="relative mt-5 font-serif text-2xl leading-snug text-ivory">{way.title}</h4>
            <p className="relative mt-4 flex-1 font-sans text-[16px] leading-7 text-ivory-dim">{way.text}</p>
            <span className="relative mt-5 inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
              <RotateCcw size={13} aria-hidden /> <span className="hidden [@media(hover:hover)]:inline">Hover or click</span><span className="[@media(hover:hover)]:hidden">Tap</span>&nbsp;to see more
            </span>
          </button>
        </div>

        {/* ---------------- back: the picture, shown whole ---------------- */}
        <div className="sflip-face sflip-back" inert={!flipped}>
          <div className="flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-2xl border border-gold/40 bg-white shadow-[0_20px_46px_-20px_rgba(76,29,149,0.65)]">
            {/* The picture already carries its own title and words, so nothing is laid over it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={way.image} alt={way.alt} width={way.w} height={way.h} loading="lazy" decoding="async"
              className="block h-auto w-full object-cover" style={{ aspectRatio: `${way.w} / ${way.h}` }}
            />
            <div className="grid grid-cols-2 gap-2 border-t border-gold/20 bg-white p-3">
              <a
                href={wa} target="_blank" rel="noopener noreferrer"
                className="col-span-2 flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-gold px-4 py-2.5 font-sans text-[12px] font-bold uppercase tracking-[0.12em] text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <MessageCircle size={15} aria-hidden /> Support This Cause
              </a>
              <a
                href={tel}
                className="gold-border flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-gold transition-all hover:bg-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <Phone size={14} aria-hidden /> {phone}
              </a>
              <button
                ref={back} type="button" onClick={turnBack}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <RotateCcw size={13} aria-hidden /> Flip back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WaysFlip({
  ways, wa, tel, phone, className,
}: { ways: Way[]; wa: string; tel: string; phone: string; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7", className)}>
      {ways.map((w) => (
        <li key={w.id} className="flex">
          <div className="w-full"><WayCard way={w} wa={wa} tel={tel} phone={phone} /></div>
        </li>
      ))}
    </ul>
  );
}
