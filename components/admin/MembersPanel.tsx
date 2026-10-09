"use client";

/**
 * SUPERADMIN — Members (existing-member requests, claim codes, standing).
 *
 * Three jobs, one panel:
 *   1. REQUESTS   the queue of "Add Existing Member Details" submissions.
 *                 Approve / ask for a correction / reject. A request that
 *                 matches another record (same mobile, email or enrolment
 *                 number) shows a flag and needs the override ticked.
 *   2. CODES      give any active member without a card a one-time code.
 *                 The code is shown ONCE, here, for the office to pass to
 *                 the member on the mobile number it already holds.
 *   3. MEMBERS    who is on the roll, their standing, whether a card exists;
 *                 suspend / revoke / reinstate.
 * Every action is a server call that checks the Superadmin session again
 * and writes an audit row; nothing here decides anything by itself.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, FileText, KeyRound, Loader2, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-2.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";
const btn = "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-4 py-2 font-sans text-[11px] uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-50";

type Req = {
  id: string; createdAt: string; status: "pending" | "approved" | "rejected" | "needs_correction";
  membershipNo: string; fullName: string; email: string; mobile: string; category: string; dob: string;
  enrollmentNo: string; district: string; address: string; hasPhoto: boolean; hasDocument: boolean;
  flags: string[]; reviewNote?: string; reviewedBy?: string;
};
type Mem = { id: string; createdAt: string; memberName: string; membershipNo: string; source: string; status: string; cardStatus: string };
type Code = { membershipNo: string; memberName: string; mobile: string; code: string; expiresAt: string };

const FLAG_TEXT: Record<string, string> = {
  mobile_matches_another_member: "Mobile number matches another member or request",
  email_matches_another_member: "Email matches another member or request",
  enrolment_matches_another_member: "Enrolment number matches another member or request",
};

const tone: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300", approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400", needs_correction: "bg-sky-500/15 text-sky-300",
  active: "bg-emerald-500/15 text-emerald-400", suspended: "bg-amber-500/15 text-amber-300",
  revoked: "bg-red-500/15 text-red-400", pending_verification: "bg-amber-500/15 text-amber-300",
  created: "bg-emerald-500/15 text-emerald-400", not_created: "bg-white/10 text-ivory-dim",
};
const Pill = ({ v, prefix = "" }: { v: string; prefix?: string }) => (
  <span className={cn("rounded-full px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-wider", tone[v] ?? "bg-white/10 text-ivory-dim")}>{prefix}{v.replace(/_/g, " ")}</span>
);

export default function MembersPanel() {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [mems, setMems] = useState<Mem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [issued, setIssued] = useState<Code | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [override, setOverride] = useState<Record<string, boolean>>({});
  const [codeFor, setCodeFor] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch("/api/members/requests", { cache: "no-store" }),
        fetch("/api/members/directory", { cache: "no-store" }),
      ]);
      if (a.ok) setReqs((await a.json()).requests);
      if (b.ok) setMems((await b.json()).members);
      if (!a.ok || !b.ok) setMsg({ ok: false, text: "Could not load — are you still signed in?" });
    } catch { setMsg({ ok: false, text: "Could not reach the server." }); }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const act = async (r: Req, action: "approve" | "reject" | "needs_correction") => {
    if (busyId) return;
    setBusyId(r.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/members/requests/${encodeURIComponent(r.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: notes[r.id] ?? "", overrideFlags: override[r.id] === true }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: d.error || "Could not save that decision." });
      else {
        setMsg({ ok: true, text: action === "approve" ? `${r.membershipNo} approved — pass the code below to the member.` : `Request ${action === "reject" ? "rejected" : "sent back for correction"}.` });
        if (action === "approve" && d.claim) {
          setIssued({ membershipNo: r.membershipNo, memberName: r.fullName, mobile: r.mobile, code: d.claim.code, expiresAt: d.claim.expiresAt });
          setCopied(false);
        }
        await load();
      }
    } catch { setMsg({ ok: false, text: "Could not reach the server." }); }
    setBusyId(null);
  };

  const issueCode = async (no: string) => {
    if (busyId || !no.trim()) return;
    setBusyId("code");
    setMsg(null);
    try {
      const res = await fetch("/api/members/claim-code", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ membershipNo: no }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: d.error || "Could not issue a code." });
      else { setIssued(d); setCopied(false); setCodeFor(""); }
    } catch { setMsg({ ok: false, text: "Could not reach the server." }); }
    setBusyId(null);
  };

  const setStatus = async (m: Mem, status: string) => {
    if (busyId) return;
    if (!window.confirm(`Set ${m.membershipNo} (${m.memberName}) to “${status}”?`)) return;
    setBusyId(m.id);
    try {
      const res = await fetch("/api/members/directory", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ membershipNo: m.membershipNo, status }),
      });
      const d = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, text: `${m.membershipNo} is now ${status}.` } : { ok: false, text: d.error || "Could not change the status." });
      if (res.ok) await load();
    } catch { setMsg({ ok: false, text: "Could not reach the server." }); }
    setBusyId(null);
  };

  const shown = useMemo(() => reqs.filter((r) => filter === "all" || r.status === "pending"), [reqs, filter]);
  const members = useMemo(() => {
    const n = q.trim().toLowerCase();
    return mems.filter((m) => !n || m.memberName.toLowerCase().includes(n) || m.membershipNo.toLowerCase().includes(n));
  }, [mems, q]);
  const pendingCount = reqs.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-8">
      {msg && <p role="status" className={cn("rounded-xl border px-4 py-3 font-sans text-xs", msg.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-400/40 bg-red-500/10 text-red-300")}>{msg.text}</p>}

      {issued && (
        <div className="rounded-2xl border border-gold/50 bg-gold-faint p-5" role="alert">
          <p className="font-sans text-[11px] uppercase tracking-widest text-ivory-dim">One-time code — shown once</p>
          <p className="mt-2 font-mono text-3xl tracking-[0.3em] text-gold">{issued.code}</p>
          <p className="mt-2 font-sans text-xs leading-relaxed text-ivory-dim">
            For <b className="text-ivory">{issued.memberName}</b> · {issued.membershipNo}. Give it to the member on {issued.mobile ? <b className="text-ivory">{issued.mobile}</b> : "the mobile number on file"}.
            Valid until {new Date(issued.expiresAt).toLocaleDateString()}; locks after 5 wrong tries. It cannot be shown again — issue a new one if lost.
          </p>
          <div className="mt-3 flex gap-2">
            <button className={cn(btn, "gold-border text-gold hover:bg-gold hover:text-black")}
              onClick={async () => { try { await navigator.clipboard.writeText(issued.code); setCopied(true); } catch { /* ignore */ } }}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
            </button>
            <button className={cn(btn, "border border-[var(--hairline)] text-ivory-dim hover:text-ivory")} onClick={() => setIssued(null)}><X size={13} /> Hide</button>
          </div>
        </div>
      )}

      {/* ---------------- requests ---------------- */}
      <section aria-labelledby="mp-req">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="mp-req" className="font-serif text-xl text-ivory">Existing-member requests {pendingCount > 0 && <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 font-sans text-xs text-amber-300">{pendingCount} pending</span>}</h2>
          <div className="flex gap-1 rounded-full bg-obsidian-soft/60 p-1">
            {(["pending", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-4 py-2 font-sans text-[11px] uppercase tracking-widest", filter === f ? "bg-gold text-black" : "text-ivory-dim")}>{f}</button>
            ))}
          </div>
        </div>
        {loading ? <p className="flex items-center gap-2 font-sans text-sm text-ivory-dim"><Loader2 className="animate-spin" size={14} /> Loading…</p>
          : shown.length === 0 ? <p className="font-sans text-sm text-ivory-faint">No {filter === "pending" ? "pending " : ""}requests.</p>
          : <ul className="space-y-3">
              {shown.map((r) => (
                <li key={r.id} className="rounded-2xl glass gold-border p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-lg text-ivory">{r.fullName}</p>
                      <p className="font-sans text-xs text-gold">{r.membershipNo} · {r.id}</p>
                    </div>
                    <Pill v={r.status} />
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-1 font-sans text-xs sm:grid-cols-2">
                    {([["Mobile", r.mobile], ["Email", r.email], ["Category", r.category], ["Enrolment", r.enrollmentNo], ["District", r.district], ["Birthday (day-month)", r.dob], ["Address", r.address], ["Submitted", new Date(r.createdAt).toLocaleString()]] as const).map(([k, v]) => v ? (
                      <div key={k} className="flex gap-2"><dt className="w-32 shrink-0 text-ivory-faint">{k}</dt><dd className="min-w-0 break-words text-ivory">{v}</dd></div>
                    ) : null)}
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {r.hasPhoto && <a className="inline-flex items-center gap-1.5 font-sans text-xs text-gold underline" href={`/api/members/requests/${encodeURIComponent(r.id)}/file?which=photo`}><FileText size={13} /> Photograph</a>}
                    {r.hasDocument && <a className="inline-flex items-center gap-1.5 font-sans text-xs text-gold underline" href={`/api/members/requests/${encodeURIComponent(r.id)}/file?which=document`}><FileText size={13} /> Supporting document</a>}
                  </div>
                  {r.flags?.length > 0 && r.status === "pending" && (
                    <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3">
                      <p className="flex items-center gap-1.5 font-sans text-xs font-semibold text-amber-300"><ShieldAlert size={14} /> Check before approving</p>
                      <ul className="mt-1 list-disc pl-5 font-sans text-xs text-amber-200">{r.flags.map((f) => <li key={f}>{FLAG_TEXT[f] ?? f}</li>)}</ul>
                      <label className="mt-2 flex cursor-pointer items-center gap-2 font-sans text-xs text-ivory">
                        <input type="checkbox" checked={override[r.id] === true} onChange={(e) => setOverride((o) => ({ ...o, [r.id]: e.target.checked }))} /> I have checked this — approve anyway
                      </label>
                    </div>
                  )}
                  {r.reviewNote && r.status !== "pending" && <p className="mt-3 font-sans text-xs text-ivory-dim">Note{r.reviewedBy ? ` (${r.reviewedBy})` : ""}: {r.reviewNote}</p>}
                  {r.status === "pending" && (
                    <div className="mt-4 space-y-3">
                      <label className="block"><span className="sr-only">Note (required to reject or ask for a correction)</span>
                        <input className={inputCls} placeholder="Note — required to reject or ask for a correction" maxLength={500} value={notes[r.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button disabled={busyId !== null || (r.flags?.length > 0 && !override[r.id])} onClick={() => act(r, "approve")} className={cn(btn, "bg-gold text-black hover:bg-gold-bright")}>{busyId === r.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve</button>
                        <button disabled={busyId !== null} onClick={() => act(r, "needs_correction")} className={cn(btn, "gold-border text-gold hover:bg-gold hover:text-black")}>Needs correction</button>
                        <button disabled={busyId !== null} onClick={() => act(r, "reject")} className={cn(btn, "border border-red-400/50 text-red-300 hover:bg-red-500/20")}>Reject</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>}
      </section>

      {/* ---------------- codes ---------------- */}
      <section aria-labelledby="mp-code" className="rounded-2xl glass gold-border p-5">
        <h2 id="mp-code" className="flex items-center gap-2 font-serif text-xl text-ivory"><KeyRound size={18} className="text-gold" /> Issue a one-time code</h2>
        <p className="mt-1 mb-3 font-sans text-xs text-ivory-dim">For a member who is on the roll but has no card — for example one added by the bulk import. Replaces any earlier code for that number.</p>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); void issueCode(codeFor); }}>
          <input className={inputCls} placeholder="Membership number, e.g. 57 or TNWLA/2026/57" value={codeFor} maxLength={40} onChange={(e) => setCodeFor(e.target.value)} aria-label="Membership number" />
          <button type="submit" disabled={busyId !== null || !codeFor.trim()} className={cn(btn, "bg-gold text-black hover:bg-gold-bright sm:shrink-0")}>{busyId === "code" ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />} Issue code</button>
        </form>
      </section>

      {/* ---------------- members ---------------- */}
      <section aria-labelledby="mp-mem">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="mp-mem" className="font-serif text-xl text-ivory">Members on the roll <span className="font-sans text-xs text-ivory-faint">({mems.length})</span></h2>
          <input className={cn(inputCls, "max-w-xs")} placeholder="Search name or number…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" />
        </div>
        <ul className="divide-y divide-[var(--hairline)] rounded-2xl glass gold-border">
          {members.slice(0, 200).map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-sans text-sm text-ivory">{m.memberName}</p>
                <p className="font-sans text-xs text-gold">{m.membershipNo}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill v={m.status} /><Pill v={m.cardStatus} prefix="card: " />
                <select aria-label={`Change status of ${m.membershipNo}`} className="min-h-[44px] rounded-full border border-[var(--hairline)] bg-obsidian/70 px-3 font-sans text-[11px] text-ivory-dim"
                  value="" disabled={busyId !== null} onChange={(e) => e.target.value && setStatus(m, e.target.value)}>
                  <option value="">Change status…</option>
                  {["active", "suspended", "revoked"].filter((s) => s !== m.status).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </li>
          ))}
          {members.length === 0 && <li className="px-4 py-6 text-center font-sans text-sm text-ivory-faint">No stored members{q ? " match" : ""}.</li>}
        </ul>
        <p className="mt-2 font-sans text-[11px] text-ivory-faint">Members in the built-in list (config/members.config.ts) are not shown here; they already have printed cards.</p>
      </section>
    </div>
  );
}
