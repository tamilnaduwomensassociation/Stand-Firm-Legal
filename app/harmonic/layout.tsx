import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { HarmonyHeader, HarmonyFooter } from "@/components/harmonic/HarmonyChrome";

const Chatbot = dynamic(() => import("@/components/features/Chatbot"));
import { harmony } from "@/config/harmonic.config";
import ThemeStyle from "@/components/providers/ThemeStyle";

export const metadata: Metadata = {
  title: { default: `${harmony.name} — ${harmony.tagline}`, template: `%s | Harmony` },
  description:
    "Harmony Pranic Healing, Chennai — dhoobam and ritual supplies, pranic healing classes from basic to psychotherapy level, and the lineage this practice descends from.",
};

export default function HarmonyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeStyle brand="harmonic" isolate />
      {/* Scopes the whole brand — header, page content and footer
          together — to Harmony's own purple/pink palette. See the
          ".harmony-theme" block in app/globals.css. The header is
          position:fixed, but it is still a DOM child of this div, and
          CSS custom properties inherit through the DOM tree regardless
          of layout, so it is themed too. */}
      <div className="harmony-theme">
        <HarmonyHeader />
        {children}
        <HarmonyFooter />
        <Chatbot
          brandIcon="/media/marks/harmony-float-mark.png"
          brand="Harmony"
          brandId="harmonic"
          greeting="Vanakkam. I can tell you about the dhoobam range, the class levels and how to register. I do not give medical advice — this is a complementary practice, not a treatment."
        />
      </div>
    </>
  );
}
