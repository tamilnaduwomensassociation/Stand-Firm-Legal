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
      <HarmonyHeader />
      {children}
      <HarmonyFooter />
      <Chatbot
        brandIcon="/media/marks/harmony-float-mark.png"
        brand="Harmony"
        brandId="harmonic"
        greeting="Vanakkam. I can tell you about the dhoobam range, the class levels and how to register. I do not give medical advice — this is a complementary practice, not a treatment."
      />
    </>
  );
}
