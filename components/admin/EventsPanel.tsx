"use client";

/**
 * SUPERADMIN — create and run sessions.
 *
 * EVERY INPUT THAT CAN BE A CHOICE IS A CHOICE.
 *
 * That was the explicit instruction and it is also the right design.
 * Free text in an event form produces "10 AM", "10:00" and "Morning 10"
 * as three different start times, and no seat counter or reminder can
 * reason about them. Type, venue, audience, seats, time, duration and
 * amenities are all closed lists drawn from config/events.config.ts —
 * adding a venue there makes it appear here, with no code change.
 *
 * Four things are typed, because no list can contain them: the title,
 * the summary, the speaker's name and the agenda lines. Everything
 * else is picked.
 *
 * The date picker is the browser's own. A custom one would be prettier
 * and would also have to reimplement keyboard entry, locale ordering
 * and the mobile wheel — all of which the native control already does
 * correctly.
 */
import { useMemo, useState } from "react";
import {
  CalendarDays, Check, ChevronDown, Loader2, Plus, Trash2, Users, X,
} from "lucide-react";
import {
  amenities, audiences, durations, eventKinds, eventStatuses, INTEREST_THRESHOLD,
  prettyDate, prettyTime, seatOptions, suggestedTopics, timeSlots, venues,
} from "@/config/events.config";
import type { Row } from "@/components/admin/Portal";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory transition-all focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";
const selectCls = cn(field, "appearance-none pr-11");

function Select({
  label, value, onChange, children, hint,
}: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gold" />
      </div>
      {hint && <p className="mt-1.5 font-sans text-[11px] text-ivory-faint">{hint}</p>}
    </div>
  );
}

type AgendaDay = { date: string; heading: string; items: { time: string; what: string }[] };

export default function EventsPanel({
  rows, onChanged,
}: { rows: Row[]; onChanged: () => void }) {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  /* ---- the form ---- */
  const [f, setF] = useState({
    title: "", summary: "", speaker: "",
    kind: eventKinds[0].id as string,
    venue: venues[0].id as string,
    venueNote: "",
    audience: audiences[0].id as string,
    capacity: String(seatOptions[2]),
    date: "", time: "10:00",
    duration: durations[2].id as string,
    days: "1",
  });
  const [chosenAmenities, setChosenAmenities] = useState<string[]>(["tea", "certificate"]);
  const [agenda, setAgenda] = useState<AgendaDay[]>([]);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const toggleAmenity = (id: string) =>
    setChosenAmenities((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const days = Number(f.days) || 1;

  /* Agenda rows follow the day count, so changing 1 → 2 days gives you
     a second day to fill rather than a form that silently ignores it. */
  useMemo(() => {
    setAgenda((prev) => {
      const next = [...prev];
      while (next.length < days) next.push({ date: "", heading: "", items: [{ time: "", what: "" }] });
      return next.slice(0, days);
    });
  }, [days]);

  const create = async () => {
    if (!f.title.trim()) { setError("Give the session a title."); return; }
    setBusy("create"); setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          capacity: Number(f.capacity),
          days,
          amenities: chosenAmenities,
          agenda: agenda.map((d) => ({ ...d, items: d.items.filter((i) => i.what.trim()) })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not create the session");
      setCreating(false);
      setF((p) => ({ ...p, title: "", summary: "", speaker: "", date: "" }));
      setAgenda([]);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the session");
    }
    setBusy(null);
  };

  const patchEvent = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) onChanged();
      else setError((await res.json()).error ?? "Could not update");
    } catch {
      setError("Could not reach the server");
    }
    setBusy(null);
  };

  /** Open the feedback window until 23:59 tonight — "by the evening". */
  const openFeedback = (id: string) => {
    const end = new Date();
    end.setHours(23, 59, 0, 0);
    patchEvent(id, { feedbackOpen: true, feedbackClosesAt: end.toISOString(), status: "completed" });
  };

  return (
    <div>
      {/* ---------- header ---------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-ivory">Sessions &amp; Programmes</h2>
          <p className="mt-1 font-sans text-[12px] text-ivory-faint">
            Everything here is chosen from a list, so seat counts and reminders can rely on it.
          </p>
        </div>
        <button
          onClick={() => { setCreating((v) => !v); setError(""); }}
          className="flex h-12 items-center gap-2 rounded-lg bg-gold px-5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
        >
          {creating ? <><X size={14} /> Close</> : <><Plus size={14} /> New session</>}
        </button>
      </div>

      {error && (
        <p className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-[12px] text-red-300">
          {error}
        </p>
      )}

      {/* ---------- create ---------- */}
      {creating && (
        <div className="mb-8 rounded-2xl border border-[var(--hairline)] bg-obsidian/60 p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Title</label>
              <input value={f.title} onChange={(e) => set("title", e.target.value)} className={field} placeholder="What is the session about?" />
              {/* Ready-made topics, so a proposal is two clicks. */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {suggestedTopics.slice(0, 4).map((t) => (
                  <button
                    key={t.en}
                    onClick={() => set("title", t.en)}
                    className="rounded-full border border-gold/25 px-3 py-1 text-left font-sans text-[10px] text-gold/80 transition-all hover:border-gold hover:text-gold"
                  >
                    {t.en.length > 46 ? `${t.en.slice(0, 46)}…` : t.en}
                  </button>
                ))}
              </div>
            </div>

            <Select label="Session type" value={f.kind} onChange={(v) => set("kind", v)}>
              {eventKinds.map((k) => <option key={k.id} value={k.id}>{k.en}</option>)}
            </Select>

            <Select label="Who may attend" value={f.audience} onChange={(v) => set("audience", v)}>
              {audiences.map((a) => <option key={a.id} value={a.id}>{a.en}</option>)}
            </Select>

            <Select label="Venue" value={f.venue} onChange={(v) => set("venue", v)}>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.en}</option>)}
            </Select>

            <div>
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Venue note</label>
              <input value={f.venueNote} onChange={(e) => set("venueNote", e.target.value)} className={field} placeholder="Room, floor, landmark" />
            </div>

            <Select
              label="Seats"
              value={f.capacity}
              onChange={(v) => set("capacity", v)}
              hint="Bookings are refused once this is reached."
            >
              {seatOptions.map((n) => <option key={n} value={String(n)}>{n} seats</option>)}
            </Select>

            <Select label="How many days" value={f.days} onChange={(v) => set("days", v)}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n} day{n > 1 ? "s" : ""}</option>)}
            </Select>

            <div>
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Date</label>
              <input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} className={field} />
              <p className="mt-1.5 font-sans text-[11px] text-ivory-faint">
                Leave empty to publish as a proposal — it gathers interest until {INTEREST_THRESHOLD} people sign up.
              </p>
            </div>

            <Select label="Start time" value={f.time} onChange={(v) => set("time", v)}>
              {timeSlots.map((t) => <option key={t} value={t}>{prettyTime(t)}</option>)}
            </Select>

            <Select label="Duration" value={f.duration} onChange={(v) => set("duration", v)}>
              {durations.map((d) => <option key={d.id} value={d.id}>{d.en}</option>)}
            </Select>

            <div>
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Speaker</label>
              <input value={f.speaker} onChange={(e) => set("speaker", e.target.value)} className={field} placeholder="Adv. …" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Summary</label>
              <textarea rows={3} value={f.summary} onChange={(e) => set("summary", e.target.value)} className={cn(field, "resize-y")} />
            </div>

            {/* ---- amenities ---- */}
            <div className="md:col-span-2">
              <p className="mb-2.5 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">What is laid on</p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => {
                  const on = chosenAmenities.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAmenity(a.id)}
                      className={cn(
                        "flex h-11 items-center gap-2 rounded-lg border px-4 font-sans text-[11px] transition-all",
                        on ? "border-gold bg-gold text-black" : "border-[var(--hairline)] text-ivory-dim hover:border-gold/60 hover:text-gold"
                      )}
                    >
                      {on && <Check size={12} />} {a.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ---- agenda ---- */}
            <div className="md:col-span-2">
              <p className="mb-2.5 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                Agenda {days > 1 ? `— ${days} days` : ""}
              </p>
              <div className="space-y-4">
                {agenda.map((d, di) => (
                  <div key={di} className="rounded-xl border border-[var(--hairline)] p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-gold-faint px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-gold">
                        Day {di + 1}
                      </span>
                      <input
                        value={d.heading}
                        onChange={(e) => setAgenda((p) => p.map((x, i) => (i === di ? { ...x, heading: e.target.value } : x)))}
                        placeholder="What this day covers"
                        className={cn(field, "flex-1")}
                      />
                    </div>
                    {d.items.map((it, ii) => (
                      <div key={ii} className="mb-2 flex gap-2">
                        <div className="relative w-36 shrink-0">
                          <select
                            value={it.time}
                            onChange={(e) => setAgenda((p) => p.map((x, i) => i === di
                              ? { ...x, items: x.items.map((y, j) => (j === ii ? { ...y, time: e.target.value } : y)) } : x))}
                            className={selectCls}
                          >
                            <option value="">Time</option>
                            {timeSlots.map((t) => <option key={t} value={t}>{prettyTime(t)}</option>)}
                          </select>
                          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gold" />
                        </div>
                        <input
                          value={it.what}
                          onChange={(e) => setAgenda((p) => p.map((x, i) => i === di
                            ? { ...x, items: x.items.map((y, j) => (j === ii ? { ...y, what: e.target.value } : y)) } : x))}
                          placeholder="Session, break, lunch…"
                          className={cn(field, "flex-1")}
                        />
                        <button
                          onClick={() => setAgenda((p) => p.map((x, i) => i === di
                            ? { ...x, items: x.items.filter((_, j) => j !== ii) } : x))}
                          className="shrink-0 px-2 text-ivory-faint transition-colors hover:text-red-400"
                          aria-label="Remove line"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setAgenda((p) => p.map((x, i) => i === di
                        ? { ...x, items: [...x.items, { time: "", what: "" }] } : x))}
                      className="mt-1 font-sans text-[11px] uppercase tracking-widest text-gold transition-colors hover:text-gold-bright"
                    >
                      + Add a line
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={create}
            disabled={busy === "create"}
            className="mt-7 flex h-12 items-center gap-2 rounded-lg bg-gold px-7 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
          >
            {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {f.date ? "Publish session" : "Publish as a proposal"}
          </button>
        </div>
      )}

      {/* ---------- the list ---------- */}
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-[var(--hairline)] px-6 py-14 text-center font-sans text-sm text-ivory-faint">
          No sessions yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((ev) => {
            const seats = (ev.seats ?? {}) as { capacity?: number; booked?: number; left?: number };
            const interest = (ev.interest ?? {}) as { votes?: number; threshold?: number; met?: boolean };
            const meta = eventStatuses.find((s) => s.id === ev.status);
            const proposal = ev.status === "proposed";

            return (
              <article key={ev.id} className="rounded-2xl border border-[var(--hairline)] bg-obsidian/60 p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-lg text-ivory">{String(ev.title)}</p>
                    <p className="mt-1 font-sans text-[12px] text-ivory-faint">
                      {ev.date ? prettyDate(String(ev.date)) : "No date — proposal"}
                      {ev.time ? ` · ${prettyTime(String(ev.time))}` : ""} · {ev.id}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-ivory-dim">
                    {meta?.label ?? String(ev.status)}
                  </span>
                </div>

                <p className="mt-3 flex items-center gap-2 font-sans text-[13px] text-ivory-dim">
                  <Users size={13} className="text-gold" />
                  {proposal
                    ? <>{interest.votes ?? 0} / {interest.threshold ?? INTEREST_THRESHOLD} interested{interest.met ? " — ready to schedule" : ""}</>
                    : <>{seats.booked ?? 0} / {seats.capacity ?? 0} booked · {seats.left ?? 0} left</>}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {proposal && (
                    <span className="flex h-11 items-center rounded-lg border border-dashed border-gold/40 px-4 font-sans text-[11px] text-gold/80">
                      Set a date below to open booking
                    </span>
                  )}
                  {!proposal && (
                    <input
                      type="date"
                      defaultValue={String(ev.date ?? "")}
                      onChange={(e) => patchEvent(ev.id, { date: e.target.value })}
                      className="h-11 rounded-lg border border-[var(--hairline)] bg-obsidian/70 px-3 font-sans text-[12px] text-ivory"
                    />
                  )}
                  {proposal && (
                    <input
                      type="date"
                      onChange={(e) => patchEvent(ev.id, { date: e.target.value, status: "scheduled" })}
                      className="h-11 rounded-lg border border-[var(--hairline)] bg-obsidian/70 px-3 font-sans text-[12px] text-ivory"
                    />
                  )}

                  {(ev.status === "scheduled" || ev.status === "full" || ev.status === "running") && (
                    <button
                      onClick={() => openFeedback(ev.id)}
                      disabled={busy === ev.id}
                      className="flex h-11 items-center gap-2 rounded-lg bg-gold px-4 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-50"
                    >
                      <CalendarDays size={13} /> End &amp; open feedback
                    </button>
                  )}

                  {ev.feedbackOpen === true && (
                    <span className="flex h-11 items-center gap-2 rounded-lg border border-emerald-500/40 px-4 font-sans text-[11px] text-emerald-300">
                      <Check size={13} /> Feedback open until tonight
                    </span>
                  )}

                  {ev.status !== "cancelled" && (
                    <button
                      onClick={() => patchEvent(ev.id, { status: "cancelled" })}
                      disabled={busy === ev.id}
                      className="flex h-11 items-center rounded-lg border border-[var(--hairline)] px-4 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
