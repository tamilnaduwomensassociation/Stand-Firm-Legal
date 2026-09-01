"use client";

/**
 * Superadmin sign-in.
 *
 * The form posts to /api/auth/login and nothing else. There is no
 * password in this bundle to compare against — that was the whole
 * problem with doing this on a static site, where the only place to
 * check a password is the browser and anyone can read the browser.
 * Here the check happens on the server against a scrypt hash, and all
 * this component ever learns is whether it worked.
 *
 * The error is deliberately vague. "Wrong password" would confirm that
 * the username exists, which is a free list of valid accounts for
 * anyone who wants to guess at one.
 */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, ShieldCheck, User } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 py-3.5 pl-12 pr-5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/superadmin";

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Sign-in failed");
      /* refresh() so the server re-reads the new cookie before the
         portal renders — without it the layout can still see the
         signed-out state. */
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-obsidian-deep px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint ring-1 ring-gold/40">
            <ShieldCheck size={28} className="text-gold" />
          </div>
          <h1 className="font-serif text-3xl gold-text md:text-4xl">Superadmin</h1>
          <p className="mt-3 font-sans text-[13px] leading-relaxed text-ivory-dim">
            TNWLA Madras · Stand Firm Legal · Jeni Enterprises · Harmony Pranic Healing
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl glass gold-border p-7 md:p-8">
          <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
            Username
          </label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold/70" />
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className={inputCls}
              placeholder="Master - TSJH"
              required
            />
          </div>

          <label className="mb-1.5 mt-5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold/70" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={inputCls}
              placeholder="••••••••••••"
              required
            />
          </div>

          {error && (
            <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-[12px] text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
          >
            {busy ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : "Sign in"}
          </button>

          <p className="mt-6 text-center font-sans text-[10px] leading-relaxed text-ivory-faint">
            Sessions last 12 hours. This area is not indexed by search engines and every
            change made here is recorded against the account that made it.
          </p>
        </form>
      </div>
    </main>
  );
}
