import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProdutoPrincipal from "@/components/ProdutoPrincipal";
import FaixaConfianca from "@/components/FaixaConfianca";
import HowItWorks from "@/components/HowItWorks";
import ProvaSocial from "@/components/ProvaSocial";
import Testimonials from "@/components/Testimonials";
import About from "@/components/About";
import Faq from "@/components/Faq";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import StickyCta from "@/components/StickyCta";
import { heroPet } from "@/lib/data";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-offwhite">
      <Navbar />
      <main className="flex-1 pb-24 md:pb-0">
        <Hero />
        <ProdutoPrincipal />
        <FaixaConfianca />
        <HowItWorks />
        <ProvaSocial />
        <Testimonials />
        <About />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <StickyCta
        label="Fazer minha miniatura"
        href={heroPet.primaryCta.href}
        origin="home-barra-mobile"
      />
    </div>
  );
}
