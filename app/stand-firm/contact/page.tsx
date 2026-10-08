import type { Metadata } from "next";
import PageShell from "@/components/standfirm/PageShell";
import SFContact from "@/components/standfirm/SFContact";
import { sf } from "@/config/standfirm.config";

export const metadata: Metadata = {
  title: "Contact",
  description: `${sf.name} — ${sf.address}. ${sf.phones.join(", ")}.`,
};

export default function ContactPage() {
  return (
    <PageShell
      kicker="Reach the Office"
      title="Contact Us"
      lead="Armenian Street, Parrys — a few minutes from the High Court and the Registration offices. Call first and we will make sure the right advocate is in when you arrive."
      image="/media/stills/scene-4.jpg"
    >
      <SFContact />
    </PageShell>
  );
}
