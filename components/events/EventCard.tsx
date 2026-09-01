"use client";

/**
 * One session, as a card.
 *
 * Serves both shapes an event can take, because they are the same
 * object at different stages: a PROPOSAL shows a progress bar toward
 * the interest threshold and an "I'd attend" button; a SCHEDULED
 * event shows date, time, venue, seats left and Book Now.
 *
 * The seat bar turns amber under a quarter remaining and red at zero.
 * That is the one piece of urgency on the card and it is honest — the
 * number behind it is counted from live bookings, not a marketing
 * figure.
 */
import { useState } from "react";
import {
  Award, BookOpen, CalendarDays, Car, CheckCircle2, Clock, Coffee,
  FileText, GraduationCap, MapPin, Users, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import {
  amenities as ALL_AMENITIES, eventStatuses, findKind, findVenue,
  prettyDate, prettyTime,
} from "@/config/events.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const amenityIcons: Record<string, LucideIcon> = {
  UtensilsCrossed, Coffee, BookOpen, Award, FileText, Car, GraduationCap,
};

const toneCls: Record<string, string> = {
  neutral: "bg-white/10 text-ivory-dim",
  good: "bg-emerald-500/15 text-emerald-300",
  warn: "bg-amber-500/15 text-amber-300",
  info: "bg-sky-500/15 text-sky-300",
  bad: "bg-red-500/15 text-red-300",
};

export type EventRow = Record<string, unknown> & {
  id: string;
  seats?: { capacity: number; booked: number; left: number; full: boolean };
  interest?: { votes: number; threshold: number; met: boolean };
};

export default function EventCard({
  ev, onBook, onInterest,
}: { ev: EventRow; onBook: (e: EventRow) => void; onInterest: (e: EventRow) => void }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [expanded, setExpanded] = useState(false);

  const status = String(ev.status);
  const meta = eventStatuses.find((s) => s.id === status);
  const kind = findKind(String(ev.kind));
  const venue = findVenue(String(ev.venue));
  const seats = ev.seats ?? { capacity: 0, booked: 0, left: 0, full: false };
  const interest = ev.interest ?? { votes: 0, threshold: 30, met: false };
  const isProposal = status === "proposed";
  const bookable = status === "scheduled" && seats.left > 0;

  const pct = seats.capacity ? Math.min(100, Math.round((seats.booked / seats.capacity) * 100)) : 0;
  const votePct = Math.min(100, Math.round((interest.votes / interest.threshold) * 100));
  const scarce = seats.left > 0 && seats.left <= Math.max(1, Math.round(seats.capacity * 0.25));

  const agenda = Array.isArray(ev.agenda) ? (ev.agenda as Record<string, unknown>[]) : [];
  const chosen = Array.isArray(ev.amenities) ? (ev.amenities as string[]) : [];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl glass gold-border transition-all duration-500 hover:border-gold/70">
      <div className="flex flex-1 flex-col p-6 md:p-7">
        {/* ---------- status + type ---------- */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-3 py-1 font-sans text-[10px] uppercase tracking-widest", toneCls[meta?.tone ?? "neutral"])}>
            {meta?.label ?? status}
          </span>
          {kind && (
            <span className="rounded-full border border-gold/25 px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-gold/80">
              {ta ? kind.ta : kind.en}
            </span>
          )}
          {Number(ev.days) > 1 && (
            <span className="rounded-full border border-gold/25 px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-gold/80">
              {String(ev.days)} {ta ? "நாட்கள்" : "days"}
            </span>
          )}
        </div>

        <h3 className="font-serif text-xl leading-snug text-ivory md:text-2xl">{String(ev.title)}</h3>
        {ev.speaker ? (
          <p className="mt-1.5 font-sans text-[12px] text-gold/85">{String(ev.speaker)}</p>
        ) : null}
        {ev.summary ? (
          <p className="prose-justify mt-3 font-sans text-[13px] leading-relaxed text-ivory-dim">
            {String(ev.summary)}
          </p>
        ) : null}

        {/* ---------- when & where ---------- */}
        <ul className="mt-5 space-y-2">
          {ev.date ? (
            <li className="flex items-center gap-2.5 font-sans text-[13px] text-ivory-dim">
              <CalendarDays size={14} className="shrink-0 text-gold" />
              {prettyDate(String(ev.date))}
              {ev.time ? <span className="text-ivory-faint">· {prettyTime(String(ev.time))}</span> : null}
            </li>
          ) : (
            <li className="flex items-center gap-2.5 font-sans text-[13px] text-ivory-faint">
              <Clock size={14} className="shrink-0 text-gold/60" />
              {ta ? "தேதி இன்னும் அறிவிக்கப்படவில்லை" : "Date to be announced"}
            </li>
          )}
          {venue && (
            <li className="flex items-start gap-2.5 font-sans text-[13px] text-ivory-dim">
              <MapPin size={14} className="mt-0.5 shrink-0 text-gold" />
              <span>
                {ta ? venue.ta : venue.en}
                {ev.venueNote ? <span className="block text-ivory-faint">{String(ev.venueNote)}</span> : null}
              </span>
            </li>
          )}
        </ul>

        {/* ---------- amenities ---------- */}
        {chosen.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {chosen.map((id) => {
              const a = ALL_AMENITIES.find((x) => x.id === id);
              if (!a) return null;
              const Icon = amenityIcons[a.icon] ?? CheckCircle2;
              return (
                <span key={id} className="flex items-center gap-1.5 rounded-full border border-gold/25 px-2.5 py-1 font-sans text-[10px] text-gold/85">
                  <Icon size={11} /> {ta ? a.ta : a.en}
                </span>
              );
            })}
          </div>
        )}

        {/* ---------- agenda ---------- */}
        {agenda.length > 0 && (
          <div className="mt-5">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="font-sans text-[11px] uppercase tracking-widest text-gold transition-colors hover:text-gold-bright"
              aria-expanded={expanded}
            >
              {expanded ? (ta ? "நிரலை மறை" : "Hide agenda") : (ta ? "நிகழ்ச்சி நிரல்" : "See the agenda")}
            </button>
            {expanded && (
              <div className="mt-4 space-y-4 border-l border-gold/25 pl-4">
                {agenda.map((d) => (
                  <div key={String(d.day)}>
                    <p className="font-sans text-[11px] uppercase tracking-widest text-gold">
                      {ta ? "நாள்" : "Day"} {String(d.day)}
                      {d.date ? <span className="text-ivory-faint"> · {prettyDate(String(d.date))}</span> : null}
                    </p>
                    {d.heading ? <p className="mt-1 font-serif text-[15px] text-ivory">{String(d.heading)}</p> : null}
                    <ul className="mt-2 space-y-1.5">
                      {(Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []).map((it, i) => (
                        <li key={i} className="flex gap-3 font-sans text-[12.5px] text-ivory-dim">
                          <span className="w-16 shrink-0 text-gold/70">{it.time ? prettyTime(String(it.time)) : "—"}</span>
                          <span className="min-w-0 flex-1">{String(it.what)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------- seats / interest + action ---------- */}
      <div className="border-t border-[var(--hairline)] px-6 py-5 md:px-7">
        {isProposal ? (
          <>
            <div className="mb-2 flex items-center justify-between font-sans text-[12px]">
              <span className="text-ivory-dim">
                <Users size={13} className="mr-1.5 inline text-gold" />
                {interest.votes} {ta ? "பேர் ஆர்வம்" : "interested"}
              </span>
              <span className="text-ivory-faint">
                {ta ? "தேவை" : "need"} {interest.threshold}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--hairline)]">
              <div
                className={cn("h-full rounded-full transition-all duration-700", interest.met ? "bg-emerald-400" : "bg-gold")}
                style={{ width: `${votePct}%` }}
              />
            </div>
            <p className="mt-2.5 font-sans text-[11px] leading-relaxed text-ivory-faint">
              {interest.met
                ? (ta ? "போதிய ஆர்வம் — விரைவில் தேதி அறிவிக்கப்படும்." : "Enough interest — the office will set a date.")
                : (ta
                    ? `${interest.threshold - interest.votes} பேர் சேர்ந்தால் இந்த அமர்வு நடத்தப்படும்.`
                    : `${interest.threshold - interest.votes} more and this session gets scheduled.`)}
            </p>
            <button
              onClick={() => onInterest(ev)}
              className="mt-4 w-full rounded-full gold-border py-3 font-sans text-[11px] uppercase tracking-widest text-gold transition-all hover:bg-gold-faint"
            >
              {ta ? "நானும் வருவேன்" : "I'd attend this"}
            </button>
          </>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between font-sans text-[12px]">
              <span className="text-ivory-dim">
                <Users size={13} className="mr-1.5 inline text-gold" />
                {seats.booked} / {seats.capacity} {ta ? "இடங்கள்" : "seats taken"}
              </span>
              <span className={cn(seats.full ? "text-red-300" : scarce ? "text-amber-300" : "text-ivory-faint")}>
                {seats.full
                  ? (ta ? "நிரம்பியது" : "Full")
                  : `${seats.left} ${ta ? "மீதம்" : "left"}`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--hairline)]">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  seats.full ? "bg-red-400" : scarce ? "bg-amber-400" : "bg-gold"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <button
              onClick={() => onBook(ev)}
              disabled={!bookable}
              className="mt-4 w-full rounded-full bg-gold py-3.5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
            >
              {seats.full
                ? (ta ? "இடங்கள் நிரம்பிவிட்டன" : "Fully booked")
                : status === "running"
                  ? (ta ? "இன்று நடைபெறுகிறது" : "Running today")
                  : (ta ? "இடம் பதிவு செய்" : "Book now")}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
