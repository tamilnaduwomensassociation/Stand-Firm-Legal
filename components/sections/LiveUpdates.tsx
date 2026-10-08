"use client";

/**
 * LIVE ACTIVITY — a homepage strip fed directly from Superadmin's
 * "Live Activity" tab (still `/api/live-updates` and the `live-updates`
 * collection under the hood — the tab's DISPLAY name changed, the
 * plumbing did not, so nothing already wired to it had to move).
 * An admin uploads a photo, types a line of text, and it appears here
 * immediately — no draft, no review gate, unlike the weekly Blog just
 * below it. Sits directly above "From Our Desk" on the home page.
 *
 * SEEDED ENTRY
 * `seedUpdates` below is one real, specific update — the Chief
 * Minister's inspection visit — checked into the codebase directly
 * rather than requiring someone to re-upload it through the panel.
 * It always renders first, ahead of anything published later through
 * Superadmin, and it is the reason this section is never actually
 * empty even before an admin publishes their first update.
 *
 * MULTI-PHOTO CARDS
 * A seeded (or future admin-published) entry can carry `images: []`
 * instead of a single `image`. When it does, the card becomes a
 * click-to-advance carousel: tapping anywhere on the card crossfades
 * to the next photo and cycles back to the first after the last, with
 * small dots marking position. A single-image or text-only update
 * renders exactly as it did before this existed.
 */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

type Update = { id: string; text?: string; image?: string; images?: string[]; video?: string; createdAt: string };
type MediaItem = { kind: "image" | "video"; src: string };

/* Real, published now — see the file header. Dated to when it was
   added to the site rather than guessed at, since the exact hour of
   the visit itself isn't on record here. The video is the same visit,
   filmed on site — it always plays last, after the three photos. */
const seedUpdates: Update[] = [
  {
    id: "seed-cm-visit-m3-puzhal",
    createdAt: "2026-09-05T00:00:00.000Z",
    images: [
      "/media/live-activity/inspection-1.jpg",
      "/media/live-activity/inspection-2.jpg",
      "/media/live-activity/inspection-3.jpg",
    ],
    video: "/media/live-activity/cm-visit-video.mp4",
    text:
      "During the inspection conducted by Hon’ble Chief Minister C. Joseph Vijay at M3 Puzhal Police Station, Chennai, he met M. Jenifer Arokia Mary, President of Tamilnadu Women Law Association – Madras and High Court Advocate, along with Commitee Member Advocate M Preethi.\nThe meeting provided an opportunity to discuss matters concerning the legal profession, women’s rights, and the welfare of the public.",
  },
];

function UpdateCard({ u, lang }: { u: Update; lang: string }) {
  const photos = u.images && u.images.length > 0 ? u.images : u.image ? [u.image] : [];
  /* The video, when there is one, is always the last item in the
     sequence — after every photo, never mixed in between. */
  const media: MediaItem[] = [
    ...photos.map((src): MediaItem => ({ kind: "image", src })),
    ...(u.video ? [{ kind: "video", src: u.video } as MediaItem] : []),
  ];
  const [idx, setIdx] = useState(0);
  const multi = media.length > 1;
  const current = media[idx];

  const go = (delta: number) => setIdx((i) => (i + media.length + delta) % media.length);

  /* Auto-advance every 5 seconds, same as a typical photo carousel.
     Paused while the current slide is a video — the video has its own
     controls and shouldn't be yanked away mid-playback — and reset
     whenever the visitor manually changes slide (idx in the deps) so
     the next auto-advance is always a full 5s after the last change,
     manual or automatic. */
  useEffect(() => {
    if (!multi) return;
    if (current?.kind === "video") return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multi, idx, current?.kind, media.length]);

  return (
    <article className="overflow-hidden rounded-2xl glass gold-border">
      {media.length > 0 ? (
        <div className="group relative h-64 w-full overflow-hidden bg-obsidian">
          {media.map((m, i) =>
            m.kind === "video" ? (
              <video
                key={m.src}
                src={m.src}
                controls
                playsInline
                preload="metadata"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
                  i === idx ? "z-10 opacity-100" : "z-0 opacity-0"
                )}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={m.src}
                src={m.src}
                alt=""
                loading="lazy"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out",
                  i === idx ? "z-10 scale-100 opacity-100" : "z-0 scale-105 opacity-0"
                )}
              />
            )
          )}

          {multi && (
            <>
              {/* Explicit prev/next controls — click-anywhere-to-advance
                  would fight with the video's own play/pause controls
                  once the last slide is a <video>, so navigation is
                  always through these arrows and the dots below, never
                  a click on the media itself. */}
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={lang === "ta" ? "முந்தையது" : "Previous"}
                className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-obsidian-deep/50 text-ivory opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:bg-obsidian-deep/70 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={lang === "ta" ? "அடுத்தது" : "Next"}
                className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-obsidian-deep/50 text-ivory opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:bg-obsidian-deep/70 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <ChevronRight size={16} />
              </button>

              <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                {media.map((m, i) => (
                  <button
                    key={m.src}
                    type="button"
                    onClick={() => setIdx(i)}
                    aria-label={`${i + 1}/${media.length}`}
                    className={cn(
                      "pointer-events-auto h-1.5 rounded-full transition-all duration-300",
                      i === idx ? "w-5 bg-gold" : "w-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <time className="font-sans text-[11px] uppercase tracking-widest text-gold/70">
            {new Date(u.createdAt).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </time>
          {multi && (
            <span className="font-sans text-[10px] uppercase tracking-widest text-ivory-faint">
              {idx + 1}/{media.length} {current?.kind === "video" ? (lang === "ta" ? "· வீடியோ" : "· Video") : ""}
            </span>
          )}
        </div>
        {u.text ? (
          <p className="prose-justify mt-3 whitespace-pre-line font-sans text-sm leading-relaxed text-ivory-dim">
            {u.text}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function LiveUpdates() {
  const { lang, t } = useLang();
  const [fetched, setFetched] = useState<Update[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/live-updates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && Array.isArray(j?.updates)) setFetched(j.updates); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const updates = [...seedUpdates, ...fetched];
  if (updates.length === 0) return null;

  return (
    <section id="live-updates" className="bg-obsidian-deep section-pad">
      <SectionHeading kicker={t("liveUpdatesKicker")} title={t("liveUpdatesTitle")} />

      {/* flex + justify-center rather than a strict grid: a single
          update (today's reality) sits centered on the page instead of
          pinned to the left edge of an otherwise-empty grid row, and
          it still wraps into a tidy centered row if more are added. */}
      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-6">
        {updates.map((u) => (
          <div key={u.id} className="w-full sm:w-[420px]">
            <UpdateCard u={u} lang={lang} />
          </div>
        ))}
      </div>
    </section>
  );
}
