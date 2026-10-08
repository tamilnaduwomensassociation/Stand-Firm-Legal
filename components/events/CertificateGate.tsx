"use client";

/**
 * Picks the session, then hands over to CertificateClaim.
 *
 * `?event=` comes from the link the office sends. Without it — a
 * forwarded message, a typed URL — the page offers whichever sessions
 * have their feedback window open rather than showing an error, so a
 * lost link costs an extra tap instead of a phone call to the office.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";
import { prettyDate } from "@/config/events.config";
import CertificateClaim from "@/components/events/CertificateClaim";

type Ev = Record<string, unknown> & { id: string };

export default function CertificateGate() {
  const params = useSearchParams();
  const wanted = params.get("event") ?? "";

  const [events, setEvents] = useState<Ev[]>([]);
  const [chosen, setChosen] = useState<Ev | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/events?scope=all", { cache: "no-store" });
        const d = await res.json();
        const all: Ev[] = Array.isArray(d.events) ? d.events : [];
        setEvents(all.filter((e) => e.feedbackOpen === true));
        if (wanted) setChosen(all.find((e) => e.id === wanted) ?? null);
      } catch {
        /* handled by the empty state below */
      }
      setLoading(false);
    })();
  }, [wanted]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gold" /></div>;
  }

  if (chosen) {
    return <CertificateClaim eventId={chosen.id} eventTitle={String(chosen.title)} />;
  }

  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl glass gold-border p-10 text-center">
        <CalendarDays size={26} className="mx-auto mb-4 text-gold/70" />
        <p className="font-sans text-sm text-ivory-dim">
          No feedback form is open at the moment.
        </p>
        <p className="mt-2 font-sans text-[12px] leading-relaxed text-ivory-faint">
          The form opens on the day of a session and closes that evening. If you attended today
          and the link has expired, call the office — a certificate is not lost, it just has to
          be issued by hand.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-4 text-center font-sans text-[13px] text-ivory-dim">
        Which session did you attend?
      </p>
      <div className="space-y-3">
        {events.map((e) => (
          <button
            key={e.id}
            onClick={() => setChosen(e)}
            className="w-full rounded-2xl glass gold-border p-5 text-left transition-all hover:border-gold/70"
          >
            <p className="font-serif text-lg text-ivory">{String(e.title)}</p>
            {e.date ? (
              <p className="mt-1 font-sans text-[12px] text-ivory-faint">{prettyDate(String(e.date))}</p>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
