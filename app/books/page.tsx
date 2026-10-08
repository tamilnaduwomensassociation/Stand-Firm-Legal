import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import BookShop from "@/components/sections/BookShop";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const WishesPanel = dynamic(() => import("@/components/features/WishesPanel"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));

export const metadata: Metadata = {
  title: "Bare Acts & Legal Titles",
  description:
    "Bare acts, commentaries, exam material and the association's own imprint — request the titles you need and TNWLA Madras will call you back with availability and cost.",
};

export default function BooksPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="bg-obsidian pt-28 md:pt-32">
        <BookShop />
      </main>
      <Footer />
      <FloatingActions />
      <WishesPanel />
      <SearchOverlay />
    </>
  );
}
