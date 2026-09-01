import dynamic from "next/dynamic";
import JeniHome from "@/components/jeni/JeniHome";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));
const Chatbot = dynamic(() => import("@/components/features/Chatbot"));

export default function JeniPage() {
  return (
    <>
      <main id="main"><JeniHome /></main>
      <Footer />
      <FloatingActions brandIcon="/media/marks/jeni-float-mark.png" />
      <Chatbot brandIcon="/media/marks/jeni-float-mark.png" brand="Jeni Enterprises" brandId="jeni" />
      <SearchOverlay />
    </>
  );
}
