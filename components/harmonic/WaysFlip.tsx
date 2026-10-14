"use client";

/**
 * "Ways You Can Support" — each way is a box that turns over.
 *
 * FRONT   the centre's own words: icon, title and description.
 * BACK    a full picture with the title and the same two contact actions
 *         the page has always had (WhatsApp / call). Nothing here takes a
 *         payment or states an amount, bank or UPI account.
 *
 * The pictures are illustrations of the kind of help, not a record of a
 * particular event. Turning works like the other flip cards on this page:
 * hover or click (mouse), tap (touch), Enter/Space (keyboard), Esc or
 * "Flip back" to return; the hidden face is `inert`; reduced motion swaps
 * the faces without the 3D turn (see .flip-card in app/globals.css).
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
  /** the picture on the back */
  image: string;
  pos: string;
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
      className="flip-card"
      data-flipped={flipped}
      onPointerEnter={(e) => { if (e.pointerType === "mouse" && !blockHover.current) setHover(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") { setHover(false); blockHover.current = false; } }}
      onKeyDown={(e) => { if (e.key === "Escape" && flipped) { e.stopPropagation(); turnBack(); } }}
    >
      <div className="flip-inner">
        {/* ---------------- front: the words ---------------- */}
        <div className="flip-face flip-face-front" inert={flipped}>
          <button
            ref={front}
            type="button"
            onClick={() => { moved.current = true; setPinned(true); }}
            aria-label={`${way.title} — turn the card over to see a picture`}
            className="group relative flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-white via-obsidian-soft to-gold/10 p-7 text-left shadow-[0_12px_34px_-20px_rgba(76,29,149,0.5)] transition-shadow duration-500 hover:shadow-[0_20px_44px_-20px_rgba(76,29,149,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <span className="pointer-events-none absolute -right-3 -top-5 select-none font-serif text-8xl font-bold leading-none text-gold/10" aria-hidden>{way.n}</span>
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-white text-3xl shadow-sm" aria-hidden>{way.emoji}</span>
            <span className="relative mt-5 block h-0.5 w-10 bg-gold transition-all duration-500 group-hover:w-20" aria-hidden />
            <h4 className="relative mt-4 font-serif text-xl leading-snug text-ivory md:text-[22px]">{way.title}</h4>
            <p className="relative mt-3 flex-1 font-sans text-[14px] leading-relaxed text-ivory-dim">{way.text}</p>
            <span className="relative mt-5 inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
              <RotateCcw size={13} aria-hidden /> <span className="hidden [@media(hover:hover)]:inline">Hover or click</span><span className="[@media(hover:hover)]:hidden">Tap</span>&nbsp;to see more
            </span>
          </button>
        </div>

        {/* ---------------- back: the picture ---------------- */}
        <div className="flip-face flip-face-back" inert={!flipped}>
          <div className="relative flex h-full min-h-[300px] w-full flex-col justify-end overflow-hidden rounded-2xl border border-gold/40 bg-obsidian-deep shadow-[0_20px_46px_-20px_rgba(76,29,149,0.65)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={way.image} alt="" width={way.w} height={way.h} loading="lazy" decoding="async"
              style={{ objectPosition: way.pos }} className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2e1065]/95 via-[#4c1d95]/45 to-transparent" aria-hidden />
            <div className="relative p-6 text-white">
              <h4 className="font-serif text-xl leading-snug drop-shadow">{way.title}</h4>
              <span className="mt-2 block h-0.5 w-10 bg-white/80" aria-hidden />
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <a
                  href={wa} target="_blank" rel="noopener noreferrer"
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-[#4c1d95] transition-all hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4c1d95]"
                >
                  <MessageCircle size={15} aria-hidden /> Support This Cause
                </a>
                <a
                  href={tel}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-white/70 px-4 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-all hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4c1d95]"
                >
                  <Phone size={15} aria-hidden /> {phone}
                </a>
              </div>
              <button
                ref={back} type="button" onClick={turnBack}
                className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-1 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4c1d95]"
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
