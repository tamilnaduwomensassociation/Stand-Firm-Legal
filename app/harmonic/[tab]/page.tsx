import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { findTab, harmony, harmonyTabs } from "@/config/harmonic.config";

const DhoobamShop = dynamic(() => import("@/components/harmonic/DhoobamShop"));
const Classes = dynamic(() => import("@/components/harmonic/Classes"));
const Masters = dynamic(() => import("@/components/harmonic/Masters"));

export const dynamicParams = false;

export function generateStaticParams() {
  return harmonyTabs.map((t) => ({ tab: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tab: string }> }): Promise<Metadata> {
  const { tab } = await params;
  const t = findTab(tab);
  if (!t) return { title: "Not found" };
  return { title: t.en, description: t.blurb.slice(0, 300), alternates: { canonical: `/harmonic/${t.slug}` } };
}

export default async function HarmonyTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  const t = findTab(tab);
  if (!t) notFound();

  return (
    <main id="main">
      <section className="relative overflow-hidden bg-obsidian-deep pb-12 pt-32 md:pt-36">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.15]"
          style={{ backgroundImage: `url(${harmony.poster})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep via-obsidian-deep/90 to-obsidian" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="kicker mb-4">{t.kicker}</p>
          <h1 className="font-serif text-4xl leading-tight gold-text md:text-5xl">{t.en}</h1>
          <p className="prose-justify mx-auto mt-5 max-w-2xl text-center font-sans text-[15px] leading-relaxed text-ivory-dim">
            {t.blurb}
          </p>
        </div>
      </section>

      {t.slug === "dhoobam" && <DhoobamShop />}
      {t.slug === "classes" && <Classes />}
      {t.slug === "masters" && <Masters />}
    </main>
  );
}
