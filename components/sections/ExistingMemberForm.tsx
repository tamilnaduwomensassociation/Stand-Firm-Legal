"use client";

/**
 * ADD EXISTING MEMBER DETAILS
 *
 * For someone who is already a TNWLA member but whose number is not in
 * the online directory. Submitting this does NOT make them a member and
 * does NOT produce a card: it files a request that the office checks
 * against its own records, and only an approval creates the member
 * (keeping the number they already hold). See lib/server/membership.ts.
 *
 * Validation runs here for the person's convenience and again on the
 * server, which is the one that counts — it also rejects fields this
 * form never sends. Whatever the server says about a field is shown
 * against that field; what was typed is kept (the files are not, since
 * a rejected upload has to be chosen again anyway).
 */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Send, Upload } from "lucide-react";
import { membershipCategories } from "@/config/forms.config";
import { MEMBERSHIP_PREFIX, toSerial } from "@/config/membership.config";
import { readDocument, shrinkImage } from "@/lib/shrinkImage";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-4 py-2.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all aria-[invalid=true]:border-red-400/70";

type Values = {
  fullName: string; serial: string; email: string; mobile: string; category: string;
  dob: string; enrollmentNo: string; district: string; address: string; confirm: boolean;
};

const EMPTY: Values = {
  fullName: "", serial: "", email: "", mobile: "", category: "", dob: "",
  enrollmentNo: "", district: "", address: "", confirm: false,
};

type Errors = Record<string, string>;

export default function ExistingMemberForm({ initialSerial = "", onBack }: { initialSerial?: string; onBack: () => void }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const t = (en: string, tm: string) => (ta ? tm : en);

  const [v, setV] = useState<Values>({ ...EMPTY, serial: initialSerial });
  const [errors, setErrors] = useState<Errors>({});
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [doc, setDoc] = useState<{ url: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; message: string } | null>(null);
  const [taken, setTaken] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const honey = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    if (errors[k === "serial" ? "membershipNo" : k]) setErrors((e) => { const n = { ...e }; delete n[k === "serial" ? "membershipNo" : k]; return n; });
  };

  /* Tell the person at once if the number already belongs to someone —
     the same answer the server will give on submit, just sooner. */
  useEffect(() => {
    setTaken(false);
    const s = v.serial.trim();
    if (!s) return;
    const h = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/members/available?q=${encodeURIComponent(s)}`, { cache: "no-store" });
        if (r.ok) setTaken(Boolean((await r.json()).taken));
      } catch { /* the server re-checks on submit */ }
    }, 450);
    return () => window.clearTimeout(h);
  }, [v.serial]);

  const clientCheck = (): Errors => {
    const e: Errors = {};
    if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,118}$/u.test(v.fullName.trim())) e.fullName = t("Enter your full name as recorded by the association.", "சங்கப் பதிவில் உள்ளபடி உங்கள் முழுப் பெயரை உள்ளிடவும்.");
    if (!/^[0-9A-Za-z-]{1,12}$/.test(v.serial.trim())) e.membershipNo = t("Enter the number after the prefix, e.g. 57.", "முன்னொட்டுக்குப் பிறகு உள்ள எண்ணை உள்ளிடவும், எ.கா. 57.");
    if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = t("Enter a valid email address.", "சரியான மின்னஞ்சலை உள்ளிடவும்.");
    if (!/^(\+?91)?[\s-]?0?[6-9]\d{9}$/.test(v.mobile.replace(/[\s()-]/g, ""))) e.mobile = t("Enter a valid 10-digit mobile number.", "சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்.");
    if (!v.category) e.category = t("Choose your membership category.", "உறுப்பினர் வகையைத் தேர்ந்தெடுக்கவும்.");
    if (v.enrollmentNo.trim() && !/^\d{1,7}\/\d{4}$/.test(v.enrollmentNo.trim())) e.enrollmentNo = t("Use the format 1080/2015.", "1080/2015 என்ற வடிவில் உள்ளிடவும்.");
    if (!v.confirm) e.confirm = t("Please confirm the details are accurate.", "விவரங்கள் சரியானவை என உறுதிப்படுத்தவும்.");
    return e;
  };

  const pick = async (kind: "photo" | "doc", file?: File | null) => {
    if (!file) return;
    const key = kind === "photo" ? "photo" : "document";
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
    try {
      if (kind === "photo") {
        if (!file.type.startsWith("image/")) throw new Error(t("Choose an image file.", "படக் கோப்பைத் தேர்ந்தெடுக்கவும்."));
        setPhoto({ url: await shrinkImage(file), name: file.name });
      } else {
        setDoc({ url: await readDocument(file), name: file.name });
      }
    } catch (err) {
      setErrors((e) => ({ ...e, [key]: (err as Error).message }));
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting.current) return; // a double-click must not file two requests
    setBanner(null);
    const local = clientCheck();
    if (Object.keys(local).length) {
      setErrors(local);
      setBanner(t("Please correct the highlighted fields.", "சிவப்பாகக் காட்டப்பட்ட புலங்களைச் சரிசெய்யவும்."));
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/members/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: v.fullName.trim(),
          membershipNo: v.serial.trim(),
          email: v.email.trim(),
          mobile: v.mobile.trim(),
          category: v.category,
          dob: v.dob,
          enrollmentNo: v.enrollmentNo.trim(),
          district: v.district.trim(),
          address: v.address.trim(),
          photo: photo?.url ?? "",
          document: doc?.url ?? "",
          documentName: doc?.name ?? "",
          website: honey.current?.value ?? "",
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone({ id: String(d.id), message: String(d.message ?? "") });
      } else {
        if (d.fields) setErrors(d.fields as Errors);
        setBanner(d.error || t("Could not submit. Please try again.", "சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்."));
        /* A rejected file has to be chosen again; the typed text stays. */
        if (d.fields?.photo) setPhoto(null);
        if (d.fields?.document) setDoc(null);
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      }
    } catch {
      setBanner(t("Could not reach the server. Nothing was submitted — please try again.", "சேவையகத்தை அடைய முடியவில்லை. எதுவும் சமர்ப்பிக்கப்படவில்லை."));
    }
    submitting.current = false;
    setBusy(false);
  };

  if (done) {
    return (
      <div role="status" className="text-center">
        <CheckCircle2 className="mx-auto text-gold" size={40} />
        <h3 className="mt-3 font-serif text-2xl gold-text">{t("Submitted for verification", "சரிபார்ப்புக்கு சமர்ப்பிக்கப்பட்டது")}</h3>
        <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-ivory-dim">
          {done.message || t("The office will check your details against the association's records.", "சங்கப் பதிவுகளுடன் அலுவலகம் உங்கள் விவரங்களைச் சரிபார்க்கும்.")}
        </p>
        <dl className="mx-auto mt-5 inline-grid grid-cols-[auto_auto] gap-x-5 gap-y-1.5 rounded-xl border border-[var(--hairline)] bg-obsidian-soft/50 px-5 py-4 text-left font-sans text-xs">
          <dt className="text-ivory-faint uppercase tracking-wider">{t("Reference", "குறிப்பு எண்")}</dt>
          <dd className="font-semibold text-gold">{done.id}</dd>
          <dt className="text-ivory-faint uppercase tracking-wider">{t("Status", "நிலை")}</dt>
          <dd className="font-semibold text-ivory">{t("Pending verification", "சரிபார்ப்பு நிலுவையில்")}</dd>
        </dl>
        <p className="mx-auto mt-4 max-w-md font-sans text-xs leading-relaxed text-ivory-faint">
          {t("Your ID card cannot be created until the office approves this request. Once it does, they will give you a one-time code to use here.",
             "அலுவலகம் இக்கோரிக்கையை அங்கீகரிக்கும் வரை அடையாள அட்டையை உருவாக்க முடியாது. அதன் பின் இங்கு பயன்படுத்த ஒரு முறை குறியீடு வழங்கப்படும்.")}
        </p>
        <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
          <ArrowLeft size={13} /> {t("Back to Verify", "திரும்பு")}
        </button>
      </div>
    );
  }

  const err = (k: string) => errors[k];
  const Err = ({ k }: { k: string }) => err(k) ? <p id={`emf-${k}-err`} className="mt-1 font-sans text-[11px] text-red-400">{err(k)}</p> : null;
  const aria = (k: string) => ({ "aria-invalid": err(k) ? true : undefined, "aria-describedby": err(k) ? `emf-${k}-err` : undefined } as const);
  const label = "mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-dim";

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy}>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 font-sans text-xs text-ivory-dim hover:text-gold">
        <ArrowLeft size={13} /> {t("Back", "பின்செல்")}
      </button>
      <h3 className="font-serif text-2xl gold-text">{t("Add Existing Member Details", "தற்போதைய உறுப்பினர் விவரங்களைச் சேர்க்கவும்")}</h3>
      <p className="mt-2 mb-5 font-sans text-[13px] leading-relaxed text-ivory-dim">
        {t("Submit your existing membership information for verification. Nothing here creates a card — the office checks it against its records first.",
           "உங்கள் தற்போதைய உறுப்பினர் விவரங்களைச் சரிபார்ப்புக்குச் சமர்ப்பிக்கவும். இது அட்டையை உருவாக்காது — அலுவலகம் முதலில் பதிவுகளுடன் சரிபார்க்கும்.")}
      </p>

      {banner && <p role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 font-sans text-xs text-red-300">{banner}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block" htmlFor="emf-fullName">
            <span className={label}>{t("Full name as recorded by the association", "சங்கப் பதிவில் உள்ள முழுப் பெயர்")} *</span>
          </label>
          <input id="emf-fullName" className={inputCls} value={v.fullName} maxLength={120} autoComplete="name" onChange={(e) => set("fullName", e.target.value)} {...aria("fullName")} />
          <Err k="fullName" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="emf-serial"><span className={label}>{t("Existing membership number", "தற்போதைய உறுப்பினர் எண்")} *</span></label>
          <div className={cn("flex items-stretch overflow-hidden rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 focus-within:border-gold/60 focus-within:ring-1 focus-within:ring-gold/30", err("membershipNo") && "border-red-400/70")}>
            <span className="flex select-none items-center whitespace-nowrap border-r border-[var(--hairline)] bg-obsidian/50 px-4 font-sans text-sm text-gold" aria-hidden>{MEMBERSHIP_PREFIX}</span>
            <input
              id="emf-serial" value={v.serial} inputMode="numeric" maxLength={12} placeholder="57"
              onChange={(e) => set("serial", toSerial(e.target.value).replace(/[^0-9A-Za-z-]/g, ""))}
              className="w-full bg-transparent px-4 py-2.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
              aria-label={`Membership number, after ${MEMBERSHIP_PREFIX}`} {...aria("membershipNo")}
            />
          </div>
          {taken && !err("membershipNo") && (
            <p role="status" className="mt-1 font-sans text-[11px] text-amber-300">
              {t("A member with this number already exists — go back and use Verify Your Membership. If it is not yours, contact the office.",
                 "இந்த எண்ணில் ஏற்கனவே உறுப்பினர் உள்ளார் — திரும்பிச் சரிபார்க்கவும். உங்களுடையது இல்லையெனில் அலுவலகத்தைத் தொடர்பு கொள்ளவும்.")}
            </p>
          )}
          <Err k="membershipNo" />
        </div>

        <div>
          <label htmlFor="emf-email"><span className={label}>{t("Email address", "மின்னஞ்சல்")} *</span></label>
          <input id="emf-email" type="email" className={inputCls} value={v.email} maxLength={160} autoComplete="email" onChange={(e) => set("email", e.target.value)} {...aria("email")} />
          <Err k="email" />
        </div>
        <div>
          <label htmlFor="emf-mobile"><span className={label}>{t("Mobile number", "கைபேசி எண்")} *</span></label>
          <input id="emf-mobile" type="tel" inputMode="tel" className={inputCls} value={v.mobile} maxLength={20} autoComplete="tel" onChange={(e) => set("mobile", e.target.value)} {...aria("mobile")} />
          <Err k="mobile" />
        </div>

        <div>
          <label htmlFor="emf-category"><span className={label}>{t("Membership category", "உறுப்பினர் வகை")} *</span></label>
          <select id="emf-category" className={inputCls} value={v.category} onChange={(e) => set("category", e.target.value)} {...aria("category")}>
            <option value="">{t("Select…", "தேர்ந்தெடுக்கவும்…")}</option>
            {membershipCategories.map((c) => <option key={c.id} value={c.id}>{ta ? c.ta : c.en}</option>)}
          </select>
          <Err k="category" />
        </div>
        <div>
          <label htmlFor="emf-enrol"><span className={label}>{t("Enrolment number (if any)", "பதிவு எண் (இருந்தால்)")}</span></label>
          <input id="emf-enrol" className={inputCls} value={v.enrollmentNo} maxLength={12} placeholder="1080/2015" onChange={(e) => set("enrollmentNo", e.target.value)} {...aria("enrollmentNo")} />
          <Err k="enrollmentNo" />
        </div>

        <div>
          <label htmlFor="emf-dob"><span className={label}>{t("Date of birth (optional)", "பிறந்த தேதி (விருப்பம்)")}</span></label>
          <input id="emf-dob" type="date" className={inputCls} value={v.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set("dob", e.target.value)} {...aria("dob")} />
          <p className="mt-1 font-sans text-[10px] text-ivory-faint">{t("Only the day and month are kept, for birthday wishes.", "பிறந்தநாள் வாழ்த்துக்காக நாள், மாதம் மட்டுமே சேமிக்கப்படும்.")}</p>
          <Err k="dob" />
        </div>
        <div>
          <label htmlFor="emf-district"><span className={label}>{t("District (optional)", "மாவட்டம் (விருப்பம்)")}</span></label>
          <input id="emf-district" className={inputCls} value={v.district} maxLength={60} onChange={(e) => set("district", e.target.value)} {...aria("district")} />
          <Err k="district" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="emf-address"><span className={label}>{t("Address (optional)", "முகவரி (விருப்பம்)")}</span></label>
          <textarea id="emf-address" className={cn(inputCls, "min-h-[72px] resize-none")} value={v.address} maxLength={300} onChange={(e) => set("address", e.target.value)} {...aria("address")} />
          <Err k="address" />
        </div>

        <FilePick id="emf-photo" k="photo" label={t("Photograph (optional)", "புகைப்படம் (விருப்பம்)")} hint={t("Passport-size, portrait. JPEG/PNG.", "பாஸ்போர்ட் அளவு. JPEG/PNG.")}
          accept="image/jpeg,image/png,image/webp" value={photo} onPick={(f) => pick("photo", f)} onClear={() => setPhoto(null)} error={err("photo")} />
        <FilePick id="emf-doc" k="document" label={t("Supporting document (optional)", "ஆதார ஆவணம் (விருப்பம்)")} hint={t("Old membership receipt or card — JPEG, PNG or PDF, up to 600 KB. Seen only by the office.", "பழைய உறுப்பினர் ரசீது/அட்டை — JPEG, PNG அல்லது PDF, 600 KB வரை. அலுவலகம் மட்டுமே காணும்.")}
          accept="image/jpeg,image/png,application/pdf" value={doc} onPick={(f) => pick("doc", f)} onClear={() => setDoc(null)} error={err("document")} />

        {/* honeypot — invisible to people, irresistible to form-filling bots */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Website<input ref={honey} tabIndex={-1} autoComplete="off" name="website" /></label>
        </div>

        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 font-sans text-xs leading-relaxed text-ivory-dim">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--gold,#c9a24b)]" checked={v.confirm} onChange={(e) => set("confirm", e.target.checked)} {...aria("confirm")} />
            <span>{t("I confirm that these details are accurate and that I am the member named above.", "மேற்கண்ட விவரங்கள் சரியானவை என்றும் நானே மேற்கண்ட உறுப்பினர் என்றும் உறுதிப்படுத்துகிறேன்.")}</span>
          </label>
          <Err k="confirm" />
        </div>
      </div>

      <button
        type="submit" disabled={busy}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {busy ? t("Submitting…", "சமர்ப்பிக்கிறது…") : t("Submit for verification", "சரிபார்ப்புக்குச் சமர்ப்பி")}
      </button>
    </form>
  );
}

function FilePick({
  id, k, label, hint, accept, value, onPick, onClear, error,
}: {
  id: string; k: string; label: string; hint: string; accept: string;
  value: { url: string; name: string } | null; onPick: (f?: File | null) => void; onClear: () => void; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id}><span className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-dim">{label}</span></label>
      <div className={cn("flex items-center gap-3 rounded-xl border border-dashed border-white/15 px-4 py-3 transition-all hover:border-gold/50", error && "border-red-400/70")}>
        {value?.url.startsWith("data:image") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt="" className="h-10 w-10 rounded object-cover" />
        ) : <Upload size={18} className="shrink-0 text-ivory-faint" />}
        <div className="min-w-0 flex-1">
          <input id={id} type="file" accept={accept} onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }}
            className="block w-full font-sans text-[11px] text-ivory-dim file:mr-3 file:rounded-full file:border-0 file:bg-gold/90 file:px-3 file:py-1 file:text-[10px] file:uppercase file:tracking-widest file:text-black"
            aria-invalid={error ? true : undefined} aria-describedby={error ? `emf-${k}-err` : undefined} />
          {value && <p className="mt-1 truncate font-sans text-[10px] text-gold">{value.name}</p>}
        </div>
        {value && <button type="button" onClick={onClear} className="font-sans text-[10px] uppercase tracking-widest text-ivory-faint hover:text-gold">Remove</button>}
      </div>
      <p className="mt-1 font-sans text-[10px] text-ivory-faint">{hint}</p>
      {error && <p id={`emf-${k}-err`} className="mt-1 font-sans text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
