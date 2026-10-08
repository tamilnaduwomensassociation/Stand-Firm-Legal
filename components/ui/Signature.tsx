/**
 * SIGNATURE — the typed applicant name, rendered as a signature.
 *
 * Nobody signs a form with a mouse. Rather than leave the applicant
 * facing a blank "Signature of the Applicant" line they cannot fill,
 * their name — already typed on step 1 — is re-rendered here in a
 * handwritten-style face, so both the live wizard and the printed
 * application carry something that reads as a signature rather than
 * an empty rule.
 *
 * `dark` switches between the ink-on-paper look used in the printed
 * preview (black, on white) and the on-screen look used inside the
 * wizard itself (gold, on the obsidian panel).
 */
import { cn } from "@/lib/utils";

export default function Signature({
  name, lang, dark = false, className,
}: {
  name: string;
  lang: "en" | "ta";
  /** Render in black ink for the printed/preview document. */
  dark?: boolean;
  className?: string;
}) {
  const trimmed = name.trim();
  if (!trimmed) {
    return (
      <span className={cn("font-sans text-xs italic", dark ? "text-black/40" : "text-ivory-faint", className)}>
        {lang === "ta" ? "பெயரை உள்ளிட்டதும் கையொப்பம் இங்கே தோன்றும்" : "Your signature appears here once you type your name"}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "font-signature leading-none",
        dark ? "text-black" : "text-gold-bright",
        className
      )}
      aria-label={lang === "ta" ? `${trimmed} கையொப்பம்` : `Signature of ${trimmed}`}
    >
      {trimmed}
    </span>
  );
}
