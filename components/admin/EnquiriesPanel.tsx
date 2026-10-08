"use client";

/**
 * Enquiries — the service sheets and vertical enquiries that come in
 * from the public forms.
 *
 * Read-only by design. An enquiry is a record of what somebody sent
 * us; editing it would quietly rewrite what they said, and the office
 * would then be working from a version the client never wrote. Acting
 * on one means phoning or messaging the person, which is one tap away
 * on every row.
 */
import { useMemo, useState } from "react";
import { ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import type { Row } from "@/components/admin/Portal";
import { cn } from "@/lib/utils";

const when = (iso: unknown) =>
  new Date(String(iso)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const wa = (phone: unknown) => `https://wa.me/91${String(phone).replace(/\D/g, "").slice(-10)}`;

export default function EnquiriesPanel({ rows, query }: { rows: Row[]; query: string }) {
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.id, r.name, r.phone, r.email, r.service].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [rows, query]);

  if (filtered.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--hairline)] px-6 py-14 text-center font-sans text-sm text-ivory-faint">
        {rows.length === 0 ? "No enquiries yet." : "Nothing matches that search."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((e) => {
        const expanded = open === e.id;
        const fields = Array.isArray(e.fields) ? (e.fields as { label: string; value: string }[]) : [];
        return (
          <article key={e.id} className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-obsidian/60">
            <button
              onClick={() => setOpen(expanded ? null : e.id)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
              aria-expanded={expanded}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-sans text-[15px] text-ivory">{String(e.name)}</p>
                  {e.status === "new" && (
                    <span className="rounded-full bg-gold px-2.5 py-0.5 font-sans text-[9px] uppercase tracking-widest text-black">New</span>
                  )}
                </div>
                <p className="mt-1 font-sans text-[13px] text-gold/90">{String(e.service || "General enquiry")}</p>
                <p className="mt-1 font-sans text-[11px] text-ivory-faint">
                  {String(e.category || "")}{e.category ? " · " : ""}{when(e.createdAt)} · {e.id}
                </p>
              </div>
              <ChevronDown size={16} className={cn("mt-1 shrink-0 text-ivory-faint transition-transform", expanded && "rotate-180")} />
            </button>

            {expanded && (
              <div className="border-t border-[var(--hairline)] px-5 py-5">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">Contact</p>
                    <dl className="space-y-1.5">
                      {([
                        ["Phone", String(e.phone || "—")],
                        ["Email", String(e.email || "—")],
                        ["Address", String(e.address || "—")],
                      ] as [string, string][]).map(([k, v]) => (
                        <div key={k} className="flex gap-3 font-sans text-[12.5px]">
                          <dt className="w-20 shrink-0 text-ivory-faint">{k}</dt>
                          <dd className="min-w-0 flex-1 break-words text-ivory-dim">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={`tel:+91${String(e.phone).replace(/\D/g, "").slice(-10)}`}
                        className="flex h-11 items-center gap-2 rounded-lg border border-[var(--hairline)] px-4 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold">
                        <Phone size={13} /> Call
                      </a>
                      <a href={wa(e.phone)} target="_blank" rel="noopener noreferrer"
                        className="flex h-11 items-center gap-2 rounded-lg bg-gold px-4 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                      {e.email ? (
                        <a href={`mailto:${String(e.email)}`}
                          className="flex h-11 items-center gap-2 rounded-lg border border-[var(--hairline)] px-4 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold">
                          <Mail size={13} /> Email
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    {fields.length > 0 && (
                      <>
                        <p className="mb-2 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">Particulars given</p>
                        <dl className="space-y-1.5">
                          {fields.map((f, i) => (
                            <div key={`${f.label}-${i}`} className="flex gap-3 font-sans text-[12.5px]">
                              <dt className="w-36 shrink-0 text-ivory-faint">{f.label}</dt>
                              <dd className="min-w-0 flex-1 whitespace-pre-wrap break-words text-ivory-dim">{f.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </>
                    )}

                    {e.notes ? (
                      <>
                        <p className="mb-2 mt-4 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">Their message</p>
                        <p className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-ivory-dim">{String(e.notes)}</p>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
