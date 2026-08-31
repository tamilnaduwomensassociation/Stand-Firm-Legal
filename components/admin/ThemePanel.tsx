"use client";

/**
 * SUPERADMIN — restyle a brand.
 *
 * Colours, fonts, type scale, corner rounding and two images. The
 * contrast warning updates as you pick and the Save button refuses
 * while any pair fails, so the failure is caught before the save, not
 * after the site has gone unreadable. The server checks the same thing
 * again — see app/api/theme/route.ts.
 *
 * The preview is a real card built from the tokens rather than a
 * swatch grid, because "is this readable?" is a question about text on
 * a surface, and only text on a surface answers it.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ImageIcon, Loader2, RotateCcw, Save, Upload } from "lucide-react";
import { fontChoices, themeFields, type ThemeTokens } from "@/config/theme.config";
import { checkTheme, contrast } from "@/lib/theme";
import type { BrandId } from "@/config/brands.config";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none";

export default function ThemePanel({ brand }: { brand: BrandId }) {
  const [theme, setTheme] = useState<ThemeTokens>({});
  const [saved, setSaved] = useState<ThemeTokens>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  /* Upload availability, and the reason when it is off. */
  const [uploads, setUploads] = useState<{ live: boolean; reason: string | null }>({ live: false, reason: null });
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [t, m] = await Promise.all([
          fetch(`/api/theme?brand=${brand}`, { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/media", { cache: "no-store" }).then((r) => r.json()),
        ]);
        setTheme(t.theme ?? {});
        setSaved(t.theme ?? {});
        setUploads({ live: Boolean(m.live), reason: m.reason ?? null });
      } catch {
        /* Leave the defaults; the panel still works for colours. */
      }
      setLoading(false);
    })();
  }, [brand]);

  const problems = useMemo(() => checkTheme(theme), [theme]);
  const dirty = JSON.stringify(theme) !== JSON.stringify(saved);

  const set = (k: keyof ThemeTokens, v: string | number | undefined) =>
    setTheme((p) => {
      const next = { ...p };
      if (v === "" || v === undefined) delete next[k];
      else (next as Record<string, unknown>)[k] = v;
      return next;
    });

  const pickFile = async (slot: string, file: File) => {
    setUploading(slot); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("brand", brand);
      fd.append("slot", slot);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      set(slot as keyof ThemeTokens, d.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
    setUploading(null);
  };

  const save = async () => {
    setBusy(true); setError(""); setDone(false);
    try {
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, theme }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not save");
      setSaved(d.theme ?? theme);
      setDone(true);
      window.setTimeout(() => setDone(false), 2600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
    setBusy(false);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gold" /></div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-ivory">Appearance</h2>
        <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
          Every field is an override — clear one and the site goes back to how it shipped.
          A combination that would be hard to read cannot be saved.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ---------- controls ---------- */}
        <div className="space-y-5">
          {themeFields.map((f) => {
            const value = (theme as Record<string, unknown>)[f.key];

            if (f.type === "color") {
              const paired = f.pairsWith ? (theme as Record<string, unknown>)[f.pairsWith] : undefined;
              const ratio = value && paired ? contrast(String(value), String(paired)) : null;
              return (
                <div key={f.key}>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {f.label}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={String(value ?? "#c9a24b")}
                      onChange={(e) => set(f.key as keyof ThemeTokens, e.target.value)}
                      className="h-12 w-16 shrink-0 cursor-pointer rounded-lg border border-[var(--hairline)] bg-transparent"
                      aria-label={f.label}
                    />
                    <input
                      value={String(value ?? "")}
                      onChange={(e) => set(f.key as keyof ThemeTokens, e.target.value)}
                      placeholder="Using the built-in colour"
                      className={field}
                    />
                    {value ? (
                      <button
                        onClick={() => set(f.key as keyof ThemeTokens, "")}
                        className="shrink-0 px-2 text-ivory-faint transition-colors hover:text-gold"
                        aria-label="Clear"
                        title="Back to the built-in colour"
                      >
                        <RotateCcw size={15} />
                      </button>
                    ) : null}
                  </div>
                  {ratio !== null && (
                    <p className={cn("mt-1.5 font-sans text-[11px]", ratio < 4.5 ? "text-amber-300" : "text-ivory-faint")}>
                      Contrast {ratio}:1 {ratio < 4.5 ? "— needs 4.5:1 to be readable" : "✓"}
                    </p>
                  )}
                </div>
              );
            }

            if (f.type === "font") {
              return (
                <div key={f.key}>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {f.label}
                  </label>
                  <select
                    value={String(value ?? "")}
                    onChange={(e) => set(f.key as keyof ThemeTokens, e.target.value)}
                    className={field}
                  >
                    <option value="">As designed</option>
                    {fontChoices.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              );
            }

            if (f.type === "range") {
              const n = typeof value === "number" ? value : 1;
              return (
                <div key={f.key}>
                  <label className="mb-1.5 flex items-center justify-between font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {f.label}
                    <span className="text-gold">{value === undefined ? "as designed" : `${n}×`}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={f.min} max={f.max} step={f.step}
                      value={n}
                      onChange={(e) => set(f.key as keyof ThemeTokens, Number(e.target.value))}
                      className="h-11 flex-1 accent-[var(--gold)]"
                    />
                    {value !== undefined && (
                      <button onClick={() => set(f.key as keyof ThemeTokens, undefined)} className="shrink-0 px-2 text-ivory-faint hover:text-gold" aria-label="Reset">
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            /* image */
            return (
              <div key={f.key}>
                <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                  {f.label}
                </label>
                {value ? (
                  <div className="mb-2 flex items-center gap-3 rounded-xl border border-[var(--hairline)] p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={String(value)} alt="" className="h-14 w-20 rounded object-cover" />
                    <p className="min-w-0 flex-1 truncate font-sans text-[11px] text-ivory-faint">{String(value)}</p>
                    <button onClick={() => set(f.key as keyof ThemeTokens, "")} className="shrink-0 px-2 text-ivory-faint hover:text-red-400" aria-label="Remove">
                      <RotateCcw size={15} />
                    </button>
                  </div>
                ) : null}
                <input
                  ref={(el) => { fileInputs.current[f.key] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) pickFile(f.key, file); }}
                />
                <button
                  onClick={() => fileInputs.current[f.key]?.click()}
                  disabled={!uploads.live || uploading === f.key}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--hairline)] font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploading === f.key
                    ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                    : <><Upload size={14} /> Upload an image</>}
                </button>
                {!uploads.live && uploads.reason && (
                  <p className="mt-1.5 flex gap-2 font-sans text-[11px] leading-relaxed text-amber-300/90">
                    <ImageIcon size={13} className="mt-0.5 shrink-0" /> {uploads.reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ---------- preview ---------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2.5 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">Preview</p>
          <div
            className="overflow-hidden rounded-2xl border border-[var(--hairline)]"
            style={{ background: theme.bg ?? "#0A0A0B" }}
          >
            {theme.heroImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={theme.heroImage} alt="" className="h-24 w-full object-cover" />
            ) : null}
            <div className="p-5" style={{ background: theme.surface ?? "#141416" }}>
              {theme.logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={theme.logo} alt="" className="mb-3 h-10 w-auto" />
              ) : null}
              <p
                style={{
                  color: theme.text ?? "#F3EEE3",
                  fontFamily: fontChoices.find((f) => f.id === theme.headingFont)?.stack,
                  fontSize: `${1.35 * (theme.scale ?? 1)}rem`,
                  lineHeight: 1.3,
                }}
              >
                A heading in this theme
              </p>
              <p
                className="mt-2"
                style={{
                  color: theme.text ?? "#F3EEE3",
                  opacity: 0.8,
                  fontFamily: fontChoices.find((f) => f.id === theme.bodyFont)?.stack,
                  fontSize: `${0.85 * (theme.scale ?? 1)}rem`,
                  lineHeight: 1.6,
                }}
              >
                Body text as a visitor would read it, at the size and in the family you have chosen.
              </p>
              <button
                className="mt-4 px-5 py-2.5 font-sans text-[11px] uppercase tracking-widest"
                style={{
                  background: theme.accent ?? "#C9A24B",
                  color: theme.onAccent ?? "#000000",
                  borderRadius: `${9999 * (theme.radius ?? 1)}px`,
                }}
              >
                A button
              </button>
            </div>
          </div>

          {problems.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-widest text-amber-300">
                <AlertTriangle size={13} /> Cannot save yet
              </p>
              <ul className="mt-2 space-y-1.5">
                {problems.map((p) => (
                  <li key={p.pair} className="font-sans text-[12px] leading-relaxed text-amber-200/90">
                    {p.pair}: {p.ratio}:1 — needs {p.needs}:1
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-[12px] text-red-300">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--hairline)] bg-obsidian-deep/95 py-4 backdrop-blur">
        <button
          onClick={save}
          disabled={busy || !dirty || problems.length > 0}
          className="flex h-12 items-center gap-2 rounded-lg bg-gold px-6 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-40"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : done ? <Check size={14} /> : <Save size={14} />}
          {busy ? "Saving…" : done ? "Saved" : "Save appearance"}
        </button>
        {dirty && (
          <button
            onClick={() => setTheme(saved)}
            className="flex h-12 items-center gap-2 rounded-lg border border-[var(--hairline)] px-5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold"
          >
            <RotateCcw size={14} /> Discard
          </button>
        )}
        <p className="font-sans text-[11px] text-ivory-faint">
          {problems.length > 0 ? "Fix the contrast warnings first" : dirty ? "Unsaved changes" : "Everything saved"}
        </p>
      </div>
    </div>
  );
}
