"use client";

/**
 * WHAT'S ON — the sessions section.
 *
 * Fetched on mount rather than rendered from a config, because seat
 * counts go stale the moment somebody else books. Every successful
 * booking re-fetches, so the number on screen is the number the server
 * would enforce.
 *
 * Placed after Free Legal Aid on the home page, and standing alone at
 * /events. The `limit` prop is what lets the home page show the next
 * three without a second component.
 */
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { useLang } from "@/lib/i18n";
import EventCard, { type EventRow } from "@/components/events/EventCard";
import BookingDialog from "@/components/events/BookingDialog";
import InterestDialog from "@/components/events/InterestDialog";

export default function EventsSection({
  limit, heading = true,
}: { limit?: number; heading?: boolean } = {}) {
  const { lang } = useLang();
  const ta = lang === "ta";

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<EventRow | null>(null);
  const [interest, setInterest] = useState<EventRow | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      const d = await res.json();
      setEvents(Array.isArray(d.events) ? d.events : []);
    } catch {
      /* Leave whatever is on screen rather than blanking the section
         because one poll failed. */
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Nothing scheduled is a legitimate state, not an error — and an
     empty section with a heading looks broken, so it renders nothing
     at all when embedded on the home page. */
  if (!loading && events.length === 0 && limit) return null;

  const shown = limit ? events.slice(0, limit) : events;

  return (
    <section id="events" className="bg-obsidian-deep section-pad">
      {heading && (
        <div className="mx-auto max-w-3xl text-center">
          <p className="kicker mb-3">{ta ? "வரவிருக்கும் நிகழ்வுகள்" : "What's On"}</p>
          <h2 className="font-serif text-3xl gold-text md:text-5xl">
            {ta ? "வழக்கு அமர்வுகள் & நிகழ்ச்சிகள்" : "Case Topics & Programme Sessions"}
          </h2>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
            {ta
              ? "இடங்கள் குறைவு — முன்பதிவு செய்யுங்கள். தேதி அறிவிக்கப்படாத அமர்வுகளுக்கு உங்கள் ஆர்வத்தைப் பதிவு செய்யலாம்."
              : "Seats are limited and booked in advance. Sessions without a date yet are gathering interest — tell us you'd attend and we'll schedule them."}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-gold" />
        </div>
      ) : events.length === 0 ? (
        <div className="mx-auto mt-10 max-w-md rounded-2xl glass gold-border p-10 text-center">
          <CalendarDays size={26} className="mx-auto mb-4 text-gold/70" />
          <p className="font-sans text-sm text-ivory-dim">
            {ta ? "தற்போது அமர்வுகள் எதுவும் இல்லை." : "Nothing scheduled at the moment."}
          </p>
          <p className="mt-2 font-sans text-[12px] text-ivory-faint">
            {ta ? "விரைவில் புதிய அமர்வுகள் அறிவிக்கப்படும்." : "New sessions are announced here first."}
          </p>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-11 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((ev) => (
              <EventCard key={ev.id} ev={ev} onBook={setBooking} onInterest={setInterest} />
            ))}
          </div>

          {limit && events.length > limit && (
            <div className="mt-10 text-center">
              <a
                href="/events"
                className="inline-flex items-center gap-2.5 rounded-full gold-border px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-gold transition-all hover:bg-gold-faint"
              >
                {ta ? `அனைத்தையும் பார் (${events.length})` : `See all ${events.length} sessions`}
              </a>
            </div>
          )}

          {!limit && (
            <div className="mt-10 text-center">
              <button
                onClick={() => { setLoading(true); load(); }}
                className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-widest text-ivory-faint transition-colors hover:text-gold"
              >
                <RefreshCw size={13} /> {ta ? "இட எண்ணிக்கையைப் புதுப்பி" : "Refresh seat counts"}
              </button>
            </div>
          )}
        </>
      )}

      {booking && (
        <BookingDialog
          ev={booking}
          onClose={() => setBooking(null)}
          onBooked={() => { setBooking(null); load(); }}
        />
      )}
      {interest && (
        <InterestDialog
          ev={interest}
          onClose={() => setInterest(null)}
          onVoted={() => { setInterest(null); load(); }}
        />
      )}
    </section>
  );
}
