import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import VerticalTabs from "@/components/jeni/VerticalTabs";
import { jeni } from "@/config/jeni.config";
import ThemeStyle from "@/components/providers/ThemeStyle";

export const metadata: Metadata = {
  title: { default: `${jeni.name} — ${jeni.tagline}`, template: `%s | ${jeni.name}` },
  description:
    "Foods, clothing, sarees, wholesale combos, import and export of Milagu and spices, IT services, books, bank auction property and e-sevai — from Armenian Street, Parrys, Chennai.",
};

/** The tab strip belongs to every /jeni page, so it lives in the layout. */
export default function JeniLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeStyle brand="jeni" />
      <Navbar />
      <VerticalTabs />
      {children}
    </>
  );
}
