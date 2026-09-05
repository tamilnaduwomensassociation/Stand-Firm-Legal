import dynamic from "next/dynamic";
import JeniHome from "@/components/jeni/JeniHome";
import ComingSoon from "@/components/jeni/ComingSoon";
import { JENI_LIVE } from "@/config/jeni.config";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));
const Chatbot = dynamic(() => import("@/components/features/Chatbot"));

export default function JeniPage() {
  if (!JENI_LIVE) return <ComingSoon />;
  return (
    <>
      <main id="main"><JeniHome /></main>
      <Footer />
      <FloatingActions brandIcon="/media/marks/jeni-float-mark.png" brand="jeni" />
      <Chatbot brandIcon="/media/marks/jeni-float-mark.png" brand="Jeni Enterprises" brandId="jeni" />
      <SearchOverlay />
    </>
  );
}
